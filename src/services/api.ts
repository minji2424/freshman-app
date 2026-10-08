import { ChatMessage, PrescriptionResult, BizTranslationResult } from '../types';

export interface StorageStats {
  status: string;
  storageEngine: string;
  stats: {
    chatsCount: number;
    prescriptionsCount: number;
    savedTranslationsCount: number;
    moodLogsCount: number;
  };
  lastSyncedAt: string;
}

export interface SavedTranslationItem {
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
}

export interface MoodLogItem {
  id: string;
  mood: string;
  tags: string[];
  note: string;
  date: string;
  timestamp: number;
}

// 1. Chat History API
export async function fetchChatHistory(): Promise<ChatMessage[]> {
  const res = await fetch('/api/chat/history');
  if (!res.ok) throw new Error('Failed to fetch chat history');
  return res.json();
}

export async function saveChatHistory(messages: ChatMessage[]): Promise<void> {
  await fetch('/api/chat/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
}

export async function clearChatHistoryOnServer(): Promise<void> {
  await fetch('/api/chat/history', {
    method: 'DELETE',
  });
}

// 2. Prescriptions API
export async function fetchPrescriptions(): Promise<PrescriptionResult[]> {
  const res = await fetch('/api/prescriptions');
  if (!res.ok) throw new Error('Failed to fetch prescriptions');
  return res.json();
}

export async function savePrescriptionToServer(prescription: PrescriptionResult): Promise<PrescriptionResult> {
  const res = await fetch('/api/prescriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(prescription),
  });
  if (!res.ok) throw new Error('Failed to save prescription');
  return res.json();
}

export async function toggleFavoritePrescriptionOnServer(id: string): Promise<PrescriptionResult> {
  const res = await fetch(`/api/prescriptions/${id}/favorite`, {
    method: 'PATCH',
  });
  if (!res.ok) throw new Error('Failed to toggle favorite');
  return res.json();
}

export async function deletePrescriptionOnServer(id: string): Promise<void> {
  const res = await fetch(`/api/prescriptions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete prescription');
}

// 3. Saved Business Translations API
export async function fetchSavedTranslations(): Promise<SavedTranslationItem[]> {
  const res = await fetch('/api/saved-translations');
  if (!res.ok) throw new Error('Failed to fetch saved translations');
  return res.json();
}

export async function saveTranslationToServer(
  item: Omit<SavedTranslationItem, 'id' | 'createdAt'> & { title?: string; category?: string }
): Promise<SavedTranslationItem> {
  const res = await fetch('/api/saved-translations', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...item,
      title: item.title || '업무 커뮤니케이션 템플릿',
      category: item.category || '비즈니스 언어',
      createdAt: new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' }),
    }),
  });
  if (!res.ok) throw new Error('Failed to save translation');
  return res.json();
}

export async function deleteTranslationOnServer(id: string): Promise<void> {
  const res = await fetch(`/api/saved-translations/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete translation');
}

// 4. Mood Logs API
export async function fetchMoodLogs(): Promise<MoodLogItem[]> {
  const res = await fetch('/api/mood-logs');
  if (!res.ok) throw new Error('Failed to fetch mood logs');
  return res.json();
}

export async function saveMoodLogToServer(mood: string, tags: string[], note: string): Promise<MoodLogItem> {
  const res = await fetch('/api/mood-logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mood,
      tags,
      note,
      date: new Date().toISOString().slice(0, 10),
    }),
  });
  if (!res.ok) throw new Error('Failed to save mood log');
  return res.json();
}

// 5. Backend Storage Status
export async function fetchStorageStats(): Promise<StorageStats> {
  const res = await fetch('/api/storage/stats');
  if (!res.ok) throw new Error('Failed to fetch storage stats');
  return res.json();
}
