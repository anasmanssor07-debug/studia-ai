import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy, Award, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';

export const CelebrationModal: React.FC = () => {
  const { celebrationData, setCelebrationData, user } = useAuth();
  const { t } = useLanguage();

  useEffect(() => {
    if (celebrationData.isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563EB', '#8B5CF6', '#16A34A', '#F59E0B'],
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [celebrationData.isOpen]);

  if (!celebrationData.isOpen) return null;

  const handleClose = () => {
    setCelebrationData((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 text-center overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-16 -left-16 w-36 h-36 bg-blue-100 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-36 h-36 bg-purple-100 rounded-full blur-2xl pointer-events-none" />

        {/* Trophy / Star Icon */}
        <div className="relative mx-auto mb-4 w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
          <Trophy className="w-8 h-8 animate-bounce" />
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 mb-2">
          {celebrationData.title}
        </h3>

        <p className="text-sm text-slate-600 leading-relaxed mb-5">
          {celebrationData.subtitle}
        </p>

        {/* Stats Pill Card */}
        <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-2xl mb-5 text-left">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium">XP Gagnés</span>
            <span className="text-lg font-extrabold text-blue-600 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-500" />
              +{celebrationData.xpEarned} XP
            </span>
          </div>

          <div className="flex flex-col border-l border-slate-200 pl-3">
            <span className="text-xs text-slate-500 font-medium">Temps d'étude</span>
            <span className="text-lg font-extrabold text-emerald-600 flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              {celebrationData.minutes || 1} min
            </span>
          </div>
        </div>

        {/* If an achievement was unlocked */}
        {celebrationData.achievement && (
          <div className="mb-5 p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-left flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">Succès Débloqué !</div>
              <div className="text-sm font-extrabold text-slate-900">{celebrationData.achievement.title}</div>
              <div className="text-xs text-slate-600">{celebrationData.achievement.description}</div>
            </div>
          </div>
        )}

        <button
          onClick={handleClose}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-semibold rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
        >
          <span>Continuer mes progrès</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
