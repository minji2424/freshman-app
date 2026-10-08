import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Send, 
  Mail, 
  MessageSquare, 
  UserCheck, 
  Lightbulb, 
  Copy, 
  Check, 
  Sparkles, 
  AlertOctagon, 
  ArrowRight, 
  HelpCircle, 
  FileText,
  Bookmark,
  Database,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { BizTranslationResult } from '../types';
import { 
  fetchSavedTranslations, 
  saveTranslationToServer, 
  deleteTranslationOnServer, 
  SavedTranslationItem 
} from '../services/api';

interface BizTranslateTabProps {
  initialText?: string;
}

const PRESET_SCENARIOS = [
  {
    title: '실수/오송부 보고',
    type: 'mistake_report',
    raw: '실수로 거래처에 견적서 파일을 이전 버전으로 잘못 보냈어요. 큰일 난 것 같은데 어떻게 사수님께 보고하고 수습하죠?',
    badge: '🚨 긴급 수습'
  },
  {
    title: '업무 마감 연장 요청',
    type: 'deadline_extend',
    raw: '오늘 오후 5시까지 취합해서 드리기로 한 자료인데, 생각보다 검토할 게 많아서 오늘 안에 못 끝낼 것 같아요. 내일 오전까지로 미뤄도 될까요?',
    badge: '⏳ 기한 조율'
  },
  {
    title: '사수에게 눈치 안 보고 질문',
    type: 'asking_question',
    raw: '선배님이 주신 업무인데 솔직히 무슨 말인지 잘 모르겠고 어떤 툴로 작업해야 하는지 헷갈려요. 바빠 보이시는데 언제 어떻게 여쭤봐야 할까요?',
    badge: '❓ 질문 화법'
  },
  {
    title: '당일 병가/연차 신청',
    type: 'sick_leave',
    raw: '오늘 아침부터 열이 심하게 나고 몸살 기운이 너무 심해서 출근하기 힘들 것 같아요. 당일 병가 죄송하다고 어떻게 말씀드려야 할까요?',
    badge: '🏖️ 휴가/병가'
  },
  {
    title: '무리한 업무 정중히 거절',
    type: 'polite_refuse',
    raw: '타팀 대리님이 급하다고 파일 좀 정리해 달라고 하시는데, 지금 제 본업도 마감 직전이라 도저히 해드릴 여유가 없어요.',
    badge: '✋ 완곡한 거절'
  },
  {
    title: '첫 협업 메신저 인사',
    type: 'first_contact',
    raw: '다른 부서 선배님께 데이터 요청을 해야 하는데, 처음 대화해보는 분이라 무례하지 않게 슬랙으로 인사하고 요청드리고 싶어요.',
    badge: '💬 메신저 첫인사'
  }
];

export const BizTranslateTab: React.FC<BizTranslateTabProps> = ({ initialText = '' }) => {
  const [rawText, setRawText] = useState(initialText);
  const [selectedScenario, setSelectedScenario] = useState(PRESET_SCENARIOS[0].type);
  const [tone, setTone] = useState<'polite' | 'soft' | 'confident'>('polite');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<BizTranslationResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedList, setSavedList] = useState<SavedTranslationItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Load saved templates from backend on mount
  useEffect(() => {
    let mounted = true;
    fetchSavedTranslations()
      .then((items) => {
        if (mounted && Array.isArray(items)) {
          setSavedList(items);
        }
      })
      .catch((err) => console.warn('Failed to fetch saved translations:', err));
    return () => {
      mounted = false;
    };
  }, []);

  const handleSaveToServer = async () => {
    if (!result) return;
    setIsSaving(true);
    try {
      const saved = await saveTranslationToServer({
        title: rawText.slice(0, 24) || '비즈니스 표현',
        category: selectedScenario,
        rawText,
        formalEmail: result.formalEmail,
        messenger: result.messenger,
        verbalSpeech: result.verbalSpeech,
        seniorProTip: result.seniorProTip,
        keyEtiquette: result.keyEtiquette,
      });
      setSavedList((prev) => [saved, ...prev.filter((p) => p.id !== saved.id)]);
      setSaveSuccessMsg('💾 백엔드 서버에 템플릿이 영구 저장되었습니다!');
      setTimeout(() => setSaveSuccessMsg(null), 2500);
    } catch (e) {
      console.error(e);
      setErrorMessage('서버 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSaved = async (id: string) => {
    try {
      await deleteTranslationOnServer(id);
      setSavedList((prev) => prev.filter((item) => item.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  const handleTranslate = async (textToUse?: string) => {
    const text = (textToUse || rawText).trim();
    if (!text) {
      setErrorMessage('변환할 속마음이나 상황을 입력해 주세요.');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    setIsLoading(true);
    setResult(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/biz-translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: text,
          situationType: selectedScenario,
          tone
        })
      });

      if (!response.ok) {
        throw new Error('Biz translation failed');
      }

      const data: BizTranslationResult = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setErrorMessage('번역 중 지연이 발생했습니다. 다시 한 번 버튼을 눌러주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (key: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 rounded-3xl p-6 sm:p-8 text-white shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
            <Briefcase className="w-3.5 h-3.5" />
            <span>추가 기능 2 : 신입 구원투수</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            신입사원 비즈니스 언어 변환기 & SOS 회신기
          </h2>
          <p className="text-white/90 text-xs sm:text-sm max-w-xl">
            "어떻게 말해야 눈치 안 보이고 예의 바를까?" 고민되는 순간, 거친 속마음을 깔끔하고 신뢰받는 프로의 언어로 즉시 바꿔드립니다.
          </p>
        </div>
      </div>

      {/* Preset Quick Buttons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            사회초년생 단골 SOS 상황 프리셋 (클릭 시 자동 입력)
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PRESET_SCENARIOS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => {
                setSelectedScenario(item.type);
                setRawText(item.raw);
                handleTranslate(item.raw);
              }}
              className="p-3 bg-white hover:bg-stone-50 border border-stone-200 rounded-2xl text-left transition-all hover:border-indigo-300 shadow-2xs group"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-stone-800 group-hover:text-indigo-600">
                  {item.title}
                </span>
                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md font-medium">
                  {item.badge}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 line-clamp-1">
                {item.raw}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-stone-900 mb-1.5">
            말하고 싶은 속마음 or 어색한 초안을 편하게 적어보세요
          </label>
          <textarea
            rows={3}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="예: 지금 다른 업무 때문에 도저히 오늘 안에 못 끝낼 것 같은데 사수님한테 뭐라고 말씀드려야 할지 무서워요."
            className="w-full text-sm p-4 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none leading-relaxed resize-none text-stone-800 placeholder-stone-400"
          />
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          {/* Tone Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-stone-500">원하는 톤:</span>
            <div className="flex gap-1 bg-stone-100 p-1 rounded-xl text-xs">
              <button
                onClick={() => setTone('polite')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  tone === 'polite' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                정중하고 깍듯하게
              </button>
              <button
                onClick={() => setTone('soft')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  tone === 'soft' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                부드럽고 센스 있게
              </button>
              <button
                onClick={() => setTone('confident')}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  tone === 'confident' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                명확하고 당당하게
              </button>
            </div>
          </div>

          <button
            onClick={() => handleTranslate()}
            disabled={isLoading || !rawText.trim()}
            className={`px-6 py-3 rounded-2xl font-bold text-sm text-white flex items-center gap-2 shadow-md transition-all ${
              isLoading || !rawText.trim()
                ? 'bg-stone-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>비즈니스 언어로 다듬는 중...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>프로 직장인 문구로 변환하기</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Translation Output Grid */}
      {result && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          {/* Action Header: Save to Server */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-indigo-50/70 border border-indigo-200 rounded-2xl">
            <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>변환된 문구를 서버 보관함에 영구 저장해 두고 언제든 꺼내 쓰세요!</span>
            </div>
            <button
              onClick={handleSaveToServer}
              disabled={isSaving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs active:scale-95 disabled:bg-stone-300"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isSaving ? '서버 저장 중...' : '내 템플릿 보관함에 저장'}</span>
            </button>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-semibold animate-in fade-in">
              {saveSuccessMsg}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Format 1: Messenger (Slack / Teams / Kakao) */}
            <div className="bg-white rounded-3xl border-2 border-indigo-100 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs">
                    <MessageSquare className="w-4 h-4" />
                    <span>사내 메신저 (슬랙/잔디/카톡)</span>
                  </div>
                  <button
                    onClick={() => handleCopy('messenger', result.messenger)}
                    className="p-1.5 text-stone-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition-colors"
                    title="복사"
                  >
                    {copiedKey === 'messenger' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap font-sans border border-stone-100">
                  {result.messenger}
                </div>
              </div>
              <span className="text-[10px] text-stone-400 mt-3 block text-center">
                클릭 시 메신저에 바로 붙여넣을 수 있습니다
              </span>
            </div>

            {/* Format 2: Verbal Speech (Face-to-Face 10s Speech) */}
            <div className="bg-white rounded-3xl border-2 border-sky-100 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-sky-700 font-bold text-xs">
                    <UserCheck className="w-4 h-4" />
                    <span>구두 10초 대면 스피치 (자리 방문)</span>
                  </div>
                  <button
                    onClick={() => handleCopy('verbal', result.verbalSpeech)}
                    className="p-1.5 text-stone-400 hover:text-sky-600 rounded-lg hover:bg-sky-50 transition-colors"
                    title="복사"
                  >
                    {copiedKey === 'verbal' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl text-xs sm:text-sm text-stone-800 leading-relaxed whitespace-pre-wrap font-sans border border-stone-100">
                  {result.verbalSpeech}
                </div>
              </div>
              <span className="text-[10px] text-stone-400 mt-3 block text-center">
                선배 자리로 가기 전 한 번 소리 내어 읽어보세요
              </span>
            </div>

            {/* Format 3: Formal Email */}
            <div className="bg-white rounded-3xl border-2 border-emerald-100 p-5 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-stone-100">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <Mail className="w-4 h-4" />
                    <span>정중한 비즈니스 이메일</span>
                  </div>
                  <button
                    onClick={() => handleCopy('email', `[제목] ${result.formalEmail.subject}\n\n${result.formalEmail.body}`)}
                    className="p-1.5 text-stone-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors"
                    title="전체 복사"
                  >
                    {copiedKey === 'email' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
                <div className="bg-stone-50 p-4 rounded-2xl text-xs sm:text-sm text-stone-800 leading-relaxed space-y-2 font-sans border border-stone-100">
                  <div className="font-semibold text-stone-900 pb-1 border-b border-stone-200">
                    제목: {result.formalEmail.subject}
                  </div>
                  <div className="whitespace-pre-wrap text-[11px] sm:text-xs">
                    {result.formalEmail.body}
                  </div>
                </div>
              </div>
              <span className="text-[10px] text-stone-400 mt-3 block text-center">
                제목과 본문이 완벽히 구성되었습니다
              </span>
            </div>
          </div>

          {/* Senior Pro Tip & Caution */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
              <Lightbulb className="w-4 h-4 text-amber-600" />
              <span>선배의 실무 시크릿 코멘트 & 주의점</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-stone-700">
              <div className="bg-white/80 p-4 rounded-2xl border border-amber-100">
                <span className="font-bold text-amber-800 block mb-1">
                  💡 왜 이렇게 말하는 것이 좋을까요?
                </span>
                <p className="leading-relaxed">
                  {result.seniorProTip}
                </p>
              </div>

              <div className="bg-white/80 p-4 rounded-2xl border border-rose-100">
                <span className="font-bold text-rose-800 block mb-1">
                  ⚠️ 이 상황에서 절대 하지 말아야 할 행동
                </span>
                <p className="leading-relaxed">
                  {result.keyEtiquette}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saved Templates Library (Backend Server Persistent) */}
      <div className="bg-white rounded-3xl border border-stone-200 p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-stone-900 text-sm sm:text-base">
              내 비즈니스 템플릿 보관함 ({savedList.length}개)
            </h3>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
              <Database className="w-2.5 h-2.5" />
              서버 영구 저장
            </span>
          </div>
          <span className="text-xs text-stone-400">
            실무에서 자주 쓰는 문구를 저장해두고 언제든 복사하세요
          </span>
        </div>

        {savedList.length === 0 ? (
          <div className="py-8 text-center text-xs text-stone-400 border border-dashed border-stone-200 rounded-2xl">
            아직 보관된 템플릿이 없습니다. 위에서 문구를 변환한 후 '내 템플릿 보관함에 저장'을 눌러보세요.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
            {savedList.map((item) => (
              <div
                key={item.id}
                className="p-4 rounded-2xl bg-stone-50 border border-stone-200 hover:border-indigo-200 transition-colors flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-stone-900 truncate mr-2">
                      {item.title}
                    </span>
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md font-medium shrink-0">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 line-clamp-1 italic">
                    속마음: "{item.rawText}"
                  </p>
                  <div className="mt-2 p-2.5 bg-white rounded-xl border border-stone-100 text-xs text-stone-800 line-clamp-2">
                    {item.messenger || item.formalEmail.body}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-xs">
                  <span className="text-[10px] text-stone-400">
                    {item.createdAt}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleCopy(`saved-msg-${item.id}`, item.messenger)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 flex items-center gap-1 transition-colors"
                      title="메신저 문구 복사"
                    >
                      {copiedKey === `saved-msg-${item.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-stone-400" />
                      )}
                      <span>메신저 복사</span>
                    </button>
                    <button
                      onClick={() =>
                        handleCopy(
                          `saved-email-${item.id}`,
                          `[제목] ${item.formalEmail.subject}\n\n${item.formalEmail.body}`
                        )
                      }
                      className="px-2.5 py-1 text-[11px] font-semibold bg-white hover:bg-stone-100 text-stone-700 rounded-lg border border-stone-200 flex items-center gap-1 transition-colors"
                      title="이메일 전문 복사"
                    >
                      {copiedKey === `saved-email-${item.id}` ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Mail className="w-3 h-3 text-stone-400" />
                      )}
                      <span>이메일 복사</span>
                    </button>
                    <button
                      onClick={() => handleDeleteSaved(item.id)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded-lg hover:bg-white transition-colors"
                      title="삭제"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
