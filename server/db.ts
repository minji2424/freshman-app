import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface ChatRecord {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  persona?: string;
  createdAt: number;
}

export interface PrescriptionRecord {
  id: string;
  diagnosis: string;
  comfortLetter: string;
  cognitiveReframing: {
    trapThought: string;
    reframedFact: string;
  };
  microSelfCareAction: string;
  cheerQuote: string;
  badgeName: string;
  mood: string;
  tags: string[];
  situation?: string;
  isFavorite?: boolean;
  createdAt: string;
  timestamp: number;
}

export interface SavedTranslationRecord {
  id: string;
  title: string;
  category: string;
  rawText: string;
  formalEmail: {
    subject: string;
    body: string;
  };
  messenger: string;
  verbalSpeech: string;
  seniorProTip: string;
  keyEtiquette: string;
  createdAt: string;
  timestamp: number;
}

export interface MoodLogRecord {
  id: string;
  mood: string;
  tags: string[];
  note: string;
  date: string;
  timestamp: number;
}

export interface AppDatabase {
  chats: ChatRecord[];
  prescriptions: PrescriptionRecord[];
  savedTranslations: SavedTranslationRecord[];
  moodLogs: MoodLogRecord[];
}

const DEFAULT_DB: AppDatabase = {
  chats: [
    {
      id: 'init-msg-1',
      role: 'assistant',
      content: '오늘 하루 정말 고생 많았어요! 회사에서 마음에 걸리는 일이나 속상한 일 있었나요? 편하게 털어놓아 봐요. 언제나 네 편이야 ☕',
      timestamp: '오후 6:00',
      persona: 'warmSenior',
      createdAt: Date.now() - 1000 * 60 * 60,
    },
  ],
  prescriptions: [
    {
      id: 'init-rx-1',
      diagnosis: '첫 온보딩의 정상적인 적응 피로증',
      comfortLetter: '낯선 회사 환경과 수많은 새로운 용어 속에서 긴장하고 실수하는 것은 당신이 부족해서가 아닙니다. 뇌가 적응하기 위해 치열하게 학습하는 정상적인 과정이에요. 오늘 하루도 꿋꿋이 자리를 지킨 스스로의 등을 가볍게 토닥여주세요.',
      cognitiveReframing: {
        trapThought: '나만 일머리가 없고 팀에 민폐를 끼치고 있다.',
        reframedFact: '신입의 기본값은 배우는 것입니다. 실수하고 피드백을 수용하는 과정 자체가 가장 빠른 성장입니다.',
      },
      microSelfCareAction: '퇴근 후 따뜻한 물로 샤워하고 스마트폰 메신저 알림 1시간 끄기',
      cheerQuote: '서투른 오늘은 내일의 단단한 노하우가 됩니다.',
      badgeName: '용기 있게 한 걸음 내딛은 새싹',
      mood: '불안과 긴장',
      tags: ['신입 온보딩', '사수 눈치'],
      situation: '첫 주차인데 모르는 게 너무 많아서 불안해요',
      isFavorite: true,
      createdAt: '10월 8일 (수)',
      timestamp: Date.now() - 1000 * 60 * 120,
    },
  ],
  savedTranslations: [
    {
      id: 'init-trans-1',
      title: '실수/오송부 즉시 보고 및 수습',
      category: '실수 수습',
      rawText: '견적서 파일 잘못 보냈는데 어쩌죠?',
      formalEmail: {
        subject: '[정정 요청] 송부 문서 파일 버전 정정의 건',
        body: '안녕하십니까, 담당자님.\n\n앞서 송부드린 파일 중 최종본이 아닌 이전 버전이 첨부되어, 올바른 최신 파일로 재송부드립니다.\n\n업무에 혼선을 드려 대단히 죄송하며, 첨부된 최신 문서를 확인 부탁드립니다.\n감사합니다.',
      },
      messenger: '선배님, 방금 거래처에 보낸 견적서 파일 버전에 오송부가 확인되어 즉시 정정 파일로 재발송 및 유선 안내드렸습니다. 번거롭게 해드려 죄송합니다!',
      verbalSpeech: '선배님, 방금 메일 오송부 건 즉시 정정 발송하고 사과 연락드렸습니다. 앞으로 발송 전 더블체크 철저히 하겠습니다.',
      seniorProTip: '실수는 즉시 보고하고, 수습 완료 상황까지 한 세트로 보고할 때 신뢰를 지킬 수 있습니다.',
      keyEtiquette: '숨기거나 미루지 마시고 5분 안에 선배에게 고백하세요.',
      createdAt: '10월 8일',
      timestamp: Date.now() - 1000 * 60 * 180,
    },
  ],
  moodLogs: [
    {
      id: 'init-mood-1',
      mood: '불안과 긴장',
      tags: ['첫 출근', '눈치'],
      note: '하루 종일 긴장해서 어깨가 뻐근했지만 잘 퇴근했다.',
      date: '2026-10-08',
      timestamp: Date.now() - 1000 * 60 * 240,
    },
  ],
};

let memoryDb: AppDatabase | null = null;
let writePromise = Promise.resolve();

export async function initDb(): Promise<AppDatabase> {
  if (memoryDb) return memoryDb;

  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    try {
      const content = await fs.readFile(DB_FILE, 'utf-8');
      memoryDb = JSON.parse(content);
    } catch {
      memoryDb = { ...DEFAULT_DB };
      await fs.writeFile(DB_FILE, JSON.stringify(memoryDb, null, 2), 'utf-8');
    }
  } catch (err) {
    console.error('Failed to init DB file, using memory DB:', err);
    memoryDb = { ...DEFAULT_DB };
  }

  return memoryDb!;
}

export async function saveDb(): Promise<void> {
  if (!memoryDb) return;

  writePromise = writePromise.then(async () => {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      await fs.writeFile(tempPath, JSON.stringify(memoryDb, null, 2), 'utf-8');
      await fs.rename(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving DB:', err);
    }
  });

  return writePromise;
}

// 1. Chat Methods
export async function getChatMessages(): Promise<ChatRecord[]> {
  const db = await initDb();
  return db.chats;
}

export async function addChatMessage(msg: Omit<ChatRecord, 'createdAt'>): Promise<ChatRecord> {
  const db = await initDb();
  const record: ChatRecord = {
    ...msg,
    createdAt: Date.now(),
  };
  db.chats.push(record);
  await saveDb();
  return record;
}

export async function setChatMessages(messages: ChatRecord[]): Promise<void> {
  const db = await initDb();
  db.chats = messages;
  await saveDb();
}

export async function clearChatMessages(): Promise<void> {
  const db = await initDb();
  db.chats = [];
  await saveDb();
}

// 2. Prescription Methods
export async function getPrescriptions(): Promise<PrescriptionRecord[]> {
  const db = await initDb();
  return db.prescriptions.sort((a, b) => b.timestamp - a.timestamp);
}

export async function addPrescription(item: Omit<PrescriptionRecord, 'id' | 'timestamp'>): Promise<PrescriptionRecord> {
  const db = await initDb();
  const record: PrescriptionRecord = {
    ...item,
    id: `rx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  };
  db.prescriptions.unshift(record);
  await saveDb();
  return record;
}

export async function toggleFavoritePrescription(id: string): Promise<PrescriptionRecord | null> {
  const db = await initDb();
  const item = db.prescriptions.find((p) => p.id === id);
  if (item) {
    item.isFavorite = !item.isFavorite;
    await saveDb();
    return item;
  }
  return null;
}

export async function deletePrescription(id: string): Promise<boolean> {
  const db = await initDb();
  const idx = db.prescriptions.findIndex((p) => p.id === id);
  if (idx >= 0) {
    db.prescriptions.splice(idx, 1);
    await saveDb();
    return true;
  }
  return false;
}

// 3. Saved Translations Methods
export async function getSavedTranslations(): Promise<SavedTranslationRecord[]> {
  const db = await initDb();
  return db.savedTranslations.sort((a, b) => b.timestamp - a.timestamp);
}

export async function addSavedTranslation(
  item: Omit<SavedTranslationRecord, 'id' | 'timestamp'>
): Promise<SavedTranslationRecord> {
  const db = await initDb();
  const record: SavedTranslationRecord = {
    ...item,
    id: `tr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: Date.now(),
  };
  db.savedTranslations.unshift(record);
  await saveDb();
  return record;
}

export async function deleteSavedTranslation(id: string): Promise<boolean> {
  const db = await initDb();
  const idx = db.savedTranslations.findIndex((t) => t.id === id);
  if (idx >= 0) {
    db.savedTranslations.splice(idx, 1);
    await saveDb();
    return true;
  }
  return false;
}

// 4. Mood Logs Methods
export async function getMoodLogs(): Promise<MoodLogRecord[]> {
  const db = await initDb();
  return db.moodLogs.sort((a, b) => b.timestamp - a.timestamp);
}

export async function addMoodLog(item: Omit<MoodLogRecord, 'id' | 'timestamp'>): Promise<MoodLogRecord> {
  const db = await initDb();
  const record: MoodLogRecord = {
    ...item,
    id: `mood-${Date.now()}`,
    timestamp: Date.now(),
  };
  db.moodLogs.unshift(record);
  await saveDb();
  return record;
}
