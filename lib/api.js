import { supabase } from './supabase';

/**
 * API functions for reports
 */
export const reportsApi = {
  /**
   * Submit a new incident report
   * @param {Object} reportData - The report data
   * @returns {Promise<Object>} - The response with data and error
   */
  submitReport: async (reportData) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .insert([reportData])
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error submitting report:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Get user's reports
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - The response with data and error
   */
  getUserReports: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching user reports:', error);
      return { data: null, error };
    }
  }
};

/**
 * API functions for emergency alerts
 */
export const emergencyApi = {
  /**
   * Submit a new emergency alert
   * @param {Object} alertData - The alert data
   * @returns {Promise<Object>} - The response with data and error
   */
  submitAlert: async (alertData) => {
    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .insert([alertData])
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error submitting emergency alert:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Get user's emergency alerts
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - The response with data and error
   */
  getUserAlerts: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching user alerts:', error);
      return { data: null, error };
    }
  }
};

/**
 * API functions for alerts and safety updates
 */
export const alertsApi = {
  /**
   * Get campus-wide alerts
   * @param {number} limit - Maximum number of alerts to return
   * @returns {Promise<Object>} - The response with data and error
   */
  getAlerts: async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching alerts:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Get safety updates
   * @param {number} limit - Maximum number of updates to return
   * @returns {Promise<Object>} - The response with data and error
   */
  getSafetyUpdates: async (limit = 10) => {
    try {
      const { data, error } = await supabase
        .from('safety_updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching safety updates:', error);
      return { data: null, error };
    }
  }
};

/**
 * API functions for user profiles
 */
export const profilesApi = {
  /**
   * Get a user profile by ID
   * @param {string} userId - The user ID
   * @returns {Promise<Object>} - The response with data and error
   */
  getProfile: async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Update a user profile
   * @param {string} userId - The user ID
   * @param {Object} updates - The profile updates
   * @returns {Promise<Object>} - The response with data and error
   */
  updateProfile: async (userId, updates) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { data: null, error };
    }
  },
  
  /**
   * Create a new user profile
   * @param {Object} profileData - The profile data
   * @returns {Promise<Object>} - The response with data and error
   */
  createProfile: async (profileData) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .insert([profileData])
        .select()
        .single();
      
      return { data, error };
    } catch (error) {
      console.error('Error creating profile:', error);
      return { data: null, error };
    }
  }
};