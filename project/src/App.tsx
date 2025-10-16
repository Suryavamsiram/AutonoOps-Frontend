import React, { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Navigation from './components/Navigation';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ChatPage from './pages/ChatPage';
import Dashboard from './pages/Dashboard';
import AdminPanel from './pages/AdminPanel';
import DailyJournalPage from './pages/DailyJournalPage';
import { Page } from './types';

function AppContent() {
  const { user } = useAuth();
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // If user is logged in, default to chat page
  React.useEffect(() => {
    if (user && (currentPage === 'login' || currentPage === 'signup')) {
      setCurrentPage('chat');
    }
  }, [user, currentPage]);

  // If user is not logged in, show auth pages
  if (!user) {
    if (authMode === 'signup') {
      return (
        <SignupPage onSwitchToLogin={() => setAuthMode('login')} />
      );
    }
    return (
      <LoginPage onSwitchToSignup={() => setAuthMode('signup')} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-teal-600/20"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/50 via-slate-900/50 to-slate-900"></div>
      
      <div className="relative z-10 flex min-h-screen">
        <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
        <div className="flex-1">
          {currentPage === 'chat' && <ChatPage />}
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'admin' && <AdminPanel />}
          {currentPage === 'journal' && <DailyJournalPage />}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;