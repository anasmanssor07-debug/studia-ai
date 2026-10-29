import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Crown, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  Settings, 
  Play, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  ShieldCheck, 
  DollarSign, 
  FileText,
  Sliders,
  Clock
} from 'lucide-react';
import { api } from '../../services/api.ts';
import type { AdminMetrics, AdminConfig, PaymentTransaction } from '../../types/index.ts';

export const AdminDashboardView: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [config, setConfig] = useState<AdminConfig | null>(null);

  // Editable config state
  const [priceMAD, setPriceMAD] = useState<number>(40);
  const [cycleDays, setCycleDays] = useState<number>(30);
  const [aiLimit, setAiLimit] = useState<number>(100);
  const [configMessage, setConfigMessage] = useState<string | null>(null);

  // Test Suite state
  const [runningTests, setRunningTests] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<{
    summary: { total: number; passed: number; failed: number; passRatePercent: number; timestamp: string };
    tests: Array<{ name: string; category: string; passed: boolean; durationMs: number; details: string }>;
  } | null>(null);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminMetrics();
      setMetrics(res.metrics);
      setConfig(res.config);
      if (res.config) {
        setPriceMAD(res.config.premiumPriceMAD || 40);
        setCycleDays(res.config.billingCycleDays || 30);
        setAiLimit(res.config.aiDailyLimit || 100);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateAdminConfig({
        premiumPriceMAD: priceMAD,
        billingCycleDays: cycleDays,
        aiDailyLimit: aiLimit,
      });
      setConfig(res.config);
      setConfigMessage('Configuration mise à jour avec succès.');
      setTimeout(() => setConfigMessage(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Erreur lors de la mise à jour de la configuration.');
    }
  };

  const handleRunAllTests = async () => {
    setRunningTests(true);
    try {
      const results = await api.runQaTestSuite();
      setTestResults(results);
    } catch (err: any) {
      alert(err.message || 'Échec de l’exécution de la suite de tests.');
    } finally {
      setRunningTests(false);
    }
  };

  const failedTransactions = (metrics?.transactions || []).filter(tx => tx.status === 'failed');

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wider">
            Console Administrateur
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1 flex items-center gap-2">
            <Sliders className="w-6 h-6 text-blue-600" />
            <span>Gestion des Abonnements & Payzone Maroc</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Supervision financière, logs de transactions, configuration du tarif (40 MAD) et suite de tests QA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdminData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualiser</span>
          </button>

          <button
            onClick={handleRunAllTests}
            disabled={runningTests}
            className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${runningTests ? 'animate-pulse' : ''}`} />
            <span>{runningTests ? 'Exécution des 14 tests...' : 'Lancer les 14 Tests QA'}</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Metric 1: Total Revenue */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Revenus Collectés</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            {metrics?.totalRevenueMAD || 0} <span className="text-xs font-bold text-emerald-600">MAD</span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Revenu récurrent certifié</span>
        </div>

        {/* Metric 2: Active Subscribers */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Abonnés Premium Actifs</span>
            <Crown className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-600">
            {metrics?.activeSubscribers || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">40 MAD / mois en cours</span>
        </div>

        {/* Metric 3: Cancelled / Expired */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Résiliés / Expirés</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {(metrics?.cancelledSubscribers || 0) + (metrics?.expiredSubscribers || 0)}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Accès préservé jusqu'à terme</span>
        </div>

        {/* Metric 4: Failed Transactions */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Paiements Échoués</span>
            <AlertTriangle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">
            {metrics?.failedTransactionsCount || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Rejet CMI / 3D Secure</span>
        </div>
      </div>

      {/* QA Test Suite Results (if run) */}
      {testResults && (
        <div className="p-5 rounded-3xl bg-slate-900 text-white shadow-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="font-extrabold text-sm tracking-tight">
                Rapport d'Exécution des 14 Tests QA — Payzone & Sécurité
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30">
                {testResults.summary.passRatePercent}% Succès ({testResults.summary.passed}/{testResults.summary.total})
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
            {testResults.tests.map((t, idx) => (
              <div 
                key={idx}
                className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs flex items-start gap-2"
              >
                {t.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-slate-200 truncate">{t.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                    <span>{t.category}</span>
                    <span className="font-mono text-slate-500">{t.durationMs}ms</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Config Form and Failed Payments Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Admin Parameters & Pricing (1 Column) */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Settings className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900">
              Paramètres Tarifaires & Quotas
            </h3>
          </div>

          {configMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold">
              {configMessage}
            </div>
          )}

          <form onSubmit={handleSaveConfig} className="space-y-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Prix de l'abonnement mensuel (MAD)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="10"
                  max="1000"
                  value={priceMAD}
                  onChange={(e) => setPriceMAD(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <span className="absolute right-3.5 top-2.5 text-xs font-bold text-slate-400">MAD</span>
              </div>
              <span className="text-[10px] text-slate-400">Tarif officiel actuel : 40 MAD / mois</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cycle de facturation (en jours)
              </label>
              <input
                type="number"
                min="7"
                max="365"
                value={cycleDays}
                onChange={(e) => setCycleDays(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              <span className="text-[10px] text-slate-400">Standard mensuel : 30 jours</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Limite quotidienne de requêtes IA
              </label>
              <input
                type="number"
                min="10"
                max="500"
                value={aiLimit}
                onChange={(e) => setAiLimit(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              Enregistrer la configuration
            </button>
          </form>
        </div>

        {/* Failed Transactions Log (2 Columns) */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Journal des Incidents & Échecs de Paiement
              </h3>
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {failedTransactions.length} incident{failedTransactions.length > 1 ? 's' : ''}
            </span>
          </div>

          {failedTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <span>Aucun échec de paiement récent. Toutes les autorisations bancaires sont nominales.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Commande</th>
                    <th className="py-2.5 px-3">Montant</th>
                    <th className="py-2.5 px-3">Motif du refus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {failedTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-slate-900">
                        {new Date(tx.createdAt).toLocaleDateString('fr-FR')}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-500">
                        {tx.orderId}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-rose-600">
                        {tx.amountMAD} MAD
                      </td>
                      <td className="py-2.5 px-3 text-rose-700 text-[11px]">
                        {tx.failureReason || 'Refus bancaire standard'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
