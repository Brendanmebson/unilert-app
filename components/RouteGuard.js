import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function RouteGuard({ children }) {
  const { user, loading, userProfile, refreshProfile, checkSession } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(false);
  
  // This effect is only to help navigate away from login/signup screens if needed
  // You can comment this out if you need to access those screens
  useEffect(() => {
    const isLoginOrSignup = segments[0] === 'login' || segments[0] === 'signup';
    const isRoot = segments.length === 0 || segments[0] === 'index';
    const isResetPassword = segments[0] === 'reset-password';
    
    // Don't redirect from reset password
    if (!isResetPassword && (isLoginOrSignup || isRoot)) {
      console.log("RouteGuard: User appears to be logged in, redirecting to dashboard");
      router.replace('/tabs/dashboard');
    }
  }, [segments]);

  // Simply render children - bypass all authentication checks
  return <>{children}</>;
}