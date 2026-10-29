import React, { useState, useEffect } from 'react';
import { 
  User, 
  Settings, 
  Award, 
  Flame, 
  Clock, 
  Sparkles, 
  Crown, 
  Languages, 
  Bell, 
  ShieldCheck, 
  LogOut, 
  Trash2, 
  BarChart2, 
  CheckCircle, 
  Lock,
  ChevronRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import { api } from '../../services/api.ts';
import { QATestRunnerModal } from '../qa/QATestRunnerModal.tsx';
import type { Achievement, WeeklyStudyMetric, Language } from '../../types/index.ts';

import { AvatarPickerModal } from './AvatarPickerModal.tsx';
import { RotateCcw, Camera } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, logout, updateProfile, resetStats, setShowSubscriptionModal } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [analytics, setAnalytics] = useState<any>(null);
  const [showQaModal, setShowQaModal] = useState<boolean>(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState<boolean>(false);
  const [showAvatarModal, setShowAvatarModal] = useState<boolean>(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [editingGoal, setEditingGoal] = useState<boolean>(false);
  const [goalInput, setGoalInput] = useState<number>(user?.dailyGoalMinutes || 45);
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const loadAnalytics = () => {
    api.getAnalyticsSummary().then(setAnalytics).catch(console.error);
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleGoalSave = async () => {
    await updateProfile({ dailyGoalMinutes: Number(goalInput) });
    setEditingGoal(false);
  };

  const handleLanguageChange = (newLang: Language) => {
    setLanguage(newLang);
    updateProfile({ language: newLang });
  };

  const handleResetStats = async () => {
    if (!confirm('Voulez-vous vraiment réinitialiser toutes les statistiques (XP, niveau, série, séances) à zéro ?')) return;
    try {
      await resetStats();
      loadAnalytics();
      setResetMessage('Toutes les statistiques ont été réinitialisées à zéro !');
      setTimeout(() => setResetMessage(null), 3000);
    } catch (e: any) {
      alert(e.message || 'Erreur lors de la réinitialisation.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm('Êtes-vous absolument certain de vouloir supprimer définitivement votre compte et vos données ?')) return;
    try {
      await api.deleteAccount();
      logout();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const tier = user?.subscription?.tier || 'free_trial';

  return (
    <div className="space-y-4 pb-12">
      {resetMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-2xl text-center animate-fade-in">
          {resetMessage}
        </div>
      )}

      {/* 1. Profile Header Card with Avatar & STUDIA AI Logo */}
      <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-2xs flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          {/* Avatar with click to edit */}
          <div 
            onClick={() => setShowAvatarModal(true)}
            className="relative group cursor-pointer shrink-0"
            title="Changer ma photo de profil"
          >
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-blue-600 shadow-md bg-slate-100">
              <img
                src={user?.avatarUrl || '/assets/aistudio/logo_studia_ai_a2b1aae5.png'}
                alt={user?.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/assets/aistudio/logo_studia_ai_a2b1aae5.png';
                }}
              />
            </div>
            <div className="absolute inset-0 bg-slate-900/60 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
              <Camera className="w-4 h-4" />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900">{user?.name}</h2>
              <img
                src="/assets/aistudio/logo_studia_ai_a2b1aae5.png"
                alt="Logo STUDIA AI"
                className="w-4 h-4 rounded-xs object-cover"
              />
              {user?.subscription?.status === 'active' && (
                <span className="px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 font-black text-[10px] tracking-wider uppercase shadow-xs flex items-center gap-1">
                  <Crown className="w-3 h-3 fill-slate-950" />
                  PREMIUM
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">{user?.email}</p>

            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                {user?.levelTitle || 'Nouveau Débutant'} (Niv. {user?.level || 1})
              </span>
              <span className="text-[10px] text-slate-400">
                {user?.academicLevel} · {user?.studyField}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center bg-slate-50 border border-slate-100 rounded-2xl p-2.5 min-w-[65px]">
          <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
          <span className="text-xs font-black text-slate-900 mt-0.5">{user?.streakDays || 0} j</span>
          <span className="text-[9px] text-slate-400">Série</span>
        </div>
      </div>

      {/* 2. Subscription Card (40 MAD / mois) */}
      <div className="p-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-3xl shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-bold mb-0.5">
            <Crown className="w-3.5 h-3.5" />
            <span>Formule Actuelle</span>
            {user?.subscription?.status === 'active' && (
              <span className="px-1.5 py-0.2 rounded-sm bg-emerald-500/20 text-emerald-300 text-[10px] border border-emerald-400/30">
                Active
              </span>
            )}
          </div>
          <h3 className="text-sm font-extrabold text-white">
            {user?.subscription?.status === 'active' 
              ? 'STUDIA AI Premium — 40 MAD / mois' 
              : user?.subscription?.status === 'cancelled'
              ? 'Abonnement Résilié (Accès Actif)'
              : 'Essai Gratuit Découverte (48h)'}
          </h3>
          <p className="text-[11px] text-slate-300 mt-0.5">
            {user?.subscription?.status === 'active' 
              ? 'Paiement Payzone validé. Tous les accès IA illimités sont débloqués.' 
              : 'Accédez à l’analyse de polycopiés PDF et quiz pour 40 DH/mois sans engagement.'}
          </p>
        </div>

        <button
          onClick={() => setShowSubscriptionModal(true)}
          className="shrink-0 py-2 px-3.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
        >
          {user?.subscription?.status === 'active' ? 'Gérer' : 'S’abonner (40 DH)'}
        </button>
      </div>

      {/* 3. Learning Analytics Snapshot */}
      {analytics && (
        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <span>{t('weeklyAnalytics')}</span>
            </h3>
            <span className="text-[11px] text-slate-400">Cette semaine</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5 text-center">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-semibold">Temps d'étude</div>
              <div className="text-base font-black text-slate-900 mt-0.5">
                {analytics.totalStudyMinutes} min
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-semibold">Séances validées</div>
              <div className="text-base font-black text-emerald-600 mt-0.5">
                {analytics.completedSessionsCount}
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="text-[10px] text-slate-500 font-semibold">Moyenne Quiz</div>
              <div className="text-base font-black text-purple-600 mt-0.5">
                {analytics.avgQuizScore}%
              </div>
            </div>
          </div>

          {/* Encouraging message */}
          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-900">
            🌱 Vous avez étudié davantage que la semaine précédente. Continuez à bâtir vos habitudes sans pression !
          </div>
        </div>
      )}

      {/* 4. Achievements Gallery */}
      {analytics?.achievements && (
        <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              <span>{t('achievements')}</span>
            </h3>
            <span className="text-[11px] text-slate-400">
              {analytics.achievements.filter((a: any) => a.unlocked).length} / {analytics.achievements.length} débloqués
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {analytics.achievements.map((ach: Achievement) => (
              <div
                key={ach.id}
                className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
                  ach.unlocked
                    ? 'bg-amber-50/40 border-amber-200'
                    : 'bg-slate-50/50 border-slate-100 opacity-60'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    ach.unlocked ? 'bg-amber-500 text-white shadow-xs' : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {ach.unlocked ? '🏆' : <Lock className="w-3.5 h-3.5" />}
                </div>

                <div>
                  <div className="text-xs font-bold text-slate-900">{ach.title}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{ach.description}</div>
                  <div className="text-[9px] font-bold text-amber-700 mt-1">+{ach.xpReward} XP</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Settings List */}
      <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-4">
        <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
          Préférences & Paramètres
        </h3>

        {/* Daily Goal Setting */}
        <div className="flex items-center justify-between text-xs py-1">
          <div>
            <div className="font-bold text-slate-800">Objectif quotidien</div>
            <div className="text-[11px] text-slate-500">Temps de révision visé chaque jour</div>
          </div>
          {editingGoal ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                min={10}
                max={180}
                value={goalInput}
                onChange={(e) => setGoalInput(Number(e.target.value))}
                className="w-16 px-2 py-1 text-xs border rounded-lg"
              />
              <button
                onClick={handleGoalSave}
                className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingGoal(true)}
              className="text-blue-600 font-bold hover:underline"
            >
              {user?.dailyGoalMinutes || 45} min
            </button>
          )}
        </div>

        {/* Language Selection */}
        <div className="flex items-center justify-between text-xs py-1 border-t border-slate-50">
          <div>
            <div className="font-bold text-slate-800">Langue de l'application</div>
            <div className="text-[11px] text-slate-500">Français, English ou العربية (RTL)</div>
          </div>
          <div className="flex items-center gap-1">
            {(['fr', 'en', 'ar'] as Language[]).map((lng) => (
              <button
                key={lng}
                onClick={() => handleLanguageChange(lng)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                  language === lng
                    ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {lng.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications toggle */}
        <div className="flex items-center justify-between text-xs py-1 border-t border-slate-50">
          <div>
            <div className="font-bold text-slate-800">Rappels bienveillants</div>
            <div className="text-[11px] text-slate-500">Notifications positives d'encouragement</div>
          </div>
          <button
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
            className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
              notificationsEnabled ? 'bg-blue-600' : 'bg-slate-300'
            }`}
          >
            <div
              className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform ${
                notificationsEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Reset Stats to Zero Option */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={handleResetStats}
            className="w-full py-2.5 px-4 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center justify-between transition-colors shadow-2xs"
          >
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span>Réinitialiser toutes les statistiques à zéro</span>
            </div>
            <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200/60 text-amber-800">
              0 XP / 0 j
            </span>
          </button>
        </div>

        {/* Subscription & Payzone Invoices Button */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="w-full py-2.5 px-4 rounded-2xl bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-xs font-bold flex items-center justify-between transition-colors shadow-2xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Crown className="w-4 h-4 text-blue-600" />
              <span>Gérer mon abonnement (40 MAD / mois) & Factures</span>
            </div>
            <ChevronRight className="w-4 h-4 text-blue-400" />
          </button>
        </div>

        {/* QA Automated Test Runner Button (14 Scenarios) */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => setShowQaModal(true)}
            className="w-full py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-between transition-colors shadow-xs cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Lancer les 14 Tests QA (Payzone, Sécurité & IA)</span>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        </div>

        {/* Privacy & Terms */}
        <div className="flex items-center justify-between text-xs pt-2 text-slate-500">
          <button
            onClick={() => setShowPrivacyModal(true)}
            className="hover:text-blue-600 underline"
          >
            Politique de confidentialité & RGPD
          </button>
          <span>STUDIA AI v1.0.0</span>
        </div>

        {/* Logout & Delete */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={logout}
            className="py-2 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>{t('logout')}</span>
          </button>

          <button
            onClick={handleDeleteAccount}
            className="py-2 px-3 text-xs font-bold text-rose-600 hover:text-rose-700 rounded-xl hover:bg-rose-50 flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>{t('deleteAccount')}</span>
          </button>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AvatarPickerModal isOpen={showAvatarModal} onClose={() => setShowAvatarModal(false)} />

      {/* QA Test Suite Modal */}
      <QATestRunnerModal isOpen={showQaModal} onClose={() => setShowQaModal(false)} />

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 max-h-[85vh] overflow-y-auto space-y-3">
            <h3 className="text-base font-extrabold text-slate-900">
              Politique de Confidentialité & Sécurité
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Chez STUDIA AI, la confidentialité et la souveraineté des données de chaque étudiant sont sacrées.
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4">
              <li>Vos documents de cours téléversés ne sont jamais partagés avec des tiers.</li>
              <li>Toutes les requêtes vers l'API Gemini 3.8 Flash sont anonymisées et traitées de manière sécurisée côté serveur.</li>
              <li>Aucune donnée bancaire n'est stockée en clair sur nos serveurs : les règlements passent par les passerelles bancaires accréditées (CMI Maroc, App Store, Google Play).</li>
              <li>Vous disposez d'un droit inconditionnel d'exportation et de suppression définitive de votre compte à tout moment.</li>
            </ul>
            <button
              onClick={() => setShowPrivacyModal(false)}
              className="w-full mt-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold"
            >
              Fermer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
