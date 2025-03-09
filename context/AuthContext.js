import React, { createContext, useState, useEffect, useContext } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    // Check active sessions and sets the user
    const getUser = async () => {
      setLoading(true);
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }
        
        if (session) {
          setSession(session);
          setUser(session.user);
          // Fetch user profile data
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error getting session:', error.message);
      } finally {
        setLoading(false);
      }
    };

    getUser();

    // Listen for changes on auth state (login, signup, logout)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        } else {
          setUser(null);
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      if (authListener) authListener.subscription.unsubscribe();
    };
  }, []);

  // Fetch user's profile from profiles table
  const fetchUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setUserProfile(data);
        // Also store in AsyncStorage for offline access
        await AsyncStorage.setItem('userProfile', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error fetching user profile:', error.message);
    }
  };

  // Sign in with email and password
  const signIn = async (email, password) => {
    setLoading(true);
    setAuthError(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
      
      return { success: true };
    } catch (error) {
      setAuthError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, userData) => {
    setLoading(true);
    setAuthError(null);

    try {
      // 1. Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data?.user) {
        // 2. Create profile record with user details
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([
            { 
              id: data.user.id,
              fullname: userData.fullname,
              matricNo: userData.matricNo,
              phoneNo: userData.phoneNo || "",
              course: userData.course || "",
              department: userData.department || "",
              email: email,
              level: userData.level || '100 Level',
              created_at: new Date()
            }
          ]);

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }
      
      return { success: true };
    } catch (error) {
      setAuthError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        throw error;
      }
      
      // Update local state
      setUserProfile({...userProfile, ...updates});
      
      // Update AsyncStorage
      const updated = {...userProfile, ...updates};
      await AsyncStorage.setItem('userProfile', JSON.stringify(updated));
      
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign out the user
  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      // Clear local storage
      await AsyncStorage.removeItem('userProfile');
      setUser(null);
      setUserProfile(null);
    } catch (error) {
      console.error('Error signing out:', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userProfile, 
      loading, 
      authError,
      signIn, 
      signUp, 
      signOut, 
      updateProfile,
      refreshProfile: () => fetchUserProfile(user?.id)
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}