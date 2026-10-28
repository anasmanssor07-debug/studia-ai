import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Flame, 
  Play, 
  Square, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  Circle, 
  Calendar, 
  Award, 
  ArrowRight,
  TrendingUp,
  Brain,
  Zap,
  FileUp,
  Upload
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { api } from '../../services/api.ts';
import type { Course, ExamCountdown, StudyPlanDay } from '../../types/index.ts';

interface HomeDashboardProps {
  onNavigate: (tab: string, extra?: any) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ onNavigate }) => {
  const { 
    user, 
    isStudying, 
    studyDurationSec, 
    startStudySession, 
    finishStudySession,
    setShowSubscriptionModal 
  } = useAuth();
  const { t, language } = useLanguage();

  const [courses, setCourses] = useState<Course[]>([]);
  const [exams, setExams] = useState<ExamCountdown[]>([]);
  const [todayTasks, setTodayTasks] = useState<any[]>([]);
  const [recommendation, setRecommendation] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [coursesRes, planRes, recRes] = await Promise.all([
          api.getCourses(),
          api.getStudyPlan(),
          api.getAiRecommendation(),
        ]);
        setCourses(coursesRes.courses);
        setExams(planRes.exams);
        if (planRes.plan.length > 0) {
          setTodayTasks(planRes.plan[0].tasks || []);
        }
        setRecommendation(recRes.recommendation);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleToggleTask = async (taskId: string) => {
    try {
      const res = await api.toggleTask(taskId);
      if (res.plan.length > 0) {
        setTodayTasks(res.plan[0].tasks || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const dailyGoalMinutes = user?.dailyGoalMinutes || 45;
  const loggedMinutes = 0; // Starts at 0, counts from completed sessions
  const currentTotalMinutes = isStudying 
    ? loggedMinutes + Math.floor(studyDurationSec / 60) 
    : loggedMinutes;
  const progressPercent = Math.min(100, Math.round((currentTotalMinutes / dailyGoalMinutes) * 100));

  // Circular progress math
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="space-y-5 pb-8">
      {/* 1. Welcome & Motivation Greeting */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 rounded-3xl p-5 text-white shadow-lg shadow-blue-500/20 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-xl pointer-events-none" />
        
        <div className="flex items-start justify-between relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-white/20 text-blue-50 border border-white/20">
                {user?.levelTitle || 'Nouveau Débutant'} · Niv. {user?.level ?? 1}
              </span>
              <span className="text-xs text-blue-200">
                {user?.totalXp ?? 0} XP
              </span>
            </div>
            <h1 className="text-xl font-black tracking-tight">
              {t('greetingMorning')}, {user?.name?.split(' ')[0] || 'Étudiant'} !
            </h1>
            <p className="text-xs text-blue-100 mt-1 max-w-xs leading-relaxed">
              {language === 'ar' 
                ? 'جاهز لتحقيق إنجاز اليوم؟ كل جلسة مراجعة تقربك من أهدافك.'
                : 'Prêt à progresser aujourd’hui ? Chaque minute passée compte.'}
            </p>
          </div>

          {/* Study streak pill badge */}
          <div className="flex flex-col items-center bg-white/15 backdrop-blur-md border border-white/20 rounded-2xl p-2.5 text-center min-w-[72px]">
            <Flame className="w-6 h-6 text-amber-400 fill-amber-400 animate-pulse" />
            <span className="text-sm font-black text-white mt-0.5">{user?.streakDays ?? 0} j</span>
            <span className="text-[10px] text-blue-200 font-medium">Série</span>
          </div>
        </div>

        {/* 7-Day Activity Dots */}
        <div className="mt-4 pt-3 border-t border-white/15 flex items-center justify-between text-xs">
          <span className="text-blue-200 text-[11px]">Activité 7 derniers jours :</span>
          <div className="flex items-center gap-1.5">
            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div
                  className={`w-3.5 h-3.5 rounded-full ${
                    idx < (user?.streakDays ?? 0)
                      ? 'bg-amber-400 shadow-xs shadow-amber-300'
                      : 'bg-white/20'
                  }`}
                />
                <span className="text-[9px] text-blue-200">{day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Daily Study Goal Card & Active Timer */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Circular SVG Progress */}
          <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100 fill-none"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-blue-600 fill-none transition-all duration-500 ease-out"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute text-center flex flex-col items-center justify-center">
              <span className="text-base font-black text-slate-900 leading-none">
                {progressPercent}%
              </span>
              <span className="text-[9px] text-slate-400 font-medium mt-0.5">
                {currentTotalMinutes}/{dailyGoalMinutes}m
              </span>
            </div>
          </div>

          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {t('dailyGoal')}
            </div>
            <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
              {currentTotalMinutes} sur {dailyGoalMinutes} minutes
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {progressPercent >= 100 
                ? 'Objectif du jour atteint ! Bravo pour ta constance.' 
                : `${dailyGoalMinutes - currentTotalMinutes} minutes restantes pour valider la journée.`}
            </p>
          </div>
        </div>

        {/* Live Timer Trigger */}
        <div className="shrink-0 flex flex-col items-end">
          {isStudying ? (
            <div className="flex flex-col items-end gap-1.5">
              <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200 animate-pulse">
                {formatTimer(studyDurationSec)}
              </span>
              <button
                onClick={finishStudySession}
                className="py-2 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-500/20 flex items-center gap-1.5 transition-all active:scale-95"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Terminer</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => startStudySession()}
              className="py-2.5 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Étudier</span>
            </button>
          )}
        </div>
      </div>

      {/* Quick Action Bar (PDF Upload & Tools) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => onNavigate('courses', { openPdfModal: true })}
          className="p-3 bg-gradient-to-br from-rose-50 to-orange-50 hover:from-rose-100 hover:to-orange-100 border border-rose-200/80 rounded-2xl flex items-center gap-3 transition-all text-left shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <FileUp className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-rose-950 truncate">Importer un PDF</div>
            <div className="text-[10px] text-rose-700/80 truncate">Résumé 100% fidèle strict</div>
          </div>
        </button>

        <button
          onClick={() => onNavigate('assistant')}
          className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border border-blue-200/80 rounded-2xl flex items-center gap-3 transition-all text-left shadow-2xs group"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-blue-950 truncate">Poser à STUDIA AI</div>
            <div className="text-[10px] text-blue-700/80 truncate">Tuteur IA 24h/24</div>
          </div>
        </button>
      </div>

      {/* 3. AI Recommended Next Action (Personalized) */}
      {recommendation && (
        <div className="bg-gradient-to-r from-purple-50 via-indigo-50 to-blue-50 border border-purple-200/80 rounded-3xl p-4.5 flex items-start justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-purple-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>{t('recommendedNext')}</span>
              </div>
              <h4 className="text-xs font-extrabold text-slate-900 mt-0.5">
                {recommendation.title}
              </h4>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                {recommendation.description}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              if (recommendation.type === 'flashcards') onNavigate('quiz', { subtab: 'flashcards' });
              else if (recommendation.type === 'course') onNavigate('courses');
              else onNavigate('assistant');
            }}
            className="shrink-0 self-center py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm shadow-purple-500/20 transition-all flex items-center gap-1"
          >
            <span>{recommendation.actionLabel}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 4. Continue Learning (Recent Courses) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>{t('continueLearning')}</span>
          </h2>
          <button
            onClick={() => onNavigate('courses')}
            className="text-xs text-blue-600 font-bold hover:text-blue-700 flex items-center gap-0.5"
          >
            <span>Voir tout</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {courses.length === 0 ? (
          <div 
            onClick={() => onNavigate('courses', { openPdfModal: true })}
            className="p-5 bg-white rounded-2xl border-2 border-dashed border-blue-200 hover:border-blue-500 shadow-2xs cursor-pointer text-center space-y-2.5 group transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Aucun cours ajouté pour le moment</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 max-w-sm mx-auto">
                Cliquez pour importer votre premier support PDF. STUDIA AI reconnaîtra automatiquement le module de ce cours et générera votre synthèse.
              </p>
            </div>
            <div className="pt-1">
              <span className="py-2 px-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-500/20 inline-flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                <span>Importer un PDF</span>
              </span>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {courses.slice(0, 2).map((course) => (
              <div
                key={course.id}
                onClick={() => onNavigate('courses', { courseId: course.id })}
                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all cursor-pointer flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xs"
                    style={{ backgroundColor: course.color }}
                  >
                    {course.title.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-slate-900 truncate">
                      {course.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      {course.chapters.length} chapitres · {course.documents.length} document{course.documents.length > 1 ? 's' : ''}
                    </p>
                    
                    {/* Micro Progress bar */}
                    <div className="w-36 h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${course.progressPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-slate-600">{course.progressPercent}%</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 5. AI Assistant Quick Card */}
      <div className="p-4 rounded-3xl bg-slate-900 text-white relative overflow-hidden flex items-center justify-between gap-4">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-400 mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Assistant IA STUDIA</span>
          </div>
          <h3 className="text-sm font-extrabold text-white">
            {t('aiAssistantCardTitle')}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 max-w-xs">
            {t('aiAssistantCardDesc')}
          </p>
        </div>

        <button
          onClick={() => onNavigate('assistant')}
          className="relative z-10 shrink-0 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
        >
          {t('askStudiaAi')}
        </button>
      </div>

      {/* 6. Upcoming Exams Countdown */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>{t('upcomingExams')}</span>
          </h2>
          <button
            onClick={() => onNavigate('planner')}
            className="text-xs text-blue-600 font-bold hover:text-blue-700 flex items-center gap-0.5"
          >
            <span>Gérer</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {exams.map((exam) => {
            const daysLeft = Math.max(0, Math.ceil((new Date(exam.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
            return (
              <div
                key={exam.id}
                className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
                    {exam.courseTitle}
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 mt-0.5">{exam.examName}</h4>
                  <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                    <span>Note visée : {exam.targetScore}/20</span>
                    <span>·</span>
                    <span>Jauge : {exam.readinessScore}%</span>
                  </div>
                </div>

                <div className="text-center bg-purple-50 border border-purple-100 rounded-xl px-2.5 py-1.5 shrink-0">
                  <div className="text-base font-black text-purple-700 leading-none">J-{daysLeft}</div>
                  <div className="text-[9px] text-purple-600 font-semibold mt-0.5">jours</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Today's Study Tasks */}
      {todayTasks.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Séances prévues aujourd'hui</span>
            </h2>
          </div>

          <div className="space-y-2">
            {todayTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => handleToggleTask(task.id)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  task.completed
                    ? 'bg-slate-50 border-slate-200/80 opacity-70'
                    : 'bg-white border-slate-100 shadow-xs hover:border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {task.completed ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                  )}
                  <div>
                    <h4
                      className={`text-xs font-bold ${
                        task.completed ? 'line-through text-slate-400' : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </h4>
                    <p className="text-[10px] text-slate-500">
                      {task.courseTitle} · {task.durationMinutes} min · {task.scheduledTime}
                    </p>
                  </div>
                </div>

                {!task.completed && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startStudySession(task.courseId);
                    }}
                    className="py-1 px-2.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Lancer</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
