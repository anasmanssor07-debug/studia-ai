import React, { useState, useEffect } from 'react';
import { 
  Crown, 
  CreditCard, 
  Calendar, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  ShieldCheck, 
  ArrowRight, 
  XCircle,
  FileText
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.tsx';
import { api } from '../../services/api.ts';
import { PayzoneCheckoutModal } from './PayzoneCheckoutModal.tsx';
import type { PaymentTransaction } from '../../types/index.ts';

export const MySubscriptionView: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [subStatus, setSubStatus] = useState<any>(null);
  const [payments, setPayments] = useState<PaymentTransaction[]>([]);
  const [showCheckout, setShowCheckout] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const fetchStatusAndPayments = async () => {
    setLoading(true);
    try {
      const [statusRes, paymentsRes] = await Promise.all([
        api.getSubscriptionStatus(),
        api.getPaymentHistory(),
      ]);
      setSubStatus(statusRes);
      setPayments(paymentsRes.payments || []);
    } catch (err: any) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatusAndPayments();
  }, []);

  const handleCancelAutoRenew = async () => {
    if (!window.confirm('Voulez-vous vraiment désactiver le renouvellement automatique ? Vous conserverez votre accès complet jusqu’à la fin de la période déjà payée.')) {
      return;
    }
    setActionMessage(null);
    setActionError(null);
    try {
      const res = await api.cancelSubscription();
      setActionMessage(res.message);
      await refreshUser();
      await fetchStatusAndPayments();
    } catch (err: any) {
      setActionError(err.message || 'Impossible d’annuler le renouvellement.');
    }
  };

  const handleReactivate = async () => {
    setActionMessage(null);
    setActionError(null);
    try {
      const res = await api.reactivateSubscription();
      setActionMessage(res.message);
      await refreshUser();
      await fetchStatusAndPayments();
    } catch (err: any) {
      setActionError(err.message || 'Impossible de réactiver l’abonnement.');
    }
  };

  const currentSub = user?.subscription;
  const status = currentSub?.status || 'inactive';
  const isActive = status === 'active';
  const isCancelled = status === 'cancelled';
  const isExpired = status === 'expired';
  const isFailed = status === 'payment_failed';

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="space-y-5 animate-fade-in pb-12">
      {/* View Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Crown className="w-6 h-6 text-amber-500 fill-amber-500" />
            <span>Mon Abonnement STUDIA AI</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Gérez votre abonnement mensuel de 40 MAD, vos factures et votre moyen de paiement sécurisé.
          </p>
        </div>

        <button
          onClick={fetchStatusAndPayments}
          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          title="Actualiser"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {actionMessage && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Main Status Card */}
      <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-blue-300" />
                Formule Premium
              </span>

              {/* Status Badge */}
              {isActive && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  Abonnement Actif
                </span>
              )}
              {isCancelled && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-400/30 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  Renouvellement Annulé
                </span>
              )}
              {isExpired && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-400/30 flex items-center gap-1">
                  <XCircle className="w-3 h-3 text-rose-400" />
                  Abonnement Expiré
                </span>
              )}
              {isFailed && (
                <span className="px-2.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-400/30 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-rose-400" />
                  Paiement Échoué
                </span>
              )}
            </div>

            <h3 className="text-2xl font-black tracking-tight">
              STUDIA AI Premium — 40 MAD / mois
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-lg">
              Accès illimité aux résumés de polycopiés PDF, création de quiz automatiques et tuteur IA universitaire.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {(!isActive && !isCancelled) ? (
              <button
                onClick={() => setShowCheckout(true)}
                className="py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-extrabold text-sm shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>Payer 40 MAD (Payzone)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : isCancelled ? (
              <button
                onClick={handleReactivate}
                className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Réactiver le renouvellement
              </button>
            ) : (
              <button
                onClick={handleCancelAutoRenew}
                className="py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Annuler le renouvellement
              </button>
            )}
          </div>
        </div>

        {/* Detailed Period Dates Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block text-[11px]">Prix Mensuel</span>
            <span className="font-extrabold text-white text-sm">40 MAD / mois</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Date de début</span>
            <span className="font-bold text-slate-200">{formatDate(currentSub?.startDate)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Fin de la période payée</span>
            <span className="font-bold text-slate-200">{formatDate(currentSub?.currentPeriodEnd)}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[11px]">Prochain prélèvement</span>
            <span className="font-bold text-slate-200">
              {currentSub?.autoRenew && !currentSub?.cancelAtPeriodEnd
                ? formatDate(currentSub?.nextBillingDate)
                : 'Aucun (Annulé)'}
            </span>
          </div>
        </div>
      </div>

      {/* Retention Notice if Cancelled */}
      {isCancelled && currentSub?.currentPeriodEnd && (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Votre accès Premium reste actif !</span>
            <p className="mt-0.5 text-amber-800">
              Conformément à nos règles de transparence, votre accès aux fonctionnalités IA reste pleinement actif jusqu'au{' '}
              <strong>{formatDate(currentSub.currentPeriodEnd)}</strong>. Aucun montant ne sera prélevé par la suite.
            </p>
          </div>
        </div>
      )}

      {/* Payment History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h4 className="font-extrabold text-slate-900 text-sm">
              Historique des Transactions Payzone Maroc
            </h4>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {payments.length} transaction{payments.length > 1 ? 's' : ''}
          </span>
        </div>

        {payments.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <span>Aucune transaction enregistrée pour ce compte.</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Réf. Commande</th>
                  <th className="py-3 px-4">Montant</th>
                  <th className="py-3 px-4">Moyen de paiement</th>
                  <th className="py-3 px-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {payments.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 text-slate-900 font-semibold">
                      {formatDate(tx.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600">
                      {tx.orderId || tx.transactionRef}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {tx.amountMAD} {tx.currency}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {tx.paymentMethod} {tx.cardBrand ? `(${tx.cardBrand})` : ''}
                    </td>
                    <td className="py-3 px-4">
                      {tx.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[11px] border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          Payé & Validé
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold text-[11px] border border-rose-200">
                          <XCircle className="w-3 h-3" />
                          Échoué
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payzone Checkout Modal */}
      <PayzoneCheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onSuccess={() => {
          fetchStatusAndPayments();
        }}
      />
    </div>
  );
};
