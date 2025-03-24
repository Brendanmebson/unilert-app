import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// This component checks if the user is authenticated
// If not, it redirects to the login page
export function RouteGuard({ children }) {
  const { user, loading, userProfile, refreshProfile } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasLocalUser, setHasLocalUser] = useState(false);

  // Check for stored user on mount
  useEffect(() => {
    const checkStoredUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        setHasLocalUser(!!storedUser);
      } catch (error) {
        console.error("RouteGuard: Error checking stored user:", error);
      } finally {
        setIsChecking(false);
      }
    };
    
    checkStoredUser();
  }, []);

  useEffect(() => {
    if (loading || isChecking) return; // Don't do anything while loading

    console.log("RouteGuard check - User:", user ? "Authenticated" : "Not authenticated");
    console.log("RouteGuard check - Current route:", segments.join('/'));
    console.log("RouteGuard check - UserProfile:", userProfile ? "Available" : "Not available");
    console.log("RouteGuard check - HasLocalUser:", hasLocalUser);

    const isLoginOrSignup = segments[0] === 'login' || segments[0] === 'signup';
    const isRoot = segments.length === 0 || segments[0] === 'index';
    
    const checkSession = async () => {
      // If no user but we're not on login screen, double-check session directly
      if (!user && !isLoginOrSignup && !isRoot) {
        console.log("RouteGuard: No user detected, checking session directly");
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session) {
            console.log("RouteGuard: Found active session, keeping on current page");
            
            // If we have a session but no user in context, refresh the profile
            if (refreshProfile) {
              console.log("RouteGuard: Refreshing profile from active session");
              await refreshProfile();
            }
            return; // Keep on current page if there's an active session
          } else if (hasLocalUser) {
            console.log("RouteGuard: No active session, but has local user. Attempting to refresh");
            
            // Try to refresh the session using stored user credentials
            const { data: refreshData } = await supabase.auth.refreshSession();
            
            if (refreshData?.session) {
              console.log("RouteGuard: Session refreshed successfully, keeping on current page");
              if (refreshProfile) {
                await refreshProfile();
              }
              return; // Keep on current page if session was refreshed
            } else {
              console.log("RouteGuard: Failed to refresh session, redirecting to login");
              router.replace('/login');
            }
          } else {
            console.log("RouteGuard: No active session or stored user, redirecting to login");
            router.replace('/login');
          }
        } catch (error) {
          console.error("RouteGuard: Error checking session:", error);
          router.replace('/login');
        }
      } else if (user && (isLoginOrSignup || isRoot)) {
        // User is signed in and trying to access login/signup
        console.log("RouteGuard: Redirecting to dashboard because user is already authenticated");
        router.replace('/tabs/dashboard');
      }
    };
    
    checkSession();
  }, [user, loading, segments, userProfile, isChecking, hasLocalUser]);

  // Show a loading indicator while checking authentication
  if (loading || isChecking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0A356D" />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading your profile...</Text>
      </View>
    );
  }

  return <>{children}</>;
}