import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Your Supabase URL and key
const supabaseUrl = 'https://fjnjqkmpbkeaybnxpjyd.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqbmpxa21wYmtlYXlibnhwanlkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4OTc1NTgsImV4cCI6MjA1NzQ3MzU1OH0.7mWc0BY7AuxNYXtxnqvA_NzIdZFtcCvge-dC3ITGl4I'; // Replace with your actual anon key

// Create a custom storage implementation that works in all environments
const createCustomStorage = () => {
  return {
    async getItem(key) {
      try {
        return await AsyncStorage.getItem(key);
      } catch (error) {
        return null;
      }
    },
    async setItem(key, value) {
      try {
        await AsyncStorage.setItem(key, value);
        return;
      } catch (error) {
        return;
      }
    },
    async removeItem(key) {
      try {
        await AsyncStorage.removeItem(key);
        return;
      } catch (error) {
        return;
      }
    }
  };
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createCustomStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
});