import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  FileText, 
  Upload, 
  Trash2, 
  Sparkles, 
  CheckCircle, 
  Circle, 
  ChevronRight, 
  ArrowLeft,
  FileCheck,
  Brain,
  Layers,
  HelpCircle
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { Course, CourseDocument } from '../../types/index.ts';
import { PdfCourseUploadModal } from './PdfCourseUploadModal.tsx';

interface CoursesViewProps {
  initialCourseId?: string;
  openPdfModalTrigger?: boolean;
  onNavigate: (tab: string, extra?: any) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({ 
  initialCourseId, 
  openPdfModalTrigger, 
  onNavigate 
}) => {
  const { user, setShowSubscriptionModal } = useAuth();
  const { t, language } = useLanguage();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<'chapters' | 'documents' | 'summary'>('chapters');
  
  // Modals
  const [showAddCourse, setShowAddCourse] = useState<boolean>(false);
  const [showPdfModal, setShowPdfModal] = useState<boolean>(Boolean(openPdfModalTrigger));
  const [newTitle, setNewTitle] = useState<string>('');
  const [newSubject, setNewSubject] = useState<string>('Informatique');
  const [newDesc, setNewDesc] = useState<string>('');
  
  // Document upload modal
  const [showUploadDoc, setShowUploadDoc] = useState<boolean>(false);
  const [docTitle, setDocTitle] = useState<string>('');
  const [docContent, setDocContent] = useState<string>('');
  const [docFileType, setDocFileType] = useState<string>('pdf');
  
  // Chapter add
  const [showAddChapter, setShowAddChapter] = useState<boolean>(false);
  const [chapterTitle, setChapterTitle] = useState<string>('');
  
  // AI Summary state
  const [summaryData, setSummaryData] = useState<any>(null);
  const [generatingSummary, setGeneratingSummary] = useState<boolean>(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      const res = await api.getCourses();
      setCourses(res.courses);
      if (initialCourseId) {
        const found = res.courses.find((c) => c.id === initialCourseId);
        if (found) setSelectedCourse(found);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [initialCourseId]);

  useEffect(() => {
    if (openPdfModalTrigger) {
      setSelectedCourse(null);
      setShowPdfModal(true);
    }
  }, [openPdfModalTrigger]);

  useEffect(() => {
    if (selectedCourse?.documents && selectedCourse.documents.length > 0) {
      const doc = selectedCourse.documents[0];
      if (doc.summary || doc.detailedSummary) {
        setSummaryData({
          title: `Fiche de révision : ${selectedCourse.title}`,
          summary: doc.detailedSummary || doc.summary,
          keyConcepts: doc.keyConcepts || [],
          definitions: doc.definitions || [],
          formulasOrTheorems: doc.formulasOrTheorems || [],
          examTips: doc.examTips || [],
        });
      }
    } else {
      setSummaryData(null);
    }
  }, [selectedCourse]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle) return;
    try {
      const colors = ['#2563EB', '#8B5CF6', '#0EA5E9', '#10B981', '#F59E0B'];
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      const res = await api.createCourse({
        title: newTitle,
        subject: newSubject,
        description: newDesc,
        color: randomColor,
      });
      setCourses([res.course, ...courses]);
      setSelectedCourse(res.course);
      setShowAddCourse(false);
      setNewTitle('');
      setNewDesc('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !docTitle || !docContent) return;
    try {
      const res = await api.addDocument(selectedCourse.id, {
        title: docTitle,
        fileType: docFileType,
        fileSize: `${Math.round(docContent.length / 1024) || 12} KB`,
        content: docContent,
      });
      setSelectedCourse(res.course);
      setCourses(courses.map((c) => (c.id === res.course.id ? res.course : c)));
      setShowUploadDoc(false);
      setDocTitle('');
      setDocContent('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse || !chapterTitle) return;
    try {
      const res = await api.addChapter(selectedCourse.id, chapterTitle);
      setSelectedCourse(res.course);
      setCourses(courses.map((c) => (c.id === res.course.id ? res.course : c)));
      setShowAddChapter(false);
      setChapterTitle('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!selectedCourse) return;
    if (!confirm('Supprimer ce document ?')) return;
    try {
      const res = await api.deleteDocument(selectedCourse.id, docId);
      setSelectedCourse(res.course);
      setCourses(courses.map((c) => (c.id === res.course.id ? res.course : c)));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedCourse) return;
    setGeneratingSummary(true);
    setSummaryError(null);
    try {
      const res = await api.generateSummary({
        courseId: selectedCourse.id,
        language,
      });
      setSummaryData(res.result);
      setActiveTab('summary');
    } catch (err: any) {
      if (err.message && err.message.includes('expiré')) {
        setShowSubscriptionModal(true);
      }
      setSummaryError(err.message || 'Impossible de générer la fiche de révision.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  // If no course is selected, show courses list
  if (!selectedCourse) {
    return (
      <div className="space-y-4 pb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-slate-900">{t('coursesTitle')}</h1>
            <p className="text-xs text-slate-500">Gérez vos matières, cours et documents téléversés</p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPdfModal(true)}
              className="py-2 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Upload className="w-4 h-4" />
              <span>Importer un PDF</span>
            </button>
            <button
              onClick={() => setShowAddCourse(true)}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 border border-slate-200"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Créer</span>
            </button>
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-slate-100 p-6 space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-xs">
              <BookOpen className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">{t('noCoursesYet')}</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Ajoutez vos cours d'ingénierie, sciences ou gestion en téléversant directement un fichier PDF depuis votre appareil pour obtenir un résumé 100% exact.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setShowPdfModal(true)}
                className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-md shadow-blue-500/20"
              >
                <Upload className="w-4 h-4" />
                <span>Téléverser un cours PDF</span>
              </button>
              <button
                onClick={() => setShowAddCourse(true)}
                className="py-2.5 px-4 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Créer manuellement</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {courses.map((course) => (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className="p-4 bg-white rounded-2xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all cursor-pointer flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 font-bold text-xs shadow-xs"
                      style={{ backgroundColor: course.color }}
                    >
                      {course.title.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {course.subject}
                      </span>
                      <h3 className="text-sm font-extrabold text-slate-900 leading-snug">
                        {course.title}
                      </h3>
                      {course.description && (
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                          {course.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-xs font-bold text-slate-500">
                    {course.progressPercent}%
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-50">
                  <span>{course.chapters.length} chapitres · {course.documents.length} document{course.documents.length > 1 ? 's' : ''}</span>
                  <div className="flex items-center gap-1 text-blue-600 font-bold">
                    <span>Ouvrir</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal: Add Course */}
        {showAddCourse && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
            <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100">
              <h3 className="text-base font-extrabold text-slate-900 mb-3">Créer un nouveau cours</h3>
              <form onSubmit={handleCreateCourse} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Titre du cours</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Ex: Analyse Numérique & Algèbre"
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Matière / Domaine</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                  >
                    <option value="Informatique">Informatique</option>
                    <option value="Mathématiques">Mathématiques</option>
                    <option value="Physique">Physique</option>
                    <option value="Gestion & Économie">Gestion & Économie</option>
                    <option value="Médecine">Médecine</option>
                    <option value="Droit">Droit</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Description courte</label>
                  <textarea
                    rows={2}
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Objectifs, notions clés ou coefficients..."
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddCourse(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20"
                  >
                    Créer le cours
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Upload PDF Course with Strict AI Summary */}
        <PdfCourseUploadModal
          isOpen={showPdfModal}
          onClose={() => setShowPdfModal(false)}
          onCourseCreated={(c) => {
            setCourses([c, ...courses]);
            setSelectedCourse(c);
          }}
        />
      </div>
    );
  }

  // Course Detail View
  return (
    <div className="space-y-4 pb-8">
      {/* Top Bar with Back Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedCourse(null)}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-900 py-1.5 px-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Retour aux cours</span>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onNavigate('assistant', { courseId: selectedCourse.id })}
            className="py-1.5 px-3 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold border border-purple-200 flex items-center gap-1"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-600" />
            <span>Chat IA</span>
          </button>
          <button
            onClick={() => onNavigate('quiz', { courseId: selectedCourse.id })}
            className="py-1.5 px-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-200 flex items-center gap-1"
          >
            <Brain className="w-3.5 h-3.5 text-blue-600" />
            <span>Quiz</span>
          </button>
        </div>
      </div>

      {/* Course Banner */}
      <div
        className="p-5 rounded-3xl text-white shadow-md relative overflow-hidden"
        style={{ backgroundColor: selectedCourse.color }}
      >
        <span className="text-xs uppercase tracking-wider font-semibold opacity-80">
          {selectedCourse.subject}
        </span>
        <h1 className="text-lg font-black mt-0.5">{selectedCourse.title}</h1>
        {selectedCourse.description && (
          <p className="text-xs opacity-90 mt-1 max-w-md">{selectedCourse.description}</p>
        )}

        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-white/20 text-xs">
          <span>{selectedCourse.chapters.length} chapitres</span>
          <span>·</span>
          <span>{selectedCourse.documents.length} document{selectedCourse.documents.length > 1 ? 's' : ''}</span>
          <span>·</span>
          <span>Progression : {selectedCourse.progressPercent}%</span>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
        <button
          onClick={() => setActiveTab('chapters')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'chapters'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('chapters')} ({selectedCourse.chapters.length})
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
            activeTab === 'documents'
              ? 'bg-white text-slate-900 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {t('documents')} ({selectedCourse.documents.length})
        </button>

        <button
          onClick={() => setActiveTab('summary')}
          className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
            activeTab === 'summary'
              ? 'bg-white text-purple-700 shadow-2xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-3 h-3 text-purple-600" />
          <span>Fiche IA</span>
        </button>
      </div>

      {/* Tab 1: Chapters */}
      {activeTab === 'chapters' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600">Plan du cours</span>
            <button
              onClick={() => setShowAddChapter(true)}
              className="text-xs text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Ajouter un chapitre</span>
            </button>
          </div>

          {selectedCourse.chapters.length === 0 ? (
            <div className="p-6 bg-white rounded-2xl border border-slate-100 text-center text-xs text-slate-500">
              Aucun chapitre pour le moment. Cliquez sur "Ajouter un chapitre" pour organiser votre cours.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedCourse.chapters.map((ch, idx) => (
                <div
                  key={ch.id}
                  className="p-4 bg-white rounded-2xl border border-slate-100 shadow-2xs flex items-start justify-between gap-3"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-700 font-extrabold text-xs flex items-center justify-center shrink-0 border border-blue-100">
                      {idx + 1}
                    </span>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900">{ch.title}</h4>
                      {ch.summary && <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{ch.summary}</p>}
                      {ch.keyPoints && ch.keyPoints.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ch.keyPoints.map((pt, pIdx) => (
                            <span key={pIdx} className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                              • {pt}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {ch.completed ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-slate-300 shrink-0" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Documents */}
      {activeTab === 'documents' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-slate-600">Supports & Documents de cours</span>
            <button
              onClick={() => setShowUploadDoc(true)}
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Téléverser un document</span>
            </button>
          </div>

          {selectedCourse.documents.length === 0 ? (
            <div className="p-8 bg-white rounded-3xl border border-slate-100 text-center space-y-2">
              <FileText className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-xs font-bold text-slate-800">Aucun document téléversé</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                Téléversez vos polycopiés de cours, notes de TD ou diapositives pour permettre à STUDIA AI d'analyser le contenu.
              </p>
              <button
                onClick={() => setShowUploadDoc(true)}
                className="mt-2 py-2 px-3.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-xs font-bold inline-flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un document d'exemple</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {selectedCourse.documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3.5 bg-white rounded-2xl border border-slate-100 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-slate-900 truncate">{doc.title}</h4>
                      <p className="text-[10px] text-slate-400">
                        {doc.fileType.toUpperCase()} · {doc.fileSize}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onNavigate('assistant', { courseId: selectedCourse.id, documentId: doc.id })}
                      className="py-1 px-2.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-bold transition-colors flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Interroger</span>
                    </button>
                    <button
                      onClick={() => handleDeleteDocument(doc.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: AI Revision Sheet */}
      {activeTab === 'summary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <span>Fiche de révision intelligente</span>
              </h3>
              <p className="text-[11px] text-slate-500">Synthèse générée par l'IA basée sur vos documents</p>
            </div>

            <button
              onClick={handleGenerateSummary}
              disabled={generatingSummary}
              className="py-2 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-500/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{generatingSummary ? 'Génération...' : 'Régénérer'}</span>
            </button>
          </div>

          {summaryError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
              {summaryError}
            </div>
          )}

          {!summaryData && !generatingSummary && (
            <div className="p-8 bg-white rounded-3xl border border-slate-100 text-center space-y-3">
              <Sparkles className="w-10 h-10 text-purple-500 mx-auto" />
              <div className="text-xs font-bold text-slate-800">Aucune fiche encore générée</div>
              <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
                L'IA analyse l'intégralité de vos supports de cours pour extraire les théorèmes, les définitions et les pièges classiques d'examen.
              </p>
              <button
                onClick={handleGenerateSummary}
                className="py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-md inline-flex items-center gap-2"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Générer ma fiche maintenant</span>
              </button>
            </div>
          )}

          {generatingSummary && (
            <div className="p-12 bg-white rounded-3xl border border-slate-100 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="text-xs font-bold text-slate-800">STUDIA AI analyse le cours...</div>
              <div className="text-[11px] text-slate-500">Extraction des concepts clés et des formules</div>
            </div>
          )}

          {summaryData && !generatingSummary && (
            <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-2xs space-y-4">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black text-slate-900">{summaryData.title || selectedCourse.title}</h2>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    100% extrait du PDF
                  </span>
                </div>
                <div className="text-xs text-slate-700 mt-2.5 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-100 whitespace-pre-line font-normal">
                  {summaryData.summary}
                </div>
              </div>

              {/* Definitions Section */}
              {summaryData.definitions && summaryData.definitions.length > 0 && (
                <div className="p-4 bg-purple-50/70 border border-purple-100 rounded-2xl space-y-2">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-purple-600" />
                    <span>Définitions Rigoureuses du Support</span>
                  </h4>
                  <div className="space-y-1.5">
                    {summaryData.definitions.map((def: any, i: number) => {
                      const term = typeof def === 'string' ? def : def.term;
                      const definition = typeof def === 'string' ? '' : def.definition;
                      return (
                        <div key={i} className="bg-white p-2.5 rounded-xl border border-purple-100/80 text-xs">
                          <span className="font-extrabold text-purple-950">{term} : </span>
                          <span className="text-slate-700">{definition}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Key Concepts */}
              {summaryData.keyConcepts && summaryData.keyConcepts.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                  <h4 className="text-xs font-bold text-slate-800 mb-2 uppercase tracking-wider">Concepts Majeurs du Document</h4>
                  <div className="space-y-1.5">
                    {summaryData.keyConcepts.map((item: string, i: number) => (
                      <div key={i} className="text-xs text-slate-700 flex items-start gap-2">
                        <span className="text-blue-600 font-bold shrink-0">•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Formulas or Theorems */}
              {summaryData.formulasOrTheorems && summaryData.formulasOrTheorems.length > 0 && (
                <div className="p-4 bg-blue-50/80 border border-blue-100 rounded-2xl">
                  <h4 className="text-xs font-bold text-blue-900 mb-2 uppercase tracking-wider">Formules, Lois & Théorèmes Clés</h4>
                  <div className="space-y-1.5 text-xs text-blue-950 font-mono">
                    {summaryData.formulasOrTheorems.map((f: string, i: number) => (
                      <div key={i} className="bg-white/80 p-2.5 rounded-xl border border-blue-200/60 leading-relaxed">
                        {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Exam Tips */}
              {summaryData.examTips && summaryData.examTips.length > 0 && (
                <div className="p-4 bg-amber-50/80 border border-amber-100 rounded-2xl">
                  <h4 className="text-xs font-bold text-amber-900 mb-2 uppercase tracking-wider">Astuces & Pièges d'Examen Fréquents</h4>
                  <div className="space-y-1.5 text-xs text-amber-950">
                    {summaryData.examTips.map((tip: string, i: number) => (
                      <div key={i} className="flex items-start gap-2 bg-white/70 p-2 rounded-xl border border-amber-200/50">
                        <span className="text-amber-600 font-bold shrink-0">⚠️</span>
                        <span>{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal: Upload Document */}
      {showUploadDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Ajouter un document au cours</h3>
            <form onSubmit={handleUploadDocument} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom du document</label>
                <input
                  type="text"
                  required
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  placeholder="Ex: Polycopie_Chapitre_1.pdf"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Type de document</label>
                <select
                  value={docFileType}
                  onChange={(e) => setDocFileType(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                >
                  <option value="pdf">Document PDF</option>
                  <option value="docx">Word (.docx)</option>
                  <option value="pptx">PowerPoint (.pptx)</option>
                  <option value="txt">Fichier Texte (.txt)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contenu textuel du support</label>
                <textarea
                  rows={4}
                  required
                  value={docContent}
                  onChange={(e) => setDocContent(e.target.value)}
                  placeholder="Collez ici les notes, extraits du polycopié ou résumés de vos diapositives..."
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadDoc(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Téléverser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Chapter */}
      {showAddChapter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100">
            <h3 className="text-base font-extrabold text-slate-900 mb-3">Nouveau chapitre</h3>
            <form onSubmit={handleAddChapter} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre du chapitre</label>
                <input
                  type="text"
                  required
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="Ex: Chapitre 4 : Optimisation et Sémaphores"
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddChapter(false)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Ajouter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload PDF Course with Strict AI Summary */}
      <PdfCourseUploadModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        onCourseCreated={(c) => {
          setCourses([c, ...courses]);
          setSelectedCourse(c);
        }}
      />
    </div>
  );
};
