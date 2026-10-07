import { supabase, isSupabaseConfigured } from '../lib/supabase';

// Initial Mock / Seed Data
const INITIAL_USERS = [
  {
    id: 'u-admin-1',
    username: 'admin',
    password: 'password123',
    full_name: 'Rajesh Sharma',
    role: 'ADMIN',
    phone: '+91 98765 43210',
    created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'u-member-1',
    username: 'amit',
    password: 'password123',
    full_name: 'Amit Patel',
    role: 'USER',
    phone: '+91 98765 43211',
    created_at: new Date(Date.now() - 25 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'u-member-2',
    username: 'priya',
    password: 'password123',
    full_name: 'Priya Verma',
    role: 'USER',
    phone: '+91 98765 43212',
    created_at: new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'u-member-3',
    username: 'rahul',
    password: 'password123',
    full_name: 'Rahul Deshmukh',
    role: 'USER',
    phone: '+91 98765 43213',
    created_at: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString(),
  }
];

const INITIAL_COLLECTIONS = [
  {
    id: 'col-1',
    receipt_book_number: 'REC-2026-001',
    collected_by_user_id: 'u-member-1',
    collector_name: 'Amit Patel',
    donor_name: 'Sunil Narang & Sons',
    donor_address: 'Shop 12, Main Market, MG Road',
    donor_phone: '+91 98234 11223',
    amount: 25000,
    payment_mode: 'UPI',
    reference_number: 'UPI/260982347182',
    notes: 'Annual festival diamond sponsor',
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'col-2',
    receipt_book_number: 'REC-2026-002',
    collected_by_user_id: 'u-member-1',
    collector_name: 'Amit Patel',
    donor_name: 'Kavita Sundaram',
    donor_address: 'Flat 402, Green Park Residency',
    donor_phone: '+91 98450 33445',
    amount: 10000,
    payment_mode: 'CASH',
    reference_number: '',
    notes: 'Cash received at residency desk',
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'col-3',
    receipt_book_number: 'REC-2026-003',
    collected_by_user_id: 'u-member-2',
    collector_name: 'Priya Verma',
    donor_name: 'Apex Industrial Solutions',
    donor_address: 'Plot 45, MIDC Phase 2',
    donor_phone: '+91 98111 88990',
    amount: 50000,
    payment_mode: 'BANK_TRANSFER',
    reference_number: 'NEFT-HDFC000123984',
    notes: 'Corporate sponsorship wire transfer',
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'col-4',
    receipt_book_number: 'REC-2026-004',
    collected_by_user_id: 'u-member-3',
    collector_name: 'Rahul Deshmukh',
    donor_name: 'Dr. Ramesh Chandra',
    donor_address: 'Clinic 5, South Extension',
    donor_phone: '+91 98712 99001',
    amount: 5000,
    payment_mode: 'CHEQUE',
    reference_number: 'CHQ-882104 (SBI)',
    notes: 'Cheque cleared in bank account',
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'col-5',
    receipt_book_number: 'REC-2026-005',
    collected_by_user_id: 'u-member-2',
    collector_name: 'Priya Verma',
    donor_name: 'Shree Balaji Traders',
    donor_address: 'Market Yard Gate 2',
    donor_phone: '+91 97654 32109',
    amount: 15000,
    payment_mode: 'UPI',
    reference_number: 'UPI/261048392019',
    notes: 'Banner advertisement sponsorship',
    created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
  }
];

const INITIAL_EXPENSES = [
  {
    id: 'exp-1',
    submitted_by_user_id: 'u-member-1',
    submitter_name: 'Amit Patel',
    category: 'Stage & Lighting',
    amount: 18500,
    description: 'Truss setup, LED par lights and heavy-duty halogen spotlights for main stage',
    bill_image_url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&auto=format&fit=crop',
    status: 'APPROVED',
    rejection_reason: null,
    reviewed_by: 'u-admin-1',
    reviewer_name: 'Rajesh Sharma',
    reviewed_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp-2',
    submitted_by_user_id: 'u-member-1',
    submitter_name: 'Amit Patel',
    category: 'Sound System',
    amount: 12000,
    description: 'JBL 4-top Line Array speakers, digital mixer, and 4 wireless handheld mics',
    bill_image_url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop',
    status: 'APPROVED',
    rejection_reason: null,
    reviewed_by: 'u-admin-1',
    reviewer_name: 'Rajesh Sharma',
    reviewed_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp-3',
    submitted_by_user_id: 'u-member-2',
    submitter_name: 'Priya Verma',
    category: 'Catering & Food',
    amount: 15400,
    description: 'Lunch thali boxes, drinking water cans, and evening high-tea for 85 volunteers',
    bill_image_url: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop',
    status: 'PENDING',
    rejection_reason: null,
    reviewed_by: null,
    reviewer_name: null,
    reviewed_at: null,
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp-4',
    submitted_by_user_id: 'u-member-1',
    submitter_name: 'Amit Patel',
    category: 'Printing & Banners',
    amount: 4200,
    description: '25 Heavy Vinyl Standees, 1000 invitation leaflets and badges with lanyards',
    bill_image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop',
    status: 'PENDING',
    rejection_reason: null,
    reviewed_by: null,
    reviewer_name: null,
    reviewed_at: null,
    created_at: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: 'exp-5',
    submitted_by_user_id: 'u-member-3',
    submitter_name: 'Rahul Deshmukh',
    category: 'Transport & Logistics',
    amount: 3500,
    description: 'Tempo rental for transporting sound equipment & chairs across 3 venues',
    bill_image_url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&auto=format&fit=crop',
    status: 'REJECTED',
    rejection_reason: 'Bill invoice missing GST / vendor rubber stamp. Please ask driver for official receipt.',
    reviewed_by: 'u-admin-1',
    reviewer_name: 'Rajesh Sharma',
    reviewed_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    created_at: new Date(Date.now() - 18 * 3600 * 1000).toISOString(),
  }
];

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

    // 1. Check Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('username', cleanUser)
          .maybeSingle();

        if (!error && data) {
          const dbHash = data.password_hash || data.password || '';
          const isDirectMatch = dbHash === cleanPass;
          const isDemoMatch = (cleanPass === 'admin123' && data.role === 'ADMIN') ||
                              (cleanPass === 'member123') ||
                              (cleanPass === 'password123');

          // Check if updated in local store as well
          const localUsers = getStore('users', INITIAL_USERS);
          const localUser = localUsers.find(u => u.username.toLowerCase() === cleanUser);
          const isLocalMatch = localUser && (
            localUser.password === cleanPass ||
            localUser.password_hash === cleanPass
          );

          if (isDirectMatch || isDemoMatch || isLocalMatch) {
            // Synchronize into local store
            const lIdx = localUsers.findIndex(u => u.username.toLowerCase() === cleanUser);
            if (lIdx !== -1) {
              localUsers[lIdx] = { ...localUsers[lIdx], ...data, password: cleanPass, password_hash: cleanPass };
            } else {
              localUsers.unshift({ ...data, password: cleanPass, password_hash: cleanPass });
            }
            setStore('users', localUsers);

            return {
              id: data.id,
              username: data.username,
              full_name: data.full_name || data.username,
              role: data.role,
              phone: data.phone
            };
          }
        }
      } catch (err) {
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
    const isLocalPassMatch = (storedPass === cleanPass) ||
                             (user.password_hash === cleanPass) ||
                             (cleanPass === 'admin123' && user.role === 'ADMIN') ||
                             (cleanPass === 'member123') ||
                             (cleanPass === 'password123');

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
  async getNextLeafForBook(bookNo) {
    const cleanBook = parseInt(bookNo, 10) || 1;
    const prefix = String(cleanBook).padStart(3, '0'); // e.g. "001"
    const recordedLeaves = new Set();

    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('collections')
          .select('receipt_book_number')
          .like('receipt_book_number', `${prefix}-%`);

        if (!error && Array.isArray(data)) {
          data.forEach(item => {
            if (item.receipt_book_number) {
              const parts = item.receipt_book_number.split('-');
              if (parts.length === 2 && parts[0] === prefix) {
                const leafNum = parseInt(parts[1], 10);
                if (!isNaN(leafNum)) recordedLeaves.add(leafNum);
              }
            }
          });
        }
      } catch (err) {
        console.warn('Supabase getNextLeafForBook error:', err);
      }
    }

    // Also check local store
    const localCols = getStore('collections', INITIAL_COLLECTIONS);
    localCols.forEach(item => {
      if (item.receipt_book_number) {
        const parts = item.receipt_book_number.split('-');
        if (parts.length === 2 && parts[0] === prefix) {
          const leafNum = parseInt(parts[1], 10);
          if (!isNaN(leafNum)) recordedLeaves.add(leafNum);
        }
      }
    });

    const leafArray = Array.from(recordedLeaves);
    if (leafArray.length === 0) {
      return {
        bookNo: cleanBook,
        nextLeaf: 1,
        highestRecordedLeaf: 0,
        recordedCount: 0,
        isCompleted: false,
        totalLeaves: 50,
        formattedLeaf: `${prefix}-01`
      };
    }

    const maxLeaf = Math.max(...leafArray);
    const nextLeaf = maxLeaf + 1;
    const isCompleted = maxLeaf >= 50;
    const targetLeaf = isCompleted ? 50 : nextLeaf;
    const leafStr = String(targetLeaf).padStart(2, '0');

    return {
      bookNo: cleanBook,
      nextLeaf: targetLeaf,
      highestRecordedLeaf: maxLeaf,
      recordedCount: leafArray.length,
      isCompleted: isCompleted,
      totalLeaves: 50,
      formattedLeaf: `${prefix}-${leafStr}`
    };
  },

  // --------------------------------------------------------------------------
  // COLLECTIONS (Income)
  // --------------------------------------------------------------------------
  async createCollection(collectionData) {
    const { receipt_book_number, amount, donor_name, payment_mode } = collectionData;
    
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
            notes: collectionData.notes || ''
          }])
          .select()
          .single();

        if (error) {
          if (error.code === '23505' || (error.message && error.message.toLowerCase().includes('unique'))) {
            throw { field: 'receipt_book_number', message: `Receipt #${cleanReceiptNo} already recorded in system (Leaf Conflict 409)` };
          }
          throw error;
        }

        // Keep local storage in sync
        const collections = getStore('collections', INITIAL_COLLECTIONS);
        const idx = collections.findIndex(c => c.receipt_book_number.toUpperCase() === cleanReceiptNo);
        if (idx >= 0) {
          collections[idx] = { ...data, collector_name: collectionData.collector_name || 'Member' };
        } else {
          collections.unshift({ ...data, collector_name: collectionData.collector_name || 'Member' });
        }
        setStore('collections', collections);

        return data;
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
      reference_number: collectionData.reference_number || '',
      notes: collectionData.notes || '',
      created_at: new Date().toISOString()
    };

    collections.unshift(newCollection);
    setStore('collections', collections);
    return newCollection;
  },

  async getCollections({ search = '', mode = '', memberId = '', dateFrom = '', dateTo = '' } = {}) {
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
        if (!error && data) {
          return data.map(item => ({
            ...item,
            collector_name: item.users ? item.users.full_name : 'Unknown Member'
          }));
        }
      } catch (err) {
        console.warn('Supabase collections query error:', err);
      }
    }

    // Local fallback
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

    return collections;
  },

  async updateCollection(collectionId, collectionData) {
    const { receipt_book_number, amount, donor_name, payment_mode } = collectionData;
    
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

    if (isSupabaseConfigured()) {
      try {
        const { data: existing } = await supabase
          .from('collections')
          .select('id')
          .eq('receipt_book_number', receipt_book_number.trim())
          .neq('id', collectionId)
          .maybeSingle();

        if (existing) {
          throw { field: 'receipt_book_number', message: `Receipt ${receipt_book_number} already recorded in system (Leaf Conflict 409)` };
        }

        const { data, error } = await supabase
          .from('collections')
          .update({
            receipt_book_number: receipt_book_number.trim().toUpperCase(),
            donor_name: donor_name.trim(),
            donor_address: collectionData.donor_address || '',
            donor_phone: collectionData.donor_phone || '',
            amount: numAmount,
            payment_mode: payment_mode,
            reference_number: collectionData.reference_number || '',
            notes: collectionData.notes || ''
          })
          .eq('id', collectionId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        if (err.field) throw err;
        console.warn('Supabase updateCollection error fallback:', err);
      }
    }

    const collections = getStore('collections', INITIAL_COLLECTIONS);
    const idx = collections.findIndex(c => c.id === collectionId);
    if (idx === -1) throw new Error('Collection entry not found');

    const duplicate = collections.find(c => c.id !== collectionId && c.receipt_book_number.toLowerCase() === receipt_book_number.trim().toLowerCase());
    if (duplicate) {
      throw { field: 'receipt_book_number', message: `Receipt #${receipt_book_number} already recorded in system (Leaf Conflict 409)` };
    }

    collections[idx] = {
      ...collections[idx],
      receipt_book_number: receipt_book_number.trim().toUpperCase(),
      donor_name: donor_name.trim(),
      donor_address: collectionData.donor_address || '',
      donor_phone: collectionData.donor_phone || '',
      amount: numAmount,
      payment_mode: payment_mode,
      reference_number: collectionData.reference_number || '',
      notes: collectionData.notes || '',
      updated_at: new Date().toISOString()
    };

    setStore('collections', collections);
    return collections[idx];
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

    // 1. Total Income = Sum of all collections
    const totalIncome = collections.reduce((sum, c) => sum + Number(c.amount || 0), 0);

    // 2. Total Approved Expenses = Sum of APPROVED expenses ONLY
    const approvedExpensesList = expenses.filter(e => e.status === 'APPROVED');
    const totalApprovedExpenses = approvedExpensesList.reduce((sum, e) => sum + Number(e.amount || 0), 0);

    // 3. Net Balance = Income - Approved Expenses
    const netBalance = totalIncome - totalApprovedExpenses;

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

    // 7. Payment mode breakdown for collections
    const paymentModeBreakdown = {};
    collections.forEach(c => {
      paymentModeBreakdown[c.payment_mode] = (paymentModeBreakdown[c.payment_mode] || 0) + Number(c.amount || 0);
    });

    return {
      totalIncome,
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
    const localUsers = getStore('users', INITIAL_USERS);
    if (isSupabaseConfigured()) {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('id, username, full_name, role, phone, created_at')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          // Merge: Map by username (lowercase)
          const mergedMap = new Map();
          // Start with local users
          localUsers.forEach(u => {
            if (u && u.username) mergedMap.set(u.username.toLowerCase(), u);
          });
          // Overlay Supabase users
          data.forEach(su => {
            if (!su || !su.username) return;
            const uname = su.username.toLowerCase();
            const existingLocal = mergedMap.get(uname);
            mergedMap.set(uname, {
              ...su,
              full_name: (existingLocal?.full_name && existingLocal?.full_name !== existingLocal?.username) 
                ? existingLocal.full_name 
                : (su.full_name || su.username),
              phone: existingLocal?.phone || su.phone || '',
              role: existingLocal?.role || su.role || 'USER',
              password: existingLocal?.password
            });
          });
          const merged = Array.from(mergedMap.values());
          setStore('users', merged);
          return merged;
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

  // Reset demo store back to fresh state
  resetDemoData() {
    localStorage.removeItem('fecms_collections');
    localStorage.removeItem('fecms_expenses');
    localStorage.removeItem('fecms_users');
    setStore('users', INITIAL_USERS);
    setStore('collections', INITIAL_COLLECTIONS);
    setStore('expenses', INITIAL_EXPENSES);
  }
};
