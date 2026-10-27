import React, { useState, useEffect } from 'react';
import { Check, Zap, Crown, Shield, RefreshCw, X, Sparkles, Star } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';

export const SubscriptionModal: React.FC = () => {
  const { showSubscriptionModal, setShowSubscriptionModal, user, refreshUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedTier, setSelectedTier] = useState<'premium' | 'gold'>('premium');
  const [remainingTrialHours, setRemainingTrialHours] = useState<number>(0);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (showSubscriptionModal) {
      api.getSubscriptionStatus().then((res) => {
        setRemainingTrialHours(res.remainingTrialHours);
      }).catch(() => {});
    }
  }, [showSubscriptionModal]);

  if (!showSubscriptionModal) return null;

  const handleUpgrade = async (tier: 'premium' | 'gold') => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.upgradeSubscription(tier);
      await refreshUser();
      setMessage(res.message);
      setTimeout(() => {
        setShowSubscriptionModal(false);
      }, 1500);
    } catch (err: any) {
      setMessage(err.message || 'Erreur lors du traitement du paiement.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await api.restoreSubscription();
      await refreshUser();
      setMessage(res.message);
    } catch (err: any) {
      setMessage(err.message || 'Impossible de restaurer les achats.');
    } finally {
      setLoading(false);
    }
  };

  const currentTier = user?.subscription?.tier || 'free_trial';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white relative">
          <button
            onClick={() => setShowSubscriptionModal(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-1 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold tracking-wider uppercase border border-blue-400/30">
              Formules STUDIA AI
            </span>
            {currentTier === 'free_trial' && (
              <span className="text-xs text-amber-300 font-medium">
                Essai gratuit : {remainingTrialHours}h restantes
              </span>
            )}
          </div>

          <h2 className="text-2xl font-extrabold tracking-tight">
            Libère tout ton potentiel académique
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            Débloque l'Assistant IA illimité, les synthèses de documents et les examens corrigés.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {message && (
            <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 text-xs font-medium text-center">
              {message}
            </div>
          )}

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Premium Plan Card */}
            <div
              onClick={() => setSelectedTier('premium')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                selectedTier === 'premium'
                  ? 'border-blue-600 bg-blue-50/50 shadow-md shadow-blue-500/10'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xs font-bold text-blue-600 uppercase tracking-wider">Mensuel</div>
                  <h3 className="text-lg font-extrabold text-slate-900">Offre Premium</h3>
                </div>
                <Zap className="w-5 h-5 text-blue-600" />
              </div>

              <div className="flex items-baseline gap-1 my-2">
                <span className="text-2xl font-black text-slate-900">49 DH</span>
                <span className="text-xs text-slate-500">/ mois</span>
              </div>
              <div className="text-xs text-slate-600 mb-3">Sans engagement, résiliable à tout moment.</div>

              <ul className="text-xs text-slate-700 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Assistant IA illimité</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Documents PDF, Word & PPT</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span>Quiz & examens blancs corrigés</span>
                </li>
              </ul>
            </div>

            {/* Gold Annual Plan Card */}
            <div
              onClick={() => setSelectedTier('gold')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition-all relative ${
                selectedTier === 'gold'
                  ? 'border-purple-600 bg-purple-50/50 shadow-md shadow-purple-500/10'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-purple-600 text-white text-[10px] font-bold uppercase tracking-wide shadow-sm">
                Économisez 32%
              </div>

              <div className="flex justify-between items-start mb-2">
                <div>
                  <div className="text-xs font-bold text-purple-600 uppercase tracking-wider">Annuel</div>
                  <h3 className="text-lg font-extrabold text-slate-900">Offre Gold</h3>
                </div>
                <Crown className="w-5 h-5 text-amber-500" />
              </div>

              <div className="flex items-baseline gap-1 my-2">
                <span className="text-2xl font-black text-slate-900">400 DH</span>
                <span className="text-xs text-slate-500">/ an</span>
              </div>
              <div className="text-xs text-slate-600 mb-3">Soit seulement ~33 DH / mois pour l'année entière.</div>

              <ul className="text-xs text-slate-700 space-y-1.5">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Tous les avantages Premium</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Traitement IA haute priorité</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>Accompagnement 12 mois complets</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Secure Payment Assurance */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-600" />
              <span>Paiement sécurisé CMI Maroc & Store Billing</span>
            </div>
            <button
              onClick={handleRestore}
              disabled={loading}
              className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Restaurer</span>
            </button>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col gap-2">
          <button
            onClick={() => handleUpgrade(selectedTier)}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.99] transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <span>Validation du paiement en cours...</span>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Activer l'offre {selectedTier === 'premium' ? 'Premium (49 DH)' : 'Gold (400 DH)'}</span>
              </>
            )}
          </button>

          <p className="text-[11px] text-center text-slate-500">
            Aucun prélèvement automatique non consenti. Données protégées et conformes RGPD/CNDP.
          </p>
        </div>
      </div>
    </div>
  );
};
