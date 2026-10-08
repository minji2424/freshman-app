import React, { useState, useEffect } from 'react';
import { X, Wind, Heart, Play, Pause, RefreshCw } from 'lucide-react';

interface BreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BreathPhase = 'inhale' | 'hold' | 'exhale';

export const BreathingModal: React.FC<BreathingModalProps> = ({ isOpen, onClose }) => {
  const [isActive, setIsActive] = useState(true);
  const [phase, setPhase] = useState<BreathPhase>('inhale');
  const [secondsLeft, setSecondsLeft] = useState(4);
  const [completedCycles, setCompletedCycles] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setIsActive(false);
      setPhase('inhale');
      setSecondsLeft(4);
      setCompletedCycles(0);
      return;
    }
    setIsActive(true);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !isActive) return;

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev > 1) {
          return prev - 1;
        }

        // Phase Transition: 4s inhale -> 7s hold -> 8s exhale
        if (phase === 'inhale') {
          setPhase('hold');
          return 7;
        } else if (phase === 'hold') {
          setPhase('exhale');
          return 8;
        } else {
          setPhase('inhale');
          setCompletedCycles((c) => c + 1);
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, isActive, phase]);

  if (!isOpen) return null;

  const phaseConfig = {
    inhale: {
      title: '숨을 깊게 들이쉬세요 (4초)',
      instruction: '코로 천천히 시원한 공기를 가슴 가득 채웁니다',
      color: 'from-sky-400 to-indigo-400 text-sky-800',
      circleScale: 'scale-125 bg-sky-100 border-sky-300',
    },
    hold: {
      title: '숨을 편안히 멈추세요 (7초)',
      instruction: '가슴의 공기와 함께 마음의 긴장을 머금어봅니다',
      color: 'from-amber-400 to-orange-400 text-amber-800',
      circleScale: 'scale-125 bg-amber-100 border-amber-300',
    },
    exhale: {
      title: '입으로 천천히 내쉬세요 (8초)',
      instruction: '회사에서의 무거운 걱정과 자책을 모두 밖으로 내보냅니다',
      color: 'from-emerald-400 to-teal-400 text-emerald-800',
      circleScale: 'scale-90 bg-emerald-100 border-emerald-300',
    },
  };

  const current = phaseConfig[phase];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-stone-200 text-center animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 text-emerald-600 font-semibold text-sm mb-2">
          <Wind className="w-4 h-4" />
          <span>사회초년생 4-7-8 긴장 완화 호흡</span>
        </div>

        <h3 className="text-xl font-bold text-stone-900 mb-1">
          {current.title}
        </h3>
        <p className="text-xs text-stone-500 mb-8">
          {current.instruction}
        </p>

        {/* Breathing Circle Visualizer */}
        <div className="relative flex items-center justify-center h-52 mb-6">
          <div
            className={`w-40 h-40 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-1000 ease-in-out shadow-lg ${current.circleScale}`}
          >
            <span className="text-5xl font-black text-stone-800 tabular-nums">
              {secondsLeft}
            </span>
            <span className="text-xs font-medium text-stone-500 uppercase tracking-widest mt-1">
              초
            </span>
          </div>

          {/* Background soothing ripple */}
          <div className="absolute inset-0 m-auto w-48 h-48 rounded-full border border-stone-200/60 -z-10 animate-ping opacity-20 pointer-events-none" />
        </div>

        {/* Status & Controls */}
        <div className="flex items-center justify-between text-xs text-stone-500 bg-stone-50 p-3 rounded-2xl mb-5">
          <div className="flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>완료한 호흡 사이클: <strong>{completedCycles}회</strong></span>
          </div>
          <span className="text-stone-400">3회 권장</span>
        </div>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => setIsActive(!isActive)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-stone-900 text-white font-medium text-sm hover:bg-stone-800 transition-colors shadow-md"
          >
            {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            {isActive ? '잠시 멈춤' : '다시 시작'}
          </button>
          <button
            onClick={() => {
              setPhase('inhale');
              setSecondsLeft(4);
              setCompletedCycles(0);
              setIsActive(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-stone-100 text-stone-700 font-medium text-sm hover:bg-stone-200 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>처음부터</span>
          </button>
        </div>

        <p className="mt-4 text-[11px] text-stone-400">
          "실수해도 괜찮아요. 지금 이 호흡 안에서 당신은 완벽히 안전합니다."
        </p>
      </div>
    </div>
  );
};
