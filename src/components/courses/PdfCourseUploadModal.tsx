import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  Brain,
  Check
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { Course } from '../../types/index.ts';

import { extractTextFromPdfFile } from '../../utils/pdfExtractor.ts';

interface PdfCourseUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseCreated: (course: Course) => void;
}

export const PdfCourseUploadModal: React.FC<PdfCourseUploadModalProps> = ({
  isOpen,
  onClose,
  onCourseCreated,
}) => {
  const { setShowSubscriptionModal } = useAuth();
  const { language } = useLanguage();

  const [file, setFile] = useState<File | null>(null);
  const [base64Pdf, setBase64Pdf] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [processing, setProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setProcessing(false);
      setProcessingStep('');
      setProgressPercent(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const readBlobAsBase64 = (blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const handleFileSelect = async (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setError('Veuillez sélectionner un fichier au format PDF valide.');
      return;
    }
    if (selectedFile.size > 30 * 1024 * 1024) {
      setError('Le fichier dépasse la taille maximale autorisée (30 Mo).');
      return;
    }

    setError(null);
    setFile(selectedFile);
    if (!courseTitle) {
      setCourseTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_|-]/g, ' '));
    }

    // Fast background text pre-extraction
    extractTextFromPdfFile(selectedFile).then(({ text }) => {
      if (text) setExtractedText(text);
    }).catch(() => {});
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Veuillez sélectionner un fichier PDF depuis votre appareil.');
      return;
    }

    setProcessing(true);
    setError(null);
    setProgressPercent(20);
    setProcessingStep('1/3 - Extraction ultra-rapide du document...');

    try {
      // 1. Extract text if not already done
      let text = extractedText;
      if (!text) {
        const extracted = await extractTextFromPdfFile(file);
        text = extracted.text;
        setExtractedText(text);
      }

      setProgressPercent(50);
      setProcessingStep('2/3 - Détection du module & structuration stricte...');

      let b64 = base64Pdf;
      // Only convert to base64 if text couldn't be extracted from the PDF streams
      if (!text || text.length < 150) {
        if (!b64) {
          b64 = await readBlobAsBase64(file);
          setBase64Pdf(b64);
        }
      }

      setProgressPercent(80);
      const res = await api.createCourseFromPdf({
        title: courseTitle.trim() || undefined,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        pdfBase64: b64 || undefined,
        textContent: text || undefined,
        language,
      });

      setProgressPercent(100);
      setProcessingStep('3/3 - Finalisation du cours et des chapitres...');
      
      setTimeout(() => {
        onCourseCreated(res.course);
        onClose();
      }, 300);
    } catch (err: any) {
      console.error('PDF course upload error:', err);
      if (err.message && err.message.includes('expiré')) {
        setShowSubscriptionModal(true);
      } else {
        setError(err.message || 'Erreur lors de l’analyse et de la détection du module.');
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">
                Importer un cours depuis un PDF
              </h3>
              <p className="text-xs text-slate-500">
                Détection automatique du module & résumé fidèle
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={processing}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="py-4 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* AI Module Detection Notice */}
          <div className="p-3.5 bg-indigo-50/90 border border-indigo-200/80 rounded-2xl flex items-start gap-2.5">
            <Brain className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
            <div className="text-xs text-indigo-950">
              <span className="font-extrabold block text-indigo-900">
                Reconnaissance automatique du module par STUDIA AI :
              </span>
              Vous n'avez pas besoin de choisir la matière : l'IA analyse l'en-tête et le contenu du document pour reconnaître et classifier automatiquement le module exact (Algorithmique, Mathématiques, Droit, Économie, etc.).
            </div>
          </div>

          {/* Strict AI Guarantee Badge */}
          <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950">
              <span className="font-bold text-blue-900">
                Garantie de fidélité 100% stricte :
              </span>{' '}
              Le résumé est produit exclusivement à partir du contenu de votre PDF, sans aucune source extérieure.
            </div>
          </div>

          {/* PDF Drag & Drop Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Fichier PDF du cours
            </label>
            <input
              type="file"
              ref={fileInputRef}
              accept=".pdf,application/pdf"
              onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
              className="hidden"
            />

            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className={`p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-center flex flex-col items-center justify-center gap-2.5 ${
                file
                  ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950'
                  : 'border-blue-300 hover:border-blue-600 bg-blue-50/30 hover:bg-blue-50/60 text-slate-700'
              }`}
            >
              {file ? (
                <>
                  <CheckCircle2 className="w-9 h-9 text-emerald-600" />
                  <div className="text-xs font-extrabold text-slate-900">{file.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} Mo · Cliquez pour changer de fichier
                  </div>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-black text-slate-900">
                      Cliquez ici pour sélectionner votre cours PDF
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      ou glissez-déposez le fichier depuis votre appareil (jusqu'à 30 Mo)
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Optional Title Override */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Titre du cours (optionnel — l'IA le détectera s'il est vide)
            </label>
            <input
              type="text"
              value={courseTitle}
              onChange={(e) => setCourseTitle(e.target.value)}
              placeholder="Ex: Laisser vide pour détection automatique"
              className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-slate-50/50"
            />
          </div>

          {/* Processing Indicator */}
          {processing && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-3 text-center animate-fade-in shadow-lg">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold text-blue-300">{processingStep}</div>
              
              {/* Animated Progress Bar */}
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-700">
                <div
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full transition-all duration-300 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              <div className="text-[10px] text-slate-400">
                Traitement optimisé : identification instantanée du module et structuration stricte du support.
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={processing}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-2xl transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!file || processing}
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-98"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{processing ? 'Analyse en cours...' : 'Lancer l’analyse du PDF'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
