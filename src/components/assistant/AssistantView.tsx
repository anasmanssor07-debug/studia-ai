import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  FileText, 
  Bot, 
  User, 
  BookOpen, 
  Languages, 
  Lightbulb, 
  AlertCircle,
  HelpCircle,
  RefreshCw,
  Crown,
  Zap,
  Clock
} from 'lucide-react';
import { api } from '../../services/api.ts';
import { useAuth } from '../../context/AuthContext.tsx';
import { useLanguage } from '../../context/LanguageContext.tsx';
import type { Course, CourseDocument, ChatMessage, UserUsageLimits } from '../../types/index.ts';

interface AssistantViewProps {
  initialCourseId?: string;
  initialDocumentId?: string;
}

export const AssistantView: React.FC<AssistantViewProps> = ({ initialCourseId, initialDocumentId }) => {
  const { user, setShowSubscriptionModal } = useAuth();
  const { t, language } = useLanguage();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>(initialCourseId || '');
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocumentId || '');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [usage, setUsage] = useState<UserUsageLimits | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      content: language === 'ar'
        ? 'مرحباً بك! أنا STUDIA AI، رفيقك ومساعدك الأكاديمي. اسألني عن أي مفهوم دراسي أو تمرين أو نظرية وسأشرحها لك خطوة بخطوة مع أمثلة واقعية.'
        : 'Bonjour ! Je suis STUDIA AI, ton tuteur académique. Pose-moi n’importe quelle question sur tes cours, des théorèmes ou des exercices et je t’expliquerai la démarche pas à pas avec des exemples concrets.',
      timestamp: new Date().toISOString(),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchUsage = () => {
    api.getUserUsage().then((res) => {
      if (res && res.usage) {
        setUsage(res.usage);
      }
    }).catch(console.error);
  };

  useEffect(() => {
    fetchUsage();
    api.getCourses().then((res) => {
      setCourses(res.courses);
      if (!selectedCourseId && res.courses.length > 0) {
        setSelectedCourseId(res.courses[0].id);
      }
    }).catch(console.error);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const currentCourse = courses.find((c) => c.id === selectedCourseId);
  const availableDocs: CourseDocument[] = currentCourse?.documents || [];

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-u`,
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setLoading(true);

    try {
      const res = await api.askAiAssistant({
        message: text,
        courseId: selectedCourseId || undefined,
        documentId: selectedDocId || undefined,
        targetLanguage: language,
      });

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-a`,
        sender: 'assistant',
        content: res.reply,
        timestamp: new Date().toISOString(),
        sourceDocTitle: res.sourceDocTitle,
      };

      setMessages((prev) => [...prev, aiMsg]);
      fetchUsage();
    } catch (err: any) {
      if (err.message && (err.message.includes('expiré') || err.message.includes('Limite quotidienne'))) {
        fetchUsage();
      }
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}-err`,
          sender: 'assistant',
          content: `⚠️ ${err.message || 'Impossible de joindre le service IA pour le moment.'}`,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickPrompt = (promptText: string) => {
    handleSendMessage(promptText);
  };

  const isFreePlanQuestionLimitReached = Boolean(
    usage && !usage.isPremium && !usage.isTrialActive && usage.aiQuestions.remainingToday <= 0
  );

  return (
    <div className="flex flex-col h-[calc(100vh-140px)] max-h-[720px] bg-white rounded-3xl border border-slate-100 shadow-xs overflow-hidden">
      {/* Real-time Usage Limits Banner */}
      {usage && !usage.isPremium && (
        <div className="px-3.5 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500 shrink-0" />
            <span>
              {usage.tier === 'free_trial' && usage.isTrialActive ? (
                <>Essai Découverte : <strong className="text-blue-700">{usage.trialHoursRemaining}h restantes</strong></>
              ) : (
                <>
                  Plan Gratuit : <strong className={usage.aiQuestions.remainingToday > 0 ? "text-blue-700" : "text-red-600 font-black"}>
                    {usage.aiQuestions.remainingToday}/{usage.aiQuestions.limit} questions restantes aujourd'hui
                  </strong> (réinitialisation à minuit)
                </>
              )}
            </span>
          </div>

          <button
            onClick={() => setShowSubscriptionModal(true)}
            className="flex items-center gap-1 py-1 px-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] shadow-xs cursor-pointer transition-all active:scale-95"
          >
            <Crown className="w-3 h-3 text-amber-300 fill-amber-300" />
            <span>Passer à Premium (40 MAD)</span>
          </button>
        </div>
      )}

      {/* Limit Reached Warning if 0 questions remaining today on Free Plan */}
      {isFreePlanQuestionLimitReached && (
        <div className="m-3 p-3 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-2.5 text-xs text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold text-red-900">Limite quotidienne de 5 questions atteinte</p>
            <p className="text-[11px] text-red-700 mt-0.5">
              Vos 5 questions gratuites seront réinitialisées à minuit (00:00). Pour continuer vos révisions sans limite, passez à STUDIA AI Premium (40 MAD/mois).
            </p>
            <button
              onClick={() => setShowSubscriptionModal(true)}
              className="mt-2 py-1 px-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>Débloquer les questions illimitées</span>
            </button>
          </div>
        </div>
      )}

      {/* Top Context Selector */}
      <div className="p-3 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
          <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
          <select
            value={selectedCourseId}
            onChange={(e) => {
              setSelectedCourseId(e.target.value);
              setSelectedDocId('');
            }}
            className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-blue-500 focus:outline-none"
          >
            <option value="">{t('allCourses')} (Connaissances générales)</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
        </div>

        {availableDocs.length > 0 && (
          <div className="flex items-center gap-1.5 min-w-[160px]">
            <FileText className="w-4 h-4 text-purple-600 shrink-0" />
            <select
              value={selectedDocId}
              onChange={(e) => setSelectedDocId(e.target.value)}
              className="bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs text-slate-800 font-medium focus:ring-1 focus:ring-purple-500 focus:outline-none max-w-[170px] truncate"
            >
              <option value="">Tous les documents du cours</option>
              {availableDocs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-xs ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-xs'
                }`}
              >
                {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-wrap ${
                  isUser
                    ? 'bg-blue-600 text-white rounded-tr-none'
                    : 'bg-slate-50 text-slate-800 border border-slate-100 rounded-tl-none shadow-2xs'
                }`}
              >
                {msg.content}

                {msg.sourceDocTitle && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200/80 text-[10px] text-purple-700 flex items-center gap-1 font-semibold">
                    <FileText className="w-3 h-3" />
                    <span>Basé sur le polycopié : {msg.sourceDocTitle}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <div className="w-5 h-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" />
            <span>STUDIA AI réfléchit et rédige sa réponse...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
        <button
          onClick={() => handleQuickPrompt('Explique ce concept comme si j’avais 12 ans, avec une analogie concrète.')}
          className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
        >
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>{t('explainSimple')}</span>
        </button>

        <button
          onClick={() => handleQuickPrompt('Donne-moi un exemple concret d’application réelle ou un cas pratique.')}
          className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
        >
          <span>Exemple pratique</span>
        </button>

        <button
          onClick={() => handleQuickPrompt('اشرح لي هذا المفهوم بالتفصيل باللغة العربية مع المصطلحات العلمية الدقيقة.')}
          className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
        >
          <Languages className="w-3 h-3 text-emerald-600" />
          <span>الشرح بالعربية</span>
        </button>

        <button
          onClick={() => handleQuickPrompt('Quels sont les pièges classiques ou erreurs fréquentes posées à l’examen sur ce sujet ?')}
          className="shrink-0 px-2.5 py-1 rounded-full bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1"
        >
          <span>Pièges à éviter</span>
        </button>
      </div>

      {/* Input box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (isFreePlanQuestionLimitReached) {
            setShowSubscriptionModal(true);
            return;
          }
          handleSendMessage();
        }}
        className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
      >
        <input
          type="text"
          disabled={isFreePlanQuestionLimitReached}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder={
            isFreePlanQuestionLimitReached 
              ? "Limite quotidienne de 5 questions atteinte (réinitialisation à minuit)" 
              : t('typeMessage')
          }
          className="flex-1 py-2.5 px-3.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none focus:bg-white transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        />

        {isFreePlanQuestionLimitReached ? (
          <button
            type="button"
            onClick={() => setShowSubscriptionModal(true)}
            className="py-2.5 px-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all active:scale-95 shrink-0 flex items-center gap-1 cursor-pointer"
          >
            <Crown className="w-3.5 h-3.5 text-amber-300" />
            <span>Passer à Premium</span>
          </button>
        ) : (
          <button
            type="submit"
            disabled={!inputMessage.trim() || loading}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl shadow-sm transition-all active:scale-95 shrink-0 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        )}
      </form>
    </div>
  );
};
