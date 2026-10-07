import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import { 
  ShieldCheck, 
  Wallet, 
  FileText, 
  Upload, 
  History, 
  LayoutDashboard, 
  CheckSquare, 
  BookOpen, 
  Receipt, 
  Users, 
  LogOut, 
  Menu, 
  X,
  UserCheck
} from 'lucide-react';

export default function Navbar({ activeRoute, onNavigate, onOpenSupabaseModal }) {
  const { user, isAdmin, isMember, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isConnected = isSupabaseConfigured();

  const handleNavClick = (route) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  const adminNavItems = [
    { id: '/admin/overview', label: 'Overview', icon: LayoutDashboard },
    { id: '/admin/approvals', label: 'Approvals Queue', icon: CheckSquare },
    { id: '/admin/collections', label: 'Collections Ledger', icon: BookOpen },
    { id: '/admin/expenses', label: 'Expense Ledger', icon: Receipt },
    { id: '/admin/users', label: 'User Accounts', icon: Users },
  ];

  const memberNavItems = [
    { id: '/member/record', label: 'Record Collection', icon: Wallet },
    { id: '/member/upload', label: 'Submit Expense Bill', icon: Upload },
    { id: '/member/history', label: 'My Book & History', icon: History },
  ];

  const currentNavItems = isAdmin ? adminNavItems : memberNavItems;

  return (
    <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <div 
              onClick={() => onNavigate(isAdmin ? '/admin/overview' : '/member/record')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-900/30 group-hover:scale-105 transition shrink-0">
                <ShieldCheck className="w-5 h-5 text-slate-950 font-bold" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base tracking-tight text-white">Srikainari Ulsavam 2026</span>
                  <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Ledger
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                  Expense &amp; Collection Management
                </p>
              </div>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center space-x-1">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/80 border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Actions & User Profile */}
          <div className="flex items-center gap-3">
            {/* Profile & Logout */}
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-bold text-slate-100">{user?.full_name || user?.username}</div>
                <div className="text-[10px] text-slate-400 uppercase font-semibold tracking-wider">
                  {isAdmin ? 'Treasurer / Admin' : 'Field Collector'}
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                title="Logout"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile menu toggle */}
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-900 border-b border-slate-800 px-4 pt-2 pb-4 space-y-2 animate-in slide-in-from-top duration-150">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <p className="text-sm font-bold text-white">{user?.full_name || user?.username}</p>
              <p className="text-xs text-slate-400">{user?.role === 'ADMIN' ? 'Admin Portal' : 'Member Portal'}</p>
            </div>
          </div>

          <div className="space-y-1 pt-1">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition cursor-pointer ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
