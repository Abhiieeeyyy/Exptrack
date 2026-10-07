import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './auth/AuthContext';
import Navbar from './components/Navbar';
import SupabaseConfigModal from './components/SupabaseConfigModal';

// Pages
import Login from './pages/Login';
import RecordCollection from './pages/member/RecordCollection';
import UploadExpense from './pages/member/UploadExpense';
import MemberHistory from './pages/member/MemberHistory';

import AdminOverview from './pages/admin/AdminOverview';
import AdminApprovals from './pages/admin/AdminApprovals';
import AdminCollections from './pages/admin/AdminCollections';
import AdminExpenses from './pages/admin/AdminExpenses';
import AdminUsers from './pages/admin/AdminUsers';

function MainApp() {
  const { user, isAdmin, isMember } = useAuth();
  
  // Current route state
  const [currentRoute, setCurrentRoute] = useState(() => {
    return window.location.pathname !== '/' ? window.location.pathname : '/login';
  });

  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync route on login or role changes
  useEffect(() => {
    if (!user) {
      setCurrentRoute('/login');
    } else if (currentRoute === '/login' || currentRoute === '/') {
      setCurrentRoute(isAdmin ? '/admin/overview' : '/member/record');
    } else if (isMember && currentRoute.startsWith('/admin')) {
      setCurrentRoute('/member/record');
    }
  }, [user, isAdmin, isMember]);

  const handleNavigate = (route) => {
    setCurrentRoute(route);
    window.history.pushState({}, '', route);
  };

  const handleTriggerRefresh = () => {
    setRefreshKey(k => k + 1);
  };

  // If not authenticated, show Login screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
        <Login 
          onLoginSuccess={handleNavigate}
          onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        />
        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60">
          Srikainari Ulsavam 2026 &bull; Expense &amp; Collection Management System
        </footer>

        <SupabaseConfigModal
          isOpen={supabaseModalOpen}
          onClose={() => setSupabaseModalOpen(false)}
          onConfigSaved={handleTriggerRefresh}
        />
      </div>
    );
  }

  // Render active screen
  const renderScreen = () => {
    switch (currentRoute) {
      // Member Routes
      case '/member/record':
        return <RecordCollection onCollectionAdded={handleTriggerRefresh} />;
      case '/member/upload':
        return (
          <UploadExpense 
            onExpenseSubmitted={handleTriggerRefresh}
            onNavigateHistory={() => handleNavigate('/member/history')}
          />
        );
      case '/member/history':
        return <MemberHistory key={refreshKey} />;

      // Admin Routes
      case '/admin/overview':
        return <AdminOverview key={refreshKey} onNavigate={handleNavigate} />;
      case '/admin/approvals':
        return <AdminApprovals key={refreshKey} onApprovedOrRejected={handleTriggerRefresh} />;
      case '/admin/collections':
        return <AdminCollections key={refreshKey} />;
      case '/admin/expenses':
        return <AdminExpenses key={refreshKey} />;
      case '/admin/users':
        return <AdminUsers key={refreshKey} />;

      default:
        return isAdmin 
          ? <AdminOverview key={refreshKey} onNavigate={handleNavigate} /> 
          : <RecordCollection onCollectionAdded={handleTriggerRefresh} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FF] text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeRoute={currentRoute}
        onNavigate={handleNavigate}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {renderScreen()}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 text-xs text-center">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Srikainari Ulsavam 2026</span>
            <span>&bull; Official Event Ledger</span>
          </div>
        </div>
      </footer>

      {/* Global Supabase Modal */}
      <SupabaseConfigModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        onConfigSaved={handleTriggerRefresh}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
