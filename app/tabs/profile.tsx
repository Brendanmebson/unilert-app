import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  Image, 
  TouchableOpacity, 
  TextInput, 
  StyleSheet, 
  ScrollView, 
  Alert,
  ActivityIndicator,
  Modal,
  Platform,
  RefreshControl,
  DeviceEventEmitter
} from "react-native";
import { Ionicons, Entypo, MaterialIcons, Feather, FontAwesome } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import { uploadImage } from "../../lib/storage";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const auth = useAuth();
  
  // Add this debug log
  console.log("Profile screen rendering with userProfile:", auth.userProfile);

  const [menuVisible, setMenuVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Temporary state for editing
  const [tempData, setTempData] = useState({
    full_name: "",
    matric_no: "",
    phone_number: "",
    course: "",
    department: "",
    email: "",
    level: "",
    hall: "",
    profile_image_url: ""
  });
  
  // Helper function to update form with profile data
  const updateProfileForm = (profileData) => {
    if (!profileData) return;
    
    console.log("Updating profile form with data:", profileData.full_name);
    
    setTempData({
      full_name: profileData.full_name || "",
      matric_no: profileData.matric_no || "",
      phone_number: profileData.phone_number || "",
      course: profileData.course || "",
      department: profileData.department || "",
      email: profileData.email || "",
      level: profileData.level || "",
      hall: profileData.hall || "",
      profile_image_url: profileData.profile_image_url || "https://via.placeholder.com/100"
    });
  };
  
  // Direct access to AsyncStorage
  const forceLoadProfileFromStorage = async () => {
    try {
      setLoading(true);
      console.log("Attempting direct storage access");
      
      const storedProfile = await AsyncStorage.getItem('userProfile');
      if (storedProfile) {
        console.log("Found profile in storage:", storedProfile);
        const profileData = JSON.parse(storedProfile);
        
        // Update form data
        updateProfileForm(profileData);
        
        // Also try to update auth context
        if (typeof auth.updateProfile === 'function' && auth.user) {
          auth.updateProfile(profileData);
        }
        
        Alert.alert("Success", "Profile loaded directly from storage");
      } else {
        Alert.alert("No Data", "No profile data found in storage");
      }
    } catch (error) {
      console.error("Error loading from storage:", error);
      Alert.alert("Error", "Failed to load profile from storage");
    } finally {
      setLoading(false);
    }
  };

  // Initial data loading from all possible sources
  useEffect(() => {
    // Immediate function to load profile data from all possible sources
    const loadProfileData = async () => {
      console.log("Profile screen: Loading profile data from all sources");
      setLoading(true);
      
      try {
        // First check auth context
        if (auth?.userProfile) {
          console.log("Profile screen: Found data in auth context");
          updateProfileForm(auth.userProfile);
          setLoading(false);
          return;
        }
        
        // Then try AsyncStorage
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          const profileData = JSON.parse(storedProfile);
          console.log("Profile screen: Found data in AsyncStorage");
          updateProfileForm(profileData);
          
          // Also update auth context if possible
          if (auth?.updateProfile && auth.user) {
            console.log("Profile screen: Updating auth context with stored data");
            auth.updateProfile(profileData);
          }
          
          setLoading(false);
          return;
        }
        
        // If we have a user ID but no profile, fetch from Supabase
        if (auth?.user?.id) {
          console.log("Profile screen: Fetching profile from Supabase");
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', auth.user.id)
            .single();
            
          if (data && !error) {
            console.log("Profile screen: Successfully fetched from Supabase");
            updateProfileForm(data);
            
            // Save to AsyncStorage for future use
            await AsyncStorage.setItem('userProfile', JSON.stringify(data));
            
            // Update auth context
            if (auth?.updateProfile) {
              auth.updateProfile(data);
            }
            
            setLoading(false);
            return;
          }
        }
        
        // If all else fails, check for active session
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.user) {
          console.log("Profile screen: Found active session, fetching profile");
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', sessionData.session.user.id)
            .single();
            
          if (data && !error) {
            console.log("Profile screen: Successfully fetched from session");
            updateProfileForm(data);
            
            // Save for future use
            await AsyncStorage.setItem('userProfile', JSON.stringify(data));
            
            // If we have an active session but no user in auth context, fix it
            if (!auth.user && auth.refreshProfile) {
              console.log("Profile screen: Fixing auth context with session data");
              auth.refreshProfile();
            }
          }
        }
      } catch (error) {
        console.error("Profile screen: Error loading profile data:", error);
      } finally {
        setLoading(false);
      }
    };
    
    // Load profile data immediately
    loadProfileData();
  }, []);
  
  // Load user data whenever userProfile changes
  useEffect(() => {
    if (auth.userProfile) {
      console.log("Updating profile form with userProfile data from auth context:", auth.userProfile);
      updateProfileForm(auth.userProfile);
    }
  }, [auth.userProfile]);
  
  // Request permissions on component mount
  useEffect(() => {
    requestPermissions();
  }, []);
  
  // Pull to refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      console.log("Manually refreshing profile");
      if (typeof auth.refreshUserData === 'function') {
        const profile = await auth.refreshUserData();
        if (profile) {
          updateProfileForm(profile);
        }
      } else if (typeof auth.refreshProfile === 'function') {
        const profile = await auth.refreshProfile();
        if (profile) {
          updateProfileForm(profile);
        }
      } else {
        // Fallback to direct storage access
        await forceLoadProfileFromStorage();
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    } finally {
      setRefreshing(false);
    }
  };
  
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
      }
    }
  };
  
  // Function to upload an image to Supabase Storage
  const uploadProfileImage = async (uri) => {
    if (!uri || !auth.user) return null;
    
    try {
      setLoading(true);
      // Use the storage helper function
      return await uploadImage('profile-images', auth.user.id, uri);
    } catch (error) {
      console.error('Error uploading profile image:', error);
      Alert.alert('Upload Error', 'Failed to upload profile image. Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditToggle = () => {
    if (editing) {
      // If we're saving changes
      saveUserData();
    } else {
      // If we're starting to edit
      setEditing(true);
    }
  };
  
  const handleCancel = () => {
    if (auth.userProfile) {
      // Reset to current profile data
      updateProfileForm(auth.userProfile);
    }
    setEditing(false);
  };
  
  const saveUserData = async () => {
    try {
      // Validate inputs
      if (!tempData.full_name) {
        Alert.alert("Validation Error", "Name is required");
        return;
      }
  
      // Prepare the updates
      const updates = {
        full_name: tempData.full_name,
        phone_number: tempData.phone_number || null,
        course: tempData.course || null,
        department: tempData.department || null,
        level: tempData.level || null,
        hall: tempData.hall || null,
        matric_no: tempData.matric_no || null  // Keep existing matric number
      };
  
      // Save to AsyncStorage
      try {
        // Retrieve existing profile
        const existingProfileStr = await AsyncStorage.getItem('userProfile');
        const existingProfile = existingProfileStr ? JSON.parse(existingProfileStr) : {};
  
        // Merge updates
        const updatedProfile = {
          ...existingProfile,
          ...updates
        };
  
        // Save updated profile
        await AsyncStorage.setItem('userProfile', JSON.stringify(updatedProfile));

        DeviceEventEmitter.emit('storageChanged');

        
        // Update local state
        setTempData(updatedProfile);
  
        // Show success message
        Alert.alert("Success", "Profile updated successfully");
        setEditing(false);
      } catch (storageError) {
        console.error("Error saving profile to storage:", storageError);
        Alert.alert("Error", "Failed to save profile");
      }
    } catch (error) {
      console.error("Profile update error:", error);
      Alert.alert("Error", "Failed to update profile");
    }
  };
  
  const pickImage = async (source) => {
    setImagePickerVisible(false);
    
    try {
      let result;
      
      if (source === 'camera') {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
      }
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Update the temporary data with the image URI
        setTempData({
          ...tempData,
          profile_image_url: result.assets[0].uri
        });
        
        // Skip the auth check and proceed with the upload
        const dummyUserId = "temp_user_123"; // Create a temporary user ID
        
        // Modify this to save locally rather than trying to upload to Supabase
        // Or set up a mock auth object
        
        // Just update the local state and storage
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          const profileData = JSON.parse(storedProfile);
          profileData.profile_image_url = result.assets[0].uri; // Just use the local URI
          await AsyncStorage.setItem('userProfile', JSON.stringify(profileData));
          
          // Update UI
          DeviceEventEmitter.emit('storageChanged');
        }
        
        Alert.alert("Success", "Profile picture updated locally");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to select image. Please try again.");
    }
  };
  
  const handleTextChange = (field, value) => {
    setTempData({
      ...tempData,
      [field]: value
    });
  };
  
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: async () => {
            try {
              console.log("Logging out...");
              if (auth.signOut) {
                await auth.signOut();
              }
              router.replace("/login");
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // Redirect to appropriate screens if show flags are true
  if (showSettings) {
    router.push("/tabs/settings");
    return null;
  }
  
  if (showHelp) {
    router.push("/tabs/help");
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {loading && (
        <View style={[styles.loadingOverlay, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)' }]}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      )}
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: "#FFD700" }]}>Profile</Text>
        {/* Menu Icon */}
        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
          <Entypo name="menu" size={28} color={theme.text} />
        </TouchableOpacity>
        {/* Dropdown Menu */}
        {menuVisible && (
          <View style={[styles.dropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.dropdownItem, { borderBottomColor: theme.border }]} 
              onPress={() => {
                setMenuVisible(false);
                setShowSettings(true);
              }}
            >
              <Ionicons name="settings-outline" size={18} color={theme.text} />
              <Text style={[styles.dropdownText, { color: theme.text }]}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.dropdownItem, { borderBottomColor: theme.border }]} 
              onPress={() => {
                setMenuVisible(false);
                setShowHelp(true);
              }}
            >
              <Feather name="help-circle" size={18} color={theme.text} />
              <Text style={[styles.dropdownText, { color: theme.text }]}>Help</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
              <Feather name="log-out" size={18} color={theme.danger} />
              <Text style={[styles.dropdownText, {color: theme.danger}]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[theme.accent]}
            tintColor={theme.accent}
          />
        }
      >
        {/* Profile Picture */}
        <View style={styles.profileContainer}>
          <Image 
            source={{ 
              uri: editing 
                ? tempData.profile_image_url 
                : (tempData.profile_image_url || "https://via.placeholder.com/100") 
            }} 
            style={styles.profileImage} 
          />
          <TouchableOpacity 
            style={styles.editIcon}
            onPress={() => setImagePickerVisible(true)}
          >
            <Ionicons name="camera" size={22} color="white" />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.profileName, { color: theme.text }]}>
          {tempData.full_name || "User"}
        </Text>
        <Text style={[styles.profileRole, { color: theme.secondaryText }]}>Student</Text>
        
        {/* Debug Info */}
        {__DEV__ && (
          <View style={{padding: 10, margin: 10, backgroundColor: isDark ? '#333' : '#f0f0f0', borderRadius: 8}}>
            <Text style={{color: theme.text, fontWeight: 'bold'}}>Profile Debug Info:</Text>
            <Text style={{color: theme.text}}>Auth state: {auth?.user ? 'Logged in' : 'Not logged in'}</Text>
            <Text style={{color: theme.text}}>User ID: {auth?.user?.id || 'None'}</Text>
            <Text style={{color: theme.text}}>Auth profile: {auth?.userProfile ? 'Available' : 'Not available'}</Text>
            <Text style={{color: theme.text}}>Current name: {tempData.full_name || 'Not set'}</Text>
            <Text style={{color: theme.text}}>Current email: {tempData.email || 'Not set'}</Text>
            
            <View style={{flexDirection: 'row', marginTop: 10}}>
              <TouchableOpacity 
                style={{
                  padding: 8,
                  backgroundColor: '#0A356D',
                  borderRadius: 4,
                  alignItems: 'center',
                  flex: 1,
                  margin: 5
                }}
                onPress={forceLoadProfileFromStorage}
              >
                <Text style={{color: '#fff'}}>Load from Storage</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={{
                  padding: 8,
                  backgroundColor: '#4CAF50',
                  borderRadius: 4,
                  alignItems: 'center',
                  flex: 1,
                  margin: 5
                }}
                onPress={async () => {
                  try {
                    if (auth?.refreshProfile) {
                      const profile = await auth.refreshProfile();
                      if (profile) {
                        updateProfileForm(profile);
                        Alert.alert("Profile refreshed", "Successfully refreshed profile");
                      } else {
                        Alert.alert("Refresh failed", "Could not refresh profile");
                      }
                    } else {
                      Alert.alert("Not available", "refreshProfile not available");
                    }
                  } catch (e) {
                    Alert.alert("Error", "Failed to refresh: " + e.message);
                  }
                }}
              >
                <Text style={{color: '#fff'}}>Refresh Profile</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* User Details */}
        <View style={[styles.detailsContainer, { backgroundColor: theme.card }]}>
          <View style={styles.detailsHeader}>
            <Text style={[styles.detailsTitle, { color: theme.text }]}>Personal Information</Text>
            <View style={styles.actionButtons}>
              {editing && (
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleCancel}
                >
                  <Text style={[styles.cancelButtonText, { color: theme.secondaryText }]}>Cancel</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.editButton} 
                onPress={handleEditToggle}
              >
                <MaterialIcons name={editing ? "check" : "edit"} size={20} color="white" />
                <Text style={styles.editButtonText}>{editing ? "Save" : "Edit"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Info Fields */}
          <View style={styles.info}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>NAME:</Text>
            <View style={styles.valueContainer}>
              {editing ? (
                <TextInput 
                  style={[
                    styles.input, 
                    { 
                      color: theme.text, 
                      borderBottomColor: "#FFD700",
                      backgroundColor: 'transparent'
                    }
                  ]} 
                  value={tempData.full_name} 
                  onChangeText={(value) => handleTextChange('full_name', value)} 
                  editable={true}
                  placeholderTextColor={theme.secondaryText}
                  placeholder="Enter full name"
                />
              ) : (
                <Text style={[styles.value, { color: theme.text, borderBottomColor: theme.border }]}>
                  {tempData.full_name || 'Not specified'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.info}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>Matric No:</Text>
            <View style={styles.valueContainer}>
              {editing ? (
                <TextInput 
                  style={[
                    styles.input, 
                    styles.disabledInput,
                    { 
                      color: theme.text, 
                      borderBottomColor: theme.border,
                      backgroundColor: (theme.isDark ? '#333' : '#f0f0f0')
                    }
                  ]} 
                  value={tempData.matric_no} 
                  onChangeText={(value) => handleTextChange('matric_no', value)} 
                  editable={false}
                  placeholderTextColor={theme.secondaryText}
                  placeholder="Enter matric number"
                />
              ) : (
                <Text style={[styles.value, { color: theme.text, borderBottomColor: theme.border }]}>
                  {tempData.matric_no || 'Not specified'}
                </Text>
              )}
              {editing && (
                <Text style={[styles.helperText, { color: theme.secondaryText }]}>Matric number cannot be changed</Text>
              )}
            </View>
          </View>

          <View style={styles.info}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>Phone No:</Text>
            <View style={styles.valueContainer}>
              {editing ? (
                <TextInput 
                  style={[
                    styles.input,
                    { 
                      color: theme.text, 
                      borderBottomColor: "#FFD700",
                      backgroundColor: 'transparent'
                    }
                  ]} 
                  value={tempData.phone_number} 
                  onChangeText={(value) => handleTextChange('phone_number', value)} 
                  editable={true}
                  keyboardType="phone-pad"
                  placeholderTextColor={theme.secondaryText}
                  placeholder="Enter phone number"
                />
              ) : (
                <Text style={[styles.value, { color: theme.text, borderBottomColor: theme.border }]}>
                  {tempData.phone_number || 'Not specified'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.info}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>Email:</Text>
            <View style={styles.valueContainer}>
              {editing ? (
                <TextInput 
                  style={[
                    styles.input, 
                    styles.disabledInput,
                    { 
                      color: theme.text, 
                      borderBottomColor: theme.border,
                      backgroundColor: (theme.isDark ? '#333' : '#f0f0f0')
                    }
                  ]} 
                  value={tempData.email} 
                  onChangeText={(value) => handleTextChange('email', value)} 
                  editable={false}
                  keyboardType="email-address"
                  placeholderTextColor={theme.secondaryText}
                  placeholder="Enter email"
                />
              ) : (
                <Text style={[styles.value, { color: theme.text, borderBottomColor: theme.border }]}>
                  {tempData.email || 'Not specified'}
                </Text>
              )}
              {editing && (
                <Text style={[styles.helperText, { color: theme.secondaryText }]}>Email cannot be changed</Text>
              )}
            </View>
          </View>

          <View style={styles.info}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>Course:</Text>
            <View style={styles.valueContainer}>
              {editing ? (
                <TextInput 
                  style={[
                    styles.input,
                    { 
                      color: theme.text, 
                      borderBottomColor: "#FFD700",
                      backgroundColor: 'transparent'
                    }
                  ]} 
                  value={tempData.course} 
                  onChangeText={(value) => handleTextChange('course', value)} 
                  editable={true}
                  placeholderTextColor={theme.secondaryText}
                  placeholder="Enter course"
                />
              ) : (
                <Text style={[styles.value, { color: theme.text, borderBottomColor: theme.border }]}>
                  {tempData.course || 'Not specified'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.info}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>Department:</Text>
            <View style={styles.valueContainer}>
              {editing ? (
                <TextInput 
                  style={[
                    styles.input,
                    { 
                      color: theme.text, 
                      borderBottomColor: "#FFD700",
                      backgroundColor: 'transparent'
                    }
                  ]} 
                  value={tempData.department} 
                  onChangeText={(value) => handleTextChange('department', value)} 
                  editable={true}
                  placeholderTextColor={theme.secondaryText}
                  placeholder="Enter department"
                />
              ) : (
                <Text style={[styles.value, { color: theme.text, borderBottomColor: theme.border }]}>
                  {tempData.department || 'Not specified'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.info}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>Level:</Text>
            <View style={styles.valueContainer}>
              {editing ? (
                <TextInput 
                  style={[
                    styles.input,
                    { 
                      color: theme.text, 
                      borderBottomColor: "#FFD700",
                      backgroundColor: 'transparent'
                    }
                  ]} 
                  value={tempData.level} 
                  onChangeText={(value) => handleTextChange('level', value)} 
                  editable={true}
                  placeholderTextColor={theme.secondaryText}
                  placeholder="Enter level"
                />
              ) : (
                <Text style={[styles.value, { color: theme.text, borderBottomColor: theme.border }]}>
                  {tempData.level || 'Not specified'}
                </Text>
              )}
            </View>
          </View>

          <View style={styles.info}>
            <Text style={[styles.label, { color: theme.secondaryText }]}>Hall of Residence:</Text>
            <View style={styles.valueContainer}>
              {editing ? (
                <TextInput 
                  style={[
                    styles.input,
                    { 
                      color: theme.text, 
                      borderBottomColor: "#FFD700",
                      backgroundColor: 'transparent',
                    }
                  ]} 
                  value={tempData.hall} 
                  onChangeText={(value) => handleTextChange('hall', value)} 
                  editable={true}
                  placeholderTextColor={theme.secondaryText}
                  placeholder="Enter hall of residence"
                />
              ) : (
                <Text style={[styles.value, { color: theme.text, borderBottomColor: theme.border }]}>
                  {tempData.hall || 'Not specified'}
                </Text>
              )}
            </View>
          </View>
        </View>
        
        <View style={[styles.sectionContainer, { backgroundColor: theme.card }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Safety Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, { backgroundColor: '#4CAF50' }]}>
                <FontAwesome name="check" size={16} color="white" />
              </View>
              <Text style={[styles.statusText, { color: theme.text }]}>Emergency Contacts Verified</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, { backgroundColor: '#4CAF50' }]}>
                <FontAwesome name="check" size={16} color="white" />
              </View>
              <Text style={[styles.statusText, { color: theme.text }]}>Campus ID Card Active</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, { backgroundColor: '#FFC107' }]}>
                <Feather name="clock" size={16} color="white" />
              </View>
              <Text style={[styles.statusText, { color: theme.text }]}>Safety Training: 1 Module Pending</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, { backgroundColor: '#4CAF50' }]}>
                <FontAwesome name="check" size={16} color="white" />
              </View>
              <Text style={[styles.statusText, { color: theme.text }]}>Location Services Enabled</Text>
            </View>
          </View>
        </View>
        
        {/* Force Load Profile Button */}
        <TouchableOpacity
          style={{
            marginHorizontal: 20,
            marginTop: 20,
            padding: 15,
            backgroundColor: '#FF9800',
            borderRadius: 8,
            alignItems: 'center'
          }}
          onPress={forceLoadProfileFromStorage}
        >
          <Text style={{color: 'white', fontWeight: 'bold'}}>Force Load Profile Data</Text>
        </TouchableOpacity>
        
        <View style={styles.footer}>
          <Text style={[styles.versionText, { color: theme.secondaryText }]}>App Version 1.0.5</Text>
        </View>
      </ScrollView>
      
      {/* Image Picker Modal */}
      <Modal
        visible={imagePickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setImagePickerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setImagePickerVisible(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Change Profile Picture</Text>
            
            <TouchableOpacity 
              style={[styles.modalOption, { borderBottomColor: theme.border }]} 
              onPress={() => pickImage('camera')}
            >
              <Ionicons name="camera" size={24} color={theme.accent} />
              <Text style={[styles.modalOptionText, { color: theme.text }]}>Take a photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, { borderBottomColor: theme.border }]} 
              onPress={() => pickImage('gallery')}
            >
              <Ionicons name="images" size={24} color={theme.accent} />
              <Text style={[styles.modalOptionText, { color: theme.text }]}>Choose from gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setImagePickerVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: theme.danger }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// Just include a minimal set of styles needed for the component to work
const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginTop: 40,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderBottomWidth: 1,
    paddingBottom: 10
  },

  title: { 
    fontSize: 20, 
    fontWeight: "bold"
  },
  dropdown: {
    position: "absolute",
    top: 40,
    right: 10,
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
    width: 150,
    zIndex: 100,
    borderWidth: 1
  },
  dropdownItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12,
    borderBottomWidth: 1
  },
  dropdownText: { 
    marginLeft: 10, 
    fontSize: 14
  },
  profileContainer: { 
    alignItems: "center", 
    marginTop: 10 
  },
  profileImage: { 
    width: 120, 
    height: 120, 
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#FFD700"
  },
  editIcon: {
    position: "absolute",
    bottom: 5,
    right: 130,
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 50,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5
  },
  profileName: {
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 10
  },
  profileRole: {
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20
  },
  detailsContainer: { 
    marginTop: 10,
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  detailsHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center",
    marginBottom: 15
  },
  detailsTitle: { 
    fontSize: 18, 
    fontWeight: "bold"
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  editButton: {
    flexDirection: 'row',
    backgroundColor: '#FFD700',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2
  },
  editButtonText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: '600'
  },
  cancelButton: {
    marginRight: 10,
    padding: 6
  },
  cancelButtonText: {
    fontWeight: '500'
  },
  info: { 
    marginTop: 18
  },
  label: { 
    fontWeight: "bold", 
    fontSize: 14,
    marginBottom: 5
  },
  valueContainer: {
    marginTop: 2
  },
  value: { 
    fontSize: 16,
    paddingVertical: 8,
    borderBottomWidth: 1
  },
  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    paddingVertical: 8
  },
  disabledInput: {
    borderRadius: 4,
    paddingHorizontal: 5
  },
  helperText: {
    fontSize: 12,
    marginTop: 3,
    fontStyle: "italic"
  },
  sectionContainer: {
    marginTop: 25,
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15
  },
  statusContainer: {
    gap: 12
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  statusText: {
    fontSize: 14
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1
  },
  modalOptionText: {
    marginLeft: 15,
    fontSize: 16
  },
  modalCancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600'
  },
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10
  },
  versionText: {
    fontSize: 12
  }
});