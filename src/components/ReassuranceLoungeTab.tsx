import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Coffee, 
  Heart, 
  Smile, 
  RotateCw, 
  CheckCircle, 
  Shield, 
  Flame, 
  Sun,
  Award
} from 'lucide-react';
import { CheerCardData } from '../types';

const SENIOR_MISTAKES = [
  {
    role: '마케팅 7년 차 팀장',
    mistake: '전 사원 400명에게 실수로 "넵!" 메일 전체 답장 누른 날',
    story: '입사 2주 차에 팀장님 메일에 전체 답장을 눌러 400명에게 메일이 발송됐어요. 식은땀이 비 오듯 쏟아지고 해고당하는 줄 알았죠.',
    seniorMessage: '선배들이 웃으면서 "신입 신고식 제대로 했네!" 하고 커피 한 잔 사주셨어요. 회사는 그런 걸로 안 망합니다!',
    tag: '메일 실수'
  },
  {
    role: '개발 5년 차 시니어',
    mistake: '공유 스프레드시트 핵심 함수 수식 통째로 날리고 사색된 날',
    story: 'Ctrl+Z도 안 먹히는 공유 시트에서 수백 개 행의 수식을 덮어씌워 날렸습니다. 손이 덜덜 떨렸는데 사수님이 차분히 "버전 기록 보기"로 3초 만에 복구해주셨어요.',
    seniorMessage: '실수는 누구에게나 찾아와요. 중요한 건 숨기지 않고 3분 안에 선배에게 고백하는 용기입니다.',
    tag: '데이터 수습'
  },
  {
    role: '기획 6년 차 과장',
    mistake: '대표님인 줄 모르고 엘리베이터에서 "저기요 몇 층 가세요?" 한 날',
    story: '첫 출근 주에 모르는 아저씨가 타시길래 퉁명스럽게 몇 층 가시냐고 물었는데, 알고 보니 그룹사 대표님이셨습니다.',
    seniorMessage: '대표님이 오히려 껄껄 웃으시며 신입이냐고 물어보셨어요. 누구나 첫날엔 앞이 깜깜한 법이에요.',
    tag: '대면 해프닝'
  },
  {
    role: '영업 4년 차 대리',
    mistake: '외부 바이어 전화 받고 뇌정지 와서 "여보세요?" 하고 끊어버린 날',
    story: '회사 전화벨이 울리는데 아무도 안 받아서 떨리는 손으로 수화기를 들었습니다. 상호명 말해야 하는 걸 까먹고 "여보세요? 어..." 하다가 당황해서 끊었어요.',
    seniorMessage: '그 바이어가 다시 전화해서 "신입분이신가 봐요, 귀여우시네" 하셨어요. 서투름은 신입의 특권입니다.',
    tag: '전화 공포증'
  }
];

const MINDSET_RULES = [
  { num: '01', title: '회사에서의 내가 내 전부는 아닙니다', desc: '직장은 돈과 경험을 얻는 곳일 뿐, 당신의 인격이나 인간적 가치를 평가하는 곳이 아닙니다.' },
  { num: '02', title: '신입의 기본 상태는 모르는 것입니다', desc: '입사하자마자 척척 해내는 신입은 판타지입니다. 묻고, 배우고, 부딪히는 것이 일하는 정상 과정입니다.' },
  { num: '03', title: '오늘의 실수는 내일의 노하우가 됩니다', desc: '실수하지 않고 배운 일보다, 한번 뼈아프게 실수하고 수습해본 일이 평생 내 진짜 실력이 됩니다.' },
  { num: '04', title: '퇴근 후 문을 닫는 순간, 회사 스위치는 OFF', desc: '침대에 누워 지난 낮의 일을 되감기하지 마세요. 당신은 오늘 하루를 무사히 살아낸 승리자입니다.' },
  { num: '05', title: '스스로를 가장 먼저 다독여주세요', desc: '남들의 인정보다 소중한 건 "오늘 낯선 곳에서 고군분투한 나"를 꼭 안아주는 나 자신의 따뜻한 눈빛입니다.' },
];

export const ReassuranceLoungeTab: React.FC = () => {
  const [cheerCard, setCheerCard] = useState<CheerCardData | null>({
    title: '오늘의 토닥 비타민',
    quote: '처음부터 능숙한 사람은 아무도 없어요. 오늘의 서투름은 당신이 성장하고 있다는 가장 확실한 증거입니다.',
    subtext: '오늘도 버텨낸 당신의 등을 살포시 토닥여주세요.',
    iconTheme: 'sprout',
  });
  const [isLoading, setIsLoading] = useState(false);

  const fetchNewCheerCard = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/cheer-card');
      const data = await res.json();
      setCheerCard(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Encouragement Fortune Capsule Section */}
      <div className="bg-gradient-to-tr from-amber-500 via-orange-400 to-rose-400 rounded-3xl p-6 sm:p-8 text-white shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-white/20 backdrop-blur-md">
              💌 하루 한 번 선배의 응원 캡슐
            </span>
            <button
              onClick={fetchNewCheerCard}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-xs font-semibold transition-all active:scale-95"
            >
              <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>새로운 응원 뽑기</span>
            </button>
          </div>

          <div className="py-2">
            <h3 className="text-xl sm:text-2xl font-black mb-2 text-white">
              "{cheerCard?.quote}"
            </h3>
            <p className="text-white/90 text-xs sm:text-sm">
              {cheerCard?.subtext}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2 text-xs text-white/80">
            <Heart className="w-4 h-4 fill-white text-white" />
            <span>당신은 오늘도 충분히 잘 해냈습니다.</span>
          </div>
        </div>

        {/* Ambient background blur */}
        <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
      </div>

      {/* Senior Mistakes Wall */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span>선배들도 다 겪었던 "레전드 신입 실수" 안심 백과</span>
            </h3>
            <p className="text-xs text-stone-500">
              "나만 바보인가 봐..." 절대 아닙니다! 지금의 프로 선배들도 신입 시절엔 모두 이런 대형 실수를 겪었습니다.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SENIOR_MISTAKES.map((item, idx) => (
            <div
              key={idx}
              className="bg-white p-5 rounded-3xl border border-stone-200 shadow-2xs hover:shadow-xs transition-shadow space-y-3 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-stone-900 bg-stone-100 px-2.5 py-1 rounded-xl">
                    {item.role}
                  </span>
                  <span className="text-[11px] font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                    {item.tag}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-stone-800 mb-2">
                  {item.mistake}
                </h4>

                <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-2xl mb-3">
                  "{item.story}"
                </p>
              </div>

              <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-100 text-xs text-emerald-950 font-medium">
                <span className="text-emerald-700 font-bold block text-[11px] mb-0.5">
                  🌿 선배의 메시지
                </span>
                {item.seniorMessage}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5 Rules for Freshers' Mental Wellness */}
      <div className="bg-stone-900 text-stone-100 rounded-3xl p-6 sm:p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-amber-400 text-xs font-bold tracking-widest uppercase">
              Mindset Protocol
            </span>
            <h3 className="text-xl font-bold text-white">
              퇴근길 지하철에서 되새기는 신입 멘탈 5계명
            </h3>
          </div>
          <Award className="w-8 h-8 text-amber-400" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MINDSET_RULES.map((rule, idx) => (
            <div
              key={idx}
              className="p-4 rounded-2xl bg-stone-800/80 border border-stone-700/80 space-y-2"
            >
              <div className="text-2xl font-black text-amber-400 font-mono">
                {rule.num}
              </div>
              <h4 className="text-sm font-bold text-white">
                {rule.title}
              </h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                {rule.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
