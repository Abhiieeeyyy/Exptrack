import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import Modal from '../../components/Modal';
import MoneyInput from '../../components/MoneyInput';
import confetti from 'canvas-confetti';
import { formatINR } from '../../lib/money';
import { 
  Users, 
  UserPlus, 
  Edit3, 
  ShieldCheck, 
  UserCheck, 
  Phone, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Search,
  Lock,
  RefreshCw,
  Copy,
  Check,
  User,
  Wallet,
  Coins,
  ArrowUpRight,
  BookOpen,
  ArrowDownLeft,
  Plus,
  Clock,
  History,
  Building,
  CreditCard,
  Banknote
} from 'lucide-react';

const generatePasskey = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomStr = '';
  for (let i = 0; i < 6; i++) {
    randomStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `EXP-${randomStr}`;
};

export default function AdminUsers() {
  const { user: currentUser, setUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [financeBalances, setFinanceBalances] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'finance'

  // Create Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState('COLLECTOR'); // 'COLLECTOR' | 'FINANCE'
  const [generatedPasskey, setGeneratedPasskey] = useState(() => generatePasskey());
  const [copiedPasskey, setCopiedPasskey] = useState(false);

  // Edit Modal state
  const [editModalUser, setEditModalUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('COLLECTOR');
  const [editPassword, setEditPassword] = useState('');
  const [copiedEditPasskey, setCopiedEditPasskey] = useState(false);

  // Credit Money Modal state
  const [creditModalUser, setCreditModalUser] = useState(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [creditMode, setCreditMode] = useState('BANK_TRANSFER');
  const [creditRef, setCreditRef] = useState('');
  const [creditNotes, setCreditNotes] = useState('');
  const [creditHistory, setCreditHistory] = useState([]);
  const [creditLoading, setCreditLoading] = useState(false);
  const [creditSaving, setCreditSaving] = useState(false);
  const [creditErrors, setCreditErrors] = useState({});

  const [actionLoading, setActionLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const [data, financeBals] = await Promise.all([
        api.getUsers(),
        api.getAllFinanceBalances()
      ]);
      setUsers(data || []);
      const balMap = {};
      (financeBals || []).forEach(b => {
        if (b.user?.id) balMap[b.user.id] = b;
      });
      setFinanceBalances(balMap);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleOpenCreateModal = () => {
    setNewUsername('');
    setNewFullName('');
    setNewPhone('');
    setNewRole('COLLECTOR');
    setGeneratedPasskey(generatePasskey());
    setCopiedPasskey(false);
    setErrors({});
    setCreateModalOpen(true);
  };

  const handleOpenEditModal = (u) => {
    setEditModalUser(u);
    setEditUsername(u.username || '');
    setEditFullName(u.full_name || '');
    setEditPhone(u.phone || '');
    setEditRole(u.role === 'FINANCE' ? 'FINANCE' : (u.role === 'ADMIN' ? 'ADMIN' : 'COLLECTOR'));
    setEditPassword('');
    setCopiedEditPasskey(false);
    setErrors({});
  };

  const handleOpenCreditModal = async (u) => {
    setCreditModalUser(u);
    setCreditAmount('');
    setCreditMode('BANK_TRANSFER');
    setCreditRef('');
    setCreditNotes('');
    setCreditErrors({});
    setCreditLoading(true);
    try {
      const hist = await api.getCreditHistory({ userId: u.id });
      setCreditHistory(hist || []);
    } catch (err) {
      console.error('Error loading credit history:', err);
    } finally {
      setCreditLoading(false);
    }
  };

  const handleRegeneratePasskey = () => {
    setGeneratedPasskey(generatePasskey());
    setCopiedPasskey(false);
  };

  const handleGenerateEditPasskey = () => {
    const key = generatePasskey();
    setEditPassword(key);
    setCopiedEditPasskey(false);
  };

  const handleCopyText = (text, isEdit = false) => {
    navigator.clipboard.writeText(text);
    if (isEdit) {
      setCopiedEditPasskey(true);
      setTimeout(() => setCopiedEditPasskey(false), 2500);
    } else {
      setCopiedPasskey(true);
      setTimeout(() => setCopiedPasskey(false), 2500);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!newUsername.trim() || newUsername.trim().length < 3) {
      setErrors({ username: 'Username must be at least 3 characters long' });
      return;
    }
    if (!generatedPasskey || generatedPasskey.length < 6) {
      setErrors({ passkey: 'Valid passkey is required (at least 6 characters)' });
      return;
    }

    setActionLoading(true);
    try {
      const cleanUsername = newUsername.trim().toLowerCase().replace(/\s+/g, '');
      await api.createUser({
        username: cleanUsername,
        full_name: newFullName.trim() || cleanUsername,
        role: newRole,
        phone: newPhone.trim(),
        password: generatedPasskey.trim()
      });

      const roleDisplay = newRole === 'FINANCE' ? 'Finance Manager' : 'Field Collector';
      setSuccessMsg(`User @${cleanUsername} created as ${roleDisplay} with passkey: ${generatedPasskey}`);
      setCreateModalOpen(false);

      setNewUsername('');
      setNewFullName('');
      setNewPhone('');
      setGeneratedPasskey(generatePasskey());

      // If user was created, show all accounts so it is immediately visible
      setActiveTab('all');
      await loadUsers();
      setTimeout(() => setSuccessMsg(''), 8000);
    } catch (err) {
      if (err.field) {
        setErrors({ [err.field]: err.message });
      } else {
        setErrors({ general: err.message || 'Failed to create user' });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setErrors({});

    if (!editUsername.trim() || editUsername.trim().length < 3) {
      setErrors({ editUsername: 'Username must be at least 3 characters long' });
      return;
    }

    if (editPassword && editPassword.trim() && editPassword.trim().length < 6) {
      setErrors({ editPassword: 'New password/passkey must be at least 6 characters long' });
      return;
    }

    setActionLoading(true);
    try {
      const cleanUsername = editUsername.trim().toLowerCase().replace(/\s+/g, '');
      const updated = await api.updateUser(editModalUser.id, {
        username: cleanUsername,
        full_name: editFullName.trim() || cleanUsername,
        phone: editPhone.trim(),
        role: editRole,
        password: editPassword.trim() ? editPassword.trim() : undefined
      });

      if (currentUser && setUser && (currentUser.id === editModalUser.id || currentUser.username.toLowerCase() === editModalUser.username.toLowerCase())) {
        setUser(prev => ({
          ...prev,
          full_name: updated.full_name,
          username: updated.username,
          phone: updated.phone,
          role: updated.role
        }));
      }

      setSuccessMsg(`User @${cleanUsername} updated successfully!`);
      setEditModalUser(null);
      await loadUsers();
      setTimeout(() => setSuccessMsg(''), 6000);
    } catch (err) {
      if (err.field) {
        setErrors({ [err.field === 'username' ? 'editUsername' : err.field]: err.message });
      } else {
        setErrors({ general: err.message || 'Failed to update user account' });
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCredit = async (e) => {
    e.preventDefault();
    setCreditErrors({});
    const num = Number(creditAmount);
    if (!creditAmount || isNaN(num) || num <= 0) {
      setCreditErrors({ amount: 'Enter a valid credit amount (> ₹0)' });
      return;
    }

    setCreditSaving(true);
    try {
      await api.addCredit({
        userId: creditModalUser.id,
        amount: num,
        payment_mode: creditMode,
        reference_number: creditRef,
        notes: creditNotes,
        adminUser: currentUser
      });

      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.6 }
      });

      setSuccessMsg(`Successfully credited ${formatINR(num)} to @${creditModalUser.username}! Available balance updated.`);
      setCreditModalUser(null);
      await loadUsers();
      setTimeout(() => setSuccessMsg(''), 8000);
    } catch (err) {
      if (err.field) {
        setCreditErrors({ [err.field]: err.message });
      } else {
        setCreditErrors({ general: err.message || 'Failed to credit money to finance member' });
      }
    } finally {
      setCreditSaving(false);
    }
  };

  const financeUsers = users.filter(u => u.role === 'FINANCE');

  // Overall totals for Finance Team
  const totalCreditedAllFinance = Object.values(financeBalances).reduce((sum, b) => sum + Number(b.totalCredited || 0), 0);
  const totalDebitedAllFinance = Object.values(financeBalances).reduce((sum, b) => sum + Number(b.totalDebited || 0), 0);
  const totalAvailableAllFinance = Object.values(financeBalances).reduce((sum, b) => sum + Number(b.availableBalance || 0), 0);

  const filteredUsers = users.filter(u => {
    if (activeTab === 'finance' && u.role !== 'FINANCE') return false;
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Team &amp; Finance Access Control</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            User Accounts &amp; Finance Team Balances
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create Field Collectors or Finance Managers. Credit advance funds to Finance team members and track debits automatically upon bill approval.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl shadow-xs transition cursor-pointer self-start md:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New User</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between gap-2 animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="leading-relaxed">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* Finance Team Overview KPI Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Funds Credited</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{formatINR(totalCreditedAllFinance)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Across {financeUsers.length} Finance Managers</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Approved Debits (Spent)</div>
            <div className="text-xl font-extrabold text-slate-900 mt-0.5">{formatINR(totalDebitedAllFinance)}</div>
            <div className="text-[11px] text-slate-400 mt-0.5">Deducted from approved bills</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Net Available in Wallets</div>
            <div className="text-xl font-extrabold text-emerald-600 mt-0.5">{formatINR(totalAvailableAllFinance)}</div>
            <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Ready for expense disbursements</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Wallet className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Tab buttons */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Accounts ({users.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('finance')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'finance'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Finance Team &amp; Balances ({financeUsers.length})</span>
            </button>
          </div>

          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user by username, phone, or role..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            <p className="text-xs font-medium">Loading user roster and balances...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <p className="text-xs font-medium">No users found matching your search.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">User Account</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Finance Balance / Status</th>
                  <th className="py-3.5 px-4">Phone / Contact</th>
                  <th className="py-3.5 px-4">Created Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => {
                  const bal = financeBalances[u.id];
                  const isFinance = u.role === 'FINANCE';
                  const isAdmin = u.role === 'ADMIN';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 font-mono text-xs">@{u.username}</div>
                        {u.full_name && u.full_name !== u.username && (
                          <div className="text-[11px] text-slate-500">{u.full_name}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                            <ShieldCheck className="w-3 h-3 text-purple-600" />
                            <span>Admin / Treasurer</span>
                          </span>
                        ) : isFinance ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            <Wallet className="w-3 h-3 text-emerald-600" />
                            <span>Finance Manager</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                            <BookOpen className="w-3 h-3 text-blue-600" />
                            <span>Field Collector</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {isFinance ? (
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-emerald-700">
                                {formatINR(bal?.availableBalance || 0)}
                              </span>
                              <span className="text-[10px] text-slate-400 font-medium">available</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Credited: {formatINR(bal?.totalCredited || 0)} &bull; Debited: {formatINR(bal?.totalDebited || 0)}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[11px] italic">Donor Collections</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-600 font-mono">
                        {u.phone || '—'}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : 'Recent'}
                      </td>

                      <td className="py-3.5 px-4 text-right space-x-1.5 whitespace-nowrap">
                        {isFinance && (
                          <button
                            type="button"
                            onClick={() => handleOpenCreditModal(u)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition cursor-pointer"
                            title="Credit money to this finance manager"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Credit Money</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(u)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg border border-slate-200 transition cursor-pointer shadow-2xs"
                          title="Edit User Data and Password"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                          <span>Edit</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal with Role Chooser: Field Collector vs Finance Manager */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New User Account"
        subtitle="Choose role (Field Collector or Finance Manager), specify login handle, and issue a passkey."
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* 1. Assigned Role Choice Cards */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Select User Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option A: Field Collector */}
              <div
                onClick={() => setNewRole('COLLECTOR')}
                className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  newRole === 'COLLECTOR'
                    ? 'border-blue-500 bg-blue-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <input
                    type="radio"
                    name="newRole"
                    checked={newRole === 'COLLECTOR'}
                    onChange={() => setNewRole('COLLECTOR')}
                    className="accent-blue-600 mt-1"
                  />
                </div>
                <div className="mt-2.5">
                  <div className="font-bold text-xs text-slate-900">Field Collector</div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Issues receipt leaf books, collects donations. Cannot submit expense bills.
                  </p>
                </div>
              </div>

              {/* Option B: Finance Manager */}
              <div
                onClick={() => setNewRole('FINANCE')}
                className={`p-3.5 rounded-xl border-2 transition cursor-pointer flex flex-col justify-between ${
                  newRole === 'FINANCE'
                    ? 'border-emerald-500 bg-emerald-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <input
                    type="radio"
                    name="newRole"
                    checked={newRole === 'FINANCE'}
                    onChange={() => setNewRole('FINANCE')}
                    className="accent-emerald-600 mt-1"
                  />
                </div>
                <div className="mt-2.5">
                  <div className="font-bold text-xs text-slate-900">Finance Manager</div>
                  <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                    Controls festival spending. Submits bills for admin approval &amp; receives fund credits.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* 2. Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder={newRole === 'FINANCE' ? 'e.g. finance_anand' : 'e.g. collector_rahul'}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              autoFocus
            />
            {errors.username ? (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.username}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Unique login handle for user authentication.</p>
            )}
          </div>

          {/* 3. Full Name / Display Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name / Display Name
            </label>
            <input
              type="text"
              value={newFullName}
              onChange={(e) => setNewFullName(e.target.value)}
              placeholder="e.g. Rahul Deshmukh"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          {/* 4. Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number / Mobile
            </label>
            <input
              type="tel"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          {/* 5. Passkey / Password */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password / Passkey <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleRegeneratePasskey}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Auto-generate Passkey</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  required
                  value={generatedPasskey}
                  onChange={(e) => setGeneratedPasskey(e.target.value)}
                  placeholder="Enter custom password or use generated passkey"
                  className="w-full rounded-lg border border-emerald-300 bg-white px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={() => handleCopyText(generatedPasskey, false)}
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer"
                title="Copy Passkey to Clipboard"
              >
                {copiedPasskey ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            {errors.passkey && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.passkey}</p>
            )}
            <p className="text-[11px] text-slate-400 mt-1">
              Share this password with the team member. You can also edit it anytime later.
            </p>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Creating User...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Credit Funds Modal - Admin Credits Money to Finance Member */}
      <Modal
        isOpen={Boolean(creditModalUser)}
        onClose={() => setCreditModalUser(null)}
        title="Credit Money to Finance Manager"
        subtitle={creditModalUser ? `Allocate advance spending money to @${creditModalUser.username}` : ''}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleAddCredit} className="space-y-4">
          {creditErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{creditErrors.general}</span>
            </div>
          )}

          {/* Current Finance Balance Overview */}
          {creditModalUser && (
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center">
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase">Credited</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {formatINR(financeBalances[creditModalUser.id]?.totalCredited || 0)}
                </div>
              </div>
              <div className="border-x border-slate-200">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Debited (Spent)</div>
                <div className="text-xs font-bold text-slate-900 mt-0.5">
                  {formatINR(financeBalances[creditModalUser.id]?.totalDebited || 0)}
                </div>
              </div>
              <div>
                <div className="text-[10px] text-emerald-700 font-bold uppercase">Available</div>
                <div className="text-xs font-extrabold text-emerald-600 mt-0.5">
                  {formatINR(financeBalances[creditModalUser.id]?.availableBalance || 0)}
                </div>
              </div>
            </div>
          )}

          {/* Amount to Credit */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Credit Amount (INR) <span className="text-rose-500">*</span>
            </label>
            <MoneyInput
              value={creditAmount}
              onChange={setCreditAmount}
              placeholder="e.g. 25000"
              required
            />
            {creditErrors.amount && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{creditErrors.amount}</p>
            )}

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 mt-2">
              <span className="text-[10px] text-slate-400 font-medium">Quick add:</span>
              {[5000, 10000, 25000, 50000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setCreditAmount(String(amt))}
                  className="px-2 py-0.5 text-[11px] font-bold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  +{formatINR(amt)}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Disbursement Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'BANK_TRANSFER', label: 'Bank / NEFT', icon: Building },
                { id: 'CASH', label: 'Cash Advance', icon: Banknote },
                { id: 'UPI', label: 'UPI / QR', icon: CreditCard },
                { id: 'CHEQUE', label: 'Cheque', icon: Coins },
              ].map(mode => {
                const Icon = mode.icon;
                const isSelected = creditMode === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setCreditMode(mode.id)}
                    className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{mode.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reference / UTR Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Reference / UTR / Voucher No <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={creditRef}
              onChange={(e) => setCreditRef(e.target.value)}
              placeholder="e.g. UTR-9823412 or Voucher #14"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Notes / Purpose */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Purpose / Allocation Notes <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
            </label>
            <input
              type="text"
              value={creditNotes}
              onChange={(e) => setCreditNotes(e.target.value)}
              placeholder="e.g. Stage lighting &amp; sound setup advance"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Past Credit History Log */}
          {creditHistory.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[11px] font-bold text-slate-600 uppercase mb-1.5 flex items-center justify-between">
                <span>Recent Credits to this Manager</span>
                <span className="text-slate-400 lowercase font-normal">{creditHistory.length} total</span>
              </div>
              <div className="max-h-28 overflow-y-auto space-y-1 pr-1 text-xs">
                {creditHistory.slice(0, 4).map(c => (
                  <div key={c.id} className="p-2 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-slate-900">{formatINR(c.amount)} &bull; {c.payment_mode}</div>
                      <div className="text-[10px] text-slate-500">{c.notes || 'Advance credit'} &bull; {new Date(c.created_at).toLocaleDateString('en-IN')}</div>
                    </div>
                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Credited
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setCreditModalUser(null)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creditSaving}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {creditSaving ? 'Processing Credit...' : `Credit ${creditAmount ? formatINR(creditAmount) : 'Money'}`}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={Boolean(editModalUser)}
        onClose={() => setEditModalUser(null)}
        title="Edit User Account"
        subtitle={editModalUser ? `Update account profile, role, or credentials for @${editModalUser.username}` : ''}
        maxWidth="max-w-md"
      >
        <form onSubmit={handleUpdateUser} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* Username */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder="e.g. collector_rahul"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
            {errors.editUsername && (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.editUsername}</p>
            )}
          </div>

          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name / Display Name
            </label>
            <input
              type="text"
              value={editFullName}
              onChange={(e) => setEditFullName(e.target.value)}
              placeholder="e.g. Rahul Deshmukh"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Phone Number / Mobile
            </label>
            <input
              type="tel"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
            />
          </div>

          {/* Role Selection (Field Collector, Finance Manager, Admin) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setEditRole('COLLECTOR')}
                className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  editRole === 'COLLECTOR'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                <span>Collector</span>
              </button>

              <button
                type="button"
                onClick={() => setEditRole('FINANCE')}
                className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  editRole === 'FINANCE'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Wallet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Finance</span>
              </button>

              <button
                type="button"
                onClick={() => setEditRole('ADMIN')}
                className={`p-2 rounded-xl border text-xs font-bold flex flex-col items-center justify-center gap-1 transition cursor-pointer ${
                  editRole === 'ADMIN'
                    ? 'border-purple-500 bg-purple-50 text-purple-800 ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin</span>
              </button>
            </div>
          </div>

          {/* New Password / Passkey (Optional) */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                New Password / Passkey <span className="text-[10px] text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <button
                type="button"
                onClick={handleGenerateEditPasskey}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Generate Passkey</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={editPassword}
                  onChange={(e) => setEditPassword(e.target.value)}
                  placeholder="Leave blank to keep unchanged"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                />
              </div>

              {editPassword && (
                <button
                  type="button"
                  onClick={() => handleCopyText(editPassword, true)}
                  className="inline-flex items-center gap-1 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition cursor-pointer shrink-0"
                  title="Copy to Clipboard"
                >
                  {copiedEditPasskey ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
            {errors.editPassword ? (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.editPassword}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">
                Leave blank to keep the current password, or enter a new one.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditModalUser(null)}
              className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              {actionLoading ? 'Saving Changes...' : 'Save User Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
