import React, { useState } from 'react';
import { Play, CheckCircle2, XCircle, Clock, ShieldCheck, X } from 'lucide-react';
import { api } from '../../services/api.ts';

interface QATestRunnerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QATestRunnerModal: React.FC<QATestRunnerModalProps> = ({ isOpen, onClose }) => {
  const [running, setRunning] = useState<boolean>(false);
  const [report, setReport] = useState<{
    summary: { total: number; passed: number; failed: number; passRatePercent: number; timestamp: string };
    tests: Array<{ name: string; category: string; passed: boolean; durationMs: number; details: string }>;
  } | null>(null);

  if (!isOpen) return null;

  const handleRunSuite = async () => {
    setRunning(true);
    try {
      const res = await api.runQaTestSuite();
      setReport(res);
    } catch (err) {
      console.error('QA Test execution failed:', err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-white">Rapport de Tests & QA STUDIA AI</h2>
              <p className="text-xs text-slate-400">Validation automatique des modules fonctionnels</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {!report && !running && (
            <div className="text-center py-8">
              <p className="text-sm text-slate-600 mb-4">
                Cliquez ci-dessous pour exécuter la batterie de tests d'intégration (authentification, base de données, algorithme Leitner, calculs de progression, abonnements 48h et API Gemini).
              </p>
              <button
                onClick={handleRunSuite}
                className="py-3 px-6 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-2xl shadow-md shadow-blue-500/20 inline-flex items-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Exécuter tous les tests</span>
              </button>
            </div>
          )}

          {running && (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-sm font-bold text-slate-800">Exécution de la suite de tests QA en cours...</div>
              <div className="text-xs text-slate-500">Vérification de la conformité du code et des données</div>
            </div>
          )}

          {report && !running && (
            <div className="space-y-4">
              {/* Summary card */}
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl text-center">
                <div>
                  <div className="text-xs text-slate-500 font-medium">Tests Exécutés</div>
                  <div className="text-xl font-extrabold text-slate-900">{report.summary.total}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Succès</div>
                  <div className="text-xl font-extrabold text-emerald-600">{report.summary.passed}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500 font-medium">Taux de réussite</div>
                  <div className="text-xl font-extrabold text-blue-600">{report.summary.passRatePercent}%</div>
                </div>
              </div>

              {/* List of tests */}
              <div className="space-y-2">
                {report.tests.map((test, index) => (
                  <div
                    key={index}
                    className="p-3 bg-white border border-slate-100 rounded-xl flex items-start justify-between gap-3 shadow-xs hover:border-slate-200"
                  >
                    <div className="flex items-start gap-2.5">
                      {test.passed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                          <span>{test.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-normal">
                            {test.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{test.details}</div>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 shrink-0">
                      <Clock className="w-3 h-3" />
                      {test.durationMs}ms
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center">
                <button
                  onClick={handleRunSuite}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Ré-exécuter les tests</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
