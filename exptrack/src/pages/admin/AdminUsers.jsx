import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import Modal from '../../components/Modal';
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
  User
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Create Modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [generatedPasskey, setGeneratedPasskey] = useState(() => generatePasskey());
  const [copiedPasskey, setCopiedPasskey] = useState(false);

  // Edit Modal state (Replaces change password with full edit user & password)
  const [editModalUser, setEditModalUser] = useState(null);
  const [editUsername, setEditUsername] = useState('');
  const [editFullName, setEditFullName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editRole, setEditRole] = useState('USER');
  const [editPassword, setEditPassword] = useState('');
  const [copiedEditPasskey, setCopiedEditPasskey] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMsg, setSuccessMsg] = useState('');

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers();
      setUsers(data || []);
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
    setNewPhone('');
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
    setEditRole(u.role || 'USER');
    setEditPassword('');
    setCopiedEditPasskey(false);
    setErrors({});
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
      setErrors({ passkey: 'Valid passkey is required' });
      return;
    }

    setActionLoading(true);
    try {
      const cleanUsername = newUsername.trim().toLowerCase().replace(/\s+/g, '');
      await api.createUser({
        username: cleanUsername,
        full_name: cleanUsername,
        role: 'USER',
        phone: newPhone.trim(),
        password: generatedPasskey
      });

      setSuccessMsg(`User @${cleanUsername} created successfully with passkey: ${generatedPasskey}`);
      setCreateModalOpen(false);

      // Reset
      setNewUsername('');
      setNewPhone('');
      setGeneratedPasskey(generatePasskey());

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

      // If active logged-in user is updated (like admin display name), update AuthContext immediately
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

  const filteredUsers = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.full_name && u.full_name.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold mb-2">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            <span>Team &amp; Access Control</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            User Accounts &amp; Passkey Manager
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create field collector accounts with auto-generated passkeys, edit details, and manage access passwords.
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

      {/* User Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search user by username or phone..."
              className="w-full rounded-lg border border-slate-300 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {users.length} Active Accounts
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <div className="animate-spin text-2xl mb-2">⏳</div>
            <p className="text-xs font-medium">Loading user roster...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Username &amp; Name</th>
                  <th className="py-3.5 px-4">Assigned Role</th>
                  <th className="py-3.5 px-4">Phone / Contact</th>
                  <th className="py-3.5 px-4">Joined Date</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 font-mono">@{u.username}</div>
                      {u.full_name && u.full_name !== u.username && (
                        <div className="text-[11px] text-slate-500">{u.full_name}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {u.role === 'ADMIN' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          <ShieldCheck className="w-3 h-3 text-purple-600" />
                          <span>Admin / Treasurer</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          <UserCheck className="w-3 h-3 text-blue-600" />
                          <span>Field Member</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-mono">
                      {u.phone || '—'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('en-IN') : 'Recent'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenEditModal(u)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 hover:text-slate-900 rounded-lg border border-slate-200 transition cursor-pointer shadow-2xs"
                        title="Edit User Data and Password"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Edit</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal - ONLY unfilled username, ph no, and randomly generated passkey */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Add New User Account"
        subtitle="Specify username, phone number, and issue a secure generated passkey."
        maxWidth="max-w-md"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          {errors.general && (
            <div className="p-3 bg-rose-50 border border-rose-300 rounded-lg text-xs font-semibold text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errors.general}</span>
            </div>
          )}

          {/* 1. Unfilled Username Field */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newUsername}
              onChange={(e) => setNewUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
              placeholder="e.g. collector_rahul"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 focus:outline-none"
              autoFocus
            />
            {errors.username ? (
              <p className="text-xs text-rose-600 mt-1 font-medium">{errors.username}</p>
            ) : (
              <p className="text-[11px] text-slate-400 mt-1">Unique login handle for field collector.</p>
            )}
          </div>

          {/* 2. Phone Number Field */}
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

          {/* 3. Randomly Generated Passkey */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Randomly Generated Passkey <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleRegeneratePasskey}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Regenerate</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  readOnly
                  value={generatedPasskey}
                  className="w-full rounded-lg border border-emerald-300 bg-emerald-50/50 px-3 py-2 text-xs font-mono font-bold text-emerald-950 focus:outline-none"
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
            <p className="text-[11px] text-slate-400 mt-1">
              Share this passkey with the user for first login. You can edit it anytime afterwards.
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

      {/* Edit User Modal - Edit Userdata (Username, Full Name, Phone, Role) & Password/Passkey */}
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

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Assigned Role
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setEditRole('USER')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  editRole === 'USER'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Field Member</span>
              </button>

              <button
                type="button"
                onClick={() => setEditRole('ADMIN')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  editRole === 'ADMIN'
                    ? 'border-purple-500 bg-purple-50 text-purple-800 ring-2 ring-purple-500/20'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                <span>Admin / Treasurer</span>
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

