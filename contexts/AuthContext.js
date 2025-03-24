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
  const [initialized, setInitialized] = useState(false);

  // Add this effect to ensure data is loaded from storage
  useEffect(() => {
    const loadUserFromStorage = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedProfile = await AsyncStorage.getItem('userProfile');
        
        if (storedUser) {
          console.log("[AuthContext] Loading user from storage");
          setUser(JSON.parse(storedUser));
        }
        
        if (storedProfile) {
          console.log("[AuthContext] Loading profile from storage");
          setUserProfile(JSON.parse(storedProfile));
        }
      } catch (error) {
        console.error("[AuthContext] Error loading from storage:", error);
      }
    };
    
    loadUserFromStorage();
  }, []);

  // Check user on mount
  useEffect(() => {
    console.log("[AuthContext] Initializing");
    
    const initializeAuth = async () => {
      try {
        setLoading(true);
        console.log("[AuthContext] Checking for existing session");
        
        // Get current session from Supabase
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AuthContext] Session error:", error);
          setLoading(false);
          return;
        }
        
        // If we have an active session, use it
        if (data?.session) {
          console.log("[AuthContext] Found active session for user:", data.session.user.id);
          setSession(data.session);
          setUser(data.session.user);
          
          // Store user in AsyncStorage for recovery
          await AsyncStorage.setItem('user', JSON.stringify(data.session.user));
          
          // Fetch profile
          await fetchProfile(data.session.user.id);
        } else {
          console.log("[AuthContext] No active session found, checking storage");
          
          // Try to recover from AsyncStorage
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            console.log("[AuthContext] Found user in AsyncStorage:", userData.id);
            
            // Set user from storage immediately 
            setUser(userData);
            
            // Load profile from storage
            const storedProfile = await AsyncStorage.getItem('userProfile');
            if (storedProfile) {
              setUserProfile(JSON.parse(storedProfile));
            }
            
            // Try to refresh the session with Supabase
            console.log("[AuthContext] Attempting to refresh session with Supabase");
            const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshData?.session) {
              console.log("[AuthContext] Session refreshed successfully");
              setSession(refreshData.session);
              setUser(refreshData.session.user);
            } else {
              console.log("[AuthContext] Session refresh failed:", refreshError?.message);
              // Even if refresh fails, we'll still use the stored user data
              // so the app shows the user as logged in
            }
          } else {
            console.log("[AuthContext] No stored user found");
          }
        }
      } catch (error) {
        console.error("[AuthContext] Initialization error:", error);
      } finally {
        setLoading(false);
        setInitialized(true);
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
      // First try to load from AsyncStorage for faster access
      let profileData = null;
      
      try {
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          profileData = JSON.parse(storedProfile);
          console.log("[AuthContext] Loaded profile from AsyncStorage:", profileData.full_name);
          // Set profile from storage immediately while fetching fresh data
          setUserProfile(profileData);
        }
      } catch (storageError) {
        console.error("[AuthContext] Error loading profile from storage:", storageError);
      }
      
      // Load profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("[AuthContext] Profile fetch error:", error);
        
        // If we loaded a profile from storage earlier, keep using that
        if (profileData) {
          console.log("[AuthContext] Using profile from storage due to fetch error");
          return profileData;
        }
        return null;
      }
      
      console.log("[AuthContext] Profile data received from Supabase:", data ? "Success" : "No data");
      
      if (data) {
        setUserProfile(data);
        // Save profile in AsyncStorage for faster loading
        await AsyncStorage.setItem('userProfile', JSON.stringify(data));
        console.log("[AuthContext] Fresh profile saved to AsyncStorage");
        return data;
      } else {
        console.log("[AuthContext] No profile data returned");
        
        // If no profile from Supabase but we have one from storage, use that
        if (profileData) {
          console.log("[AuthContext] Using profile from storage as fallback");
          return profileData;
        }
      }
    } catch (error) {
      console.error('[AuthContext] Error fetching profile:', error.message);
    }
    return null;
  }

  // Refresh profile - explicit method to refresh profile data
  async function refreshProfile() {
    console.log("[AuthContext] Explicitly refreshing profile");
    try {
      // Always try to use current user first
      if (user) {
        console.log("[AuthContext] Using existing user to refresh profile");
        return await fetchProfile(user.id);
      }
      
      // If no user object, check for session
      console.log("[AuthContext] No user, checking for session");
      const { data } = await supabase.auth.getSession();
      
      if (data?.session) {
        console.log("[AuthContext] Found session, setting user:", data.session.user.id);
        setUser(data.session.user);
        setSession(data.session);
        
        return await fetchProfile(data.session.user.id);
      }
      
      // If no session, try stored user
      console.log("[AuthContext] No active session found during refresh, checking storage");
      
      try {
        const storedUser = await AsyncStorage.getItem('user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          console.log("[AuthContext] Found user in storage during refresh:", userData.id);
          setUser(userData);
          
          // Try to fetch profile for this user
          const profile = await fetchProfile(userData.id);
          if (profile) {
            return profile;
          }
        }
      } catch (error) {
        console.error("[AuthContext] Error loading from storage:", error);
      }
      
      // If all else fails, try to get stored profile directly
      try {
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          const profileData = JSON.parse(storedProfile);
          console.log("[AuthContext] Using stored profile as last resort");
          setUserProfile(profileData);
          return profileData;
        }
      } catch (error) {
        console.error("[AuthContext] Error loading profile from storage:", error);
      }
      
      return null;
    } catch (error) {
      console.error("[AuthContext] Error refreshing profile:", error);
      return null;
    }
  }

  // New method to refresh all user data
  async function refreshUserData() {
    try {
      // Try to get current user first
      if (!user) {
        console.log("[AuthContext] No user in context, checking for session");
        const { data } = await supabase.auth.getSession();
        
        if (data?.session) {
          console.log("[AuthContext] Found session, setting user:", data.session.user.id);
          setUser(data.session.user);
          setSession(data.session);
        } else {
          console.log("[AuthContext] No active session found");
          
          // Try stored user
          const storedUser = await AsyncStorage.getItem('user');
          if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
          } else {
            console.log("[AuthContext] No stored user found");
            return null;
          }
        }
      }
      
      // Use whatever user ID we have available
      const userId = user?.id;
      if (!userId) {
        console.log("[AuthContext] No valid user ID available after checks");
        return null;
      }
      
      // Now fetch the latest profile data
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
        
      if (error) {
        console.error("[AuthContext] Error fetching fresh profile data:", error);
        
        // Try to get stored profile
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          const profileData = JSON.parse(storedProfile);
          setUserProfile(profileData);
          return profileData;
        }
        
        return null;
      }
      
      if (data) {
        // Update context state
        setUserProfile(data);
        // Update local storage
        await AsyncStorage.setItem('userProfile', JSON.stringify(data));
        console.log("[AuthContext] User data refreshed successfully");
        return data;
      }
      
      return null;
    } catch (error) {
      console.error("[AuthContext] Error in refreshUserData:", error);
      return null;
    }
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
        setUser(data.user);
        setSession(data.session);
        
        // Fetch and store profile
        await fetchProfile(data.user.id);
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
      // Get user ID from various sources
      let userId = null;
      
      if (user) {
        userId = user.id;
      } else {
        // Try to get from stored profile
        try {
          const storedProfile = await AsyncStorage.getItem('userProfile');
          if (storedProfile) {
            const profileData = JSON.parse(storedProfile);
            userId = profileData.id;
          }
        } catch (e) {
          console.error("[AuthContext] Error getting profile ID:", e);
        }
        
        // If still no user ID, try stored user
        if (!userId) {
          try {
            const storedUser = await AsyncStorage.getItem('user');
            if (storedUser) {
              const userData = JSON.parse(storedUser);
              userId = userData.id;
            }
          } catch (e) {
            console.error("[AuthContext] Error getting user ID:", e);
          }
        }
      }
      
      if (!userId) {
        throw new Error('No user ID available for profile update');
      }
      
      console.log("[AuthContext] Updating profile for user:", userId);
      
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
        .eq('id', userId)
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

  // Force check session function
  async function checkSession() {
    try {
      console.log("[AuthContext] Performing force session check");
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error("[AuthContext] Force session check error:", error);
        return false;
      }
      
      if (data?.session) {
        console.log("[AuthContext] Force check found active session");
        setSession(data.session);
        setUser(data.session.user);
        
        // Ensure AsyncStorage is up to date
        await AsyncStorage.setItem('user', JSON.stringify(data.session.user));
        
        return true;
      }
      
      console.log("[AuthContext] Force check found no active session");
      return false;
    } catch (e) {
      console.error("[AuthContext] Force session check exception:", e);
      return false;
    }
  }

  // Context value
  const value = {
    user,
    session,
    userProfile,
    loading,
    initialized,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    refreshProfile,
    refreshUserData,
    fetchProfile,
    checkSession,
    // Add these functions to allow direct manipulation if needed
    setUser: (userData) => {
      console.log("[AuthContext] Directly setting user:", userData?.id);
      setUser(userData);
    },
    setSession: (sessionData) => {
      console.log("[AuthContext] Directly setting session");
      setSession(sessionData);
    },
    setUserProfile: (profileData) => {
      console.log("[AuthContext] Directly setting profile");
      setUserProfile(profileData);
      if (profileData) {
        AsyncStorage.setItem('userProfile', JSON.stringify(profileData))
          .catch(e => console.error("[AuthContext] Error saving profile to storage:", e));
      }
    }
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