
export interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface Answer {
  questionId: number;
  selectedAnswer: string;
}

export type SkillLevel = '입문' | '중급' | '고급';

export interface TestResult {
  id: string; // UUID
  name: string;
  email: string;
  score: number;
  answers: Answer[];
  correct_count: number;
  level: SkillLevel;
  agree_personal: boolean;
  created_at: string; // timestamp
}

export interface UserInfo {
  name: string;
  email: string;
  consent: boolean;
}
