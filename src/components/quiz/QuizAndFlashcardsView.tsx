import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Brain, 
  RotateCw, 
  Check, 
  X, 
  ArrowRight, 
  Layers, 
  Award, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Plus,
  Play
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { Flashcard, Course, QuizQuestion } from '../../types/index.ts';

interface QuizAndFlashcardsViewProps {
  initialCourseId?: string;
  initialSubtab?: 'flashcards' | 'quiz';
}

export const QuizAndFlashcardsView: React.FC<QuizAndFlashcardsViewProps> = ({ 
  initialCourseId, 
  initialSubtab = 'flashcards' 
}) => {
  const { user, setCelebrationData, setShowSubscriptionModal } = useAuth();
  const { t, language } = useLanguage();

  const [subtab, setSubtab] = useState<'flashcards' | 'quiz'>(initialSubtab);
  const [courses, setCourses] = useState<Course[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [generatingCards, setGeneratingCards] = useState<boolean>(false);

  // Quiz state
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || '');
  const [quizDifficulty, setQuizDifficulty] = useState<string>('medium');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [activeQuiz, setActiveQuiz] = useState<any>(null);
  const [currentQuizIndex, setCurrentQuizIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [quizFinished, setQuizFinished] = useState<boolean>(false);
  const [quizScoreResult, setQuizScoreResult] = useState<any>(null);
  const [generatingQuiz, setGeneratingQuiz] = useState<boolean>(false);

  useEffect(() => {
    Promise.all([api.getCourses(), api.getFlashcards()]).then(([coursesRes, cardsRes]) => {
      setCourses(coursesRes.courses);
      setFlashcards(cardsRes.flashcards);
      if (!selectedCourseId && coursesRes.courses.length > 0) {
        setSelectedCourseId(coursesRes.courses[0].id);
      }
    }).catch(console.error);
  }, []);

  // Flashcards actions
  const currentCard = flashcards[currentCardIndex];

  const handleReviewCard = async (isCorrect: boolean) => {
    if (!currentCard) return;
    try {
      await api.reviewFlashcard(currentCard.id, isCorrect);
      setIsFlipped(false);
      if (currentCardIndex < flashcards.length - 1) {
        setCurrentCardIndex((prev) => prev + 1);
      } else {
        // Deck finished
        setCelebrationData({
          isOpen: true,
          title: 'Paquet de flashcards révisé !',
          subtitle: 'Tu as complété la révision de tes cartes mémoire selon l’algorithme de répétition espacée Leitner.',
          xpEarned: 30,
          minutes: 5,
        });
        setCurrentCardIndex(0);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateFlashcards = async () => {
    setGeneratingCards(true);
    try {
      const res = await api.generateFlashcards({
        courseId: selectedCourseId || undefined,
        count: 5,
        language,
      });
      setFlashcards([...res.flashcards, ...flashcards]);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    } catch (err: any) {
      if (err.message && err.message.includes('expiré')) {
        setShowSubscriptionModal(true);
      } else {
        alert(err.message || 'Erreur lors de la génération des cartes.');
      }
    } finally {
      setGeneratingCards(false);
    }
  };

  // Quiz actions
  const handleStartQuiz = async () => {
    setGeneratingQuiz(true);
    setQuizFinished(false);
    setUserAnswers({});
    setCurrentQuizIndex(0);
    try {
      const selectedCourse = courses.find((c) => c.id === selectedCourseId);
      const res = await api.generateQuiz({
        courseId: selectedCourseId,
        topic: selectedCourse?.title || 'Culture Générale & Sciences',
        questionCount,
        difficulty: quizDifficulty,
        language,
      });
      setActiveQuiz(res.quiz);
    } catch (err: any) {
      if (err.message && err.message.includes('expiré')) {
        setShowSubscriptionModal(true);
      } else {
        alert(err.message || 'Impossible de créer le quiz.');
      }
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const handleSelectAnswer = (option: string) => {
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
    let score = 0;
    const questionsWithUserAnswers = activeQuiz.questions.map((q: any, idx: number) => {
      const ans = userAnswers[idx];
      const isCorrect = ans === q.correctAnswer;
      if (isCorrect) score += 1;
      return {
        ...q,
        userAnswer: ans,
        isCorrect,
      };
    });

    const selectedCourse = courses.find((c) => c.id === selectedCourseId);
    try {
      const res = await api.logQuizResult({
        courseId: selectedCourseId,
        courseTitle: selectedCourse?.title || 'Quiz d’évaluation',
        title: activeQuiz.quizTitle,
        score,
        totalQuestions: activeQuiz.questions.length,
        questions: questionsWithUserAnswers,
        weakTopics: score < activeQuiz.questions.length ? ['Notions théoriques avancées'] : [],
        recommendations: ['Révisez les fiches de cours associées et refaites un quiz dans 3 jours.'],
      });
      setQuizScoreResult(res.result);
      setQuizFinished(true);

      setCelebrationData({
        isOpen: true,
        title: `Quiz complété : ${score}/${activeQuiz.questions.length} !`,
        subtitle: `Tu as validé ce quiz avec ${Math.round((score / activeQuiz.questions.length) * 100)}% de réussite.`,
        xpEarned: res.xpEarned,
        minutes: 4,
      });
    } catch (err) {
      console.error(err);
      setQuizFinished(true);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Segmented Subtab */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setSubtab('flashcards')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            subtab === 'flashcards'
              ? 'bg-white text-blue-600 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('tabFlashcards')}</span>
        </button>

        <button
          onClick={() => setSubtab('quiz')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            subtab === 'quiz'
              ? 'bg-white text-purple-600 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Brain className="w-4 h-4" />
          <span>{t('tabQuiz')}</span>
        </button>
      </div>

      {/* =========================================
          SUBTAB 1: FLASHCARDS (Leitner Spaced Repetition)
         ========================================= */}
      {subtab === 'flashcards' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">
                Répétition Espacée (Système Leitner)
              </h2>
              <p className="text-[11px] text-slate-500">
                Mémorisez durablement les définitions et formules sans bachotage
              </p>
            </div>

            <button
              onClick={handleGenerateFlashcards}
              disabled={generatingCards}
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{generatingCards ? 'Génération...' : '+ Cartes IA'}</span>
            </button>
          </div>

          {flashcards.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-100 text-center space-y-3">
              <Layers className="w-12 h-12 text-blue-400 mx-auto opacity-70" />
              <h3 className="text-xs font-bold text-slate-800">Aucune carte mémoire disponible</h3>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Générez automatiquement un paquet de cartes mémoire à partir de vos cours téléversés.
              </p>
              <button
                onClick={handleGenerateFlashcards}
                className="py-2.5 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Générer mes premières cartes</span>
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Progress counter & Leitner Box display */}
              <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                <span>Carte {currentCardIndex + 1} sur {flashcards.length}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-bold border border-blue-200">
                  {t('flashcardBox')} {currentCard?.box || 1} / 5
                </span>
              </div>

              {/* 3D Flashcard Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className="relative w-full min-h-[220px] bg-white rounded-3xl p-6 border border-slate-200/80 shadow-md cursor-pointer transition-all hover:shadow-lg flex flex-col justify-between select-none"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-2">
                    <span>{currentCard?.topic}</span>
                    <span className="flex items-center gap-1 text-blue-600">
                      <RotateCw className="w-3 h-3" />
                      <span>{isFlipped ? 'Afficher question' : t('revealAnswer')}</span>
                    </span>
                  </div>

                  <h3 className="text-sm md:text-base font-extrabold text-slate-900 mt-2 leading-relaxed">
                    {isFlipped ? currentCard?.answer : currentCard?.question}
                  </h3>
                </div>

                <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between items-center">
                  <span>Matière : {currentCard?.courseTitle}</span>
                  <span>{currentCard?.timesReviewed || 0} révisions</span>
                </div>
              </div>

              {/* Action buttons (Leitner scheduling) */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  onClick={() => handleReviewCard(false)}
                  className="py-3 px-4 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <X className="w-4 h-4 text-rose-600" />
                  <span>{t('needReview')} (Boîte 1)</span>
                </button>

                <button
                  onClick={() => handleReviewCard(true)}
                  className="py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>{t('iGotIt')} (+1 Boîte)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================
          SUBTAB 2: QUIZ GENERATOR & RUNNER
         ========================================= */}
      {subtab === 'quiz' && (
        <div className="space-y-4">
          {!activeQuiz && !generatingQuiz && (
            <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-4">
              <h2 className="text-sm font-extrabold text-slate-900">
                Configurer une session de Quiz IA
              </h2>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Matière ou cours cible</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.title} ({c.subject})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Nombre de questions</label>
                  <div className="flex gap-2">
                    {[3, 5, 10].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setQuestionCount(num)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          questionCount === num
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Niveau de difficulté</label>
                  <select
                    value={quizDifficulty}
                    onChange={(e) => setQuizDifficulty(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs text-slate-800 font-medium focus:outline-none"
                  >
                    <option value="easy">Facile (Rappels)</option>
                    <option value="medium">Moyen (Application)</option>
                    <option value="hard">Difficile (Examen)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleStartQuiz}
                className="w-full py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 text-xs"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Générer et lancer le Quiz</span>
              </button>
            </div>
          )}

          {generatingQuiz && (
            <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold text-slate-800">Création de vos questions personnalisées...</div>
              <div className="text-[11px] text-slate-500">STUDIA AI formule des pièges et des explications claires</div>
            </div>
          )}

          {activeQuiz && !quizFinished && (
            <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold text-purple-700">Question {currentQuizIndex + 1} / {activeQuiz.questions.length}</span>
                <span>{activeQuiz.quizTitle}</span>
              </div>

              {/* Question Text */}
              <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                {activeQuiz.questions[currentQuizIndex]?.question}
              </h3>

              {/* Options */}
              <div className="space-y-2 pt-2">
                {activeQuiz.questions[currentQuizIndex]?.options?.map((option: string, oIdx: number) => {
                  const isSelected = userAnswers[currentQuizIndex] === option;
                  return (
                    <div
                      key={oIdx}
                      onClick={() => handleSelectAnswer(option)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/60 font-bold text-purple-900'
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-800'
                      }`}
                    >
                      <span className="text-xs">{option}</span>
                      {isSelected && <Check className="w-4 h-4 text-purple-600 shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Next / Submit Button */}
              <div className="pt-2">
                <button
                  onClick={handleNextQuizQuestion}
                  disabled={!userAnswers[currentQuizIndex]}
                  className="w-full py-3 px-4 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white font-bold rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-1.5 text-xs"
                >
                  <span>
                    {currentQuizIndex < activeQuiz.questions.length - 1
                      ? 'Question suivante'
                      : 'Valider et voir la correction'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Quiz Results Breakdown */}
          {quizFinished && quizScoreResult && (
            <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-4">
              <div className="text-center py-2">
                <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Résultats du Quiz</div>
                <div className="text-3xl font-black text-slate-900 mt-1">
                  {quizScoreResult.score} / {quizScoreResult.totalQuestions}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Taux de réussite : {quizScoreResult.percentage}%
                </p>
              </div>

              {/* Detailed Corrections */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Corrigé Détaillé</h4>
                {quizScoreResult.questions?.map((q: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3.5 rounded-2xl border ${
                      q.isCorrect ? 'bg-emerald-50/40 border-emerald-200' : 'bg-rose-50/40 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {q.isCorrect ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900">{q.question}</div>
                        <div className="text-[11px] text-slate-600 mt-1">
                          <span className="font-semibold">Ta réponse :</span> {q.userAnswer || 'Non répondu'}
                        </div>
                        {!q.isCorrect && (
                          <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                            Bonne réponse : {q.correctAnswer}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 mt-1.5 p-2 bg-white/70 rounded-lg border border-slate-200/60">
                          💡 {q.explanation}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setActiveQuiz(null);
                  setQuizFinished(false);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Nouveau Quiz</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
