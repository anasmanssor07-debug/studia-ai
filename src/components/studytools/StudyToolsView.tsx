import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Brain, 
  RotateCw, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Copy, 
  Download, 
  FileText, 
  Layers, 
  BookOpen, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  Share2, 
  Play, 
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Crown,
  Zap,
  Clock
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { Course, Flashcard, AcademicSummaryResult, AcademicSummarySection, UserUsageLimits } from '../../types/index.ts';

interface StudyToolsViewProps {
  initialTab?: 'summary' | 'flashcards' | 'quiz';
  initialCourseId?: string;
  onNavigate?: (tab: string, extra?: any) => void;
}

export const StudyToolsView: React.FC<StudyToolsViewProps> = ({
  initialTab = 'summary',
  initialCourseId,
  onNavigate,
}) => {
  const { user, setCelebrationData, setShowSubscriptionModal } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'quiz'>(initialTab);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);

  // Common Selection
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || '');

  // ==========================================
  // 1. AI SUMMARY GENERATOR STATE
  // ==========================================
  const [summaryCourseName, setSummaryCourseName] = useState<string>('');
  const [summaryTopic, setSummaryTopic] = useState<string>('');
  const [summaryRawText, setSummaryRawText] = useState<string>('');
  const [summaryLanguage, setSummaryLanguage] = useState<string>(language || 'fr');
  const [generatingSummary, setGeneratingSummary] = useState<boolean>(false);
  const [generatedSummary, setGeneratedSummary] = useState<AcademicSummaryResult | null>(null);
  const [summaryCopied, setSummaryCopied] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // ==========================================
  // 2. AI FLASHCARD GENERATOR STATE
  // ==========================================
  const [flashcardCourseName, setFlashcardCourseName] = useState<string>('');
  const [flashcardTopic, setFlashcardTopic] = useState<string>('');
  const [flashcardRawText, setFlashcardRawText] = useState<string>('');
  const [flashcardCount, setFlashcardCount] = useState<number>(5);
  const [generatingFlashcards, setGeneratingFlashcards] = useState<boolean>(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [cardsCopied, setCardsCopied] = useState<boolean>(false);
  const [flashcardError, setFlashcardError] = useState<string | null>(null);

  // ==========================================
  // 3. AI QUIZ STATE
  // ==========================================
  const [quizDifficulty, setQuizDifficulty] = useState<string>('medium');
  const [quizCount, setQuizCount] = useState<number>(5);
  const [generatingQuiz, setGeneratingQuiz] = useState<boolean>(false);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [quizScore, setQuizScore] = useState<{ score: number; percentage: number } | null>(null);
  const [quizError, setQuizError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getCourses(), api.getFlashcards()])
      .then(([coursesRes, cardsRes]) => {
        setCourses(coursesRes.courses);
        if (cardsRes.flashcards && cardsRes.flashcards.length > 0) {
          setFlashcards(cardsRes.flashcards);
        }
        if (!selectedCourseId && coursesRes.courses.length > 0) {
          const first = coursesRes.courses[0];
          setSelectedCourseId(first.id);
          setSummaryCourseName(first.title);
          setFlashcardCourseName(first.title);
        }
      })
      .catch((err) => {
        console.error('Error loading courses or flashcards:', err);
      })
      .finally(() => {
        setLoadingInitial(false);
      });
  }, []);

  // When selectedCourseId changes, auto-populate inputs
  const handleSelectCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    const found = courses.find((c) => c.id === courseId);
    if (found) {
      setSummaryCourseName(found.title);
      setFlashcardCourseName(found.title);
      if (found.documents && found.documents.length > 0) {
        setSummaryRawText(found.documents[0].content);
        setFlashcardRawText(found.documents[0].content.slice(0, 4000));
        setSummaryTopic(found.documents[0].title);
        setFlashcardTopic(found.documents[0].title);
      }
    }
  };

  // ==========================================
  // SUMMARY GENERATOR HANDLERS
  // ==========================================
  const handleGenerateSummary = async () => {
    setGeneratingSummary(true);
    setSummaryError(null);
    setSummaryCopied(false);

    try {
      const res = await api.generateSummary({
        courseId: selectedCourseId || undefined,
        courseName: summaryCourseName.trim() || undefined,
        topic: summaryTopic.trim() || undefined,
        rawText: summaryRawText.trim() || undefined,
        language: summaryLanguage,
      });

      if (res && res.result) {
        setGeneratedSummary(res.result);
      } else {
        throw new Error('Réponse vide du générateur.');
      }
    } catch (err: any) {
      console.error('Summary error:', err);
      if (err.message && err.message.includes('expiré')) {
        setShowSubscriptionModal(true);
      } else {
        setSummaryError(err.message || 'Impossible de générer le résumé. Veuillez vérifier votre saisie.');
      }
    } finally {
      setGeneratingSummary(false);
    }
  };

  const handleCopySummary = () => {
    if (!generatedSummary) return;
    const textToCopy = generatedSummary.academicSummaryText || generatedSummary.summary || '';
    navigator.clipboard.writeText(textToCopy);
    setSummaryCopied(true);
    setTimeout(() => setSummaryCopied(false), 2500);
  };

  const handleDownloadSummary = () => {
    if (!generatedSummary) return;
    const textToDownload = generatedSummary.academicSummaryText || generatedSummary.summary || '';
    const blob = new Blob([textToDownload], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (summaryCourseName || 'resume_cours').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.href = url;
    link.download = `${safeName}_resume_academique.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // FLASHCARD GENERATOR HANDLERS
  // ==========================================
  const handleGenerateFlashcards = async () => {
    setGeneratingFlashcards(true);
    setFlashcardError(null);
    setIsFlipped(false);
    setCardsCopied(false);

    try {
      const res = await api.generateFlashcards({
        courseId: selectedCourseId || undefined,
        courseName: flashcardCourseName.trim() || undefined,
        topic: flashcardTopic.trim() || undefined,
        rawText: flashcardRawText.trim() || undefined,
        count: flashcardCount,
        language: summaryLanguage,
      });

      if (res && res.flashcards && res.flashcards.length > 0) {
        setFlashcards(res.flashcards);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      } else {
        throw new Error('Aucune flashcard reçue.');
      }
    } catch (err: any) {
      console.error('Flashcard generation error:', err);
      if (err.message && err.message.includes('expiré')) {
        setShowSubscriptionModal(true);
      } else {
        setFlashcardError(err.message || 'Erreur lors de la génération des cartes mémoire.');
      }
    } finally {
      setGeneratingFlashcards(false);
    }
  };

  const currentFlashcard = flashcards[currentCardIndex];

  const handleNextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setCurrentCardIndex((prev) => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleFlipCard = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleReviewCard = async (isCorrect: boolean) => {
    if (!currentFlashcard) return;
    try {
      await api.reviewFlashcard(currentFlashcard.id, isCorrect);
      setIsFlipped(false);
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex((prev) => prev + 1);
      } else {
        setCelebrationData({
          isOpen: true,
          title: 'Paquet de flashcards terminé !',
          subtitle: 'Félicitations ! Vous avez révisé toutes les cartes selon la méthode Leitner.',
          xpEarned: 30,
          minutes: 5,
        });
        setCurrentCardIndex(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyFlashcards = () => {
    if (flashcards.length === 0) return;
    const content = flashcards
      .map((fc, i) => `CARTE ${i + 1}\nRECTO: ${fc.front || fc.question}\nVERSO: ${fc.back || fc.answer}\n`)
      .join('\n---\n\n');
    navigator.clipboard.writeText(content);
    setCardsCopied(true);
    setTimeout(() => setCardsCopied(false), 2500);
  };

  const handleDownloadFlashcards = () => {
    if (flashcards.length === 0) return;
    const content = flashcards
      .map((fc, i) => `CARTE ${i + 1}\nRECTO (Question / Concept): ${fc.front || fc.question}\nVERSO (Réponse & Explication): ${fc.back || fc.answer}\n`)
      .join('\n==============================\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (flashcardCourseName || 'flashcards').toLowerCase().replace(/[^a-z0-9]/g, '_');
    link.href = url;
    link.download = `${safeName}_deck_flashcards.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // ==========================================
  // QUIZ GENERATOR HANDLERS
  // ==========================================
  const handleStartQuiz = async () => {
    setGeneratingQuiz(true);
    setQuizError(null);
    setQuizFinished(false);
    setUserAnswers({});
    setCurrentQuizIndex(0);

    try {
      const selectedCourse = courses.find((c) => c.id === selectedCourseId);
      const res = await api.generateQuiz({
        courseId: selectedCourseId || undefined,
        topic: summaryCourseName || selectedCourse?.title || 'Culture Générale & Sciences',
        questionCount: quizCount,
        difficulty: quizDifficulty,
        language: summaryLanguage,
      });

      if (res && res.quiz) {
        setActiveQuiz(res.quiz);
      } else {
        throw new Error('Impossible de générer le quiz.');
      }
    } catch (err: any) {
      console.error('Quiz start error:', err);
      if (err.message && err.message.includes('expiré')) {
        setShowSubscriptionModal(true);
      } else {
        setQuizError(err.message || 'Impossible de créer le quiz.');
      }
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSelectQuizAnswer = (option: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuizIndex]: option,
    }));
  };

  const handleNextQuizQuestion = () => {
    if (!activeQuiz) return;
    if (currentQuizIndex < activeQuiz.questions.length - 1) {
      setCurrentQuizIndex((prev) => prev + 1);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!activeQuiz) return;
    let correctCount = 0;
    activeQuiz.questions.forEach((q: any, idx: number) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    const percentage = Math.round((correctCount / activeQuiz.questions.length) * 100);
    setQuizScore({ score: correctCount, percentage });
    setQuizFinished(true);

    try {
      await api.logQuizResult({
        quizId: `quiz-${Date.now()}`,
        courseId: selectedCourseId || 'crs-gen',
        courseTitle: summaryCourseName || 'Quiz IA',
        title: activeQuiz.quizTitle || 'Quiz d\'évaluation',
        score: correctCount,
        totalQuestions: activeQuiz.questions.length,
        percentage,
        weakTopics: percentage < 70 ? ['Revoir les définitions clés de la section'] : [],
        recommendations: percentage < 70 ? ['Générez des flashcards pour mémoriser les points manqués.'] : ['Excellent résultat !'],
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Top Banner: AI Study Tools Suite Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-5 text-white shadow-lg shadow-indigo-500/15 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-white/20 text-blue-100 border border-white/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>STUDIA AI Studio</span>
              </span>
              <span className="text-xs text-blue-200">Production Netlify Ready</span>
            </div>
            <h1 className="text-lg md:text-xl font-black tracking-tight">
              Outils d'Étude & Mémorisation IA
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-md leading-relaxed">
              Générez des résumés académiques structurés et des cartes mémoires interactives pour maîtriser vos cours.
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-center bg-white/10 backdrop-blur-md rounded-2xl p-2.5 border border-white/20 text-center">
            <Brain className="w-6 h-6 text-amber-300" />
            <span className="text-[11px] font-bold text-white mt-1">IA Actuelle</span>
          </div>
        </div>

        {/* Global Sub-tabs: Summaries / Flashcards / Quiz */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-white/15">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'summary'
                ? 'bg-white text-blue-700 shadow-md font-black'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Résumés IA</span>
          </button>

          <button
            onClick={() => setActiveTab('flashcards')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'flashcards'
                ? 'bg-white text-indigo-700 shadow-md font-black'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2. Flashcards IA</span>
          </button>

          <button
            onClick={() => setActiveTab('quiz')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              activeTab === 'quiz'
                ? 'bg-white text-purple-700 shadow-md font-black'
                : 'bg-white/10 hover:bg-white/20 text-white'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>3. Quiz IA</span>
          </button>
        </div>
      </div>

      {/* =======================================================================
          TAB 1: AI SUMMARY GENERATOR (RÉSUMÉS ACADÉMIQUES STRUCTURÉS)
         ======================================================================= */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          {/* Input Configuration Card */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Générateur de Résumés Académiques IA
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Titres, sections numérotées, paragraphes explicatifs et définitions claires.
                  </p>
                </div>
              </div>

              {/* Quick Document Picker from student's saved courses */}
              {courses.length > 0 && (
                <div className="hidden sm:block">
                  <select
                    value={selectedCourseId}
                    onChange={(e) => handleSelectCourse(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-xl py-1.5 px-2.5 text-xs text-slate-700 font-semibold focus:outline-none"
                  >
                    <option value="">Charger un cours enregistré...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.subject})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* Error Message if any */}
            {summaryError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{summaryError}</span>
              </div>
            )}

            {/* Inputs Grid: Course Name & Topic / Chapter */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Nom du cours ou matière <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={summaryCourseName}
                  onChange={(e) => setSummaryCourseName(e.target.value)}
                  placeholder="Ex: Réseaux Informatiques, Microéconomie, Droit Civil..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Chapitre ou sujet ciblé
                </label>
                <input
                  type="text"
                  value={summaryTopic}
                  onChange={(e) => setSummaryTopic(e.target.value)}
                  placeholder="Ex: Introduction aux Réseaux, Architecture TCP/IP..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Textarea for Raw Course Content */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  3. Contenu du cours (texte ou polycopié)
                </label>
                <span className="text-[10px] text-slate-400">
                  {summaryRawText.length} caractères
                </span>
              </div>
              <textarea
                value={summaryRawText}
                onChange={(e) => setSummaryRawText(e.target.value)}
                rows={5}
                placeholder="Collez ici les notes de cours, définitions, paragraphes de votre document, ou saisissez les thèmes à synthétiser..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none resize-y"
              />
            </div>

            {/* Language & Actions row */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Langue du résumé :</span>
                <select
                  value={summaryLanguage}
                  onChange={(e) => setSummaryLanguage(e.target.value)}
                  className="bg-slate-100 border border-slate-200 rounded-lg py-1 px-2.5 text-xs text-slate-700 font-bold focus:outline-none"
                >
                  <option value="fr">Français (FR)</option>
                  <option value="en">English (EN)</option>
                  <option value="ar">العربية (AR)</option>
                </select>
              </div>

              <button
                onClick={handleGenerateSummary}
                disabled={generatingSummary || (!summaryCourseName && !summaryTopic && !summaryRawText)}
                className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md shadow-blue-500/20 active:scale-95 transition-all flex items-center gap-2 text-xs cursor-pointer"
              >
                {generatingSummary ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Analyse académique en cours...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Générer le résumé académique structuré</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Academic Summary Output Box */}
          {generatedSummary && (
            <div className="bg-white rounded-3xl p-5 border border-blue-200/90 shadow-md space-y-4 animate-fade-in">
              {/* Output Actions Bar: Title, Copy, Download */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider text-blue-700">
                    Fiche Académique Validée
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopySummary}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      summaryCopied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    {summaryCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copié dans le presse-papier !</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copier le résumé</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleDownloadSummary}
                    title="Télécharger au format texte (.txt)"
                    className="py-1.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer border border-blue-200/80"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Exporter (.txt)</span>
                  </button>
                </div>
              </div>

              {/* Exact Academic Document Formatter */}
              <div className="p-5 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-4 text-xs leading-relaxed text-slate-800">
                {/* 1. Header TITLE */}
                <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl shadow-xs">
                  <div className="text-[10px] uppercase font-bold text-blue-200">En-tête Officielle</div>
                  <div className="text-sm md:text-base font-black tracking-tight mt-0.5">
                    {generatedSummary.title || `TITLE: ${summaryCourseName || 'Cours'} - ${summaryTopic || 'Sujet'}`}
                  </div>
                </div>

                {/* 2. Structured Sections (SECTION 1, SECTION 2, SECTION 3) */}
                {generatedSummary.sections && generatedSummary.sections.length > 0 ? (
                  generatedSummary.sections.map((section: AcademicSummarySection, sIdx: number) => (
                    <div key={sIdx} className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs space-y-2">
                      <div className="flex items-center gap-2 pb-1.5 border-b border-slate-100">
                        <span className="w-6 h-6 rounded-lg bg-blue-100 text-blue-700 font-black text-xs flex items-center justify-center shrink-0">
                          {section.sectionNumber || sIdx + 1}
                        </span>
                        <h3 className="font-black text-slate-900 text-xs md:text-sm">
                          SECTION {section.sectionNumber || sIdx + 1}: {section.title}
                        </h3>
                      </div>

                      <p className="text-slate-700 leading-relaxed font-normal pt-1 whitespace-pre-line">
                        {section.content}
                      </p>

                      {section.definitions && section.definitions.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-slate-100 space-y-1.5">
                          {section.definitions.map((df, dIdx) => (
                            <div key={dIdx} className="p-2 bg-blue-50/60 rounded-lg text-slate-800 text-[11px] border border-blue-100">
                              <span className="font-black text-blue-900">{df.term} : </span>
                              <span className="text-slate-700">{df.definition}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {section.keyPoints && section.keyPoints.length > 0 && (
                        <div className="pt-2 flex flex-wrap gap-1.5">
                          {section.keyPoints.map((kp, kIdx) => (
                            <span key={kIdx} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                              • {kp}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  /* Plain academic text fallback */
                  <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-2xs whitespace-pre-line text-xs font-normal leading-relaxed text-slate-800">
                    {generatedSummary.academicSummaryText || generatedSummary.summary}
                  </div>
                )}

                {/* 3. Global Definitions & Key Takeaways if provided */}
                {generatedSummary.definitions && generatedSummary.definitions.length > 0 && (
                  <div className="p-4 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-2">
                    <div className="text-xs font-black text-purple-950 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5 text-purple-700" />
                      <span>Notions Fondamentales & Définitions du Cours</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {generatedSummary.definitions.map((def, idx) => (
                        <div key={idx} className="p-2.5 bg-white rounded-lg border border-purple-100 shadow-2xs text-[11px]">
                          <span className="font-extrabold text-purple-900">{def.term} : </span>
                          <span className="text-slate-700">{def.definition}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. Key Takeaways */}
                {generatedSummary.keyTakeaways && generatedSummary.keyTakeaways.length > 0 && (
                  <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
                    <div className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Points Essentiels à Retenir (Langage Simple)</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-amber-900 pl-2">
                      {generatedSummary.keyTakeaways.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-amber-600 font-bold">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          TAB 2: AI FLASHCARD GENERATOR (CARTES MÉMOIRES AVEC FLIP & EXPLICATION)
         ======================================================================= */}
      {activeTab === 'flashcards' && (
        <div className="space-y-4">
          {/* Flashcard Generation Form */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Générateur de Flashcards IA
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Chaque carte contient un RECTO (question/concept) et un VERSO (réponse + explication claire).
                  </p>
                </div>
              </div>

              {/* Number of cards selector */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[3, 5, 8, 10].map((num) => (
                  <button
                    key={num}
                    onClick={() => setFlashcardCount(num)}
                    className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-all ${
                      flashcardCount === num
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {flashcardError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{flashcardError}</span>
              </div>
            )}

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  1. Matière ou nom du cours
                </label>
                <input
                  type="text"
                  value={flashcardCourseName}
                  onChange={(e) => setFlashcardCourseName(e.target.value)}
                  placeholder="Ex: Réseaux Informatiques, Algèbre, Biologie..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  2. Sujet ou concept clé
                </label>
                <input
                  type="text"
                  value={flashcardTopic}
                  onChange={(e) => setFlashcardTopic(e.target.value)}
                  placeholder="Ex: Protocoles TCP/UDP, Modèle OSI, Routage..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Content Input */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  3. Contenu du cours (facultatif si le sujet est renseigné)
                </label>
                <span className="text-[10px] text-slate-400">
                  {flashcardRawText.length} caractères
                </span>
              </div>
              <textarea
                value={flashcardRawText}
                onChange={(e) => setFlashcardRawText(e.target.value)}
                rows={3}
                placeholder="Collez ici des paragraphes ou notes pour générer des cartes ultra-ciblées sur ce passage..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 font-mono leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none resize-y"
              />
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500 font-medium">
                {flashcards.length} carte(s) dans le paquet actuel
              </span>

              <button
                onClick={handleGenerateFlashcards}
                disabled={generatingFlashcards || (!flashcardCourseName && !flashcardTopic && !flashcardRawText)}
                className="py-2.5 px-5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 text-white font-extrabold rounded-xl shadow-md shadow-indigo-500/20 active:scale-95 transition-all flex items-center gap-2 text-xs cursor-pointer"
              >
                {generatingFlashcards ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Création des cartes IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Générer les {flashcardCount} Flashcards IA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Interactive Flashcard Player */}
          {flashcards.length > 0 && currentFlashcard && (
            <div className="space-y-4">
              {/* Card Deck Header: Counter & Export Buttons */}
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span className="py-1 px-3 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-200 font-black text-xs">
                    Carte {currentCardIndex + 1} sur {flashcards.length}
                  </span>
                  <span className="text-xs text-slate-500 font-bold truncate max-w-[160px]">
                    {currentFlashcard.courseTitle || flashcardCourseName}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyFlashcards}
                    className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    {cardsCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{cardsCopied ? 'Copié !' : 'Copier deck'}</span>
                  </button>

                  <button
                    onClick={handleDownloadFlashcards}
                    className="py-1 px-2.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1 transition-colors border border-indigo-200/80"
                  >
                    <Download className="w-3 h-3" />
                    <span>Exporter</span>
                  </button>
                </div>
              </div>

              {/* 3D Flip Card Container */}
              <div
                onClick={handleFlipCard}
                className="w-full min-h-[260px] md:min-h-[290px] p-6 rounded-3xl bg-white border-2 border-indigo-100 shadow-md hover:border-indigo-300 cursor-pointer transition-all duration-300 flex flex-col justify-between select-none group relative overflow-hidden"
              >
                {/* Background watermarks */}
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-indigo-50/50 pointer-events-none" />

                {/* Top Badge: RECTO vs VERSO */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                        isFlipped
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}
                    >
                      {isFlipped ? 'VERSO · RÉPONSE & EXPLICATION' : 'RECTO · QUESTION & CONCEPT'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Boîte Leitner {currentFlashcard.box || 1}
                    </span>
                  </div>

                  <span className="text-[11px] font-bold text-indigo-600 flex items-center gap-1 group-hover:scale-105 transition-transform">
                    <RotateCw className="w-3 h-3" />
                    <span>{isFlipped ? 'Afficher Question' : 'Afficher Réponse'}</span>
                  </span>
                </div>

                {/* Main Content Area */}
                <div className="py-4 my-auto">
                  {!isFlipped ? (
                    /* RECTO: Question / Concept */
                    <div className="space-y-3">
                      <div className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                        {currentFlashcard.topic || 'Concept à Définir'}
                      </div>
                      <h3 className="text-base md:text-lg font-black text-slate-900 leading-relaxed">
                        {currentFlashcard.front || currentFlashcard.question}
                      </h3>
                      <p className="text-xs text-slate-400 italic">
                        Touchez ou cliquez sur la carte pour vérifier votre réponse...
                      </p>
                    </div>
                  ) : (
                    /* VERSO: Answer + Clear Explanation */
                    <div className="space-y-3">
                      <div className="text-[11px] font-black uppercase tracking-wider text-emerald-600 flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Réponse Validée & Explication Pédagogique :</span>
                      </div>
                      <div className="text-sm md:text-base font-bold text-slate-900 leading-relaxed whitespace-pre-line bg-emerald-50/40 p-3.5 rounded-2xl border border-emerald-100">
                        {currentFlashcard.back || currentFlashcard.answer}
                      </div>
                    </div>
                  )}
                </div>

                {/* Bottom Footer Info */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                  <span>Matière : {currentFlashcard.courseTitle}</span>
                  <span>{currentFlashcard.timesReviewed || 0} révision(s) effectuée(s)</span>
                </div>
              </div>

              {/* Navigation Controls: Previous / Flip / Next */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handlePrevCard}
                  disabled={currentCardIndex === 0}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-2xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Précédente</span>
                </button>

                <button
                  onClick={handleFlipCard}
                  className="py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-extrabold rounded-2xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Retourner</span>
                </button>

                <button
                  onClick={handleNextCard}
                  disabled={currentCardIndex >= flashcards.length - 1}
                  className="py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 disabled:opacity-40 text-slate-700 text-xs font-bold rounded-2xl flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs"
                >
                  <span>Suivante</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Study Mode: Leitner spaced repetition */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Mémorisation active (Répétition espacée)
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleReviewCard(false)}
                    className="py-2.5 px-3 bg-white hover:bg-rose-50 border border-rose-200 active:scale-95 text-rose-700 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <X className="w-4 h-4 text-rose-600" />
                    <span>À revoir (Boîte 1)</span>
                  </button>

                  <button
                    onClick={() => handleReviewCard(true)}
                    className="py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-white" />
                    <span>Bien compris (+1 Boîte)</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =======================================================================
          TAB 3: AI QUIZ GENERATOR & RUNNER
         ======================================================================= */}
      {activeTab === 'quiz' && (
        <div className="space-y-4">
          {!activeQuiz && !generatingQuiz && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <HelpCircle className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">
                    Générateur de Quiz & Mini-Quiz IA
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Questions QCM basées rigoureusement sur le contenu de votre cours.
                  </p>
                </div>
              </div>

              {quizError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2 text-rose-800 text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{quizError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Matière ou cours cible
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => handleSelectCourse(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  <option value="">Sélectionner une matière...</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de questions</label>
                  <div className="flex gap-2">
                    {[3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuizCount(num)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          quizCount === num
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Difficulté</label>
                  <select
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 font-medium focus:outline-none"
                  >
                    <option value="easy">Facile (Rappels de cours)</option>
                    <option value="medium">Moyen (Application)</option>
                    <option value="hard">Difficile (Conditions d'examen)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleStartQuiz}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Générer et Lancer le Quiz IA</span>
              </button>
            </div>
          )}

          {generatingQuiz && (
            <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold text-slate-800">Génération du quiz sur mesure...</div>
              <div className="text-[11px] text-slate-500">STUDIA AI formule les pièges et les explications d'examen</div>
            </div>
          )}

          {/* Active Quiz Runner */}
          {activeQuiz && !quizFinished && (
            <div className="p-5 bg-white rounded-3xl border border-slate-200/90 shadow-md space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100">
                <span className="font-extrabold text-purple-700">
                  Question {currentQuizIndex + 1} sur {activeQuiz.questions.length}
                </span>
                <span className="font-semibold text-slate-600">{activeQuiz.quizTitle}</span>
              </div>

              <h3 className="text-sm md:text-base font-extrabold text-slate-900 leading-snug">
                {activeQuiz.questions[currentQuizIndex]?.question}
              </h3>

              <div className="space-y-2 pt-2">
                {activeQuiz.questions[currentQuizIndex]?.options?.map((option: string, oIdx: number) => {
                  const isSelected = userAnswers[currentQuizIndex] === option;
                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectQuizAnswer(option)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 font-bold text-purple-900'
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-800'
                      }`}
                    >
                      <span className="text-xs">{option}</span>
                      {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 flex items-center justify-end">
                <button
                  onClick={handleNextQuizQuestion}
                  disabled={!userAnswers[currentQuizIndex]}
                  className="py-2.5 px-5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>
                    {currentQuizIndex < activeQuiz.questions.length - 1 ? 'Question suivante' : 'Terminer le Quiz'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Quiz Results Summary */}
          {quizFinished && quizScore && (
            <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-md text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto text-xl font-black">
                {quizScore.percentage}%
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Quiz Terminé !</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Vous avez obtenu {quizScore.score} bonne(s) réponse(s) sur {activeQuiz?.questions?.length || 0}.
                </p>
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setActiveQuiz(null);
                    setQuizFinished(false);
                  }}
                  className="py-2.5 px-4 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-700 transition-colors"
                >
                  Nouveau Quiz
                </button>
                <button
                  onClick={() => setActiveTab('flashcards')}
                  className="py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200 transition-colors"
                >
                  Réviser en Flashcards
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
