export type Language = 'en' | 'fr' | 'ar';

export type AcademicLevel = 
  | 'high_school'
  | 'university'
  | 'engineering_school'
  | 'business_school'
  | 'medicine'
  | 'other';

export type StudyField =
  | 'computer_science'
  | 'engineering'
  | 'business'
  | 'management'
  | 'mathematics'
  | 'physics'
  | 'biology'
  | 'medicine'
  | 'languages'
  | 'law'
  | 'other';

export type SubscriptionTier = 'free_trial' | 'free_expired' | 'premium' | 'gold';

export interface UserSubscription {
  tier: SubscriptionTier;
  trialStartedAt?: string;
  trialExpiresAt?: string;
  isTrialActive: boolean;
  premiumExpiresAt?: string;
  autoRenew: boolean;
  planName: string;
  priceMAD: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  academicLevel: AcademicLevel;
  studyField: StudyField;
  language: Language;
  dailyGoalMinutes: number;
  streakDays: number;
  bestStreakDays: number;
  lastStudyDate?: string;
  totalXp: number;
  level: number;
  levelTitle: string;
  avatarUrl?: string;
  subscription: UserSubscription;
  createdAt: string;
}

export interface CourseDocument {
  id: string;
  courseId: string;
  title: string;
  fileType: 'pdf' | 'docx' | 'pptx' | 'txt' | 'md';
  fileSize: string;
  content: string;
  summary?: string;
  keyConcepts?: string[];
  createdAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  summary?: string;
  completed: boolean;
}

export interface Course {
  id: string;
  userId: string;
  title: string;
  subject: string;
  description: string;
  color: string;
  icon: string;
  chapters: Chapter[];
  documents: CourseDocument[];
  progressPercent: number;
  lastStudiedAt: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_in';
  options?: string[];
  correctAnswer: string;
  explanation: string;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface QuizResult {
  id: string;
  quizId: string;
  courseId: string;
  courseTitle: string;
  title: string;
  score: number;
  totalQuestions: number;
  percentage: number;
  weakTopics: string[];
  recommendations: string[];
  completedAt: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  courseId: string;
  courseTitle: string;
  topic: string;
  question: string;
  answer: string;
  box: number; // Leitner box (1 to 5)
  nextReviewDate: string;
  timesReviewed: number;
  timesCorrect: number;
}

export interface StudySessionTask {
  id: string;
  title: string;
  courseId: string;
  courseTitle: string;
  durationMinutes: number;
  scheduledTime: string;
  completed: boolean;
}

export interface StudyPlanDay {
  date: string;
  dayName: string;
  tasks: StudySessionTask[];
}

export interface ExamCountdown {
  id: string;
  courseId: string;
  courseTitle: string;
  examName: string;
  examDate: string;
  targetScore: number;
  readinessScore: number; // 0 - 100
}

export interface PracticeExam {
  id: string;
  courseId: string;
  courseTitle: string;
  title: string;
  durationMinutes: number;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuizQuestion[];
}

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  xpReward: number;
  progress: number;
  maxProgress: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sourceDocId?: string;
  sourceDocTitle?: string;
}

export interface WeeklyStudyMetric {
  day: string;
  minutes: number;
  completedSessions: number;
}
