import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

// This component checks if the user is authenticated
// If not, it redirects to the login page
export function RouteGuard({ children }) {
  const { user, loading, userProfile } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    console.log("RouteGuard check - User:", user ? "Authenticated" : "Not authenticated");
    console.log("RouteGuard check - Current route:", segments.join('/'));
    console.log("RouteGuard check - UserProfile:", userProfile ? "Available" : "Not available");

    const inAuthGroup = segments[0] === '(auth)';
    const isLoginOrSignup = segments[0] === 'login' || segments[0] === 'signup';
    const isRoot = segments.length === 0;
    
    if (!user && !isLoginOrSignup && !isRoot) {
      // User is not signed in and not on login/signup screen
      console.log("RouteGuard: Redirecting to login because user is not authenticated");
      router.replace('/login');
    } else if (user && (isLoginOrSignup || isRoot)) {
      // User is signed in and trying to access login/signup
      console.log("RouteGuard: Redirecting to dashboard because user is already authenticated");
      router.replace('/tabs/dashboard');
    }
  }, [user, loading, segments, userProfile]);

  // Show a loading indicator while checking authentication
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0A356D" />
        <Text style={{ marginTop: 10, color: "#666" }}>Loading your profile...</Text>
      </View>
    );
  }

  return <>{children}</>;
}