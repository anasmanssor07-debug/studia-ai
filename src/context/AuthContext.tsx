import React, { createContext, useContext, useState, useEffect } from 'react';
import type { UserProfile, Achievement } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isOnboarded: boolean;
  setIsOnboarded: (val: boolean) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (params: any) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshUser: () => Promise<void>;
  resetStats: () => Promise<void>;
  // Live Study Session state
  isStudying: boolean;
  studyDurationSec: number;
  activeCourseId?: string;
  todayStudyMinutes: number;
  startStudySession: (courseId?: string) => void;
  finishStudySession: () => Promise<{ xpEarned: number; newLevel: number; streakDays: number; unlockedAchievement?: Achievement | null } | null>;
  addStudyMinutes: (minutes: number, courseId?: string) => Promise<void>;
  // Modal triggers
  showSubscriptionModal: boolean;
  setShowSubscriptionModal: (val: boolean) => void;
  celebrationData: {
    isOpen: boolean;
    title: string;
    subtitle: string;
    xpEarned: number;
    minutes?: number;
    achievement?: Achievement | null;
  };
  setCelebrationData: React.Dispatch<React.SetStateAction<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    xpEarned: number;
    minutes?: number;
    achievement?: Achievement | null;
  }>>;
}

const AuthContext = createContext<AuthContextType>({} as any);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    return localStorage.getItem('studia_onboarded') === 'true';
  });
  const [showSubscriptionModal, setShowSubscriptionModal] = useState<boolean>(false);
  const [celebrationData, setCelebrationData] = useState<{
    isOpen: boolean;
    title: string;
    subtitle: string;
    xpEarned: number;
    minutes?: number;
    achievement?: Achievement | null;
  }>({
    isOpen: false,
    title: '',
    subtitle: '',
    xpEarned: 0,
    minutes: 0,
    achievement: null,
  });

  // Active study timer & minutes
  const [isStudying, setIsStudying] = useState<boolean>(false);
  const [studyDurationSec, setStudyDurationSec] = useState<number>(0);
  const [activeCourseId, setActiveCourseId] = useState<string | undefined>(undefined);
  const [todayStudyMinutes, setTodayStudyMinutes] = useState<number>(0);

  const fetchCurrentUser = async () => {
    try {
      setLoading(true);
      const res = await api.getMe();
      setUser(res.user);
      setIsOnboarded(true);
      localStorage.setItem('studia_onboarded', 'true');

      // Fetch today's accumulated study minutes
      try {
        const summary = await api.getAnalyticsSummary();
        if (summary && typeof summary.todayStudyMinutes === 'number') {
          setTodayStudyMinutes(summary.todayStudyMinutes);
        }
      } catch (sumErr) {
        // Non-critical
      }
    } catch (err) {
      console.warn('No active session, defaulting to demo user initialization');
      // If server is available, attempt to initialize demo user
      try {
        const res = await api.login('anasmanssor07@gmail.com', 'demo123');
        localStorage.setItem('studia_token', res.token);
        setUser(res.user);
        setIsOnboarded(true);
        localStorage.setItem('studia_onboarded', 'true');

        const summary = await api.getAnalyticsSummary();
        if (summary && typeof summary.todayStudyMinutes === 'number') {
          setTodayStudyMinutes(summary.todayStudyMinutes);
        }
      } catch (e) {
        setUser(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Timer tick for active study session
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isStudying) {
      timer = setInterval(() => {
        setStudyDurationSec((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isStudying]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem('studia_token', res.token);
    setUser(res.user);
    setIsOnboarded(true);
    localStorage.setItem('studia_onboarded', 'true');
  };

  const register = async (params: any) => {
    const res = await api.register(params);
    localStorage.setItem('studia_token', res.token);
    setUser(res.user);
    setIsOnboarded(true);
    localStorage.setItem('studia_onboarded', 'true');
  };

  const logout = () => {
    localStorage.removeItem('studia_token');
    localStorage.removeItem('studia_onboarded');
    setUser(null);
    setIsOnboarded(false);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!user) return;
    const res = await api.updateProfile(updates);
    setUser(res.user);
  };

  const refreshUser = async () => {
    try {
      const res = await api.getMe();
      setUser(res.user);
    } catch (e) {
      console.error('Failed to refresh user:', e);
    }
  };

  const startStudySession = (courseId?: string) => {
    setIsStudying(true);
    setStudyDurationSec(0);
    setActiveCourseId(courseId);
  };

  const finishStudySession = async () => {
    if (!isStudying) return null;
    const minutes = Math.max(1, Math.round(studyDurationSec / 60));
    setIsStudying(false);
    setStudyDurationSec(0);

    try {
      const res = await api.logStudySession(minutes, activeCourseId);
      setUser(res.user);
      if (typeof res.todayStudyMinutes === 'number') {
        setTodayStudyMinutes(res.todayStudyMinutes);
      } else {
        setTodayStudyMinutes((prev) => prev + minutes);
      }
      
      setCelebrationData({
        isOpen: true,
        title: 'Excellente séance d’étude !',
        subtitle: `Tu as consacré ${minutes} minute${minutes > 1 ? 's' : ''} productive${minutes > 1 ? 's' : ''} à ton apprentissage aujourd’hui.`,
        xpEarned: res.xpEarned,
        minutes,
        achievement: res.unlockedAchievement || null,
      });

      return res;
    } catch (err) {
      console.error('Error logging study session:', err);
      return null;
    }
  };

  const addStudyMinutes = async (minutes: number, courseId?: string) => {
    try {
      const res = await api.logStudySession(minutes, courseId);
      setUser(res.user);
      if (typeof res.todayStudyMinutes === 'number') {
        setTodayStudyMinutes(res.todayStudyMinutes);
      } else {
        setTodayStudyMinutes((prev) => prev + minutes);
      }

      setCelebrationData({
        isOpen: true,
        title: `+${minutes} minute${minutes > 1 ? 's' : ''} d’étude enregistrée${minutes > 1 ? 's' : ''} !`,
        subtitle: `Ton objectif quotidien et tes points d’expérience progressent.`,
        xpEarned: res.xpEarned,
        minutes,
        achievement: res.unlockedAchievement || null,
      });
    } catch (err) {
      console.error('Error adding study minutes:', err);
    }
  };

  const resetStats = async () => {
    try {
      const res = await api.resetStats();
      setUser(res.user);
      setTodayStudyMinutes(0);
    } catch (e) {
      console.error('Failed to reset stats:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isOnboarded,
        setIsOnboarded,
        login,
        register,
        logout,
        updateProfile,
        refreshUser,
        resetStats,
        isStudying,
        studyDurationSec,
        activeCourseId,
        todayStudyMinutes,
        startStudySession,
        finishStudySession,
        addStudyMinutes,
        showSubscriptionModal,
        setShowSubscriptionModal,
        celebrationData,
        setCelebrationData,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
