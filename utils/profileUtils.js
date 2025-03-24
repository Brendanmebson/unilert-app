import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

// Function to load profile from all available sources
export async function loadUserProfileFromAllSources(auth) {
  try {
    // Try auth context first
    if (auth?.userProfile) {
      return auth.userProfile;
    }
    
    // Try AsyncStorage next
    const storedProfile = await AsyncStorage.getItem('userProfile');
    if (storedProfile) {
      return JSON.parse(storedProfile);
    }
    
    // Try Supabase if we have auth user
    if (auth?.user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', auth.user.id)
        .single();
        
      if (data && !error) {
        // Store for future use
        await AsyncStorage.setItem('userProfile', JSON.stringify(data));
        return data;
      }
    }
    
    // Try to get from active session
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session?.user) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();
        
      if (data && !error) {
        // Store for future use
        await AsyncStorage.setItem('userProfile', JSON.stringify(data));
        return data;
      }
    }
    
    return null;
  } catch (error) {
    console.error("[profileUtils] Error loading profile:", error);
    return null;
  }
}