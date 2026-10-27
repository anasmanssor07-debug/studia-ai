import React, { useState, useRef } from 'react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  Sparkles, 
  X, 
  ShieldCheck, 
  AlertCircle, 
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { Course } from '../../types/index.ts';

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
  const [courseTitle, setCourseTitle] = useState<string>('');
  const [subject, setSubject] = useState<string>('Informatique');
  const [processing, setProcessing] = useState<boolean>(false);
  const [processingStep, setProcessingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    if (!selectedFile.name.toLowerCase().endsWith('.pdf') && selectedFile.type !== 'application/pdf') {
      setError('Veuillez sélectionner un fichier au format PDF.');
      return;
    }
    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('Le fichier dépasse la taille maximale autorisée (25 Mo).');
      return;
    }

    setError(null);
    setFile(selectedFile);
    if (!courseTitle) {
      setCourseTitle(selectedFile.name.replace(/\.[^/.]+$/, '').replace(/[_|-]/g, ' '));
    }

    const reader = new FileReader();
    reader.onload = () => {
      setBase64Pdf(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !base64Pdf) {
      setError('Veuillez charger un fichier PDF.');
      return;
    }

    setProcessing(true);
    setError(null);
    setProcessingStep('1/3 - Préparation du fichier PDF...');

    try {
      setProcessingStep('2/3 - Analyse stricte du contenu PDF par STUDIA AI...');
      
      const res = await api.createCourseFromPdf({
        title: courseTitle,
        subject,
        fileName: file.name,
        fileSize: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        pdfBase64: base64Pdf,
        language,
      });

      setProcessingStep('3/3 - Finalisation du cours et des fiches...');
      onCourseCreated(res.course);
      onClose();
    } catch (err: any) {
      console.error('PDF course upload error:', err);
      if (err.message && err.message.includes('expiré')) {
        setShowSubscriptionModal(true);
      } else {
        setError(err.message || 'Erreur lors de l’analyse du PDF.');
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
                Ajouter un cours depuis un PDF
              </h3>
              <p className="text-xs text-slate-500">
                Téléversez vos supports de cours pour une synthèse 100% fidèle
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

          {/* Strict AI Guarantee Badge */}
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-950">
              <span className="font-extrabold block text-blue-900">
                Garantie de Fidélité Absolue :
              </span>
              L'IA génère un résumé basé <span className="font-bold underline">strictement et uniquement</span> sur le contenu de votre PDF. Aucune information externe ou inventée n'est injectée.
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
              className={`p-6 rounded-2xl border-2 border-dashed cursor-pointer transition-all text-center flex flex-col items-center justify-center gap-2 ${
                file
                  ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950'
                  : 'border-slate-300 hover:border-blue-500 bg-slate-50/50 hover:bg-blue-50/30 text-slate-600'
              }`}
            >
              {file ? (
                <>
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  <div className="text-xs font-bold text-slate-900">{file.name}</div>
                  <div className="text-[11px] text-slate-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} Mo · Cliquez pour changer
                  </div>
                </>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-blue-600" />
                  <div className="text-xs font-bold text-slate-800">
                    Cliquez pour sélectionner votre fichier PDF
                  </div>
                  <div className="text-[11px] text-slate-400">
                    Ou glissez-déposez le fichier ici depuis votre appareil
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Course Metadata */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Titre du cours
              </label>
              <input
                type="text"
                value={courseTitle}
                onChange={(e) => setCourseTitle(e.target.value)}
                placeholder="Ex: Analyse Réelle & Topologie"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Matière / Discipline
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="Informatique">Informatique</option>
                <option value="Mathématiques">Mathématiques</option>
                <option value="Physique & Chimie">Physique & Chimie</option>
                <option value="Gestion & Finance">Gestion & Finance</option>
                <option value="Médecine & Pharmacie">Médecine & Pharmacie</option>
                <option value="Droit & Économie">Droit & Économie</option>
                <option value="Langues & Lettres">Langues & Lettres</option>
                <option value="Autre">Autre discipline</option>
              </select>
            </div>
          </div>

          {/* Processing Indicator */}
          {processing && (
            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2 text-center animate-fade-in">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold text-blue-300">{processingStep}</div>
              <div className="text-[10px] text-slate-400">
                Extraction stricte des théorèmes, définitions et chapitres sans extrapolation.
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
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-2xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{processing ? 'Analyse en cours...' : 'Créer et Résumer le PDF'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
