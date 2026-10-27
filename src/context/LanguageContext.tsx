import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Language } from '../types/index.ts';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  isRtl: boolean;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Identity
    appName: 'STUDIA AI',
    slogan: 'Apprends mieux. Progresse chaque jour.',
    tagline: 'Ton tuteur d’apprentissage intelligent pour réussir tes études.',
    
    // Nav
    navHome: 'Accueil',
    navCourses: 'Mes Cours',
    navAssistant: 'Assistant IA',
    navQuiz: 'Quiz & Cartes',
    navPlanner: 'Planning',
    navProfile: 'Profil',

    // Dashboard
    greetingMorning: 'Bonjour',
    greetingAfternoon: 'Bon après-midi',
    greetingEvening: 'Bonsoir',
    welcomeBack: 'Prêt à progresser aujourd’hui ?',
    welcomeSubtitle: 'Chaque séance te rapproche de tes objectifs académiques.',
    dailyGoal: 'Objectif du jour',
    minutesCompleted: 'minutes effectuées',
    studyStreak: 'Série d’études',
    daysStreak: 'jours consécutifs',
    bestStreak: 'Record personnel',
    startStudySession: 'Lancer une séance',
    stopSession: 'Terminer la séance',
    continueLearning: 'Continuer vos cours',
    aiAssistantCardTitle: 'Une question sur un cours ?',
    aiAssistantCardDesc: 'Demande à STUDIA AI d’expliquer un concept ou résumer une notion.',
    askStudiaAi: 'Ouvrir l’Assistant',
    upcomingExams: 'Examens à venir',
    inDays: 'dans',
    days: 'jours',
    readiness: 'Préparation',
    targetScore: 'Note visée',
    recommendedNext: 'Recommandation IA personnalisée',
    xpLevel: 'Niveau',
    totalXp: 'XP cumulés',

    // Courses & Documents
    coursesTitle: 'Mes Cours & Documents',
    newCourse: 'Nouveau cours',
    uploadDoc: 'Ajouter un document (PDF/Word/PPT)',
    noCoursesYet: 'Aucun cours enregistré pour l’instant.',
    addFirstCourse: 'Créez votre premier cours pour commencer.',
    chapters: 'Chapitres',
    documents: 'Documents & Supports',
    summaryTab: 'Fiche de révision',
    generateSummaryBtn: 'Générer la fiche avec l’IA',
    generating: 'Génération IA en cours...',
    
    // Assistant
    assistantTitle: 'Assistant Pédagogique IA',
    assistantSubtitle: 'Pose n’importe quelle question sur tes cours, devoirs ou concepts théoriques.',
    contextDoc: 'Document de référence',
    allCourses: 'Tous les cours',
    typeMessage: 'Pose ta question (ex: Explique-moi le théorème avec un exemple simple)...',
    explainSimple: 'Expliquer simplement',
    giveExample: 'Donner un exemple concret',
    explainArabic: 'Expliquer en arabe',
    examTraps: 'Pièges à l’examen',

    // Quiz & Flashcards
    quizAndFlashcardsTitle: 'Entraînement & Répétition Espacée',
    tabFlashcards: 'Cartes Mémoire (Leitner)',
    tabQuiz: 'Générateur de Quiz',
    startQuizBtn: 'Générer un quiz IA',
    flashcardBox: 'Boîte Leitner',
    revealAnswer: 'Révéler la réponse',
    iGotIt: 'Je maîtrise (Facile)',
    needReview: 'À revoir (Difficile)',
    quizScore: 'Score obtenu',
    explanation: 'Explication pédagogique',
    weakTopics: 'Points à renforcer',
    nextReview: 'Prochaine révision',

    // Planner & Exams
    plannerTitle: 'Planning d’Études & Examens',
    tabSchedule: 'Emploi du temps',
    tabExams: 'Examens Blancs',
    generatePlanBtn: 'Optimiser mon planning avec l’IA',
    startPracticeExam: 'Lancer un examen blanc chronométré',
    remainingTime: 'Temps restant',
    submitExam: 'Soumettre l’épreuve',

    // Profile & Subscription
    profileTitle: 'Profil & Progression',
    subscription: 'Abonnement',
    freeTrialActive: 'Essai gratuit 48h actif',
    freeTrialExpired: 'Essai gratuit 48h expiré',
    upgradeToPremium: 'Passer à Premium (49 DH/mois)',
    upgradeToGold: 'Passer à Gold (400 DH/an)',
    restorePurchases: 'Restaurer mes achats',
    achievements: 'Succès & Badges',
    weeklyAnalytics: 'Statistiques de la semaine',
    studyTime: 'Temps d’étude',
    runTests: 'Lancer les tests QA automatisés',
    logout: 'Se déconnecter',
    deleteAccount: 'Supprimer mon compte',
    languageLabel: 'Langue de l’application',
  },

  en: {
    // Identity
    appName: 'STUDIA AI',
    slogan: 'Study smarter. Learn better. Achieve more.',
    tagline: 'Your intelligent learning companion to excel in your studies.',
    
    // Nav
    navHome: 'Home',
    navCourses: 'My Courses',
    navAssistant: 'AI Assistant',
    navQuiz: 'Quiz & Cards',
    navPlanner: 'Planner',
    navProfile: 'Profile',

    // Dashboard
    greetingMorning: 'Good morning',
    greetingAfternoon: 'Good afternoon',
    greetingEvening: 'Good evening',
    welcomeBack: 'Ready to make progress today?',
    welcomeSubtitle: 'Every study session brings you closer to your academic goals.',
    dailyGoal: 'Daily goal',
    minutesCompleted: 'minutes completed',
    studyStreak: 'Study streak',
    daysStreak: 'consecutive days',
    bestStreak: 'Personal best',
    startStudySession: 'Start session',
    stopSession: 'Finish session',
    continueLearning: 'Continue learning',
    aiAssistantCardTitle: 'Have a question about a course?',
    aiAssistantCardDesc: 'Ask STUDIA AI to break down complex concepts or summarize notes.',
    askStudiaAi: 'Open Assistant',
    upcomingExams: 'Upcoming exams',
    inDays: 'in',
    days: 'days',
    readiness: 'Readiness',
    targetScore: 'Target score',
    recommendedNext: 'AI Recommended Next Step',
    xpLevel: 'Level',
    totalXp: 'Total XP',

    // Courses & Documents
    coursesTitle: 'My Courses & Documents',
    newCourse: 'New Course',
    uploadDoc: 'Upload Document (PDF/Word/PPT)',
    noCoursesYet: 'No courses registered yet.',
    addFirstCourse: 'Create your first course to begin.',
    chapters: 'Chapters',
    documents: 'Documents & Materials',
    summaryTab: 'Revision Sheet',
    generateSummaryBtn: 'Generate AI revision sheet',
    generating: 'AI generating...',

    // Assistant
    assistantTitle: 'AI Academic Assistant',
    assistantSubtitle: 'Ask any question regarding your lecture notes, exercises, or theory.',
    contextDoc: 'Reference document',
    allCourses: 'All courses',
    typeMessage: 'Ask your question (e.g. Explain this theorem with a concrete example)...',
    explainSimple: 'Explain simply',
    giveExample: 'Give real example',
    explainArabic: 'Explain in Arabic',
    examTraps: 'Exam traps to avoid',

    // Quiz & Flashcards
    quizAndFlashcardsTitle: 'Practice & Spaced Repetition',
    tabFlashcards: 'Flashcards (Leitner)',
    tabQuiz: 'Quiz Generator',
    startQuizBtn: 'Generate AI quiz',
    flashcardBox: 'Leitner Box',
    revealAnswer: 'Show answer',
    iGotIt: 'I know this (Easy)',
    needReview: 'Need review (Hard)',
    quizScore: 'Score',
    explanation: 'Explanation',
    weakTopics: 'Topics to reinforce',
    nextReview: 'Next review',

    // Planner & Exams
    plannerTitle: 'Study Planner & Exams',
    tabSchedule: 'Schedule',
    tabExams: 'Practice Exams',
    generatePlanBtn: 'Optimize schedule with AI',
    startPracticeExam: 'Start timed practice exam',
    remainingTime: 'Time remaining',
    submitExam: 'Submit exam',

    // Profile & Subscription
    profileTitle: 'Profile & Progress',
    subscription: 'Subscription',
    freeTrialActive: '48h Free Trial Active',
    freeTrialExpired: '48h Free Trial Expired',
    upgradeToPremium: 'Upgrade to Premium (49 MAD/mo)',
    upgradeToGold: 'Upgrade to Gold (400 MAD/yr)',
    restorePurchases: 'Restore purchases',
    achievements: 'Achievements & Badges',
    weeklyAnalytics: 'Weekly Analytics',
    studyTime: 'Study time',
    runTests: 'Run automated QA test suite',
    logout: 'Log out',
    deleteAccount: 'Delete account',
    languageLabel: 'Application Language',
  },

  ar: {
    // Identity
    appName: 'STUDIA AI',
    slogan: 'تعلّم بذكاء. تطور كل يوم. حقق أهدافك.',
    tagline: 'مساعدك التعليمي الذكي للنجاح والتفوق في دراستك الأكاديمية.',
    
    // Nav
    navHome: 'الرئيسية',
    navCourses: 'مقرراتي',
    navAssistant: 'المساعد الذكي',
    navQuiz: 'كويز وبطاقات',
    navPlanner: 'الجدول',
    navProfile: 'حسابي',

    // Dashboard
    greetingMorning: 'صباح الخير',
    greetingAfternoon: 'مساء الخير',
    greetingEvening: 'مساء الخير',
    welcomeBack: 'جاهز لتحقيق إنجاز اليوم؟',
    welcomeSubtitle: 'كل جلسة مراجعة تقربك خطوة إضافية من أهدافك وطموحاتك.',
    dailyGoal: 'هدف اليوم',
    minutesCompleted: 'دقيقة منجزة',
    studyStreak: 'سلسلة الاستمرار',
    daysStreak: 'أيام متتالية',
    bestStreak: 'أفضل رقم',
    startStudySession: 'بدء جلسة مراجعة',
    stopSession: 'إنهاء الجلسة',
    continueLearning: 'متابعة المقررات الأخيرة',
    aiAssistantCardTitle: 'لديك سؤال حول أحد الدروس؟',
    aiAssistantCardDesc: 'اطلب من STUDIA AI تبسيط المفاهيم المعقدة أو تلخيص المواد.',
    askStudiaAi: 'افتح المساعد',
    upcomingExams: 'الامتحانات القادمة',
    inDays: 'خلال',
    days: 'أيام',
    readiness: 'الجاهزية',
    targetScore: 'الدرجة المستهدفة',
    recommendedNext: 'الخطوة التالية الموصى بها بالذكاء الاصطناعي',
    xpLevel: 'المستوى',
    totalXp: 'نقاط الخبرة',

    // Courses & Documents
    coursesTitle: 'مقرراتي وملفاتي الدراسية',
    newCourse: 'مقرر جديد',
    uploadDoc: 'إضافة مستند (PDF/Word/PPT)',
    noCoursesYet: 'لا توجد مقررات مسجلة حتى الآن.',
    addFirstCourse: 'أنشئ أول مقرر دراسي لتبدأ.',
    chapters: 'الفصول والدروس',
    documents: 'الملفات والمراجع',
    summaryTab: 'بطاقة المراجعة',
    generateSummaryBtn: 'توليد ملخص الدرس بالذكاء الاصطناعي',
    generating: 'جاري التوليد بالذكاء الاصطناعي...',

    // Assistant
    assistantTitle: 'المساعد الدراسي الذكي',
    assistantSubtitle: 'اطرح أي سؤال حول محاضراتك وتمارينك والمفاهيم العلمية.',
    contextDoc: 'المستند المرجعي',
    allCourses: 'جميع المواد',
    typeMessage: 'اكتب سؤالك (مثال: اشرح لي هذه النظرية بمثال واقعي بسيط)...',
    explainSimple: 'تبسيط المفهوم',
    giveExample: 'مثال واقعي',
    explainArabic: 'شرح بالعربية',
    examTraps: 'أفخاخ الامتحانات',

    // Quiz & Flashcards
    quizAndFlashcardsTitle: 'التدريب والتكرار المتباعد',
    tabFlashcards: 'بطاقات التذكر (لايتنر)',
    tabQuiz: 'منشئ الكويزات',
    startQuizBtn: 'توليد كويز ذكي',
    flashcardBox: 'صندوق لايتنر',
    revealAnswer: 'إظهار الجواب',
    iGotIt: 'أتقنتها (سهل)',
    needReview: 'تحتاج مراجعة (صعب)',
    quizScore: 'النتيجة',
    explanation: 'الشرح والتوضيح',
    weakTopics: 'نقاط تتطلب تقوية',
    nextReview: 'المراجعة القادمة',

    // Planner & Exams
    plannerTitle: 'مخطط المذاكرة والامتحانات',
    tabSchedule: 'الجدول الزمني',
    tabExams: 'الامتحانات التجريبية',
    generatePlanBtn: 'تحسين الجدول بالذكاء الاصطناعي',
    startPracticeExam: 'بدء امتحان تجريبي بوقت محدد',
    remainingTime: 'الوقت المتبقي',
    submitExam: 'تسليم الامتحان',

    // Profile & Subscription
    profileTitle: 'الملف الشخصي والتقدم',
    subscription: 'الاشتراك',
    freeTrialActive: 'فترة تجربة 48 ساعة مجانية نشطة',
    freeTrialExpired: 'انتهت فترة التجربة المجانية 48 ساعة',
    upgradeToPremium: 'الترقية إلى بريميوم (49 درهم/شهر)',
    upgradeToGold: 'الترقية إلى جولد (400 درهم/سنة)',
    restorePurchases: 'استعادة المشتريات',
    achievements: 'الأوسمة والإنجازات',
    weeklyAnalytics: 'إحصائيات الأسبوع',
    studyTime: 'وقت المذاكرة',
    runTests: 'تشغيل فحص الجودة التلقائي (QA)',
    logout: 'تسجيل الخروج',
    deleteAccount: 'حذف الحساب',
    languageLabel: 'لغة التطبيق',
  },
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'fr',
  setLanguage: () => {},
  isRtl: false,
  t: (key) => key,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('studia_lang') as Language;
    return saved && ['fr', 'en', 'ar'].includes(saved) ? saved : 'fr';
  });

  const isRtl = language === 'ar';

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('studia_lang', lang);
  };

  useEffect(() => {
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRtl]);

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['fr']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRtl, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
