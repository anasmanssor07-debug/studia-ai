import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  Circle, 
  Plus, 
  GraduationCap, 
  Play, 
  AlertTriangle,
  Award,
  ChevronRight,
  ArrowRight,
  RotateCw
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { StudyPlanDay, ExamCountdown, PracticeExam, Course } from '../../types/index.ts';

export const PlannerAndExamsView: React.FC = () => {
  const { user, setCelebrationData, setShowSubscriptionModal } = useAuth();
  const { t, language } = useLanguage();

  const [activeTab, setActiveTab] = useState<'plan' | 'exams'>('plan');
  const [courses, setCourses] = useState<Course[]>([]);
  const [studyPlan, setStudyPlan] = useState<StudyPlanDay[]>([]);
  const [exams, setExams] = useState<ExamCountdown[]>([]);
  const [motivationalQuote, setMotivationalQuote] = useState<string>('');
  const [generatingPlan, setGeneratingPlan] = useState<boolean>(false);

  // New Exam modal
  const [showAddExam, setShowAddExam] = useState<boolean>(false);
  const [examName, setExamName] = useState<string>('');
  const [examCourseTitle, setExamCourseTitle] = useState<string>('');
  const [examDate, setExamDate] = useState<string>('');
  const [targetScore, setTargetScore] = useState<number>(16);

  // Active Timed Exam simulation
  const [practiceExam, setPracticeExam] = useState<PracticeExam | null>(null);
  const [examTimerSec, setExamTimerSec] = useState<number>(0);
  const [examActive, setExamActive] = useState<boolean>(false);
  const [currentExamQIdx, setCurrentExamQIdx] = useState<number>(0);
  const [examUserAnswers, setExamUserAnswers] = useState<Record<number, string>>({});
  const [examSubmitted, setExamSubmitted] = useState<boolean>(false);
  const [examCorrection, setExamCorrection] = useState<any>(null);
  const [generatingExam, setGeneratingExam] = useState<boolean>(false);

  const loadData = async () => {
    try {
      const [coursesRes, planRes] = await Promise.all([
        api.getCourses(),
        api.getStudyPlan(),
      ]);
      setCourses(coursesRes.courses);
      setStudyPlan(planRes.plan);
      setExams(planRes.exams);
      if (coursesRes.courses.length > 0 && !examCourseTitle) {
        setExamCourseTitle(coursesRes.courses[0].title);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Exam timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (examActive && examTimerSec > 0 && !examSubmitted) {
      interval = setInterval(() => {
        setExamTimerSec((prev) => {
          if (prev <= 1) {
            handleSubmitPracticeExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [examActive, examTimerSec, examSubmitted]);

  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await api.toggleTask(taskId);
      setStudyPlan(res.plan);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGeneratePlan = async () => {
    setGeneratingPlan(true);
    try {
      const res = await api.generateStudyPlan({
        availableHoursPerDay: 2,
        language,
      });
      setStudyPlan(res.plan);
      setMotivationalQuote(res.motivationalQuote);
    } catch (err: any) {
      if (err.message && err.message.includes('expiré')) {
        setShowSubscriptionModal(true);
      } else {
        alert(err.message || 'Erreur lors de la génération du planning.');
      }
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examName || !examDate) return;
    try {
      const res = await api.addExam({
        courseTitle: examCourseTitle || 'Matière générale',
        examName,
        examDate,
        targetScore,
      });
      setExams(res.exams);
      setShowAddExam(false);
      setExamName('');
      setExamDate('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleStartExamSimulation = async (courseId?: string) => {
    setGeneratingExam(true);
    setExamSubmitted(false);
    setExamCorrection(null);
    setExamUserAnswers({});
    setCurrentExamQIdx(0);
    try {
      const res = await api.generateExam({
        courseId,
        durationMinutes: 15,
        difficulty: 'hard',
        language,
      });
      setPracticeExam(res.exam);
      setExamTimerSec(15 * 60);
      setExamActive(true);
    } catch (err: any) {
      if (err.message && err.message.includes('expiré')) {
        setShowSubscriptionModal(true);
      } else {
        alert(err.message || 'Impossible de générer l’épreuve.');
      }
    } finally {
      setGeneratingExam(false);
    }
  };

  const handleSubmitPracticeExam = async () => {
    if (!practiceExam) return;
    setExamActive(false);
    setExamSubmitted(true);

    let score = 0;
    const questionsWithFeedback = practiceExam.questions.map((q, idx) => {
      const ans = examUserAnswers[idx];
      const isCorrect = ans === q.correctAnswer;
      if (isCorrect) score += 1;
      return {
        ...q,
        userAnswer: ans,
        isCorrect,
      };
    });

    const percent = Math.round((score / practiceExam.questions.length) * 100);
    setExamCorrection({
      score,
      total: practiceExam.questions.length,
      percent,
      questions: questionsWithFeedback,
    });

    setCelebrationData({
      isOpen: true,
      title: `Examen Blanc Terminé : ${score}/${practiceExam.questions.length}`,
      subtitle: `Score obtenu : ${percent}%. Analyse complète de tes erreurs disponible.`,
      xpEarned: 100,
      minutes: 15,
    });
  };

  const formatExamTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Top Segmented Subtab */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-2xl">
        <button
          onClick={() => setActiveTab('plan')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'plan'
              ? 'bg-white text-blue-600 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>{t('tabSchedule')}</span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'exams'
              ? 'bg-white text-purple-600 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>{t('tabExams')}</span>
        </button>
      </div>

      {/* =========================================
          TAB 1: AI STUDY SCHEDULE
         ========================================= */}
      {activeTab === 'plan' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-extrabold text-slate-900">Emploi du temps intelligent</h2>
              <p className="text-[11px] text-slate-500">Plan d'étude équilibré adapté à tes examens</p>
            </div>

            <button
              onClick={handleGeneratePlan}
              disabled={generatingPlan}
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{generatingPlan ? 'Calcul...' : 'Optimiser avec l’IA'}</span>
            </button>
          </div>

          {motivationalQuote && (
            <div className="p-3 bg-blue-50 border border-blue-200/80 rounded-2xl text-xs text-blue-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{motivationalQuote}</span>
            </div>
          )}

          {studyPlan.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-100 text-center space-y-3">
              <Calendar className="w-12 h-12 text-blue-400 mx-auto opacity-70" />
              <div className="text-xs font-bold text-slate-800">Aucun planning généré</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Laissez l'IA calculer la répartition idéale de vos séances de révision selon vos disponibilités.
              </p>
              <button
                onClick={handleGeneratePlan}
                className="py-2.5 px-4 bg-blue-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Générer mon planning 5 jours</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {studyPlan.map((day, dIdx) => (
                <div key={dIdx} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-2xs space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 border-b border-slate-50 pb-2">
                    <span className="flex items-center gap-1.5 text-blue-600">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{day.dayName}</span>
                    </span>
                    <span className="text-slate-400 font-normal">{day.date}</span>
                  </div>

                  <div className="space-y-2">
                    {day.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => handleToggleTask(task.id)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                          task.completed
                            ? 'bg-slate-50 border-slate-200/60 opacity-60'
                            : 'bg-white border-slate-100 shadow-2xs hover:border-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {task.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-300 shrink-0" />
                          )}
                          <div className="min-w-0">
                            <h4
                              className={`text-xs font-bold truncate ${
                                task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                              }`}
                            >
                              {task.title}
                            </h4>
                            <p className="text-[10px] text-slate-400">
                              {task.courseTitle} · {task.durationMinutes} min · {task.scheduledTime}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================
          TAB 2: PRACTICE EXAMS & COUNTDOWNS
         ========================================= */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          {/* Active Exam Simulation Runner */}
          {examActive && practiceExam && !examSubmitted && (
            <div className="p-5 bg-white rounded-3xl border-2 border-purple-500 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">Épreuve en cours</span>
                  <h3 className="text-sm font-extrabold text-slate-900">{practiceExam.title}</h3>
                </div>

                <div className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 font-mono font-bold text-xs border border-purple-200 animate-pulse">
                  ⏱️ {formatExamTime(examTimerSec)}
                </div>
              </div>

              {/* Question */}
              <div>
                <div className="text-xs text-slate-400 mb-1">
                  Question {currentExamQIdx + 1} / {practiceExam.questions.length}
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  {practiceExam.questions[currentExamQIdx]?.question}
                </h4>
              </div>

              {/* Options */}
              <div className="space-y-2">
                {practiceExam.questions[currentExamQIdx]?.options?.map((opt: string, idx: number) => {
                  const isSelected = examUserAnswers[currentExamQIdx] === opt;
                  return (
                    <div
                      key={idx}
                      onClick={() =>
                        setExamUserAnswers((prev) => ({
                          ...prev,
                          [currentExamQIdx]: opt,
                        }))
                      }
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between text-xs ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50 font-bold text-purple-900'
                          : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <span>{opt}</span>
                    </div>
                  );
                })}
              </div>

              {/* Navigation */}
              <div className="flex gap-2 pt-2">
                {currentExamQIdx < practiceExam.questions.length - 1 ? (
                  <button
                    onClick={() => setCurrentExamQIdx((prev) => prev + 1)}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    Question suivante
                  </button>
                ) : (
                  <button
                    onClick={handleSubmitPracticeExam}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md"
                  >
                    {t('submitExam')}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Exam Result Correction */}
          {examSubmitted && examCorrection && (
            <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-4">
              <div className="text-center py-2">
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Note de l'Épreuve</span>
                <div className="text-3xl font-black text-slate-900 mt-0.5">
                  {examCorrection.score} / {examCorrection.total}
                </div>
                <p className="text-xs text-slate-500">Pourcentage d'exactitude : {examCorrection.percent}%</p>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Corrigé Examen</h4>
                {examCorrection.questions?.map((q: any, i: number) => (
                  <div
                    key={i}
                    className={`p-3 rounded-2xl border text-xs ${
                      q.isCorrect ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
                    }`}
                  >
                    <div className="font-bold text-slate-900 mb-1">{q.question}</div>
                    <div className="text-[11px] text-slate-600">
                      <span className="font-semibold">Votre réponse :</span> {q.userAnswer || 'Non répondu'}
                    </div>
                    {!q.isCorrect && (
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                        Bonne réponse : {q.correctAnswer}
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 mt-1 p-2 bg-white/70 rounded-lg">
                      💡 {q.explanation}
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  setExamSubmitted(false);
                  setPracticeExam(null);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs"
              >
                Terminer la révision
              </button>
            </div>
          )}

          {/* Exam List and Generator Header */}
          {!examActive && !examSubmitted && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-slate-900">Échéances & Examens Blancs</h2>
                  <p className="text-[11px] text-slate-500">Anticipez vos partiels et testez-vous en conditions réelles</p>
                </div>

                <button
                  onClick={() => setShowAddExam(true)}
                  className="py-1.5 px-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Ajouter un examen</span>
                </button>
              </div>

              {/* Start Exam Simulation Card */}
              <div className="p-4 bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-3xl shadow-md flex items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-300">
                    Mode Épreuve Chronométrée
                  </span>
                  <h3 className="text-xs font-extrabold text-white mt-0.5">
                    Générer un examen blanc corrigé
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    6 questions à haute valeur ajoutée avec barème et compte à rebours
                  </p>
                </div>

                <button
                  onClick={() => handleStartExamSimulation(courses[0]?.id)}
                  disabled={generatingExam}
                  className="shrink-0 py-2.5 px-3.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>{generatingExam ? 'Génération...' : 'Démarrer'}</span>
                </button>
              </div>

              {/* List of registered exams */}
              <div className="space-y-2.5">
                {exams.map((ex) => {
                  const daysLeft = Math.max(0, Math.ceil((new Date(ex.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
                  return (
                    <div
                      key={ex.id}
                      className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                          {ex.courseTitle}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-0.5">{ex.examName}</h4>
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-2">
                          <span>Note visée : {ex.targetScore}/20</span>
                          <span>·</span>
                          <span>Date : {ex.examDate.split('T')[0]}</span>
                        </div>
                      </div>

                      <div className="text-center bg-purple-50 border border-purple-100 rounded-xl px-3 py-1.5 shrink-0">
                        <div className="text-lg font-black text-purple-700 leading-none">J-{daysLeft}</div>
                        <div className="text-[9px] text-purple-600 font-semibold mt-0.5">jours</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modal: Add Exam */}
          {showAddExam && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
              <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100">
                <h3 className="text-base font-extrabold text-slate-900 mb-3">Ajouter une date d'examen</h3>
                <form onSubmit={handleAddExam} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Matière</label>
                    <select
                      value={examCourseTitle}
                      onChange={(e) => setExamCourseTitle(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.title}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Intitulé de l'épreuve</label>
                    <input
                      type="text"
                      required
                      value={examName}
                      onChange={(e) => setExamName(e.target.value)}
                      placeholder="Ex: Examen Final S1 - Partiel Écrit"
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Date de l'examen</label>
                    <input
                      type="date"
                      required
                      value={examDate}
                      onChange={(e) => setExamDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Note visée sur 20</label>
                    <input
                      type="number"
                      min={10}
                      max={20}
                      value={targetScore}
                      onChange={(e) => setTargetScore(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddExam(false)}
                      className="flex-1 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-md"
                    >
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
