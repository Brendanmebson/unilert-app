import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

// Create context
const AuthContext = createContext({});

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);

  // Check user on mount
  useEffect(() => {
    console.log("[AuthContext] Initializing");
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log("[AuthContext] Checking for existing session");
        
        // Get current session
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AuthContext] Session error:", error);
          setLoading(false);
          return;
        }
        
        if (data.session) {
          console.log("[AuthContext] Found existing session for user:", data.session.user.id);
          setSession(data.session);
          setUser(data.session.user);
          
          // Fetch user profile
          await fetchProfile(data.session.user.id);
        } else {
          console.log("[AuthContext] No active session found");
          // Try to recover from AsyncStorage
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            console.log("[AuthContext] Found user in AsyncStorage, attempting to refresh session");
            const userData = JSON.parse(storedUser);
            
            // Try to refresh the session
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshData?.session) {
              console.log("[AuthContext] Session refreshed for user:", refreshData.session.user.id);
              setSession(refreshData.session);
              setUser(refreshData.session.user);
              await fetchProfile(refreshData.session.user.id);
            } else {
              console.log("[AuthContext] Failed to refresh session:", refreshError);
              // Clear stored user data
              await AsyncStorage.removeItem('user');
            }
          }
        }
      } catch (error) {
        console.error("[AuthContext] Initialization error:", error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeAuth();

    // Auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`[AuthContext] Auth event: ${event}`);
      
      if (event === 'SIGNED_IN') {
        console.log("[AuthContext] User signed in:", newSession.user.id);
        setSession(newSession);
        setUser(newSession.user);
        
        // Store user in AsyncStorage for recovery
        await AsyncStorage.setItem('user', JSON.stringify(newSession.user));
        
        // Fetch profile
        await fetchProfile(newSession.user.id);
      } 
      else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        console.log("[AuthContext] User signed out or deleted");
        setSession(null);
        setUser(null);
        setUserProfile(null);
        
        // Clear stored data
        await AsyncStorage.removeItem('user');
        await AsyncStorage.removeItem('userProfile');
      }
      else if (event === 'TOKEN_REFRESHED') {
        console.log("[AuthContext] Token refreshed for session");
        setSession(newSession);
        setUser(newSession.user);
      }
      
      setLoading(false);
    });

    return () => {
      console.log("[AuthContext] Cleaning up auth listener");
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Fetch user profile from Supabase
  async function fetchProfile(userId) {
    console.log("[AuthContext] Fetching profile for user ID:", userId);
    try {
      // Load profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("[AuthContext] Profile fetch error:", error);
        return null;
      }
      
      console.log("[AuthContext] Profile data received:", data ? "Success" : "No data");
      
      if (data) {
        setUserProfile(data);
        // Save profile in AsyncStorage for faster loading
        await AsyncStorage.setItem('userProfile', JSON.stringify(data));
        console.log("[AuthContext] Profile saved to AsyncStorage");
        return data;
      } else {
        console.log("[AuthContext] No profile data returned");
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error.message);
    }
    return null;
  }

  // Sign up function
  async function signUp(email, password, userData) {
    try {
      console.log("[AuthContext] Starting signup for:", email);
      // Using supabase client directly for the signUp method
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: userData,
          emailRedirectTo: 'unilert://login' // For mobile deep linking
        }
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Error signing up:', error.message);
      return { data: null, error };
    }
  }

  // Sign in function
  async function signIn(email, password) {
    try {
      console.log("[AuthContext] Signing in user:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      if (data?.user) {
        // Store user in AsyncStorage for recovery
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
      }
      
      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Error signing in:', error.message);
      return { data: null, error };
    }
  }

  // Sign out function
  async function signOut() {
    try {
      setLoading(true);
      console.log("[AuthContext] Signing out user");
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear profile data
      setUserProfile(null);
      setUser(null);
      setSession(null);
      await AsyncStorage.removeItem('userProfile');
      await AsyncStorage.removeItem('user');
      console.log("[AuthContext] User signed out and profile cleared");
      
      return { error: null };
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  }

  // Update profile function
  async function updateProfile(updates) {
    try {
      if (!user) throw new Error('No user logged in');
      
      console.log("[AuthContext] Updating profile for user:", user.id);
      
      // Create a complete updates object with all profile fields
      const completeUpdates = {
        // Start with existing profile data to ensure all fields are present
        ...(userProfile || {}),
        // Override with any fields passed in updates
        ...updates,
        // Ensure updated_at is set to now
        updated_at: new Date().toISOString()
      };
      
      console.log("[AuthContext] Sending profile updates to Supabase");
      
      const { data, error } = await supabase
        .from('profiles')
        .update(completeUpdates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) {
        console.error("[AuthContext] Profile update error:", error);
        throw error;
      }
      
      console.log("[AuthContext] Profile updated successfully");
      setUserProfile(data);
      await AsyncStorage.setItem('userProfile', JSON.stringify(data));
      
      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Error updating profile:', error.message);
      return { data: null, error };
    }
  }

  // Function to reset password
  async function resetPassword(email) {
    try {
      console.log("[AuthContext] Requesting password reset for:", email);
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'unilert://reset-password',
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('[AuthContext] Error resetting password:', error.message);
      return { data: null, error };
    }
  }

  // Context value
  const value = {
    user,
    session,
    userProfile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    fetchProfile // Include this to allow manual profile fetching
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};