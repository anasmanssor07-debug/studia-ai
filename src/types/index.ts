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
  | 'other'
  | (string & {});

export type SubscriptionStatus = 
  | 'inactive' 
  | 'pending_payment' 
  | 'active' 
  | 'payment_failed' 
  | 'cancelled' 
  | 'expired';

export type SubscriptionTier = 'free_trial' | 'free_plan' | 'free_expired' | 'premium' | 'gold';

export interface UserUsageLimits {
  tier: SubscriptionTier;
  isTrialActive: boolean;
  trialHoursRemaining: number;
  isTrialExpired: boolean;
  isPremium: boolean;
  aiQuestions: {
    usedToday: number;
    limit: number;
    remainingToday: number;
    resetsAt: string;
  };
  summaries: {
    usedThisMonth: number;
    limit: number;
    remainingThisMonth: number;
    resetsAt: string;
  };
  quizzes: {
    usedToday: number;
    maxQuestionsPerQuiz: number;
    isAdvancedAllowed: boolean;
  };
  canGenerateStudyPlan: boolean;
  canGenerateExamSimulation: boolean;
}

export interface PaymentTransaction {
  id: string;
  orderId: string;
  userId: string;
  userEmail: string;
  amountMAD: number;
  currency: string;
  paymentMethod: string;
  cardBrand?: string;
  last4?: string;
  status: 'success' | 'failed' | 'pending';
  transactionRef: string;
  authCode?: string;
  failureReason?: string;
  createdAt: string;
  description: string;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  planId?: 'premium' | 'free_trial' | 'free_plan' | 'gold';
  trialStartedAt?: string;
  trialExpiresAt?: string;
  isTrialActive: boolean;
  startDate?: string;
  currentPeriodEnd?: string;
  nextBillingDate?: string;
  premiumExpiresAt?: string;
  autoRenew: boolean;
  cancelAtPeriodEnd?: boolean;
  planName: string;
  priceMAD: number;
  lastPaymentId?: string;
}

export interface AdminMetrics {
  totalUsers: number;
  activeSubscribers: number;
  pendingPayments: number;
  expiredSubscribers: number;
  cancelledSubscribers: number;
  totalRevenueMAD: number;
  failedTransactionsCount: number;
  transactions: PaymentTransaction[];
}

export interface AdminConfig {
  premiumPriceMAD: number;
  billingCycleDays: number;
  allowTrial: boolean;
  trialHours: number;
  aiDailyLimit: number;
  summaryLimit: number;
  quizLimit: number;
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
  detailedSummary?: string;
  keyConcepts?: string[];
  definitions?: Array<{ term: string; definition: string }>;
  formulasOrTheorems?: string[];
  examTips?: string[];
  createdAt: string;
}

export interface Chapter {
  id: string;
  title: string;
  order: number;
  summary?: string;
  keyPoints?: string[];
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
  front?: string; // Question, concept, or key term
  back?: string;  // Correct answer + clear explanation
  concept?: string;
  explanation?: string;
  box: number; // Leitner box (1 to 5)
  nextReviewDate: string;
  timesReviewed: number;
  timesCorrect: number;
}

export interface AcademicSummarySection {
  sectionNumber: number;
  title: string;
  content: string;
  subsections?: Array<{ title: string; content: string }>;
  definitions?: Array<{ term: string; definition: string }>;
  keyPoints?: string[];
}

export interface AcademicSummaryResult {
  title: string;
  courseName?: string;
  topic?: string;
  academicSummaryText: string;
  summary?: string;
  sections?: AcademicSummarySection[];
  definitions?: Array<{ term: string; definition: string }>;
  keyTakeaways?: string[];
  examTips?: string[];
  recommendedNextStep?: string;
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
