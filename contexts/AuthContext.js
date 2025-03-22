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
    checkUser();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`Supabase auth event: ${event}`);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      // When user signs in, fetch their profile
      if (event === 'SIGNED_IN' && newSession?.user) {
        await fetchProfile(newSession.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUserProfile(null);
        await AsyncStorage.removeItem('userProfile');
      }
      
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Check for existing session
  async function checkUser() {
    try {
      setLoading(true);
      const { data } = await supabase.auth.getSession();
      console.log("Session check result:", data.session ? "Found session" : "No session");
      
      setSession(data.session);
      setUser(data.session?.user ?? null);
      
      if (data.session?.user) {
        console.log("User found in session, fetching profile for ID:", data.session.user.id);
        await fetchProfile(data.session.user.id);
      } else {
        // Try to load from AsyncStorage if no active session
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          console.log("Found profile in AsyncStorage");
          setUserProfile(JSON.parse(storedProfile));
        }
      }
    } catch (error) {
      console.error('Error checking user:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Fetch user profile from Supabase
  async function fetchProfile(userId) {
    console.log("Fetching profile for user ID:", userId);
    try {
      // Load profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("Supabase profile fetch error:", error);
        return null;
      }
      
      console.log("Profile data received:", data);
      
      if (data) {
        setUserProfile(data);
        // Save profile in AsyncStorage for faster loading
        await AsyncStorage.setItem('userProfile', JSON.stringify(data));
        console.log("Profile saved to AsyncStorage and state");
        return data;
      } else {
        console.log("No profile data returned from Supabase");
      }
    } catch (error) {
      console.error('Error fetching profile:', error.message);
    }
    return null;
  }

  // Sign up function
  async function signUp(email, password, userData) {
    try {
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
      console.error('Error signing up:', error.message);
      return { data: null, error };
    }
  }

  // Sign in function
  async function signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error signing in:', error.message);
      return { data: null, error };
    }
  }

  // Sign out function
  async function signOut() {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Clear profile data
      setUserProfile(null);
      await AsyncStorage.removeItem('userProfile');
      console.log("User signed out and profile cleared");
      
      return { error: null };
    } catch (error) {
      console.error('Error signing out:', error.message);
      return { error };
    } finally {
      setLoading(false);
    }
  }

  // Update profile function
  async function updateProfile(updates) {
    try {
      if (!user) throw new Error('No user logged in');
      
      console.log("Updating profile with:", updates);
      
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      
      console.log("Profile updated successfully:", data);
      setUserProfile(data);
      await AsyncStorage.setItem('userProfile', JSON.stringify(data));
      
      return { data, error: null };
    } catch (error) {
      console.error('Error updating profile:', error.message);
      return { data: null, error };
    }
  }

  // Function to reset password
  async function resetPassword(email) {
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'unilert://reset-password',
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error('Error resetting password:', error.message);
      return { data: null, error };
    }
  }

  // In AuthContext.js - update the refreshProfile function for better debugging
async function refreshProfile() {
  if (user) {
    console.log("Force refreshing profile for user:", user.id);
    const profile = await fetchProfile(user.id);
    console.log("Refreshed profile data:", profile);
    return profile;
  }
  return null;
}

// Fetch user profile
async function fetchProfile(userId) {
  console.log("Fetching profile for user ID:", userId);
  try {
    // Load profile from Supabase
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (error) {
      console.error("Supabase profile fetch error:", error);
      return null;
    }
    
    console.log("Profile data received:", data);
    
    if (data) {
      setUserProfile(data);
      // Save profile in AsyncStorage for faster loading
      await AsyncStorage.setItem('userProfile', JSON.stringify(data));
      console.log("Profile saved to AsyncStorage and state");
      return data;
    } else {
      console.log("No profile data returned from Supabase");
    }
  } catch (error) {
    console.error('Error fetching profile:', error.message);
    Alert.alert(
      "Profile Error", 
      "There was an error fetching your profile. Please try logging in again."
    );
  }
  return null;
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
    refreshProfile
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
