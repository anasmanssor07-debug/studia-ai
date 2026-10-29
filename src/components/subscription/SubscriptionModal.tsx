import React, { useState, useEffect } from 'react';
import { 
  Check, 
  Zap, 
  Crown, 
  ShieldCheck, 
  X, 
  Sparkles, 
  Lock, 
  CreditCard,
  ArrowRight,
  Clock,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { PayzoneCheckoutModal } from './PayzoneCheckoutModal.tsx';
import { MySubscriptionView } from './MySubscriptionView.tsx';

export const SubscriptionModal: React.FC = () => {
  const { showSubscriptionModal, setShowSubscriptionModal, user, refreshUser } = useAuth();
  const [subData, setSubData] = useState<any>(null);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'tarifs' | 'mon_compte'>('tarifs');

  useEffect(() => {
    if (showSubscriptionModal) {
      api.getSubscriptionStatus().then((res) => {
        setSubData(res);
      }).catch(() => {});
    }
  }, [showSubscriptionModal]);

  if (!showSubscriptionModal) return null;

  const currentStatus = user?.subscription?.status || 'inactive';
  const isActive = currentStatus === 'active';
  const remainingTrialHours = subData?.remainingTrialHours || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white relative">
          <button
            onClick={() => setShowSubscriptionModal(false)}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-bold tracking-wider uppercase border border-blue-400/30 flex items-center gap-1">
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              STUDIA AI Premium
            </span>
            {user?.subscription?.tier === 'free_trial' && remainingTrialHours > 0 && (
              <span className="text-xs text-amber-300 font-medium">
                Essai découverte : {remainingTrialHours}h restantes
              </span>
            )}
          </div>

          <h2 className="text-2xl font-black tracking-tight">
            Réussissez tous vos semestres avec l'IA
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-md">
            Importez vos polycopiés PDF, générez des résumés exhaustifs fidèles à vos cours et testez-vous avec des quiz sur mesure.
          </p>

          {/* Subtabs: Tarifs vs Mon Abonnement */}
          <div className="flex items-center gap-2 mt-4 pt-2 border-t border-white/10">
            <button
              onClick={() => setActiveTab('tarifs')}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tarifs'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white bg-white/5'
              }`}
            >
              Offre & Tarifs
            </button>
            <button
              onClick={() => setActiveTab('mon_compte')}
              className={`py-1.5 px-3.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'mon_compte'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white bg-white/5'
              }`}
            >
              Mon Abonnement & Factures
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {activeTab === 'mon_compte' ? (
            <MySubscriptionView />
          ) : (
            <div className="space-y-4">
              {/* Premium Plan Highlight Box (40 MAD / mois) */}
              <div className="p-5 rounded-3xl border-2 border-blue-600 bg-gradient-to-b from-blue-50/50 to-white shadow-lg shadow-blue-500/5 relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider py-1 px-4 rounded-bl-2xl shadow-xs">
                  Offre Recommandée
                </div>

                <div className="flex items-center gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                    <Zap className="w-5 h-5 fill-current" />
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                      Formule Complète
                    </span>
                    <h3 className="text-xl font-black text-slate-900">Premium — 40 MAD / mois</h3>
                  </div>
                </div>

                {/* Price Display */}
                <div className="flex items-baseline gap-2 my-3">
                  <span className="text-4xl font-black text-slate-900 tracking-tight">40 DH</span>
                  <span className="text-sm font-semibold text-slate-500">/ mois (40 MAD TTC)</span>
                </div>

                <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                  Paiement sécurisé par carte bancaire marocaine (Payzone / CMI). Sans aucun engagement de durée : vous pouvez annuler à tout moment en un clic depuis votre espace.
                </p>

                {/* Inclusive Features List */}
                <div className="space-y-2 border-t border-slate-200/80 pt-3.5 mb-5 text-xs text-slate-700">
                  <div className="font-extrabold text-slate-900 mb-2">Tout ce qui est inclus :</div>
                  
                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Importation & analyse de cours :</strong> téléversez vos polycopiés PDF sans limite de taille.</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Génération de résumés par IA :</strong> synthèses exhaustives fidèles à 100% au document PDF.</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Générateur de quiz & mini-quiz :</strong> QCM corrigés avec explications détaillées des théorèmes.</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Assistant IA conversationnel :</strong> dialogue 24/7 pour comprendre chaque concept et formule.</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                    <span><strong>Accès permanent garanti :</strong> vos cours et documents créés restent consultables à vie.</span>
                  </div>
                </div>

                {/* Main Subscribe Button */}
                <button
                  type="button"
                  onClick={() => setShowCheckout(true)}
                  className="w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-sm shadow-lg shadow-blue-500/20 hover:shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>S'abonner maintenant — 40 DH / mois</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Trust Badges */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Paiement Sécurisé au Maroc (Payzone & CMI)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Paiement par carte bancaire marocaine (Attijariwafa, BCP, BMCE, CIH, BMCI, CDM, etc.) avec authentification 3D Secure. Vos transactions sont protégées par chiffrement cryptographique SHA-512.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <Lock className="w-3.5 h-3.5 text-slate-400" />
          <span>Transactions chiffrées de bout en bout • Facturation mensuelle sans engagement</span>
        </div>
      </div>

      {/* Payzone Checkout Modal */}
      <PayzoneCheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={async () => {
          await refreshUser();
          setActiveTab('mon_compte');
        }}
      />
    </div>
  );
};
