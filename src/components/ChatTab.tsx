import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Trash2, 
  Copy, 
  Check, 
  Coffee, 
  Briefcase, 
  Moon, 
  Sparkles,
  Bot,
  User,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  Smile,
  Heart,
  Database
} from 'lucide-react';
import { ChatMessage, PersonaType } from '../types';
import { fetchChatHistory, saveChatHistory, clearChatHistoryOnServer } from '../services/api';

interface ChatTabProps {
  onOpenPrescribeWithText?: (text: string) => void;
  onOpenBizTranslateWithText?: (text: string) => void;
}

const PERSONA_DETAILS = {
  warmSenior: {
    name: '토닥선배',
    title: '따뜻한 5년차 랜선 선배',
    description: '공감 100%, 자책감 덜어주기 & 마음의 짐 나누기',
    badge: '따뜻한 위로',
    color: 'from-amber-500 to-rose-400',
    bgColor: 'bg-amber-50 text-amber-800 border-amber-200',
    icon: Coffee,
    greeting: '오늘 하루 정말 고생 많았어요! 회사에서 마음에 걸리는 일이나 속상한 일 있었나요? 편하게 털어놓아 봐요. 언제나 네 편이야 ☕'
  },
  workCoach: {
    name: '든든코치',
    title: '똑부러진 실무 프로 멘토',
    description: '실수 수습, 상사 보고, 질문 템플릿 & 센스 있는 일머리 코칭',
    badge: '실무 해결',
    color: 'from-indigo-600 to-sky-500',
    bgColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    icon: Briefcase,
    greeting: '반가워요! 업무 프로세스나 질문법, 실수 수습 등 막막한 게 있다면 주저 말고 물어보세요. 같이 단계별로 차근차근 풀어봐요 💼'
  },
  eveningMindset: {
    name: '쉼표선배',
    title: '퇴근 후 마인드셋 & 번아웃 케어',
    description: '일과 자아 분리, 퇴근 후 걱정 끊어내기 & 숙면 유도',
    badge: '멘탈 회복',
    color: 'from-emerald-600 to-teal-500',
    bgColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    icon: Moon,
    greeting: '오늘 회사 문 밖으로 나온 순간, 오늘의 일은 끝났습니다. 침대에 누워서도 머릿속을 맴도는 걱정이 있다면 여기에 다 쏟아내고 편안히 쉬어요 🌙'
  }
};

const QUICK_PROMPTS = [
  {
    label: '큰 실수해서 자책 중',
    text: '오늘 업무에서 실수로 잘못된 문서를 상사께 보냈는데 너무 무섭고 자책감이 들어요. 어떻게 마음을 다잡고 내일 대처해야 할까요?',
    persona: 'warmSenior' as PersonaType
  },
  {
    label: '눈치 안 보고 질문하는 법',
    text: '사수님이 너무 바빠 보이셔서 질문하기가 눈치 보여요. 언제, 어떻게 질문해야 센스 있고 예의 바르게 느껴질까요?',
    persona: 'workCoach' as PersonaType
  },
  {
    label: '퇴근 후에도 심장이 쿵쾅거려요',
    text: '퇴근했는데도 낮에 들은 지적이나 슬랙 알림 소리 환청이 들려 심장이 뛰어요. 일 생각을 어떻게 끊어낼 수 있을까요?',
    persona: 'eveningMindset' as PersonaType
  },
  {
    label: '나만 뒤처지는 기분',
    text: '동기들은 다 알아서 척척 적응하는 것 같은데, 저만 바보 같고 매번 버벅거리는 것 같아 자존감이 너무 바닥을 쳐요.',
    persona: 'warmSenior' as PersonaType
  },
  {
    label: '마감 기한 지연 SOS',
    text: '오늘 퇴근 전까지 제출해야 하는 업무인데, 생각보다 시간이 오래 걸려서 기한을 못 맞출 것 같아요. 어떻게 미리 보고드려야 할까요?',
    persona: 'workCoach' as PersonaType
  }
];

export const ChatTab: React.FC<ChatTabProps> = ({ 
  onOpenPrescribeWithText, 
  onOpenBizTranslateWithText 
}) => {
  const [persona, setPersona] = useState<PersonaType>('warmSenior');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial-1',
      role: 'assistant',
      content: PERSONA_DETAILS.warmSenior.greeting,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      persona: 'warmSenior'
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [reactionFeedback, setReactionFeedback] = useState<string | null>(null);
  const [isServerSynced, setIsServerSynced] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load chat messages from backend server on mount
  useEffect(() => {
    let mounted = true;
    fetchChatHistory()
      .then((serverMsgs) => {
        if (mounted && Array.isArray(serverMsgs) && serverMsgs.length > 0) {
          setMessages(serverMsgs);
          setIsServerSynced(true);
        }
      })
      .catch((err) => {
        console.warn('Backend chat history load error:', err);
        const saved = localStorage.getItem('todak_chat_history');
        if (saved && mounted) {
          try {
            setMessages(JSON.parse(saved));
          } catch {}
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  // Sync messages to backend server and localStorage
  useEffect(() => {
    localStorage.setItem('todak_chat_history', JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

    if (messages.length > 0) {
      saveChatHistory(messages)
        .then(() => setIsServerSynced(true))
        .catch(() => setIsServerSynced(false));
    }
  }, [messages]);

  const handlePersonaChange = (newPersona: PersonaType) => {
    setPersona(newPersona);
    // Add welcome greeting if last message isn't by this persona
    const greetingMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: PERSONA_DETAILS[newPersona].greeting,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      persona: newPersona
    };
    setMessages((prev) => [...prev, greetingMsg]);
  };

  const handleSend = async (userText?: string) => {
    const textToSend = (userText || input).trim();
    if (!textToSend || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    const assistantMsgId = (Date.now() + 1).toString();
    const assistantMessage: ChatMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
      persona
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const payloadMessages = newMessages
        .filter((m) => m.content && m.content.trim())
        .map((m) => ({
          role: m.role,
          content: m.content
        }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          persona,
          messages: payloadMessages
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const dataStr = line.slice(6).trim();
                if (dataStr === '[DONE]') {
                  done = true;
                  break;
                }
                try {
                  const parsed = JSON.parse(dataStr);
                  if (parsed.text) {
                    accumulated += parsed.text;
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMsgId ? { ...msg, content: accumulated } : msg
                      )
                    );
                  }
                } catch {
                  // ignore keep-alives or partial chunks
                }
              }
            }
          }
        }
      }
    } catch (err: any) {
      console.error('Chat stream error:', err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  '잠시 서버와의 연결이 원활하지 않았어요. 하지만 이것만 기억해 주세요: 오늘 있었던 일로 당신의 가치가 결코 깎이지 않아요. 다시 이야기해 주시면 귀 기울여 들을게요!'
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    const fresh: ChatMessage[] = [
      {
        id: Date.now().toString(),
        role: 'assistant',
        content: PERSONA_DETAILS[persona].greeting,
        timestamp: new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' }),
        persona
      }
    ];
    setMessages(fresh);
    localStorage.setItem('todak_chat_history', JSON.stringify(fresh));
    clearChatHistoryOnServer().catch(console.error);
    setReactionFeedback('🌿 대화가 새로 시작되었습니다 (서버 동기화)');
    setTimeout(() => setReactionFeedback(null), 2000);
  };

  const handleQuickReaction = (emoji: string, text: string) => {
    setReactionFeedback(`${emoji} ${text}`);
    setTimeout(() => setReactionFeedback(null), 2500);
  };

  const ActivePersona = PERSONA_DETAILS[persona];
  const PersonaIcon = ActivePersona.icon;

  return (
    <div className="flex flex-col h-[calc(100vh-8.5rem)] max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-stone-200 overflow-hidden">
      {/* Persona Header & Switcher */}
      <div className="p-4 bg-stone-50 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${ActivePersona.color} flex items-center justify-center text-white shadow-xs`}>
            <PersonaIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 text-sm sm:text-base">
                {ActivePersona.name}
              </span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${ActivePersona.bgColor}`}>
                {ActivePersona.badge}
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full border flex items-center gap-1 font-medium ${
                  isServerSynced
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-stone-100 text-stone-500 border-stone-200'
                }`}
                title="데이터가 백엔드 서버에 영구 보관됩니다"
              >
                <Database className="w-2.5 h-2.5" />
                <span>서버 보관 중</span>
              </span>
            </div>
            <p className="text-xs text-stone-500">
              {ActivePersona.description}
            </p>
          </div>
        </div>

        {/* Persona Segment Control */}
        <div className="flex items-center gap-1 bg-stone-200/70 p-1 rounded-2xl">
          {(Object.keys(PERSONA_DETAILS) as PersonaType[]).map((pKey) => {
            const p = PERSONA_DETAILS[pKey];
            const PIcon = p.icon;
            const isSelected = persona === pKey;
            return (
              <button
                key={pKey}
                onClick={() => handlePersonaChange(pKey)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl transition-all ${
                  isSelected
                    ? 'bg-white text-stone-900 shadow-xs font-semibold'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <PIcon className={`w-3.5 h-3.5 ${isSelected ? 'text-stone-900' : 'text-stone-400'}`} />
                <span>{p.name}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={handleClear}
          title="대화 비우기"
          className="p-2 text-stone-400 hover:text-rose-600 hover:bg-stone-100 rounded-xl transition-colors ml-auto sm:ml-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Prompt Chips (Carousel) */}
      <div className="px-4 py-2 bg-stone-50/50 border-b border-stone-100 flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
        <span className="text-stone-400 flex items-center gap-1 shrink-0 font-medium text-[11px]">
          <Sparkles className="w-3 h-3 text-amber-500" />
          추천 고민:
        </span>
        {QUICK_PROMPTS.map((q, idx) => (
          <button
            key={idx}
            onClick={() => {
              if (q.persona !== persona) {
                setPersona(q.persona);
              }
              handleSend(q.text);
            }}
            className="shrink-0 px-3 py-1 bg-white hover:bg-stone-100 border border-stone-200 rounded-full text-stone-700 font-medium hover:border-stone-300 transition-colors shadow-2xs flex items-center gap-1"
          >
            <span>{q.label}</span>
            <ChevronRight className="w-3 h-3 text-stone-300" />
          </button>
        ))}
      </div>

      {/* Messages Thread (Scrollable) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const msgPersona = msg.persona ? PERSONA_DETAILS[msg.persona] : ActivePersona;

          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-2xs ${
                  isUser
                    ? 'bg-stone-800'
                    : `bg-gradient-to-tr ${msgPersona.color}`
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Bubble */}
              <div className={`max-w-[85%] sm:max-w-[78%] flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
                <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-stone-400">
                  <span className="font-medium text-stone-600">
                    {isUser ? '나' : msgPersona.name}
                  </span>
                  <span>{msg.timestamp}</span>
                </div>

                <div
                  className={`p-4 rounded-3xl text-sm leading-relaxed whitespace-pre-wrap break-words shadow-2xs relative group ${
                    isUser
                      ? 'bg-stone-900 text-stone-50 rounded-tr-xs'
                      : 'bg-stone-100 text-stone-800 rounded-tl-xs border border-stone-200/60'
                  }`}
                >
                  {msg.content ? (
                    msg.content
                  ) : (
                    <div className="flex items-center gap-1.5 py-1 text-stone-400">
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce" />
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-2 h-2 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                      <span className="text-xs ml-1 font-medium text-stone-500">
                        {msgPersona.name}가 마음을 담아 답변을 적는 중...
                      </span>
                    </div>
                  )}

                  {/* Actions for Assistant Message */}
                  {!isUser && msg.content && (
                    <div className="mt-3 pt-2 border-t border-stone-200/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                      {/* Empathy Reactions */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleQuickReaction('🥹', '선배의 위로에 눈물 날 뻔했어요')}
                          title="감동이에요"
                          className="px-2 py-1 bg-white hover:bg-stone-200/60 rounded-lg text-stone-600 transition-colors flex items-center gap-1 text-[11px]"
                        >
                          <Heart className="w-3 h-3 text-rose-500 fill-rose-500" />
                          <span>위로됐어요</span>
                        </button>
                        <button
                          onClick={() => handleQuickReaction('☕', '마음이 한결 가벼워졌어요')}
                          title="마음이 놓여요"
                          className="px-2 py-1 bg-white hover:bg-stone-200/60 rounded-lg text-stone-600 transition-colors flex items-center gap-1 text-[11px]"
                        >
                          <Smile className="w-3 h-3 text-amber-500" />
                          <span>안심돼요</span>
                        </button>
                      </div>

                      {/* Copy & Tool Jump Buttons */}
                      <div className="flex items-center gap-1">
                        {onOpenBizTranslateWithText && (
                          <button
                            onClick={() => onOpenBizTranslateWithText(msg.content)}
                            title="이 내용을 비즈니스 언어로 변환하기"
                            className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 rounded-md hover:bg-white transition-colors"
                          >
                            비즈니스 문구 변환
                          </button>
                        )}
                        <button
                          onClick={() => handleCopy(msg.id, msg.content)}
                          className="p-1 text-stone-400 hover:text-stone-700 rounded-md hover:bg-white transition-colors"
                          title="메시지 복사"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Reaction Toast */}
      {reactionFeedback && (
        <div className="px-4 py-2 bg-stone-900 text-white text-xs rounded-full fixed bottom-24 left-1/2 -translate-x-1/2 shadow-lg z-40 animate-in fade-in zoom-in-95">
          {reactionFeedback}
        </div>
      )}

      {/* Message Input Box */}
      <div className="p-3 sm:p-4 bg-white border-t border-stone-200">
        <div className="relative flex items-end gap-2 bg-stone-100 rounded-2xl p-2 border border-stone-200 focus-within:border-amber-400 focus-within:bg-white focus-within:ring-2 focus-within:ring-amber-200 transition-all">
          <textarea
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={`${ActivePersona.name}에게 무엇이든 털어놓으세요 (Enter로 전송, Shift+Enter로 줄바꿈)`}
            className="w-full bg-transparent resize-none outline-none text-sm text-stone-800 placeholder-stone-400 px-2 py-1"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className={`p-2.5 rounded-xl shrink-0 transition-all ${
              input.trim() && !isLoading
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-xs'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] text-stone-400 mt-2 px-1">
          <span className="flex items-center gap-1">
            <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
            사회초년생의 자책과 실수는 배움의 자연스러운 과정입니다
          </span>
          <span className="hidden sm:inline">실시간 AI 멘토링</span>
        </div>
      </div>
    </div>
  );
};
