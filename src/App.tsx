import React, { useState, useEffect } from 'react';
import { AppScreen, MainTab, UserProfile, Language, HistoryItem } from './types';
import { INITIAL_HISTORY } from './data/mockInitialHistory';
import { IOSWrapper } from './components/iOSWrapper';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AuthScreen } from './components/AuthScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { HomeScreen } from './components/HomeScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { ProfileScreen } from './components/ProfileScreen';
import {
  saveUserProfileToFirestore,
  fetchUserProfileFromFirestore,
  saveHistoryItemToFirestore,
  deleteHistoryItemFromFirestore,
  fetchUserHistoryFromFirestore,
} from './lib/db';

export function getUserIdFromIdentifier(identifier: string): string {
  if (!identifier) return `user_${Date.now()}`;
  const clean = identifier.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  return `user_${clean}`;
}

export default function App() {
  // Screen state
  const [screen, setScreen] = useState<AppScreen>(() => {
    const savedScreen = localStorage.getItem('eduethiopia_screen');
    return (savedScreen as AppScreen) || 'welcome';
  });

  const [mainTab, setMainTab] = useState<MainTab>('home');

  // Auth & Profile state
  const [authData, setAuthData] = useState<{
    method: 'email' | 'phone';
    identifier: string;
    userId?: string;
  }>({
    method: 'email',
    identifier: '',
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const savedUser = localStorage.getItem('eduethiopia_user');
    if (savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        // fallback
      }
    }
    return {
      id: '',
      name: '',
      email: '',
      phone: '',
      authMethod: 'email',
      ethiopianBirthday: { day: 1, month: 'Meskerem', year: 2005 },
      language: 'en',
      grade: 11,
      isPro: false,
    };
  });

  // History state
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const savedHist = localStorage.getItem('eduethiopia_history');
    if (savedHist) {
      try {
        return JSON.parse(savedHist);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_HISTORY;
  });

  // Synchronize localStorage & Firestore
  useEffect(() => {
    localStorage.setItem('eduethiopia_screen', screen);
  }, [screen]);

  useEffect(() => {
    if (user.id) {
      localStorage.setItem('eduethiopia_user', JSON.stringify(user));
      localStorage.setItem(`edu_user_${user.id}`, JSON.stringify(user));
      saveUserProfileToFirestore(user);
    }
  }, [user]);

  useEffect(() => {
    if (user.id) {
      localStorage.setItem('eduethiopia_history', JSON.stringify(history));
      localStorage.setItem(`edu_history_${user.id}`, JSON.stringify(history));
    }
  }, [history, user.id]);

  // Load from Firestore if user is logged in
  useEffect(() => {
    if (user.id) {
      Promise.all([
        fetchUserProfileFromFirestore(user.id),
        fetchUserHistoryFromFirestore(user.id),
      ]).then(([remoteUser, remoteHistory]) => {
        if (remoteHistory && remoteHistory.length > 0) {
          setHistory(remoteHistory);
        }
        if (remoteUser && remoteUser.name) {
          const histLen = remoteHistory ? remoteHistory.length : 0;
          const computedCount = Math.max(remoteUser.uploadCount || 0, histLen);
          setUser((prev) => ({
            ...prev,
            ...remoteUser,
            uploadCount: computedCount,
          }));
        }
      });
    }
  }, [user.id]);

  const handleLanguageToggle = () => {
    const nextLang: Language = user.language === 'en' ? 'am' : 'en';
    setUser((prev) => ({ ...prev, language: nextLang }));
  };

  const handleAuthSuccess = async (data: {
    method: 'email' | 'phone';
    identifier: string;
    mode: 'signup' | 'login';
  }) => {
    const userId = getUserIdFromIdentifier(data.identifier);
    setAuthData({ ...data, userId });

    // Try fetching from localStorage cache first for fast response
    const localSavedUserStr = localStorage.getItem(`edu_user_${userId}`);
    let localSavedUser: UserProfile | null = null;
    if (localSavedUserStr) {
      try {
        localSavedUser = JSON.parse(localSavedUserStr);
      } catch (e) {}
    }

    // Fetch existing user profile from Firestore
    const remoteUser = await fetchUserProfileFromFirestore(userId);
    const existingUser = remoteUser || localSavedUser;

    if (existingUser && existingUser.name) {
      // Auto grant PRO if admin account makieyosiyas83@gmail.com or eyosiyasmaki123
      const isAdmin = Boolean(
        data.identifier.toLowerCase().includes('makieyosiyas83@gmail.com') ||
        data.identifier.toLowerCase().includes('eyosiyasmaki123') ||
        (existingUser.email && (existingUser.email.toLowerCase().includes('makieyosiyas83@gmail.com') || existingUser.email.toLowerCase().includes('eyosiyasmaki123'))) ||
        (existingUser.name && existingUser.name.toLowerCase().includes('eyosiyasmaki123'))
      );
      if (isAdmin) {
        existingUser.isPro = true;
      }

      const remoteHistory = await fetchUserHistoryFromFirestore(userId);
      let historyItems: HistoryItem[] = [];
      if (remoteHistory && remoteHistory.length > 0) {
        historyItems = remoteHistory;
        setHistory(remoteHistory);
        localStorage.setItem('eduethiopia_history', JSON.stringify(remoteHistory));
        localStorage.setItem(`edu_history_${userId}`, JSON.stringify(remoteHistory));
      } else {
        const localHistStr = localStorage.getItem(`edu_history_${userId}`);
        if (localHistStr) {
          try {
            historyItems = JSON.parse(localHistStr);
            setHistory(historyItems);
            localStorage.setItem('eduethiopia_history', JSON.stringify(historyItems));
          } catch (e) {
            setHistory([]);
          }
        } else {
          setHistory([]);
          localStorage.removeItem('eduethiopia_history');
        }
      }

      // Ensure uploadCount reflects actual number of history items created
      const computedUploadCount = Math.max(existingUser.uploadCount || 0, historyItems.length);
      existingUser.uploadCount = computedUploadCount;

      // Existing user: restore profile & study history
      setUser(existingUser);
      localStorage.setItem('eduethiopia_user', JSON.stringify(existingUser));
      localStorage.setItem(`edu_user_${userId}`, JSON.stringify(existingUser));

      setScreen('main');
    } else {
      // New registration or incomplete profile -> onboarding
      setScreen('onboarding');
    }
  };

  const handleOnboardingComplete = (newProfile: UserProfile) => {
    setUser(newProfile);
    localStorage.setItem('eduethiopia_user', JSON.stringify(newProfile));
    localStorage.setItem(`edu_user_${newProfile.id}`, JSON.stringify(newProfile));
    saveUserProfileToFirestore(newProfile);
    setScreen('main');
  };

  const handleAddHistoryItem = (newItem: HistoryItem) => {
    setHistory((prev) => [newItem, ...prev]);
    if (user.id) {
      saveHistoryItemToFirestore(user.id, newItem);
    }
  };

  const handleDeleteHistoryItem = (id: string) => {
    setHistory((prev) => prev.filter((item) => item.id !== id));
    if (user.id) {
      deleteHistoryItemFromFirestore(user.id, id);
    }
  };

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    setUser((prev) => {
      const merged = { ...prev, ...updated };
      if (merged.id) {
        saveUserProfileToFirestore(merged);
      }
      return merged;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('eduethiopia_screen');
    localStorage.removeItem('eduethiopia_user');
    localStorage.removeItem('eduethiopia_history');
    setUser({
      id: '',
      name: '',
      email: '',
      phone: '',
      authMethod: 'email',
      ethiopianBirthday: { day: 1, month: 'Meskerem', year: 2005 },
      language: 'en',
      grade: 11,
      isPro: false,
      uploadCount: 0,
    });
    setHistory([]);
    setScreen('welcome');
    setMainTab('home');
  };

  return (
    <IOSWrapper
      activeTab={mainTab}
      onTabChange={setMainTab}
      showNav={screen === 'main'}
      language={user.language}
      onLanguageToggle={screen === 'main' ? handleLanguageToggle : undefined}
      title="EduEthiopia"
    >
      {screen === 'welcome' && (
        <WelcomeScreen
          onGetStarted={() => setScreen('auth')}
          language={user.language}
        />
      )}

      {screen === 'auth' && (
        <AuthScreen
          onSuccess={handleAuthSuccess}
          language={user.language}
        />
      )}

      {screen === 'onboarding' && (
        <OnboardingScreen
          initialAuth={authData}
          onComplete={handleOnboardingComplete}
          language={user.language}
        />
      )}

      {screen === 'main' && (
        <>
          {mainTab === 'home' && (
            <HomeScreen
              user={user}
              language={user.language}
              onAddHistoryItem={handleAddHistoryItem}
              onUpdateUser={handleUpdateUser}
              onSelectProfileTab={() => setMainTab('profile')}
            />
          )}

          {mainTab === 'history' && (
            <HistoryScreen
              history={history}
              language={user.language}
              onDeleteHistoryItem={handleDeleteHistoryItem}
            />
          )}

          {mainTab === 'profile' && (
            <ProfileScreen
              user={user}
              language={user.language}
              onUpdateUser={handleUpdateUser}
              onLogout={handleLogout}
            />
          )}
        </>
      )}
    </IOSWrapper>
  );
}
