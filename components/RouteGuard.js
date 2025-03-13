import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';

// This component checks if the user is authenticated
// If not, it redirects to the login page
export function RouteGuard({ children }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading) return; // Don't do anything while loading

    const inAuthGroup = segments[0] === '(auth)';
    const isLoginOrSignup = segments[0] === 'login' || segments[0] === 'signup';
    const isRoot = segments.length === 0;
    
    if (!user && !isLoginOrSignup && !isRoot) {
      // User is not signed in and not on login/signup screen
      router.replace('/login');
    } else if (user && (isLoginOrSignup || isRoot)) {
      // User is signed in and trying to access login/signup
      router.replace('/tabs/dashboard');
    }
  }, [user, loading, segments]);

  // Show a loading indicator while checking authentication
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0A356D" />
      </View>
    );
  }

  return <>{children}</>;
}