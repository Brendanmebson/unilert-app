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

  useEffect(() => {
    // Check for existing session
    checkUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log(`Supabase auth event: ${event}`);
      setSession(newSession);
      setUser(newSession?.user ?? null);
      
      // When user signs in, fetch their profile
      if (event === 'SIGNED_IN' && newSession?.user) {
        await fetchProfile(newSession.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Check if there's a logged-in user
  async function checkUser() {
    try {
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
        throw error;
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

  // Sign out
  async function signOut() {
    try {
      setLoading(true);
      await supabase.auth.signOut();
      // Clear profile data
      setUserProfile(null);
      await AsyncStorage.removeItem('userProfile');
      console.log("User signed out and profile cleared");
    } catch (error) {
      console.error('Error signing out:', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Update profile
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
      return { success: true };
    } catch (error) {
      console.error('Error updating profile:', error.message);
      return { success: false, error };
    }
  }

  // Function to force refresh the profile
  async function refreshProfile() {
    if (user) {
      console.log("Force refreshing profile for user:", user.id);
      return await fetchProfile(user.id);
    }
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        userProfile,
        loading,
        signOut,
        updateProfile,
        refreshProfile
      }}
    >
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