import React, { useState, useEffect } from 'react';
import { 
  Home, 
  BookOpen, 
  Bot, 
  Layers, 
  Calendar, 
  User, 
  Sparkles, 
  Flame, 
  Smartphone, 
  Maximize2,
  Monitor,
  Square,
  Globe,
  Crown,
  Camera
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { HomeDashboard } from '../home/HomeDashboard.tsx';
import { CoursesView } from '../courses/CoursesView.tsx';
import { AssistantView } from '../assistant/AssistantView.tsx';
import { QuizAndFlashcardsView } from '../quiz/QuizAndFlashcardsView.tsx';
import { PlannerAndExamsView } from '../planner/PlannerAndExamsView.tsx';
import { ProfileView } from '../profile/ProfileView.tsx';
import { CelebrationModal } from '../celebration/CelebrationModal.tsx';
import { SubscriptionModal } from '../subscription/SubscriptionModal.tsx';
import { AvatarPickerModal } from '../profile/AvatarPickerModal.tsx';
import { AdminDashboardView } from '../admin/AdminDashboardView.tsx';

export type ScreenFormatMode = 'adaptive' | 'phone' | 'fullscreen';

export const MobileShell: React.FC = () => {
  const { 
    user, 
    isStudying, 
    studyDurationSec, 
    finishStudySession, 
    setShowSubscriptionModal 
  } = useAuth();
  const { language, setLanguage, t, isRtl } = useLanguage();

  const [activeTab, setActiveTab] = useState<string>('home');
  const [navExtra, setNavExtra] = useState<any>(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState<boolean>(false);

  // Dynamic screen format: adaptive (default) | phone | fullscreen
  const [screenMode, setScreenMode] = useState<ScreenFormatMode>(() => {
    const saved = localStorage.getItem('studia_screen_mode') as ScreenFormatMode;
    return saved && ['adaptive', 'phone', 'fullscreen'].includes(saved) ? saved : 'adaptive';
  });

  const handleScreenModeChange = (mode: ScreenFormatMode) => {
    setScreenMode(mode);
    localStorage.setItem('studia_screen_mode', mode);
  };

  const handleNavigate = (tab: string, extra?: any) => {
    setActiveTab(tab);
    setNavExtra(extra || null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Determine container styling based on chosen format mode
  const getContainerClasses = () => {
    if (screenMode === 'phone') {
      return 'max-w-[420px] min-h-[100vh] md:min-h-[860px] md:max-h-[900px] md:rounded-[44px] md:border-[10px] md:border-slate-800 md:shadow-2xl';
    }
    if (screenMode === 'fullscreen') {
      return 'w-full min-h-screen rounded-none shadow-none';
    }
    // Adaptive: automatically fills screen cleanly (max-w-5xl on desktop, full on mobile)
    return 'w-full max-w-5xl min-h-screen md:min-h-[92vh] md:my-auto md:rounded-3xl shadow-xl border border-slate-200/80';
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 md:p-3 selection:bg-blue-600 selection:text-white">
      {/* Top Device & Mode Bar (Visible on desktop & tablets) */}
      <div className="hidden md:flex items-center justify-between w-full max-w-5xl mb-2 px-3 text-xs text-slate-400">
        <div className="flex items-center gap-2 font-bold text-slate-300">
          <img
            src="/assets/aistudio/logo_studia_ai_a2b1aae5.png"
            alt="Logo STUDIA AI"
            className="w-5 h-5 rounded-md object-cover"
          />
          <span>STUDIA AI — Plateforme d'apprentissage intelligente</span>
        </div>

        {/* Screen Format Selector (User requested adaptable format) */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => handleScreenModeChange('adaptive')}
            title="Format Adaptatif (S'adapte à votre écran)"
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              screenMode === 'adaptive'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Adaptatif</span>
          </button>

          <button
            onClick={() => handleScreenModeChange('phone')}
            title="Format Smartphone (Émulateur Mobile)"
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              screenMode === 'phone'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Mobile</span>
          </button>

          <button
            onClick={() => handleScreenModeChange('fullscreen')}
            title="Format Plein Écran Large"
            className={`flex items-center gap-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition-all ${
              screenMode === 'fullscreen'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Plein Écran</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Admin Dashboard Quick Link */}
          <button
            onClick={() => handleNavigate('admin')}
            title="Panneau d'administration & supervision Payzone"
            className={`flex items-center gap-1 py-1 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-purple-600 text-white'
                : 'text-purple-300 hover:text-white bg-purple-950/60 border border-purple-800/60'
            }`}
          >
            <span>Admin</span>
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Language Switcher */}
          <button
            onClick={() => {
              const next = language === 'fr' ? 'en' : language === 'en' ? 'ar' : 'fr';
              setLanguage(next);
            }}
            className="flex items-center gap-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold transition-colors"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>{language.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Main Container: Dynamically sized */}
      <div
        className={`w-full bg-slate-50 transition-all duration-300 flex flex-col relative overflow-hidden ${getContainerClasses()}`}
      >
        {/* Mobile Device Status Bar & Speaker Notch (Phone mode only) */}
        {screenMode === 'phone' && (
          <div className="hidden md:flex pt-3 px-7 items-center justify-between text-slate-800 text-[11px] font-semibold select-none z-20">
            <span>09:41</span>
            <div className="w-24 h-4 bg-slate-900 rounded-full mx-auto" />
            <div className="flex items-center gap-1.5">
              <span>5G</span>
              <div className="w-4 h-2 rounded-2xs border border-slate-700 p-0.5 flex">
                <div className="w-full h-full bg-slate-800 rounded-3xs" />
              </div>
            </div>
          </div>
        )}

        {/* Global App Header */}
        <header className="px-4 md:px-6 py-3 bg-white border-b border-slate-100 flex items-center justify-between shrink-0 sticky top-0 z-20 shadow-2xs">
          {/* Logo STUDIA AI */}
          <div 
            onClick={() => handleNavigate('home')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <img
              src="/assets/aistudio/logo_studia_ai_a2b1aae5.png"
              alt="Logo STUDIA AI"
              className="w-9 h-9 rounded-xl object-cover shadow-xs border border-blue-100 group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-black text-slate-900 text-base tracking-tight flex items-center gap-1">
                STUDIA <span className="text-blue-600">AI</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 font-medium -mt-0.5">
                {t('slogan')}
              </span>
            </div>
          </div>

          {/* Right Header items: Streak, Subscription, Profile Avatar */}
          <div className="flex items-center gap-2">
            {/* Streak flame badge */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-xs font-bold border border-amber-200/80">
              <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
              <span>{user?.streakDays || 0} j</span>
            </div>

            {/* Subscription Pill with discrete PREMIUM badge */}
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                user?.subscription?.status === 'active'
                  ? 'bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-800 border-amber-300 hover:bg-amber-100/60 shadow-2xs'
                  : 'bg-blue-50 text-blue-700 border-blue-200/80 hover:bg-blue-100'
              }`}
            >
              <Crown className={`w-3.5 h-3.5 ${user?.subscription?.status === 'active' ? 'text-amber-500 fill-amber-500' : 'text-blue-600'}`} />
              <span>
                {user?.subscription?.status === 'active' ? 'PREMIUM' : user?.subscription?.status === 'cancelled' ? 'Résilié' : '40 DH / m'}
              </span>
            </button>

            {/* Profile Avatar with click-to-edit modal */}
            <button
              onClick={() => setShowAvatarPicker(true)}
              title="Modifier ma photo de profil"
              className="relative w-8 h-8 rounded-xl overflow-hidden border-2 border-slate-200 hover:border-blue-500 transition-colors shrink-0 shadow-2xs group"
            >
              <img
                src={user?.avatarUrl || '/assets/aistudio/logo_studia_ai_a2b1aae5.png'}
                alt={user?.name || 'Profil'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/logo_studia_ai_a2b1aae5.png';
                }}
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                <Camera className="w-3 h-3" />
              </div>
            </button>
          </div>
        </header>

        {/* Persistent Study Session Banner if active */}
        {isStudying && (
          <div className="bg-emerald-600 text-white px-4 py-2 flex items-center justify-between text-xs font-bold z-20 shadow-sm animate-fade-in">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-white animate-ping" />
              <span>Session d'étude en cours : {formatTimer(studyDurationSec)}</span>
            </div>
            <button
              onClick={finishStudySession}
              className="py-1 px-2.5 rounded-lg bg-white text-emerald-700 font-extrabold hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-1 text-[11px]"
            >
              <Square className="w-3 h-3 fill-current" />
              <span>Terminer</span>
            </button>
          </div>
        )}

        {/* Scrollable View Content */}
        <main className="flex-1 overflow-y-auto px-4 md:px-6 pt-4 pb-24">
          {activeTab === 'home' && <HomeDashboard onNavigate={handleNavigate} />}
          {activeTab === 'courses' && (
            <CoursesView 
              initialCourseId={navExtra?.courseId} 
              openPdfModalTrigger={navExtra?.openPdfModal}
              onNavigate={handleNavigate} 
            />
          )}
          {activeTab === 'assistant' && (
            <AssistantView 
              initialCourseId={navExtra?.courseId} 
              initialDocumentId={navExtra?.documentId} 
            />
          )}
          {activeTab === 'quiz' && (
            <QuizAndFlashcardsView 
              initialCourseId={navExtra?.courseId} 
              initialSubtab={navExtra?.subtab} 
            />
          )}
          {activeTab === 'planner' && <PlannerAndExamsView />}
          {activeTab === 'profile' && <ProfileView />}
          {activeTab === 'admin' && <AdminDashboardView />}
        </main>

        {/* Sticky Bottom Navigation Bar */}
        <nav className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-2 flex items-center justify-around z-30 pb-safe shadow-lg">
          <button
            onClick={() => handleNavigate('home')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'home'
                ? 'text-blue-600 font-extrabold scale-105'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Home className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('navHome')}</span>
          </button>

          <button
            onClick={() => handleNavigate('courses')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'courses'
                ? 'text-blue-600 font-extrabold scale-105'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('navCourses')}</span>
          </button>

          {/* AI Assistant Tab */}
          <button
            onClick={() => handleNavigate('assistant')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'assistant'
                ? 'text-purple-600 font-extrabold scale-105'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Bot className="w-5 h-5 text-purple-600" />
            <span className="text-[10px] mt-0.5">{t('navAssistant')}</span>
          </button>

          <button
            onClick={() => handleNavigate('quiz')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'quiz'
                ? 'text-blue-600 font-extrabold scale-105'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Layers className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('navQuiz')}</span>
          </button>

          <button
            onClick={() => handleNavigate('planner')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'planner'
                ? 'text-blue-600 font-extrabold scale-105'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <Calendar className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('navPlanner')}</span>
          </button>

          <button
            onClick={() => handleNavigate('profile')}
            className={`flex flex-col items-center py-1 px-3 rounded-xl transition-all ${
              activeTab === 'profile'
                ? 'text-blue-600 font-extrabold scale-105'
                : 'text-slate-500 hover:text-slate-800 font-medium'
            }`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('navProfile')}</span>
          </button>
        </nav>

        {/* Global Modals */}
        <CelebrationModal />
        <SubscriptionModal />
        <AvatarPickerModal
          isOpen={showAvatarPicker}
          onClose={() => setShowAvatarPicker(false)}
        />
      </div>
    </div>
  );
};
