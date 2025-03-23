import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Make sure these values are correct!
const supabaseUrl = 'https://ncmcihzphfnyjznktwru.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jbWNpaHpwaGZueWp6bmt0d3J1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0MzkxNjMsImV4cCI6MjA1ODAxNTE2M30.wo0QzZ1DHPQUWsSqRfpxjXlIusV0rVE-99im3l8AtK8'; 

// Define a more comprehensive storage implementation
const customStorage = {
  getItem: async (key) => {
    try {
      const value = await AsyncStorage.getItem(key);
      console.log(`[Storage] Get item: ${key}`, value ? "Value exists" : "No value");
      return value;
    } catch (error) {
      console.error('[Storage] getItem error:', error);
      return null;
    }
  },
  setItem: async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
      console.log(`[Storage] Set item: ${key}`);
      return;
    } catch (error) {
      console.error('[Storage] setItem error:', error);
    }
  },
  removeItem: async (key) => {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`[Storage] Removed item: ${key}`);
      return;
    } catch (error) {
      console.error('[Storage] removeItem error:', error);
    }
  }
};

// Create the Supabase client with more detailed options
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: customStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    debug: __DEV__, // Enable auth debugging in development
  },
  debug: __DEV__, // Enable client debugging in development
});

// Add debugging to check for existing session on initialization
(async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (data?.session) {
      console.log("[Supabase] Found existing session on initialization for user:", data.session.user.id);
    } else {
      console.log("[Supabase] No existing session found on initialization");
    }
    if (error) console.error("[Supabase] Session check error:", error);
  } catch (e) {
    console.error("[Supabase] Error checking session:", e);
  }
})();

console.log("Supabase client initialized with URL:", supabaseUrl);