import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import {
  initDb,
  getChatMessages,
  addChatMessage,
  setChatMessages,
  clearChatMessages,
  getPrescriptions,
  addPrescription,
  toggleFavoritePrescription,
  deletePrescription,
  getSavedTranslations,
  addSavedTranslation,
  deleteSavedTranslation,
  getMoodLogs,
  addMoodLog,
} from './server/db.ts';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Candidate models in preference order (gemini-3.5-flash -> gemini-3.1-flash-lite -> gemini-3.8-flash)
const CANDIDATE_MODELS = ['gemini-3.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];

async function generateStreamWithFallback(params: any) {
  let lastErr: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const stream = await ai.models.generateContentStream({
        ...params,
        model,
      });
      return stream;
    } catch (err: any) {
      lastErr = err;
      console.warn(`[Stream] Model ${model} failed (${err?.status || err?.message}), trying next fallback...`);
    }
  }
  throw lastErr;
}

async function generateContentWithFallback(params: any) {
  let lastErr: any = null;
  for (const model of CANDIDATE_MODELS) {
    try {
      const res = await ai.models.generateContent({
        ...params,
        model,
      });
      return res;
    } catch (err: any) {
      lastErr = err;
      console.warn(`[Unary] Model ${model} failed (${err?.status || err?.message}), trying next fallback...`);
    }
  }
  throw lastErr;
}

// Chatbot Persona System Instructions
const PERSONA_INSTRUCTIONS: Record<string, string> = {
  warmSenior: `당신은 입사 5년 차의 따뜻하고 사려 깊은 사내 랜선 선배 '토닥선배'입니다.
대상: 회사 생활이 낯설고 두려운 신입사원, 인턴, 사회초년생.
말투: 따뜻하고 다정하며 친근한 존댓말(~해요, ~했군요, ~였을 텐데 마음고생 많았어요).
원칙:
1. 무조건적인 공감과 지지: 신입의 실수나 미숙함은 결코 무능함이 아니라 '배우는 과정'임을 항상 일깨워줍니다.
2. 자책 방지: "내가 이것밖에 안 되나"라는 자책의 굴레에서 벗어나도록 다독입니다.
3. 꼰대 같은 훈계나 "라떼는 말이야"는 절대 금지! 선배인 나도 신입 시절 똑같이 어리숙하고 실수투성이였다는 사실을 공감으로 녹여냅니다.
4. 마음의 안정을 우선으로 하되, 원한다면 내일 출근해서 어떻게 마음을 먹으면 좋을지 아주 부드럽고 가벼운 팁을 곁들입니다.
5. 대화의 마지막에는 항상 진심 어린 응원이나 따스한 격려 한마디를 남겨주세요.`,

  workCoach: `당신은 똑부러지면서도 후배를 진심으로 아끼는 실무 가이드 코치 '든든코치'입니다.
대상: 업무 절차, 질문하는 법, 상사 보고, 실수 수습 등 구체적인 일하는 방법이 막막한 사회초년생.
말투: 듬직하고 명쾌하며 따뜻하고 친절한 존댓말(~입니다, ~하면 좋아요, ~해보세요).
원칙:
1. 불안감 해소: "실수는 누구나 합니다. 중요한 건 보고와 수습 순서입니다"라며 침착하게 가이드합니다.
2. 실용적인 실행 액션: 단계별(Step 1, Step 2, Step 3)로 바로 써먹을 수 있는 행동 가이드와 예시 문장을 제시합니다.
3. 신입사원의 권리 존중: 신입은 모르는 게 당연하고, 질문하는 것은 부끄러운 게 아니라 적극적인 배움이라는 점을 강조합니다.
4. 깔끔한 정리: 답변을 한눈에 보기 쉽게 핵심 요점과 예전문구를 제공합니다.`,

  eveningMindset: `당신은 퇴근 후에도 회사 걱정과 불안으로 쉬지 못하는 사회초년생을 위한 마음 챙김 멘토 '쉼표선배'입니다.
대상: 퇴근 후 침대에 누워서도 '내일 어떡하지?', '낮에 그 말 괜히 했나?' 곱씹으며 밤잠을 설차는 사회초년생.
말투: 차분하고 평온하며 마음을 가라앉혀주는 감성적인 존댓말(~해요, 천천히 숨을 쉬어보세요).
원칙:
1. 일과 자아의 분리: "회사의 나"와 "진짜 나"를 건강하게 분리하도록 돕습니다.
2. 반추(Overthinking) 끊어내기: 이미 지나간 낮의 일을 되감기하지 않고, 지금 이 순간의 안전함에 머물도록 이끕니다.
3. 퇴근 후 셀프 리추얼: 뇌를 오프(Off)시키는 마인드풀니스, 1분 호흡, 샤워 명상 등 현실적인 휴식 루틴을 제안합니다.
4. 편안한 수면과 힐링을 돕는 포근한 마무리를 해줍니다.`
};

// 1. Multi-turn Chat Endpoint (Streaming with SSE)
app.post('/api/chat', async (req: Request, res: Response) => {
  try {
    const { messages, persona = 'warmSenior', freshContext = '' } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Messages array is required.' });
    }

    const systemInstructionBase = PERSONA_INSTRUCTIONS[persona] || PERSONA_INSTRUCTIONS.warmSenior;
    const systemInstruction = freshContext
      ? `${systemInstructionBase}\n\n[사용자 추가 맥락 정보]: ${freshContext}`
      : systemInstructionBase;

    // Filter valid messages
    const rawList = messages
      .filter((m: { content: string }) => m && typeof m.content === 'string' && m.content.trim())
      .map((m: { role: string; content: string }) => ({
        role: m.role === 'assistant' || m.role === 'model' ? ('model' as const) : ('user' as const),
        parts: [{ text: m.content.trim() }],
      }));

    // In Gemini API, multi-turn history MUST begin with 'user'
    const firstUserIndex = rawList.findIndex((m) => m.role === 'user');
    const validList = firstUserIndex >= 0 ? rawList.slice(firstUserIndex) : [];

    if (validList.length === 0) {
      return res.status(400).json({ error: 'At least one user message is required.' });
    }

    // Merge consecutive turns with the same role so Gemini alternation rule is strictly satisfied
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];
    for (const item of validList) {
      if (contents.length > 0 && contents[contents.length - 1].role === item.role) {
        contents[contents.length - 1].parts[0].text += `\n\n${item.parts[0].text}`;
      } else {
        contents.push(item);
      }
    }

    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');

    const stream = await generateStreamWithFallback({
      contents,
      config: {
        systemInstruction,
        temperature: 0.75,
      },
    });

    for await (const chunk of stream) {
      const text = chunk.text;
      if (text) {
        res.write(`data: ${JSON.stringify({ text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err: any) {
    console.error('Chat API Error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err?.message || 'Chat generation failed' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err?.message || 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
});

// 2. Feature 1: 오늘의 멘탈 처방전 (Mood Check & Mental Rx)
app.post('/api/prescribe', async (req: Request, res: Response) => {
  try {
    const { mood, tags = [], situation = '' } = req.body;

    const prompt = `사회초년생(신입사원) 사용자가 오늘 다음과 같은 감정과 상황을 토로했습니다:
- 주 감정 상태: ${mood || '불안과 자책'}
- 선택한 감정 태그: ${Array.isArray(tags) ? tags.join(', ') : ''}
- 구체적인 상황: ${situation || '오늘 하루 종일 눈치 보이고 내가 잘하고 있는지 막막함'}

이 사회초년생의 마음을 깊이 어루만지고, 자책감을 덜어주며, 오늘 밤 평온하게 쉴 수 있는 따뜻하고 전문적인 "오늘의 멘탈 처방전"을 JSON 형식으로 작성해주세요.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: `당신은 사회초년생 전문 심리상담가이자 마음 치유 선배입니다.
따뜻하고 공감 가득하며, 인지심리학적 재구조화(자책하는 생각 교정) 기법을 부드럽게 녹여내어 사회초년생의 자존감을 지켜줍니다.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diagnosis: {
              type: Type.STRING,
              description: '공감 가득한 마음 진단명 (예: "첫 걸음마의 과도한 자책 피로증")',
            },
            comfortLetter: {
              type: Type.STRING,
              description: '따뜻한 위로와 공감의 편지 (3~4단락으로 다정하고 눈물 나게 포근한 격려)',
            },
            cognitiveReframing: {
              type: Type.OBJECT,
              properties: {
                trapThought: {
                  type: Type.STRING,
                  description: '사회초년생이 빠지기 쉬운 자책 생각 (예: "나만 못하고 민폐를 끼치고 있다")',
                },
                reframedFact: {
                  type: Type.STRING,
                  description: '선배가 짚어주는 객관적인 진실과 따뜻한 시선 (예: "신입은 배우러 온 사람입니다. 질문하고 실수하며 배우는 게 정상적인 온보딩 과정입니다")',
                },
              },
              required: ['trapThought', 'reframedFact'],
            },
            microSelfCareAction: {
              type: Type.STRING,
              description: '오늘 퇴근 후 1~3분 안에 부담 없이 할 수 있는 심신 이완 미션',
            },
            cheerQuote: {
              type: Type.STRING,
              description: '가슴에 품을 한 줄 응원 문구',
            },
            badgeName: {
              type: Type.STRING,
              description: '오늘 하루를 버텨낸 당신에게 수여하는 위로 뱃지 명칭 (예: "오늘도 꿋꿋이 버텨낸 당신")',
            },
          },
          required: [
            'diagnosis',
            'comfortLetter',
            'cognitiveReframing',
            'microSelfCareAction',
            'cheerQuote',
            'badgeName',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    const createdDate = new Date().toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });

    const savedRecord = await addPrescription({
      diagnosis: parsed.diagnosis,
      comfortLetter: parsed.comfortLetter,
      cognitiveReframing: parsed.cognitiveReframing,
      microSelfCareAction: parsed.microSelfCareAction,
      cheerQuote: parsed.cheerQuote,
      badgeName: parsed.badgeName,
      mood: mood || '불안과 자책',
      tags: Array.isArray(tags) ? tags : [],
      situation,
      createdAt: createdDate,
    });

    res.json(savedRecord);
  } catch (err: any) {
    console.error('Prescription Error:', err);
    // Graceful fallback to prevent user frustration
    const fallbackDate = new Date().toLocaleDateString('ko-KR', {
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
    const fallback = await addPrescription({
      diagnosis: '서투른 첫걸음의 적응 피로증',
      comfortLetter: '오늘 하루 정말 애쓰셨습니다. 새로운 환경과 낯선 업무 속에서 실수하고 긴장하는 것은 당신이 못나서가 아니라, 뇌가 적응하기 위해 치열하게 노력하고 있다는 증거입니다. 누구나 처음은 서툴고 흔들립니다. 지금 이 순간에도 당신은 조금씩 자라나고 있습니다.',
      cognitiveReframing: {
        trapThought: '내가 실수해서 팀에 민폐만 끼치고 나만 적응을 못하는 것 같다.',
        reframedFact: '신입의 실수는 예상 가능한 정상적 배움의 과정이며, 질문하고 고쳐나가며 누구나 성장합니다.'
      },
      microSelfCareAction: '오늘 밤은 회사 단톡방 알림을 무음으로 돌려두고 따뜻한 차 한 잔 마시기',
      cheerQuote: '오늘의 서투름은 내일의 단단한 노하우가 됩니다. 스스로를 믿어주세요.',
      badgeName: '꿋꿋이 버텨낸 용기 뱃지',
      mood: '불안과 자책',
      tags: ['신입 온보딩'],
      createdAt: fallbackDate,
    });
    res.json(fallback);
  }
});

// 3. Feature 2: 비즈니스 언어 변환기 & SOS 회신기 (Business Communication Translator)
app.post('/api/biz-translate', async (req: Request, res: Response) => {
  try {
    const { rawText, situationType = 'general', tone = 'polite' } = req.body;

    if (!rawText) {
      return res.status(400).json({ error: 'rawText is required' });
    }

    const prompt = `사회초년생이 다음과 같은 상황에서 마음속 생각이나 초안을 입력했습니다:
- 상황 유형: ${situationType} (예: 실수 보고, 질문하기, 일정 조율/기한 연장, 연차/휴가 요청, 완곡한 거절, 메신저 인사)
- 선호 톤: ${tone}
- 사용자의 초안/속마음: "${rawText}"

신입사원이 직장에서 센스 있고 예의 바르면서도 당당하게 소통할 수 있도록, 3가지 포맷(정중한 이메일, 사내 메신저 슬랙/잔디, 구두 10초 스피치)으로 매끄럽고 신뢰감 있게 다듬어주세요. 또한 선배의 실무 팁을 함께 작성해주세요.`;

    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: `당신은 10년 차 일잘러 팀장이자 후배들의 커뮤니케이션을돕는 친절한 비즈니스 코치입니다.
사회초년생들이 "어떻게 말해야 무례하지 않고 깔끔할까?" 고민하며 겪는 불안을 해소해주기 위해, 한국 기업 문화에 가장 자연스럽고 신뢰감을 주는 비즈니스 어휘와 템플릿을 제공합니다.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            formalEmail: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING, description: '이메일 제목' },
                body: { type: Type.STRING, description: '이메일 본문 전문' },
              },
              required: ['subject', 'body'],
            },
            messenger: {
              type: Type.STRING,
              description: '사내 메신저(슬랙, 팀즈, 카톡)에 바로 복사해 보낼 수 있는 공손하고 센스 있는 메시지',
            },
            verbalSpeech: {
              type: Type.STRING,
              description: '선배나 팀장님 자리로 직접 찾아가 말할 때 쓸 수 있는 10초 구두 대화 멘트',
            },
            seniorProTip: {
              type: Type.STRING,
              description: '선배가 전하는 실무 팁 (왜 이렇게 말하는 것이 좋은지, 타이밍이나 태도 조언)',
            },
            keyEtiquette: {
              type: Type.STRING,
              description: '이 상황에서 절대 하지 말아야 할 주의점 1가지',
            },
          },
          required: ['formalEmail', 'messenger', 'verbalSpeech', 'seniorProTip', 'keyEtiquette'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Biz Translate Error:', err);
    res.json({
      formalEmail: {
        subject: `[확인 요청] 관련 진행 상황 및 확인 사항 공유의 건`,
        body: `안녕하십니까, 팀장님/선배님.\n\n해당 업무와 관련하여 진행 상황을 검토하던 중, 추가적인 확인 및 일정 조율이 필요한 사항이 있어 메일 드립니다.\n\n확인해 주시면 내용 반영하여 신속히 마무리하도록 하겠습니다.\n감사합니다.`
      },
      messenger: `선배님, 바쁘신 와중에 죄송합니다. 요청주신 업무 진행 중 확인이 필요한 부분이 있어 잠시 메신저 드립니다. 편하실 때 짧게 확인 부탁드려도 될까요? 감사합니다!`,
      verbalSpeech: `선배님, 지금 1분 정도 말씀 나누실 시간 괜찮으실까요? 진행 중인 업무에 대해 여쭤보고 싶은 부분이 있어서요.`,
      seniorProTip: `막힐 때는 혼자 끙끙 앓기보다 질문할 내용과 질문 의도를 정리해서 먼저 여쭤보는 것이 훨씬 빠르고 신뢰를 줍니다.`,
      keyEtiquette: `기한이 지난 후에 보고하지 마시고, 반드시 사전에 중간 보고를 진행해 주세요.`
    });
  }
});

// 4. Random Encouragement & Senior Proverb / Fortune
app.get('/api/cheer-card', async (_req: Request, res: Response) => {
  try {
    const prompt = `사회초년생(신입사원)에게 힘과 미소를 주는 랜덤 응원 캡슐 1개를 JSON으로 생성해주세요.`;
    const response = await generateContentWithFallback({
      contents: prompt,
      config: {
        systemInstruction: `지치고 긴장한 사회초년생의 퇴근길이나 출근길에 가슴 벅찬 용기와 힐링을 선사하는 짧고 감동적인 메시지를 만듭니다.`,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: '응원 카드 제목 (예: "오늘의 선배 명언")' },
            quote: { type: Type.STRING, description: '따뜻한 위로와 용기의 문장' },
            subtext: { type: Type.STRING, description: '부연 설명이나 실천 한 줄' },
            iconTheme: { type: Type.STRING, description: 'heart, coffee, sun, star, smile, sprout 중 하나' },
          },
          required: ['title', 'quote', 'subtext', 'iconTheme'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (err: any) {
    console.error('Cheer Card Error:', err);
    res.json({
      title: '오늘의 토닥 비타민',
      quote: '처음부터 능숙한 사람은 없어요. 오늘의 서투름은 당신이 성장하고 있다는 가장 확실한 증거입니다.',
      subtext: '오늘도 최선을 다한 스스로의 등을 가볍게 토닥여주세요.',
      iconTheme: 'sprout',
    });
  }
});

// ==========================================
// Backend Data Persistence REST Endpoints
// ==========================================

// Chat History Persistence
app.get('/api/chat/history', async (_req: Request, res: Response) => {
  try {
    const messages = await getChatMessages();
    res.json(messages);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat/history', async (req: Request, res: Response) => {
  try {
    const { messages } = req.body;
    if (Array.isArray(messages)) {
      await setChatMessages(messages);
      res.json({ success: true, count: messages.length });
    } else {
      res.status(400).json({ error: 'Messages must be an array' });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/chat/history', async (_req: Request, res: Response) => {
  try {
    await clearChatMessages();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Prescriptions Persistence
app.get('/api/prescriptions', async (_req: Request, res: Response) => {
  try {
    const items = await getPrescriptions();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/prescriptions', async (req: Request, res: Response) => {
  try {
    const item = req.body;
    const saved = await addPrescription(item);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/prescriptions/:id/favorite', async (req: Request, res: Response) => {
  try {
    const updated = await toggleFavoritePrescription(req.params.id);
    if (!updated) return res.status(404).json({ error: 'Not found' });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/prescriptions/:id', async (req: Request, res: Response) => {
  try {
    const success = await deletePrescription(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Saved Business Translations Persistence
app.get('/api/saved-translations', async (_req: Request, res: Response) => {
  try {
    const items = await getSavedTranslations();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/saved-translations', async (req: Request, res: Response) => {
  try {
    const item = req.body;
    const saved = await addSavedTranslation(item);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/saved-translations/:id', async (req: Request, res: Response) => {
  try {
    const success = await deleteSavedTranslation(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Mood Logs & Reflection Journal Persistence
app.get('/api/mood-logs', async (_req: Request, res: Response) => {
  try {
    const items = await getMoodLogs();
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/mood-logs', async (req: Request, res: Response) => {
  try {
    const item = req.body;
    const saved = await addMoodLog(item);
    res.json(saved);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Storage Health and Stats
app.get('/api/storage/stats', async (_req: Request, res: Response) => {
  try {
    const [chats, prescriptions, savedTranslations, moodLogs] = await Promise.all([
      getChatMessages(),
      getPrescriptions(),
      getSavedTranslations(),
      getMoodLogs(),
    ]);
    res.json({
      status: 'connected',
      storageEngine: 'Express File System Persistent DB',
      stats: {
        chatsCount: chats.length,
        prescriptionsCount: prescriptions.length,
        savedTranslationsCount: savedTranslations.length,
        moodLogsCount: moodLogs.length,
      },
      lastSyncedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Production or Vite Dev Server integration
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (_req: Request, res: Response) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${port}`);
});
