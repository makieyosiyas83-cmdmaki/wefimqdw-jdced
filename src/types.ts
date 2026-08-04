export type Language = 'en' | 'am';

export type AppScreen = 'welcome' | 'auth' | 'onboarding' | 'main' | 'admin';

export type MainTab = 'home' | 'history' | 'profile';

export type MaterialType = 'pdf' | 'text' | 'youtube' | 'photo' | 'other';

export type GenerationType = 'notes' | 'flashcards' | 'quiz';

export type QuizType = 'mcq' | 'true_false';

export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export interface EthiopianDate {
  day: number;
  month: string; // e.g. "Meskerem", "Tikimt", etc.
  year: number; // e.g. 2005 E.C.
}

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  authMethod: 'email' | 'phone';
  ethiopianBirthday: EthiopianDate;
  language: Language;
  grade: number; // 1 to 12
  isPro: boolean;
  avatarUrl?: string;
  uploadCount?: number; // Tracks upload count (free limit: 5)
  payCode?: string; // 6-digit payment code for Telebirr payment description
}

export interface MaterialInput {
  type: MaterialType;
  title: string;
  content: string; // raw text, youtube URL, file name, base64 image summary
  customInstruction?: string;
  fileSize?: string;
}

export interface NoteTopic {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  details: string;
}

export interface NoteItem {
  id: string;
  title: string;
  materialTitle: string;
  content: string; // Strict markdown without emojis
  topics?: NoteTopic[];
  summary: string;
  createdAt: string;
  grade: number;
  customInstruction?: string;
}

export interface ExplanationResponse {
  simpleExplanation: string; // Explained like 5
  keyPoints: string[];
  checkQuestion: {
    question: string;
    options: string[];
    correctIndex: number;
    feedback: string;
  };
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  hint?: string;
}

export interface FlashcardSet {
  id: string;
  title: string;
  materialTitle: string;
  difficulty: DifficultyLevel;
  cards: Flashcard[];
  createdAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[]; // For true_false: ["True", "False"]
  correctIndex: number;
  explanation: string;
}

export interface QuizSet {
  id: string;
  title: string;
  materialTitle: string;
  quizType: QuizType;
  difficulty: DifficultyLevel;
  questionCount: number;
  questions: QuizQuestion[];
  createdAt: string;
  bestScore?: number;
}

export interface PaymentRequest {
  id: string;
  userId: string;
  userName?: string;
  userPhone?: string;
  telebirrRef: string;
  sixDigitCode?: string;
  receiptImage?: string; // base64 screenshot of receipt
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface HistoryItem {
  id: string;
  type: GenerationType;
  title: string;
  materialTitle: string;
  date: string;
  data: NoteItem | FlashcardSet | QuizSet;
}
