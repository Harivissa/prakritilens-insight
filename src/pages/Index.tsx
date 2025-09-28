import { useState } from 'react';
import { LandingPage } from '@/components/LandingPage';
import { AuthPage } from '@/components/AuthPage';
import { Dashboard } from '@/components/Dashboard';

type AppState = 'landing' | 'auth' | 'dashboard';

const Index = () => {
  const [currentView, setCurrentView] = useState<AppState>('landing');

  const handleGetStarted = () => {
    setCurrentView('auth');
  };

  const handleLogin = () => {
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setCurrentView('landing');
  };

  const handleBackToLanding = () => {
    setCurrentView('landing');
  };

  switch (currentView) {
    case 'auth':
      return <AuthPage onLogin={handleLogin} onBack={handleBackToLanding} />;
    case 'dashboard':
      return <Dashboard onLogout={handleLogout} />;
    default:
      return <LandingPage onGetStarted={handleGetStarted} />;
  }
};

export default Index;
