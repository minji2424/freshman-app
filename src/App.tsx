import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { ChatTab } from './components/ChatTab';
import { PrescriptionTab } from './components/PrescriptionTab';
import { BizTranslateTab } from './components/BizTranslateTab';
import { ReassuranceLoungeTab } from './components/ReassuranceLoungeTab';
import { BreathingModal } from './components/BreathingModal';
import { Heart, ShieldCheck, Sparkles, Coffee } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'prescribe' | 'biz' | 'lounge'>('chat');
  const [isBreatheModalOpen, setIsBreatheModalOpen] = useState(false);
  const [presetBizText, setPresetBizText] = useState('');

  const handleOpenBizTranslate = (text: string) => {
    setPresetBizText(text);
    setActiveTab('biz');
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9F6] text-stone-800 antialiased selection:bg-amber-100 selection:text-amber-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openBreatheModal={() => setIsBreatheModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeTab === 'chat' && (
          <ChatTab
            onOpenBizTranslateWithText={handleOpenBizTranslate}
          />
        )}

        {activeTab === 'prescribe' && (
          <PrescriptionTab
            onOpenBreathingModal={() => setIsBreatheModalOpen(true)}
          />
        )}

        {activeTab === 'biz' && (
          <BizTranslateTab
            initialText={presetBizText}
          />
        )}

        {activeTab === 'lounge' && (
          <ReassuranceLoungeTab />
        )}
      </main>

      {/* 4-7-8 Breathing Relaxation Modal */}
      <BreathingModal
        isOpen={isBreatheModalOpen}
        onClose={() => setIsBreatheModalOpen(false)}
      />

      {/* Bottom Gentle Footer */}
      <footer className="border-t border-stone-200/80 bg-white/60 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-700">토닥토닥 (Todak)</span>
            <span>·</span>
            <span className="flex items-center gap-1 text-rose-600 font-medium">
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              대한민국 모든 사회초년생의 첫걸음을 응원합니다
            </span>
          </div>

          <div className="flex items-center gap-4 text-stone-400">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              심리적 안전지대
            </span>
            <span>·</span>
            <span>Gemini AI 기반 맞춤형 코칭</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
