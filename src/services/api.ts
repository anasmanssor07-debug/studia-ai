import type { 
  UserProfile, 
  Course, 
  CourseDocument, 
  QuizResult, 
  Flashcard, 
  StudyPlanDay, 
  ExamCountdown, 
  PracticeExam, 
  WeeklyStudyMetric,
  Achievement
} from '../types/index.ts';

const API_BASE = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('studia_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Une erreur est survenue.');
  }
  return data as T;
}

export const api = {
  // Auth
  async register(params: {
    name: string;
    email: string;
    password: string;
    academicLevel?: string;
    studyField?: string;
    language?: string;
    dailyGoalMinutes?: number;
  }): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(res);
  },

  async getMe(): Promise<{ user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async updateProfile(updates: Partial<UserProfile>): Promise<{ success: boolean; user: UserProfile }> {
    const res = await fetch(`${API_BASE}/auth/update-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(updates),
    });
    return handleResponse(res);
  },

  async deleteAccount(): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/auth/delete-account`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Courses
  async getCourses(): Promise<{ courses: Course[] }> {
    const res = await fetch(`${API_BASE}/courses`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async createCourse(params: {
    title: string;
    subject: string;
    description?: string;
    color?: string;
    icon?: string;
  }): Promise<{ course: Course }> {
    const res = await fetch(`${API_BASE}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async createCourseFromPdf(params: {
    title?: string;
    subject?: string;
    fileName: string;
    fileSize: string;
    pdfBase64?: string;
    textContent?: string;
    language?: string;
  }): Promise<{ success: boolean; course: Course; summary: any; strictDocumentOnly: boolean }> {
    const res = await fetch(`${API_BASE}/courses/from-pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async deleteCourse(id: string): Promise<{ success: boolean }> {
    const res = await fetch(`${API_BASE}/courses/${id}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async addChapter(courseId: string, title: string, summary?: string): Promise<{ chapter: any; course: Course }> {
    const res = await fetch(`${API_BASE}/courses/${courseId}/chapters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ title, summary }),
    });
    return handleResponse(res);
  },

  async addDocument(courseId: string, params: {
    title: string;
    fileType: string;
    fileSize: string;
    content: string;
  }): Promise<{ document: CourseDocument; course: Course }> {
    const res = await fetch(`${API_BASE}/courses/${courseId}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async deleteDocument(courseId: string, docId: string): Promise<{ success: boolean; course: Course }> {
    const res = await fetch(`${API_BASE}/courses/${courseId}/documents/${docId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // AI Educational Services
  async askAiAssistant(params: {
    message: string;
    courseId?: string;
    documentId?: string;
    targetLanguage?: string;
  }): Promise<{ reply: string; sourceDocTitle?: string }> {
    const res = await fetch(`${API_BASE}/ai/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async generateSummary(params: {
    courseId?: string;
    documentId?: string;
    chapterTitle?: string;
    rawText?: string;
    language?: string;
  }): Promise<{ result: any }> {
    const res = await fetch(`${API_BASE}/ai/summarize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async generateQuiz(params: {
    courseId?: string;
    topic?: string;
    questionCount?: number;
    difficulty?: string;
    questionType?: string;
    language?: string;
  }): Promise<{ quiz: { quizTitle: string; questions: any[] } }> {
    const res = await fetch(`${API_BASE}/ai/quiz-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async generateFlashcards(params: {
    courseId?: string;
    count?: number;
    language?: string;
  }): Promise<{ flashcards: Flashcard[] }> {
    const res = await fetch(`${API_BASE}/ai/flashcards-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async generateStudyPlan(params: {
    availableHoursPerDay?: number;
    language?: string;
  }): Promise<{ plan: StudyPlanDay[]; motivationalQuote: string }> {
    const res = await fetch(`${API_BASE}/ai/plan-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async generateExam(params: {
    courseId?: string;
    durationMinutes?: number;
    difficulty?: string;
    language?: string;
  }): Promise<{ exam: PracticeExam }> {
    const res = await fetch(`${API_BASE}/ai/exam-generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async getAiRecommendation(): Promise<{ recommendation: any }> {
    const res = await fetch(`${API_BASE}/ai/recommend`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Flashcards Review
  async getFlashcards(): Promise<{ flashcards: Flashcard[] }> {
    const res = await fetch(`${API_BASE}/flashcards`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async reviewFlashcard(cardId: string, isCorrect: boolean): Promise<{ card: Flashcard; totalXp: number }> {
    const res = await fetch(`${API_BASE}/flashcards/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ cardId, isCorrect }),
    });
    return handleResponse(res);
  },

  // Study Plan
  async getStudyPlan(): Promise<{ plan: StudyPlanDay[]; exams: ExamCountdown[] }> {
    const res = await fetch(`${API_BASE}/study-plan`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async toggleTask(taskId: string): Promise<{ success: boolean; plan: StudyPlanDay[] }> {
    const res = await fetch(`${API_BASE}/study-plan/toggle-task`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ taskId }),
    });
    return handleResponse(res);
  },

  async addExam(params: {
    courseTitle: string;
    examName: string;
    examDate: string;
    targetScore: number;
  }): Promise<{ exam: ExamCountdown; exams: ExamCountdown[] }> {
    const res = await fetch(`${API_BASE}/study-plan/add-exam`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  // Analytics & Sessions
  async logStudySession(minutes: number, courseId?: string): Promise<{
    success: boolean;
    user: UserProfile;
    xpEarned: number;
    newLevel: number;
    streakDays: number;
    unlockedAchievement?: Achievement | null;
  }> {
    const res = await fetch(`${API_BASE}/analytics/study-session`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ minutes, courseId }),
    });
    return handleResponse(res);
  },

  async logQuizResult(params: any): Promise<{ result: QuizResult; xpEarned: number; totalXp: number }> {
    const res = await fetch(`${API_BASE}/analytics/quiz-result`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async getAnalyticsSummary(): Promise<{
    totalStudyMinutes: number;
    completedSessionsCount: number;
    completedQuizzesCount: number;
    avgQuizScore: number;
    streakDays: number;
    bestStreakDays: number;
    totalXp: number;
    level: number;
    levelTitle: string;
    weeklyMetrics: WeeklyStudyMetric[];
    achievements: Achievement[];
  }> {
    const res = await fetch(`${API_BASE}/analytics/summary`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async resetStats(): Promise<{ success: boolean; user: UserProfile; message: string }> {
    const res = await fetch(`${API_BASE}/analytics/reset-stats`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // Subscriptions
  async getSubscriptionStatus(): Promise<{
    subscription: any;
    remainingTrialHours: number;
    plans: any[];
  }> {
    const res = await fetch(`${API_BASE}/subscriptions/status`, {
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  async upgradeSubscription(tier: 'premium' | 'gold'): Promise<{
    success: boolean;
    subscription: any;
    message: string;
  }> {
    const res = await fetch(`${API_BASE}/subscriptions/upgrade`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeader() },
      body: JSON.stringify({ tier }),
    });
    return handleResponse(res);
  },

  async restoreSubscription(): Promise<{ success: boolean; subscription: any; message: string }> {
    const res = await fetch(`${API_BASE}/subscriptions/restore`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },

  // QA Test Suite
  async runQaTestSuite(): Promise<{
    summary: { total: number; passed: number; failed: number; passRatePercent: number; timestamp: string };
    tests: Array<{ name: string; category: string; passed: boolean; durationMs: number; details: string }>;
  }> {
    const res = await fetch(`${API_BASE}/test-suite/run`, {
      method: 'POST',
      headers: { ...getAuthHeader() },
    });
    return handleResponse(res);
  },
};
