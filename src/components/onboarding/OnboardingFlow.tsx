import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  GraduationCap, 
  Compass, 
  Globe, 
  Target, 
  ArrowRight, 
  Check, 
  ChevronRight,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { AcademicLevel, StudyField, Language } from '../../types/index.ts';

export const OnboardingFlow: React.FC = () => {
  const { register, login } = useAuth();
  const { setLanguage: setAppLanguage } = useLanguage();

  const [step, setStep] = useState<number>(1);
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('engineering_school');
  const [studyField, setStudyField] = useState<StudyField>('computer_science');
  const [language, setLanguage] = useState<Language>('fr');
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState<number>(45);

  const [name, setName] = useState<string>('Anas Manssor');
  const [email, setEmail] = useState<string>('anasmanssor07@gmail.com');
  const [password, setPassword] = useState<string>('studia2026');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const academicLevels: Array<{ id: AcademicLevel; title: string; subtitle: string }> = [
    { id: 'engineering_school', title: 'École d’Ingénieurs', subtitle: 'Classes prépa, cycle ingénieur, polytechnique' },
    { id: 'university', title: 'Université (Licence / Master)', subtitle: 'Faculté des Sciences, Droit, Économie' },
    { id: 'business_school', title: 'École de Commerce / Management', subtitle: 'ENCG, ISCAE, HEC, gestion' },
    { id: 'high_school', title: 'Lycée / Baccalauréat', subtitle: 'Sciences maths, physique, SVT, éco' },
    { id: 'medicine', title: 'Médecine & Pharmacie', subtitle: 'FMP, concours et études médicales' },
    { id: 'other', title: 'Autre formation / Autodidacte', subtitle: 'Formation continue ou certification' },
  ];

  const studyFields: Array<{ id: StudyField; label: string; icon: string }> = [
    { id: 'computer_science', label: 'Informatique & IA', icon: '💻' },
    { id: 'engineering', label: 'Génie & Sciences Industrielles', icon: '⚙️' },
    { id: 'business', label: 'Commerce & Finance', icon: '📊' },
    { id: 'mathematics', label: 'Mathématiques', icon: '📐' },
    { id: 'physics', label: 'Physique & Chimie', icon: '⚡' },
    { id: 'medicine', label: 'Médecine & Santé', icon: '🩺' },
    { id: 'law', label: 'Droit & Sciences Politiques', icon: '⚖️' },
    { id: 'languages', label: 'Langues & Littérature', icon: '🌍' },
  ];

  const languagesList: Array<{ id: Language; label: string; sub: string }> = [
    { id: 'fr', label: 'Français', sub: 'Langue universitaire courante' },
    { id: 'en', label: 'English', sub: 'International scientific & technical' },
    { id: 'ar', label: 'العربية', sub: 'دعم كامل للكتابة والواجهة من اليمين لليسار' },
  ];

  const dailyGoals = [15, 30, 45, 60];

  const handleNext = () => {
    if (step === 4) {
      setAppLanguage(language);
    }
    setStep((prev) => prev + 1);
  };

  const handleFinish = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (authMode === 'login') {
        await login(email, password);
      } else {
        await register({
          name,
          email,
          password,
          academicLevel,
          studyField,
          language,
          dailyGoalMinutes,
        });
      }
    } catch (err: any) {
      if (authMode === 'register') {
        // If account already exists, auto-attempt login
        try {
          await login(email, password);
          return;
        } catch {
          // fall through
        }
      }
      setError(err?.message || 'Erreur lors de l’authentification. Veuillez vérifier vos informations.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      await login('anasmanssor07@gmail.com', 'demo123');
    } catch (err: any) {
      setError('Impossible de lancer le profil démo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col min-h-[580px]">
        {/* Step indicator */}
        <div className="px-6 pt-6 pb-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'w-7 bg-blue-600'
                    : s < step
                    ? 'w-3 bg-blue-400'
                    : 'w-3 bg-slate-200'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-semibold text-slate-400">Étape {step}/6</span>
        </div>

        {/* Step 1: Welcome Screen */}
        {step === 1 && (
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div className="text-center pt-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/25 mb-6">
                <Sparkles className="w-10 h-10" />
              </div>

              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
                STUDIA AI
              </h1>
              <p className="text-sm font-semibold text-blue-600 mb-4">
                Apprends mieux. Progresse chaque jour.
              </p>
              <p className="text-sm text-slate-600 leading-relaxed px-4">
                Ton tuteur d'apprentissage intelligent qui t'aide à comprendre tes cours, réussir tes examens et construire de vraies habitudes de révision.
              </p>
            </div>

            <div className="space-y-3 pt-6">
              <button
                onClick={handleNext}
                className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Commencer la configuration</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              <button
                onClick={handleQuickDemo}
                className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors border border-slate-200"
              >
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Tester instantanément avec le compte démo Anas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMode('login');
                  setStep(6);
                }}
                className="w-full py-2 text-xs text-slate-500 hover:text-blue-600 font-semibold transition-colors text-center"
              >
                Déjà inscrit ? Se connecter
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Discover Features */}
        {step === 2 && (
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">
                Une IA conçue pour les études
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Découvre ce que STUDIA AI prépare pour ton semestre :
              </p>

              <div className="space-y-3">
                <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Analyse de Documents & Fiches</h4>
                    <p className="text-[11px] text-slate-600">Téléverse tes PDF de cours, reçois des synthèses claires et des explications étape par étape.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-purple-50/70 border border-purple-100 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Quiz & Répétition Espacée</h4>
                    <p className="text-[11px] text-slate-600">Flashcards Leitner et quiz interactifs avec corrections détaillées pour ne plus rien oublier.</p>
                  </div>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-100 rounded-2xl flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Target className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Examens Blancs & Planning</h4>
                    <p className="text-[11px] text-slate-600">Simulations chronométrées pour arriver confiant le jour J avec un compte à rebours personnalisé.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button
                onClick={handleNext}
                className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                <span>Continuer</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Academic Level */}
        {step === 3 && (
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">
                Ton niveau d'études
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Permet d'ajuster le niveau de rigueur et le vocabulaire des explications IA.
              </p>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {academicLevels.map((lvl) => (
                  <div
                    key={lvl.id}
                    onClick={() => setAcademicLevel(lvl.id)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      academicLevel === lvl.id
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{lvl.title}</div>
                      <div className="text-[11px] text-slate-500">{lvl.subtitle}</div>
                    </div>
                    {academicLevel === lvl.id && (
                      <Check className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleNext}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Suivant</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Preferred Language */}
        {step === 4 && (
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">
                Langue préférée
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Tu pourras changer de langue à tout moment dans tes paramètres.
              </p>

              <div className="space-y-3">
                {languagesList.map((lang) => (
                  <div
                    key={lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                      language === lang.id
                        ? 'border-blue-600 bg-blue-50/50'
                        : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-bold text-slate-900">{lang.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{lang.sub}</div>
                    </div>
                    {language === lang.id && (
                      <Check className="w-5 h-5 text-blue-600 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleNext}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Suivant</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 5: Daily Study Goal */}
        {step === 5 && (
          <div className="p-6 flex-1 flex flex-col justify-between">
            <div>
              <h2 className="text-2xl font-black text-slate-900 mb-1">
                Objectif de révision
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Combien de temps souhaites-tu étudier chaque jour ?
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {dailyGoals.map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setDailyGoalMinutes(mins)}
                    className={`p-5 rounded-2xl border-2 text-center transition-all ${
                      dailyGoalMinutes === mins
                        ? 'border-blue-600 bg-blue-50 text-blue-600 font-extrabold shadow-sm'
                        : 'border-slate-200 text-slate-700 font-semibold hover:border-slate-300'
                    }`}
                  >
                    <div className="text-2xl font-black">{mins}</div>
                    <div className="text-xs text-slate-500">minutes / jour</div>
                  </button>
                ))}
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-xs text-emerald-900">
                  Pas de pression ni de culpabilité : STUDIA AI s'adapte à ton rythme et détecte automatiquement tes matières depuis tes PDF.
                </p>
              </div>
            </div>

            <div className="pt-4">
              <button
                onClick={handleNext}
                className="w-full py-3.5 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>Finaliser mon profil</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* Step 6: Account Creation & Login */}
        {step === 6 && (
          <form onSubmit={handleFinish} className="p-6 flex-1 flex flex-col justify-between">
            <div>
              {/* Tab Selector */}
              <div className="flex bg-slate-100 p-1 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('register');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    authMode === 'register'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Inscription (48h gratuites)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                    authMode === 'login'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  Se connecter
                </button>
              </div>

              <h2 className="text-2xl font-black text-slate-900 mb-1">
                {authMode === 'register' ? 'Créer ton compte STUDIA AI' : 'Connexion à ton compte'}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                {authMode === 'register'
                  ? 'Active immédiatement tes 48 heures d’essai gratuit sans carte bancaire requise.'
                  : 'Accède à tes cours, résumés PDF et statistiques de révision.'}
              </p>

              {error && (
                <div className="p-3 mb-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Prénom & Nom</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                      placeholder="Ex: Anas Manssor"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Adresse Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="etudiant@universite.ac.ma"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mot de passe</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-[0.98] text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Authentification en cours...</span>
                ) : authMode === 'register' ? (
                  <>
                    <span>Activer mes 48h gratuites</span>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </>
                ) : (
                  <>
                    <span>Se connecter à STUDIA AI</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleQuickDemo}
                className="w-full py-2.5 text-xs text-slate-500 hover:text-blue-600 font-semibold transition-colors"
              >
                Ou continuer directement avec le profil démo pré-rempli
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
