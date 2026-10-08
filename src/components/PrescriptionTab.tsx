import React, { useState, useEffect } from 'react';
import { 
  Stethoscope, 
  Heart, 
  Sparkles, 
  CheckCircle2, 
  Copy, 
  Check, 
  RotateCcw, 
  Wind,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  Award,
  ChevronDown,
  Clock,
  Star,
  Trash2,
  Database
} from 'lucide-react';
import { PrescriptionResult } from '../types';
import { 
  fetchPrescriptions, 
  deletePrescriptionOnServer, 
  toggleFavoritePrescriptionOnServer 
} from '../services/api';

interface PrescriptionTabProps {
  onOpenBreathingModal: () => void;
}

const MOOD_OPTIONS = [
  { id: 'anxiety', label: '불안과 긴장', icon: '🌪️', desc: '상사 눈치, 내가 잘하고 있는지 매 순간 조마조마해요' },
  { id: 'self_blame', label: '자책과 괴로움', icon: '💔', desc: '오늘 실수해서 팀에 민폐만 끼친 것 같아 괴로워요' },
  { id: 'burnout', label: '번아웃과 무기력', icon: '🔋', desc: '퇴근해도 피곤하고 출근 생각만 하면 가슴이 답답해요' },
  { id: 'hurt', label: '서러움과 눈물', icon: '😢', desc: '선배나 상사의 무심한 한마디에 눈물이 왈칵 쏟아질 뻔했어요' },
  { id: 'alienation', label: '소외감과 겉돎', icon: '🫥', desc: '다들 친해 보이는데 나만 외딴섬처럼 겉도는 느낌이에요' },
  { id: 'overwhelmed', label: '업무 멘붕과 과부하', icon: '🤯', desc: '할 일은 쏟아지는데 뭐부터 어떻게 시작해야 할지 캄캄해요' },
];

const SITUATION_TAGS = [
  '업무 실수 발생',
  '선배의 날카로운 피드백',
  '보고 앞두고 멘붕',
  '퇴근길 지하철 안',
  '회의 중 얼어붙음',
  '슬랙 알림 공포증',
  '점심시간 대화 어색함',
  '나만 모르는 용어 폭탄',
];

export const PrescriptionTab: React.FC<PrescriptionTabProps> = ({ onOpenBreathingModal }) => {
  const [selectedMood, setSelectedMood] = useState(MOOD_OPTIONS[1].label);
  const [selectedTags, setSelectedTags] = useState<string[]>(['업무 실수 발생']);
  const [situation, setSituation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [prescription, setPrescription] = useState<PrescriptionResult | null>(null);
  const [history, setHistory] = useState<PrescriptionResult[]>([]);
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isServerSynced, setIsServerSynced] = useState(false);

  // Load saved prescriptions from backend server on mount
  useEffect(() => {
    let mounted = true;
    fetchPrescriptions()
      .then((items) => {
        if (mounted && Array.isArray(items)) {
          setHistory(items);
          setIsServerSynced(true);
          if (items.length > 0 && !prescription) {
            setPrescription(items[0]);
          }
        }
      })
      .catch((err) => {
        console.warn('Failed to load prescriptions from backend:', err);
        const saved = localStorage.getItem('todak_prescriptions');
        if (saved && mounted) {
          try {
            setHistory(JSON.parse(saved));
          } catch {}
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem('todak_prescriptions', JSON.stringify(history));
    }
  }, [history]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/prescribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mood: selectedMood,
          tags: selectedTags,
          situation: situation.trim() || '오늘 하루 종일 눈치 보이고 내가 잘하고 있는지 막막함',
        }),
      });

      if (!response.ok) {
        throw new Error('처방전 생성 서버 응답 오류');
      }

      // Returned data is already stored on backend server!
      const data: PrescriptionResult = await response.json();
      setPrescription(data);
      setHistory((prev) => [data, ...prev.filter((p) => p.id !== data.id)]);
      setIsServerSynced(true);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('처방전을 불러오는 중 잠시 지연이 발생했습니다. 다시 한 번 버튼을 눌러주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFavorite = async (id?: string) => {
    if (!id) return;
    try {
      const updated = await toggleFavoritePrescriptionOnServer(id);
      setHistory((prev) => prev.map((p) => (p.id === id ? { ...p, isFavorite: updated.isFavorite } : p)));
      if (prescription?.id === id) {
        setPrescription((prev) => (prev ? { ...prev, isFavorite: updated.isFavorite } : null));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    try {
      await deletePrescriptionOnServer(id);
      setHistory((prev) => prev.filter((p) => p.id !== id));
      if (prescription?.id === id) {
        const remaining = history.filter((p) => p.id !== id);
        setPrescription(remaining.length > 0 ? remaining[0] : null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyPrescription = () => {
    if (!prescription) return;
    const text = `[토닥토닥 멘탈 처방전]\n진단명: ${prescription.diagnosis}\n\n위로의 말:\n${prescription.comfortLetter}\n\n[생각의 전환]\n- 내 자책: ${prescription.cognitiveReframing.trapThought}\n- 선배의 시선: ${prescription.cognitiveReframing.reframedFact}\n\n오늘 밤 미션: ${prescription.microSelfCareAction}\n응원 한마디: "${prescription.cheerQuote}"\n뱃지: 🏅 ${prescription.badgeName}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Tab Banner */}
      <div className="bg-gradient-to-r from-rose-500 via-rose-400 to-amber-400 rounded-3xl p-6 sm:p-8 text-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold">
              <Stethoscope className="w-3.5 h-3.5" />
              <span>추가 기능 1 : 마음 응급처치</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              오늘의 신입 멘탈 처방전 & 마음 쉼터
            </h2>
            <p className="text-white/90 text-xs sm:text-sm max-w-xl">
              오늘 겪은 감정과 힘든 상황을 고르면, AI 선배가 자책감을 씻어주는 인지 재구조화 처방전과 위로의 편지를 써드립니다.
            </p>
          </div>

          <button
            onClick={onOpenBreathingModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-rose-700 font-bold text-xs sm:text-sm hover:bg-rose-50 transition-all shadow-md shrink-0"
          >
            <Wind className="w-4 h-4 text-rose-500" />
            <span>가슴 답답할 땐 1분 호흡</span>
          </button>
        </div>
      </div>

      {/* Main Step Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Inputs (Left) */}
        <div className="lg:col-span-5 space-y-5 bg-white p-6 rounded-3xl border border-stone-200 shadow-2xs">
          {/* Step 1: Mood Selection */}
          <div>
            <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
              STEP 1. 지금 마음을 가장 무겁게 짓누르는 감정은?
            </label>
            <div className="grid grid-cols-2 gap-2">
              {MOOD_OPTIONS.map((m) => {
                const isSelected = selectedMood === m.label;
                return (
                  <button
                    key={m.id}
                    onClick={() => setSelectedMood(m.label)}
                    className={`p-3 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-rose-400 bg-rose-50/70 text-rose-950 ring-2 ring-rose-200 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-stone-50/50 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-base">{m.icon}</span>
                      <span className="text-xs font-bold">{m.label}</span>
                    </div>
                    <span className="text-[10px] text-stone-500 leading-tight">
                      {m.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Situation Tags */}
          <div>
            <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
              STEP 2. 관련된 상황 키워드 (복수 선택)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SITUATION_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                      active
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'bg-stone-50 text-stone-600 border-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 3: Situation details */}
          <div>
            <label className="block text-xs font-bold text-stone-900 uppercase tracking-wider mb-2">
              STEP 3. 구체적인 일이나 속마음 털어놓기 (선택)
            </label>
            <textarea
              rows={3}
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="예: 오늘 사수님이 시킨 일에서 오탈자를 못 보고 제출했는데, 팀장님께 불려가서 한 소리 들었어요. 제가 너무 쓸모없는 존재 같아요."
              className="w-full text-xs p-3 rounded-2xl border border-stone-200 bg-stone-50 focus:bg-white focus:border-rose-400 focus:ring-2 focus:ring-rose-100 outline-none resize-none leading-relaxed text-stone-800 placeholder-stone-400"
            />
          </div>

          {/* Error Notice */}
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-medium">
              {errorMessage}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm text-white flex items-center justify-center gap-2 shadow-md transition-all ${
              isLoading
                ? 'bg-stone-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 active:scale-[0.98]'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>AI 선배가 처방전을 작성하고 있어요...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>나만을 위한 멘탈 처방전 발급받기</span>
              </>
            )}
          </button>
        </div>

        {/* Prescription Display (Right) */}
        <div className="lg:col-span-7">
          {prescription ? (
            <div className="bg-white rounded-3xl border-2 border-rose-200 p-6 sm:p-8 shadow-md relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              {/* Rx Watermark badge & actions */}
              <div className="absolute top-4 right-4 flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                  <Database className="w-3 h-3 text-emerald-600" />
                  서버 저장 완료
                </span>
                <button
                  onClick={() => handleToggleFavorite(prescription.id)}
                  className={`p-1.5 rounded-xl transition-colors ${
                    prescription.isFavorite
                      ? 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                      : 'bg-stone-100 text-stone-400 hover:text-amber-500 hover:bg-amber-50'
                  }`}
                  title={prescription.isFavorite ? '즐겨찾기 해제' : '즐겨찾기 등록'}
                >
                  <Star className={`w-4 h-4 ${prescription.isFavorite ? 'fill-amber-500' : ''}`} />
                </button>
                <button
                  onClick={handleCopyPrescription}
                  className="p-1.5 text-stone-400 hover:text-stone-700 bg-stone-100 rounded-xl transition-colors"
                  title="처방전 복사"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleDelete(prescription.id)}
                  className="p-1.5 text-stone-400 hover:text-rose-600 bg-stone-100 rounded-xl transition-colors"
                  title="처방전 삭제"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Prescription Header */}
              <div className="mb-6 pb-4 border-b border-stone-100">
                <span className="text-xs font-semibold text-rose-500 tracking-wider">
                  TODAK MENTAL CLINIC RX
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 mt-1">
                  {prescription.diagnosis}
                </h3>
                <div className="flex items-center gap-2 text-xs text-stone-400 mt-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>처방 일자: {prescription.createdAt || '오늘'}</span>
                </div>
              </div>

              {/* Warm Comfort Letter */}
              <div className="mb-6 bg-rose-50/60 rounded-2xl p-5 border border-rose-100">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-sm mb-2">
                  <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
                  <span>선배가 보내는 온기의 편지</span>
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed whitespace-pre-line">
                  {prescription.comfortLetter}
                </p>
              </div>

              {/* Cognitive Reframing (자책 생각 vs 선배의 객관적 진실) */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-2 text-stone-800 font-bold text-xs uppercase tracking-wider">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  <span>인지 재구조화 (자책 멈추기)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200">
                    <div className="flex items-center gap-1.5 text-stone-500 font-semibold text-xs mb-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      <span>내가 빠진 자책의 함정</span>
                    </div>
                    <p className="text-xs text-stone-700 leading-normal">
                      "{prescription.cognitiveReframing.trapThought}"
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-semibold text-xs mb-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>객관적인 진실과 선배의 시선</span>
                    </div>
                    <p className="text-xs text-emerald-950 font-medium leading-normal">
                      "{prescription.cognitiveReframing.reframedFact}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Tonight's Micro Action & Pill */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200">
                  <span className="text-[11px] font-bold text-amber-800 block mb-1">
                    🌿 퇴근 후 1분 리추얼 액션
                  </span>
                  <p className="text-xs text-stone-800 leading-normal">
                    {prescription.microSelfCareAction}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-indigo-50/80 border border-indigo-200">
                  <span className="text-[11px] font-bold text-indigo-800 block mb-1">
                    💊 오늘 밤의 안심 알약 (명언)
                  </span>
                  <p className="text-xs text-stone-800 font-medium leading-normal italic">
                    "{prescription.cheerQuote}"
                  </p>
                </div>
              </div>

              {/* Server Saved History Drawer / List */}
              {history.length > 0 && (
                <div className="mt-6 pt-5 border-t border-stone-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-stone-700">
                      <Database className="w-3.5 h-3.5 text-emerald-600" />
                      <span>서버에 보관된 처방전 ({history.length}개)</span>
                    </div>
                    <span className="text-[11px] text-stone-400">클릭하여 불러오기</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                    {history.map((item) => {
                      const isCurrent = prescription?.id === item.id;
                      return (
                        <div
                          key={item.id}
                          className={`p-3 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                            isCurrent
                              ? 'bg-rose-50 border-rose-300 shadow-2xs font-semibold'
                              : 'bg-stone-50 border-stone-200 hover:bg-stone-100'
                          }`}
                        >
                          <button
                            onClick={() => setPrescription(item)}
                            className="flex-1 text-left truncate mr-2"
                          >
                            <div className="flex items-center gap-1.5 truncate">
                              {item.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                              <span className="text-stone-800 truncate">{item.diagnosis}</span>
                            </div>
                            <span className="text-[10px] text-stone-400 block mt-0.5">{item.createdAt}</span>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => handleToggleFavorite(item.id)}
                              className="p-1 text-stone-400 hover:text-amber-500 rounded-md"
                              title="즐겨찾기"
                            >
                              <Star className={`w-3.5 h-3.5 ${item.isFavorite ? 'text-amber-500 fill-amber-500' : ''}`} />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id)}
                              className="p-1 text-stone-400 hover:text-rose-600 rounded-md"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full min-h-[380px] bg-white rounded-3xl border border-stone-200 border-dashed p-8 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
                <Stethoscope className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-stone-800 text-base mb-1">
                아직 생성된 처방전이 없습니다
              </h4>
              <p className="text-xs text-stone-500 max-w-sm mb-6">
                왼쪽에서 지금 느끼는 감정과 상황을 선택하고 버튼을 눌러보세요. 상처받은 마음에 따뜻한 반창고를 붙여드릴게요.
              </p>

              {history.length > 0 && (
                <div className="w-full max-w-md text-left pt-4 border-t border-stone-100">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-stone-600 mb-2">
                    <Database className="w-3.5 h-3.5 text-emerald-600" />
                    <span>서버에 저장된 지난 처방전:</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => setPrescription(item)}
                        className="w-full text-left p-2.5 rounded-xl hover:bg-stone-50 border border-stone-100 text-xs flex items-center justify-between group"
                      >
                        <span className="font-medium text-stone-700 truncate group-hover:text-rose-600 flex items-center gap-1.5">
                          {item.isFavorite && <Star className="w-3 h-3 text-amber-500 fill-amber-500 shrink-0" />}
                          {item.diagnosis}
                        </span>
                        <span className="text-[11px] text-stone-400 shrink-0">
                          {item.createdAt}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
