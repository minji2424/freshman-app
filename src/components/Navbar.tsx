import React from 'react';
import { 
  HeartHandshake, 
  MessageCircleHeart, 
  Stethoscope, 
  Briefcase, 
  Sparkles,
  Wind,
  Database
} from 'lucide-react';

interface NavbarProps {
  activeTab: 'chat' | 'prescribe' | 'biz' | 'lounge';
  setActiveTab: (tab: 'chat' | 'prescribe' | 'biz' | 'lounge') => void;
  openBreatheModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  openBreatheModal,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Slogan */}
          <div 
            onClick={() => setActiveTab('chat')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-400 flex items-center justify-center text-white shadow-md shadow-rose-200/50 group-hover:scale-105 transition-transform">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-stone-900 tracking-tight">
                  토닥토닥
                </span>
                <span className="text-[11px] font-medium bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-200">
                  신입 안심 케어
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block">
                사회초년생의 불안과 실수를 보듬는 다정한 AI 선배
              </p>
            </div>
          </div>

          {/* Backend DB Status & 1-Min Breathe Action */}
          <div className="flex items-center gap-2">
            <div 
              title="대화, 처방전, 비즈니스 템플릿이 백엔드 서버 DB에 영구 저장됩니다"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-full shadow-2xs"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">서버 DB 연동</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>

            <button
              onClick={openBreatheModal}
              title="심호흡으로 긴장 풀기"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 border border-stone-200 rounded-full transition-colors shadow-2xs"
            >
              <Wind className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">긴장 완화</span> 1분 호흡
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 sm:space-x-2 border-t border-stone-100 py-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'chat'
                ? 'bg-amber-50 text-amber-900 shadow-xs border border-amber-200 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <MessageCircleHeart className={`w-4 h-4 ${activeTab === 'chat' ? 'text-amber-600' : 'text-stone-400'}`} />
            <span>토닥 챗봇</span>
            <span className="hidden md:inline text-[11px] text-amber-600/80 font-normal">
              (맞춤 선배 상담)
            </span>
          </button>

          <button
            onClick={() => setActiveTab('prescribe')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'prescribe'
                ? 'bg-rose-50 text-rose-900 shadow-xs border border-rose-200 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Stethoscope className={`w-4 h-4 ${activeTab === 'prescribe' ? 'text-rose-600' : 'text-stone-400'}`} />
            <span>오늘의 멘탈 처방전</span>
            <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.2 rounded-full font-bold">
              추가기능 1
            </span>
          </button>

          <button
            onClick={() => setActiveTab('biz')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'biz'
                ? 'bg-indigo-50 text-indigo-900 shadow-xs border border-indigo-200 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Briefcase className={`w-4 h-4 ${activeTab === 'biz' ? 'text-indigo-600' : 'text-stone-400'}`} />
            <span>비즈니스 언어 변환기</span>
            <span className="text-[10px] bg-indigo-500 text-white px-1.5 py-0.2 rounded-full font-bold">
              추가기능 2
            </span>
          </button>

          <button
            onClick={() => setActiveTab('lounge')}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl whitespace-nowrap transition-all ${
              activeTab === 'lounge'
                ? 'bg-emerald-50 text-emerald-900 shadow-xs border border-emerald-200 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${activeTab === 'lounge' ? 'text-emerald-600' : 'text-stone-400'}`} />
            <span>신입 안심 라운지</span>
          </button>
        </div>
      </div>
    </header>
  );
};
