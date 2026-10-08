import { supabase, isSupabaseConfigured } from '../lib/supabase';

const LOCAL_DATA_VERSION = '3';

const INITIAL_USERS = [
  {
    id: 'u-admin-1',
    username: 'admin',
    password: 'Admin@skat369',
    password_hash: 'Admin@skat369',
    full_name: 'Administrator',
    role: 'ADMIN',
    phone: '',
    created_at: new Date().toISOString(),
  }
];

const INITIAL_COLLECTIONS = [];
const INITIAL_EXPENSES = [];
const SEEDED_MEMBER_USERNAMES = ['amit', 'priya', 'rahul'];

// LocalStorage helpers for offline demo mode
const getStore = (key, initial) => {
  try {
    const raw = localStorage.getItem(`fecms_${key}`);
    if (!raw) {
      localStorage.setItem(`fecms_${key}`, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return initial;
  }
};

const setStore = (key, data) => {
  try {
    localStorage.setItem(`fecms_${key}`, JSON.stringify(data));
  } catch (err) {
    console.warn('LocalStorage quota or serialization error:', err);
  }
};

function resetLocalStoresToAdminOnly() {
  localStorage.removeItem('fecms_collections');
  localStorage.removeItem('fecms_expenses');
  localStorage.removeItem('fecms_users');
  localStorage.removeItem('fecms_custom_categories');
  setStore('users', INITIAL_USERS);
  setStore('collections', []);
  setStore('expenses', []);
}

function purgeStaleLocalData() {
  try {
    if (localStorage.getItem('fecms_data_version') === LOCAL_DATA_VERSION) return;
    resetLocalStoresToAdminOnly();
    localStorage.setItem('fecms_data_version', LOCAL_DATA_VERSION);
  } catch (err) {
    console.warn('Could not purge stale local demo data:', err);
  }
}

purgeStaleLocalData();

async function purgeSeededRemoteUsers() {
  if (!isSupabaseConfigured() || !supabase) return;
  try {
    const { data: seedUsers, error } = await supabase
      .from('users')
      .select('id, username, role')
      .in('username', SEEDED_MEMBER_USERNAMES);

    if (error || !seedUsers?.length) return;

    const ids = seedUsers.map((u) => u.id);
    await supabase.from('expenses').delete().in('submitted_by_user_id', ids);
    await supabase.from('collections').delete().in('collected_by_user_id', ids);
    await supabase.from('users').delete().in('id', ids);
  } catch (err) {
    console.warn('Could not purge seeded remote users:', err);
  }
}

let remoteSeedPurgePromise = null;
function ensureRemoteSeedPurge() {
  if (!remoteSeedPurgePromise) {
    remoteSeedPurgePromise = purgeSeededRemoteUsers();
  }
  return remoteSeedPurgePromise;
}

ensureRemoteSeedPurge();

// Available Expense Categories
export const EXPENSE_CATEGORIES = [
  'Stage & Lighting',
  'Sound System',
  'Catering & Food',
  'Decoration & Flowers',
  'Printing & Banners',
  'Transport & Logistics',
  'Permissions & Security',
  'Audio-Visual & Photography',
  'Prizes & Mementos',
  'Miscellaneous & Emergency'
];

export const PAYMENT_MODES = [
  { id: 'CASH', label: 'Cash', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300' },
  { id: 'UPI', label: 'UPI / QR', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300' },
  { id: 'BANK_TRANSFER', label: 'Bank Transfer / NEFT', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300' },
  { id: 'CHEQUE', label: 'Cheque', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' }
];

export const api = {
  // --------------------------------------------------------------------------
  // AUTH
  // --------------------------------------------------------------------------
  async login(username, password) {
    if (!username || !password) {
      throw new Error('Please enter both username and password');
    }

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    await ensureRemoteSeedPurge();

    // 1. Check Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', cleanUser)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          const dbHash = data.password_hash || data.password || '';
          if (dbHash !== cleanPass) {
            throw new Error('Invalid username or password');
          }

          return {
            id: data.id,
            username: data.username,
            full_name: data.full_name || data.username,
            role: data.role,
            phone: data.phone
          };
        }

        throw new Error('Invalid username or password');
      } catch (err) {
        if (err.message === 'Invalid username or password') {
          throw err;
        }
        console.warn('Supabase auth fallback to local store:', err.message);
      }
    }

    // 2. LocalStore check
    const users = getStore('users', INITIAL_USERS);
    const user = users.find(u => u.username.toLowerCase() === cleanUser);

    if (!user) {
      throw new Error('Invalid username or password');
    }

    const storedPass = user.password || user.password_hash || '';
    const isLocalPassMatch = (storedPass === cleanPass);

    if (!isLocalPassMatch) {
      throw new Error('Invalid username or password');
    }

    return {
      id: user.id,
      username: user.username,
      full_name: user.full_name || user.username,
      role: user.role,
      phone: user.phone
    };
  },

  // --------------------------------------------------------------------------
  // COLLECTIONS (Income) & CONTINUOUS LEAF CALCULATOR
  // --------------------------------------------------------------------------
  async getNextLeafForBook(bookNo, range = {}) {
    const cleanBook = parseInt(bookNo, 10) || 1;
    const parsedFrom = parseInt(range.leafFrom, 10);
    const parsedTo = parseInt(range.leafTo, 10);
    const leafFrom = (!isNaN(parsedFrom) && parsedFrom > 0) ? parsedFrom : 1;
    const leafTo = (!isNaN(parsedTo) && parsedTo >= leafFrom) ? parsedTo : leafFrom + 49;
    const prefix = String(cleanBook).padStart(3, '0');
    const recordedLeaves = new Set();

    const collectLeaf = (receiptNo) => {
      if (!receiptNo) return;
      const parts = String(receiptNo).split('-');
      if (parts.length === 2 && parts[0] === prefix) {
        const leafNum = parseInt(parts[1], 10);
        if (!isNaN(leafNum) && leafNum >= leafFrom && leafNum <= leafTo) {
          recordedLeaves.add(leafNum);
        }
      }
    };

    const summarize = () => {
      const totalLeaves = leafTo - leafFrom + 1;
      const leafArray = Array.from(recordedLeaves);
      const formatLeaf = (n) => `${prefix}-${String(n).padStart(2, '0')}`;

      if (leafArray.length === 0) {
        return {
          bookNo: cleanBook,
          nextLeaf: leafFrom,
          highestRecordedLeaf: leafFrom - 1,
          recordedCount: 0,
          isCompleted: false,
          totalLeaves,
          leafFrom,
          leafTo,
          formattedLeaf: formatLeaf(leafFrom)
        };
      }

      const maxLeaf = Math.max(...leafArray);
      const isCompleted = maxLeaf >= leafTo;
      const nextLeaf = isCompleted ? leafTo : maxLeaf + 1;

      return {
        bookNo: cleanBook,
        nextLeaf,
        highestRecordedLeaf: maxLeaf,
        recordedCount: leafArray.length,
        isCompleted,
        totalLeaves,
        leafFrom,
        leafTo,
        formattedLeaf: formatLeaf(nextLeaf)
      };
    };

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('receipt_book_number')
          .like('receipt_book_number', `${prefix}-%`);

        if (!error && Array.isArray(data)) {
          data.forEach((item) => collectLeaf(item.receipt_book_number));
          return summarize();
        }
      } catch (err) {
        console.warn('Supabase getNextLeafForBook error:', err);
      }
    }

    const localCols = getStore('collections', INITIAL_COLLECTIONS);
    localCols.forEach((item) => collectLeaf(item.receipt_book_number));
    return summarize();
  },

  // --------------------------------------------------------------------------
  // COLLECTIONS (Income) & PENDING PAYMENT TRACKING
  // --------------------------------------------------------------------------
  async createCollection(collectionData) {
    const { receipt_book_number, amount, donor_name, payment_mode, payment_status } = collectionData;
    
    if (!receipt_book_number || !receipt_book_number.trim()) {
      throw { field: 'receipt_book_number', message: 'Receipt Book Number is required' };
    }
    if (!donor_name || !donor_name.trim()) {
      throw { field: 'donor_name', message: 'Donor name is required' };
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw { field: 'amount', message: 'Amount must be greater than zero' };
    }
    if (!payment_mode) {
      throw { field: 'payment_mode', message: 'Payment mode is required' };
    }

    const cleanReceiptNo = receipt_book_number.trim().toUpperCase();
    const isPending = payment_status === 'PENDING';
    const rawUserNotes = (collectionData.notes || '').replace(/\[PAYMENT_PENDING\]/g, '').trim();
    const storedNotes = isPending ? `[PAYMENT_PENDING] ${rawUserNotes}`.trim() : rawUserNotes;

    if (isSupabaseConfigured()) {
      try {
        // Check duplicate receipt in Supabase
        const { data: existing } = await supabase
          .from('collections')
          .select('id')
          .eq('receipt_book_number', cleanReceiptNo)
          .maybeSingle();

        if (existing) {
          throw { field: 'receipt_book_number', message: `Receipt #${cleanReceiptNo} already recorded in system (Leaf Conflict 409)` };
        }

        const { data, error } = await supabase
          .from('collections')
          .insert([{
            receipt_book_number: cleanReceiptNo,
            collected_by_user_id: collectionData.collected_by_user_id,
            donor_name: donor_name.trim(),
            donor_address: collectionData.donor_address || '',
            donor_phone: collectionData.donor_phone || '',
            amount: numAmount,
            payment_mode: payment_mode,
            reference_number: collectionData.reference_number || '',
            notes: storedNotes
          }])
          .select()
          .single();

        if (error) {
          if (error.code === '23505' || (error.message && error.message.toLowerCase().includes('unique'))) {
            throw { field: 'receipt_book_number', message: `Receipt #${cleanReceiptNo} already recorded in system (Leaf Conflict 409)` };
          }
          throw error;
        }

        const formatted = {
          ...data,
          payment_status: isPending ? 'PENDING' : 'PAID',
          notes: rawUserNotes,
          collector_name: collectionData.collector_name || 'Member'
        };

        // Keep local storage in sync
        const collections = getStore('collections', INITIAL_COLLECTIONS);
        const idx = collections.findIndex(c => c.receipt_book_number.toUpperCase() === cleanReceiptNo);
        if (idx >= 0) {
          collections[idx] = formatted;
        } else {
          collections.unshift(formatted);
        }
        setStore('collections', collections);

        return formatted;
      } catch (err) {
        if (err.field) throw err;
        console.warn('Supabase fallback to local storage for collection:', err);
      }
    }

    // LocalStore fallback
    const collections = getStore('collections', INITIAL_COLLECTIONS);
    const exists = collections.some(c => c.receipt_book_number.toUpperCase() === cleanReceiptNo);
    if (exists) {
      throw { field: 'receipt_book_number', message: `Receipt #${cleanReceiptNo} already recorded in system (Leaf Conflict 409)` };
    }

    const newCollection = {
      id: 'col-' + Date.now(),
      receipt_book_number: cleanReceiptNo,
      collected_by_user_id: collectionData.collected_by_user_id,
      collector_name: collectionData.collector_name || 'Member',
      donor_name: donor_name.trim(),
      donor_address: collectionData.donor_address || '',
      donor_phone: collectionData.donor_phone || '',
      amount: numAmount,
      payment_mode: payment_mode,
      payment_status: isPending ? 'PENDING' : 'PAID',
      reference_number: collectionData.reference_number || '',
      notes: rawUserNotes,
      created_at: new Date().toISOString()
    };

    collections.unshift(newCollection);
    setStore('collections', collections);
    return newCollection;
  },

  async getCollections({ search = '', mode = '', status = '', memberId = '', dateFrom = '', dateTo = '' } = {}) {
    await ensureRemoteSeedPurge();
    let result = [];
    let usedSupabase = false;

    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('collections').select(`
          *,
          users:collected_by_user_id (id, full_name, username)
        `).order('created_at', { ascending: false });

        if (memberId) {
          query = query.eq('collected_by_user_id', memberId);
        }
        if (mode && mode !== 'ALL') {
          query = query.eq('payment_mode', mode);
        }
        if (search) {
          query = query.or(`donor_name.ilike.%${search}%,receipt_book_number.ilike.%${search}%`);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          usedSupabase = true;
          result = data.map(item => {
            const isPending = (item.notes && item.notes.includes('[PAYMENT_PENDING]')) || item.payment_status === 'PENDING';
            const cleanNotes = (item.notes || '').replace(/\[PAYMENT_PENDING\]/g, '').trim();
            return {
              ...item,
              payment_status: isPending ? 'PENDING' : 'PAID',
              notes: cleanNotes,
              collector_name: item.users ? item.users.full_name : 'Unknown Member'
            };
          });
        }
      } catch (err) {
        console.warn('Supabase collections query error:', err);
      }
    }

    if (!usedSupabase) {
      let collections = getStore('collections', INITIAL_COLLECTIONS);
      
      if (memberId) {
        collections = collections.filter(c => c.collected_by_user_id === memberId);
      }
      if (mode && mode !== 'ALL') {
        collections = collections.filter(c => c.payment_mode === mode);
      }
      if (search) {
        const q = search.toLowerCase();
        collections = collections.filter(c => 
          c.donor_name.toLowerCase().includes(q) || 
          c.receipt_book_number.toLowerCase().includes(q) ||
          (c.collector_name && c.collector_name.toLowerCase().includes(q))
        );
      }
      if (dateFrom) {
        const from = new Date(dateFrom).getTime();
        collections = collections.filter(c => new Date(c.created_at).getTime() >= from);
      }
      if (dateTo) {
        const to = new Date(dateTo).setHours(23, 59, 59, 999);
        collections = collections.filter(c => new Date(c.created_at).getTime() <= to);
      }

      result = collections.map(c => {
        const isPending = (c.notes && c.notes.includes('[PAYMENT_PENDING]')) || c.payment_status === 'PENDING';
        return {
          ...c,
          payment_status: isPending ? 'PENDING' : 'PAID',
          notes: (c.notes || '').replace(/\[PAYMENT_PENDING\]/g, '').trim()
        };
      });
    }

    if (status && status !== 'ALL') {
      result = result.filter(c => c.payment_status === status);
    }

    return result;
  },

  async updateCollection(collectionId, collectionData) {
    const { receipt_book_number, amount, donor_name, payment_mode, payment_status } = collectionData;
    
    if (!receipt_book_number || !receipt_book_number.trim()) {
      throw { field: 'receipt_book_number', message: 'Receipt Book Number is required' };
    }
    if (!donor_name || !donor_name.trim()) {
      throw { field: 'donor_name', message: 'Donor name is required' };
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw { field: 'amount', message: 'Amount must be greater than zero' };
    }
    if (!payment_mode) {
      throw { field: 'payment_mode', message: 'Payment mode is required' };
    }

    const isPending = payment_status === 'PENDING';
    const rawUserNotes = (collectionData.notes || '').replace(/\[PAYMENT_PENDING\]/g, '').trim();
    const storedNotes = isPending ? `[PAYMENT_PENDING] ${rawUserNotes}`.trim() : rawUserNotes;
    const cleanReceiptNo = receipt_book_number.trim().toUpperCase();

    if (isSupabaseConfigured()) {
      try {
        const { data: existing } = await supabase
          .from('collections')
          .select('id')
          .eq('receipt_book_number', cleanReceiptNo)
          .neq('id', collectionId)
          .maybeSingle();

        if (existing) {
          throw { field: 'receipt_book_number', message: `Receipt ${cleanReceiptNo} already recorded in system (Leaf Conflict 409)` };
        }

        const { data, error } = await supabase
          .from('collections')
          .update({
            receipt_book_number: cleanReceiptNo,
            donor_name: donor_name.trim(),
            donor_address: collectionData.donor_address || '',
            donor_phone: collectionData.donor_phone || '',
            amount: numAmount,
            payment_mode: payment_mode,
            reference_number: collectionData.reference_number || '',
            notes: storedNotes
          })
          .eq('id', collectionId)
          .select()
          .single();

        if (!error && data) {
          const formatted = {
            ...data,
            payment_status: isPending ? 'PENDING' : 'PAID',
            notes: rawUserNotes
          };
          const collections = getStore('collections', INITIAL_COLLECTIONS);
          const idx = collections.findIndex(c => c.id === collectionId);
          if (idx >= 0) {
            collections[idx] = { ...collections[idx], ...formatted };
            setStore('collections', collections);
          }
          return formatted;
        }
      } catch (err) {
        if (err.field) throw err;
        console.warn('Supabase updateCollection error:', err);
      }
    }

    const collections = getStore('collections', INITIAL_COLLECTIONS);
    const idx = collections.findIndex(c => c.id === collectionId);
    if (idx === -1) throw new Error('Collection record not found');

    collections[idx] = {
      ...collections[idx],
      receipt_book_number: cleanReceiptNo,
      donor_name: donor_name.trim(),
      donor_address: collectionData.donor_address || '',
      donor_phone: collectionData.donor_phone || '',
      amount: numAmount,
      payment_mode: payment_mode,
      payment_status: isPending ? 'PENDING' : 'PAID',
      reference_number: collectionData.reference_number || '',
      notes: rawUserNotes,
      updated_at: new Date().toISOString()
    };

    setStore('collections', collections);
    return collections[idx];
  },

  async markCollectionAsPaid(collectionId, { payment_mode = 'CASH', reference_number = '', notes = '' } = {}) {
    const collections = await this.getCollections();
    const target = collections.find(c => c.id === collectionId);
    if (!target) throw new Error('Collection record not found');

    const updated = await this.updateCollection(collectionId, {
      ...target,
      payment_mode: payment_mode || target.payment_mode || 'CASH',
      reference_number: reference_number || target.reference_number || '',
      notes: notes || target.notes || '',
      payment_status: 'PAID'
    });

    return updated;
  },

  // --------------------------------------------------------------------------
  // EXPENSES (Spending & Approvals)
  // --------------------------------------------------------------------------
  getExpenseCategories() {
    const customCats = getStore('custom_categories', []);
    const expenses = getStore('expenses', INITIAL_EXPENSES);
    const fromExpenses = expenses.map(e => e.category).filter(Boolean);
    const combined = Array.from(new Set([...EXPENSE_CATEGORIES, ...customCats, ...fromExpenses]));
    return combined;
  },

  addExpenseCategory(newCategory) {
    if (!newCategory || !newCategory.trim()) return '';
    const cat = newCategory.trim();
    const customCats = getStore('custom_categories', []);
    if (!customCats.includes(cat) && !EXPENSE_CATEGORIES.includes(cat)) {
      customCats.push(cat);
      setStore('custom_categories', customCats);
    }
    return cat;
  },

  async createExpense(expenseData) {
    const { category, amount, description, bill_image_url } = expenseData;

    if (!category) {
      throw { field: 'category', message: 'Expense category is required' };
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw { field: 'amount', message: 'Amount must be greater than zero' };
    }

    // Auto-register custom category if not already in default list
    if (category && !EXPENSE_CATEGORIES.includes(category)) {
      this.addExpenseCategory(category);
    }

    const cleanDescription = (description || '').trim();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .insert([{
            submitted_by_user_id: expenseData.submitted_by_user_id,
            category: category,
            amount: numAmount,
            description: cleanDescription,
            bill_image_url: bill_image_url || null,
            status: 'PENDING'
          }])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        if (err.field) throw err;
        console.warn('Supabase fallback for expense creation:', err);
      }
    }

    const expenses = getStore('expenses', INITIAL_EXPENSES);
    const newExpense = {
      id: 'exp-' + Date.now(),
      submitted_by_user_id: expenseData.submitted_by_user_id,
      submitter_name: expenseData.submitter_name || 'Member',
      category: category,
      amount: numAmount,
      description: cleanDescription,
      bill_image_url: bill_image_url || null,
      status: 'PENDING',
      rejection_reason: null,
      reviewed_by: null,
      reviewer_name: null,
      reviewed_at: null,
      created_at: new Date().toISOString()
    };

    expenses.unshift(newExpense);
    setStore('expenses', expenses);
    return newExpense;
  },

  async updateExpense(expenseId, expenseData) {
    const { category, amount, description, bill_image_url } = expenseData;

    if (!category) {
      throw { field: 'category', message: 'Expense category is required' };
    }
    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      throw { field: 'amount', message: 'Amount must be greater than zero' };
    }

    if (category && !EXPENSE_CATEGORIES.includes(category)) {
      this.addExpenseCategory(category);
    }

    const cleanDescription = (description || '').trim();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .update({
            category: category,
            amount: numAmount,
            description: cleanDescription,
            bill_image_url: bill_image_url || null,
          })
          .eq('id', expenseId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        if (err.field) throw err;
        console.warn('Supabase updateExpense error fallback:', err);
      }
    }

    const expenses = getStore('expenses', INITIAL_EXPENSES);
    const idx = expenses.findIndex(e => e.id === expenseId);
    if (idx === -1) throw new Error('Expense bill record not found');

    expenses[idx] = {
      ...expenses[idx],
      category,
      amount: numAmount,
      description: cleanDescription,
      bill_image_url: bill_image_url !== undefined ? bill_image_url : expenses[idx].bill_image_url,
      updated_at: new Date().toISOString()
    };

    setStore('expenses', expenses);
    return expenses[idx];
  },

  async getExpenses({ category = '', status = '', memberId = '', search = '' } = {}) {
    await ensureRemoteSeedPurge();
    if (isSupabaseConfigured()) {
      try {
        let query = supabase.from('expenses').select(`
          *,
          submitter:submitted_by_user_id (id, full_name, username),
          reviewer:reviewed_by (id, full_name, username)
        `).order('created_at', { ascending: false });

        if (memberId) {
          query = query.eq('submitted_by_user_id', memberId);
        }
        if (status && status !== 'ALL') {
          query = query.eq('status', status);
        }
        if (category && category !== 'ALL') {
          query = query.eq('category', category);
        }

        const { data, error } = await query;
        if (!error && data) {
          return data.map(item => ({
            ...item,
            submitter_name: item.submitter ? item.submitter.full_name : 'Member',
            reviewer_name: item.reviewer ? item.reviewer.full_name : null
          }));
        }
      } catch (err) {
        console.warn('Supabase expenses query error:', err);
      }
    }

    let expenses = getStore('expenses', INITIAL_EXPENSES);

    if (memberId) {
      expenses = expenses.filter(e => e.submitted_by_user_id === memberId);
    }
    if (status && status !== 'ALL') {
      expenses = expenses.filter(e => e.status === status);
    }
    if (category && category !== 'ALL') {
      expenses = expenses.filter(e => e.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      expenses = expenses.filter(e => 
        e.description.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        (e.submitter_name && e.submitter_name.toLowerCase().includes(q))
      );
    }

    return expenses;
  },

  async approveExpense(expenseId, reviewerUser) {
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .update({
            status: 'APPROVED',
            rejection_reason: null,
            reviewed_by: reviewerUser.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', expenseId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase fallback on approveExpense:', err);
      }
    }

    const expenses = getStore('expenses', INITIAL_EXPENSES);
    const idx = expenses.findIndex(e => e.id === expenseId);
    if (idx === -1) throw new Error('Expense bill record not found');

    expenses[idx].status = 'APPROVED';
    expenses[idx].rejection_reason = null;
    expenses[idx].reviewed_by = reviewerUser.id;
    expenses[idx].reviewer_name = reviewerUser.full_name || reviewerUser.username;
    expenses[idx].reviewed_at = new Date().toISOString();

    setStore('expenses', expenses);
    return expenses[idx];
  },

  async rejectExpense(expenseId, reason, reviewerUser) {
    if (!reason || !reason.trim()) {
      throw { field: 'reason', message: 'Rejection reason is mandatory when rejecting a bill' };
    }

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .update({
            status: 'REJECTED',
            rejection_reason: reason.trim(),
            reviewed_by: reviewerUser.id,
            reviewed_at: new Date().toISOString()
          })
          .eq('id', expenseId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.warn('Supabase fallback on rejectExpense:', err);
      }
    }

    const expenses = getStore('expenses', INITIAL_EXPENSES);
    const idx = expenses.findIndex(e => e.id === expenseId);
    if (idx === -1) throw new Error('Expense bill record not found');

    expenses[idx].status = 'REJECTED';
    expenses[idx].rejection_reason = reason.trim();
    expenses[idx].reviewed_by = reviewerUser.id;
    expenses[idx].reviewer_name = reviewerUser.full_name || reviewerUser.username;
    expenses[idx].reviewed_at = new Date().toISOString();

    setStore('expenses', expenses);
    return expenses[idx];
  },

  // --------------------------------------------------------------------------
  // ADMIN METRICS (Section 6 Business Rules: Net Balance = Total Income - APPROVED Expenses)
  // --------------------------------------------------------------------------
  async getMetrics() {
    const collections = await this.getCollections();
    const expenses = await this.getExpenses();

    // 1. Total Income & Collections breakdown (Received vs Pending Payment)
    const paidCollections = collections.filter(c => c.payment_status !== 'PENDING');
    const pendingCols = collections.filter(c => c.payment_status === 'PENDING');

    const totalReceivedIncome = paidCollections.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const totalPendingCollections = pendingCols.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const totalPledgedIncome = totalReceivedIncome + totalPendingCollections;

    // 2. Total Approved Expenses = Sum of APPROVED expenses ONLY
    const approvedExpensesList = expenses.filter(e => e.status === 'APPROVED');
    const totalApprovedExpenses = approvedExpensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 3. Net Cash Balance = Received Income - Approved Expenses
    const netBalance = totalReceivedIncome - totalApprovedExpenses;

    // 4. Pending bills count & amount
    const pendingExpenses = expenses.filter(e => e.status === 'PENDING');
    const pendingCount = pendingExpenses.length;
    const pendingAmount = pendingExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 5. Rejected bills count
    const rejectedExpenses = expenses.filter(e => e.status === 'REJECTED');
    const rejectedCount = rejectedExpenses.length;

    // 6. Category breakdown for approved expenses
    const categoryBreakdown = {};
    approvedExpensesList.forEach(e => {
      categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + Number(e.amount || 0);
    });

    // 7. Payment mode breakdown for collections (only received)
    const paymentModeBreakdown = {};
    paidCollections.forEach(c => {
      paymentModeBreakdown[c.payment_mode] = (paymentModeBreakdown[c.payment_mode] || 0) + Number(c.amount || 0);
    });

    return {
      totalIncome: totalReceivedIncome,
      totalReceivedIncome,
      totalPendingCollections,
      totalPledgedIncome,
      pendingCollectionsCount: pendingCols.length,
      paidCollectionsCount: paidCollections.length,
      totalApprovedExpenses,
      netBalance,
      pendingCount,
      pendingAmount,
      rejectedCount,
      totalCollectionsCount: collections.length,
      categoryBreakdown,
      paymentModeBreakdown,
      recentCollections: collections.slice(0, 5),
      recentExpenses: expenses.slice(0, 5)
    };
  },

  // --------------------------------------------------------------------------
  // USER ROSTER & MANAGEMENT
  // --------------------------------------------------------------------------
  async getUsers() {
    await ensureRemoteSeedPurge();
    const localUsers = getStore('users', INITIAL_USERS);
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, full_name, role, phone, created_at')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          setStore('users', data);
          return data;
        }
      } catch (err) {
        console.warn('Supabase getUsers error:', err);
      }
    }

    return localUsers.map(({ id, username, full_name, role, phone, created_at }) => ({
      id, username, full_name, role, phone, created_at
    }));
  },

  async createUser(userData) {
    const { username, password, full_name, role, phone } = userData;

    if (!username || username.trim().length < 3) {
      throw { field: 'username', message: 'Username must be at least 3 characters' };
    }
    if (!password || password.length < 6) {
      throw { field: 'password', message: 'Password/Passkey must be at least 6 characters' };
    }
    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanFullName = (full_name && full_name.trim()) ? full_name.trim() : cleanUsername;

    let createdUser = null;

    if (isSupabaseConfigured()) {
      try {
        // Check if username already exists in Supabase
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', cleanUsername)
          .maybeSingle();

        if (existingUser) {
          throw { field: 'username', message: `Username @${cleanUsername} is already registered` };
        }

        const { data, error } = await supabase
          .from('users')
          .insert([{
            username: cleanUsername,
            password_hash: password,
            full_name: cleanFullName,
            role: role || 'USER',
            phone: phone ? phone.trim() : ''
          }])
          .select('id, username, full_name, role, phone, created_at');

        if (!error && data && data.length > 0) {
          createdUser = data[0];
        } else if (error) {
          if (error.code === '23505' || (error.message && error.message.toLowerCase().includes('unique'))) {
            throw { field: 'username', message: `Username @${cleanUsername} is already registered` };
          }
          console.warn('Supabase createUser error:', error.message);
        }
      } catch (err) {
        if (err.field) throw err;
        console.warn('Supabase createUser error, falling back to local:', err);
      }
    }

    const users = getStore('users', INITIAL_USERS);
    if (users.some(u => u.username.toLowerCase() === cleanUsername)) {
      throw { field: 'username', message: `Username @${cleanUsername} already exists` };
    }

    const newUser = createdUser ? { ...createdUser, password } : {
      id: 'u-' + Date.now(),
      username: cleanUsername,
      password: password,
      password_hash: password,
      full_name: cleanFullName,
      role: role || 'USER',
      phone: phone ? phone.trim() : '',
      created_at: new Date().toISOString()
    };

    users.unshift(newUser);
    setStore('users', users);
    return newUser;
  },

  async updateUser(userId, userData) {
    const { username, full_name, phone, role, password } = userData;

    if (!username || username.trim().length < 3) {
      throw { field: 'username', message: 'Username must be at least 3 characters' };
    }
    if (password && password.trim() && password.trim().length < 6) {
      throw { field: 'password', message: 'Password/Passkey must be at least 6 characters' };
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanFullName = (full_name && full_name.trim()) ? full_name.trim() : cleanUsername;

    let updatedRow = null;

    if (isSupabaseConfigured()) {
      try {
        // Check if username taken by someone else
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('username', cleanUsername)
          .neq('id', userId)
          .maybeSingle();

        if (existingUser && existingUser.id !== userId) {
          throw { field: 'username', message: `Username @${cleanUsername} is already taken by another account` };
        }

        const updatePayload = {
          username: cleanUsername,
          full_name: cleanFullName,
          role: role || 'USER',
          phone: phone ? phone.trim() : '',
          updated_at: new Date().toISOString()
        };

        if (password && password.trim()) {
          updatePayload.password_hash = password.trim();
        }

        const { data, error } = await supabase
          .from('users')
          .update(updatePayload)
          .eq('id', userId)
          .select('id, username, full_name, role, phone, created_at');

        if (!error && data && data.length > 0) {
          updatedRow = data[0];
        } else if (error) {
          if (error.code === '23505' || (error.message && error.message.toLowerCase().includes('unique'))) {
            throw { field: 'username', message: `Username @${cleanUsername} is already taken by another account` };
          }
          console.warn('Supabase updateUser error:', error.message);
        }
      } catch (err) {
        if (err.field) throw err;
        console.warn('Supabase updateUser fallback to local store:', err);
      }
    }

    // Match in local store by id OR by username!
    const users = getStore('users', INITIAL_USERS);
    const idx = users.findIndex(u => u.id === userId || u.username.toLowerCase() === cleanUsername);

    const updatedUser = {
      id: updatedRow?.id || (idx !== -1 ? users[idx].id : userId),
      username: cleanUsername,
      full_name: cleanFullName,
      role: role || (idx !== -1 ? users[idx].role : 'USER'),
      phone: phone ? phone.trim() : '',
      created_at: idx !== -1 ? users[idx].created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...(password && password.trim() ? { password: password.trim(), password_hash: password.trim() } : {})
    };

    if (idx !== -1) {
      users[idx] = { ...users[idx], ...updatedUser };
    } else {
      users.unshift(updatedUser);
    }
    setStore('users', users);

    return updatedUser;
  },

  async resetUserPassword(userId, newPassword) {
    if (!newPassword || newPassword.length < 6) {
      throw { field: 'password', message: 'Password must be at least 6 characters' };
    }

    return this.updateUser(userId, {
      username: (await this.getUsers()).find(u => u.id === userId)?.username || '',
      password: newPassword
    });
  },

  resetDemoData() {
    resetLocalStoresToAdminOnly();
    localStorage.setItem('fecms_data_version', LOCAL_DATA_VERSION);
  }
};
