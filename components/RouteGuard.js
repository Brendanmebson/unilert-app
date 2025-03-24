import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function RouteGuard({ children }) {
  const { user, loading, userProfile, refreshProfile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasLocalUser, setHasLocalUser] = useState(false);
  const [hasCheckedSession, setHasCheckedSession] = useState(false);

  // Check for stored user on mount
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        setHasLocalUser(!!storedUser);
        
        // Check for active session directly
        const { data } = await supabase.auth.getSession();
        setHasCheckedSession(true);
        
        if (data?.session && !user && refreshProfile) {
          console.log("RouteGuard: Found active session but no user in context, refreshing profile");
          await refreshProfile();
        }
      } catch (error) {
        console.error("RouteGuard: Error checking stored user:", error);
        setHasCheckedSession(true);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkStoredUser();
  }, []);

  useEffect(() => {
    if (loading || isChecking || !hasCheckedSession) return;

    console.log("RouteGuard check - User:", user ? "Authenticated" : "Not authenticated");
    console.log("RouteGuard check - Current route:", segments.join('/'));
    console.log("RouteGuard check - UserProfile:", userProfile ? "Available" : "Not available");
    console.log("RouteGuard check - HasLocalUser:", hasLocalUser);

    const isLoginOrSignup = segments[0] === 'login' || segments[0] === 'signup';
    const isRoot = segments.length === 0 || segments[0] === 'index';
    
    const checkAuth = async () => {
      // Force check for active session first
      const { data } = await supabase.auth.getSession();
      const hasActiveSession = !!data?.session;
      
      console.log("RouteGuard: Active session check:", hasActiveSession);
      
      // If no user but we have active session, fix auth state
      if (!user && hasActiveSession) {
        console.log("RouteGuard: Fixing auth state with active session");
        if (refreshProfile) {
          await refreshProfile();
          return; // Exit and let the next cycle handle routing
        }
      }
      
      // Only redirect if we're confident user is not logged in
      if (!user && !hasActiveSession && !hasLocalUser && !isLoginOrSignup && !isRoot) {
        console.log("RouteGuard: Confirmed not logged in, redirecting to login");
        router.replace('/login');
      } else if (user && (isLoginOrSignup || isRoot)) {
        console.log("RouteGuard: Logged in user trying to access login/signup, redirecting to dashboard");
        router.replace('/tabs/dashboard');
      }
    };
    
    checkAuth();
  }, [user, loading, segments, isChecking, hasCheckedSession, hasLocalUser]);

  // Show a loading indicator while checking authentication
  if (loading || isChecking || !hasCheckedSession) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0A356D" />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading your profile...</Text>
      </View>
    );
  }

  return <>{children}</>;
}