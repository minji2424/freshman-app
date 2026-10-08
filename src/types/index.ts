export type PersonaType = 'warmSenior' | 'workCoach' | 'eveningMindset';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  persona?: PersonaType;
}

export interface CognitiveReframing {
  trapThought: string;
  reframedFact: string;
}

export interface PrescriptionResult {
  id?: string;
  diagnosis: string;
  comfortLetter: string;
  cognitiveReframing: CognitiveReframing;
  microSelfCareAction: string;
  cheerQuote: string;
  badgeName: string;
  mood?: string;
  tags?: string[];
  situation?: string;
  isFavorite?: boolean;
  createdAt?: string;
  timestamp?: number;
}

export interface BizTranslationResult {
  formalEmail: {
    subject: string;
    body: string;
  };
  messenger: string;
  verbalSpeech: string;
  seniorProTip: string;
  keyEtiquette: string;
}

export interface CheerCardData {
  title: string;
  quote: string;
  subtext: string;
  iconTheme: string;
}
