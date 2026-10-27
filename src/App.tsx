import React from 'react';
import { LanguageProvider } from './context/LanguageContext.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { OnboardingFlow } from './components/onboarding/OnboardingFlow.tsx';
import { MobileShell } from './components/layout/MobileShell.tsx';

function AppContent() {
  const { user, loading, isOnboarded } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center animate-pulse shadow-lg shadow-blue-500/30">
          <span className="text-xl font-black">S</span>
        </div>
        <div className="text-sm font-bold tracking-wider uppercase text-slate-400">
          STUDIA AI
        </div>
      </div>
    );
  }

  if (!isOnboarded || !user) {
    return <OnboardingFlow />;
  }

  return <MobileShell />;
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
