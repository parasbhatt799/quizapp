
export interface Question {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface UserStats {
  coins: number;
  quizzesCompleted: number;
  correctAnswers: number;
  lastCheckIn?: string;
  checkInStreak: number;
  followedInstagram?: boolean;
  joinedTelegram?: boolean;
}

export interface QuizHistoryEntry {
  id: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  score: number;
  totalQuestions: number;
  date: string;
}

export type Difficulty = 'Easy' | 'Medium' | 'Hard';

export enum Page {
  INTRO = 'intro',
  HOME = 'home',
  CATEGORIES = 'categories',
  QUIZ = 'quiz',
  RESULTS = 'results',
  REWARDS = 'rewards',
  HISTORY = 'history',
  REDEEM = 'redeem',
  WINNERS = 'winners',
  EARN_MORE = 'earn_more'
}
