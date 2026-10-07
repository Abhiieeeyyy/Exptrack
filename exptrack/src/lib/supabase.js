import { createClient } from '@supabase/supabase-js';

// Get config from env or localStorage
const getStoredConfig = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const localUrl = localStorage.getItem('fecms_supabase_url');
  const localKey = localStorage.getItem('fecms_supabase_key');

  return {
    url: localUrl || envUrl || '',
    key: localKey || envKey || ''
  };
};

const config = getStoredConfig();

export const isSupabaseConfigured = () => {
  const cfg = getStoredConfig();
  return Boolean(cfg.url && cfg.key && cfg.url.startsWith('http'));
};

// Create client if configured
export let supabase = isSupabaseConfigured() 
  ? createClient(config.url, config.key) 
  : null;

export const updateSupabaseCredentials = (url, key) => {
  if (url && key) {
    localStorage.setItem('fecms_supabase_url', url.trim());
    localStorage.setItem('fecms_supabase_key', key.trim());
    supabase = createClient(url.trim(), key.trim());
  } else {
    localStorage.removeItem('fecms_supabase_url');
    localStorage.removeItem('fecms_supabase_key');
    supabase = null;
  }
};

export const getSupabaseConfig = () => getStoredConfig();

export const testSupabaseConnection = async (url, key) => {
  try {
    const testClient = createClient(url, key);
    const { data, error } = await testClient.from('users').select('id').limit(1);
    if (error && error.code !== 'PGRST116') {
      // Table might not exist yet or auth issue
      return { success: false, message: error.message };
    }
    return { success: true, message: 'Connected successfully to Supabase!' };
  } catch (err) {
    return { success: false, message: err.message || 'Connection failed' };
  }
};
