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
  Platform
} from "react-native";
import { Ionicons, Entypo, MaterialIcons, Feather, FontAwesome } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";

export default function ProfileScreen() {
  const navigation = useNavigation();
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
  
  // Load user data whenever userProfile changes
  useEffect(() => {
    if (auth.userProfile) {
      console.log("Updating profile form with userProfile data:", auth.userProfile);
      setTempData({
        full_name: auth.userProfile.full_name || "Mebuge Kamsiyochukwu",
        matric_no: auth.userProfile.matric_no || "21/1367",
        phone_number: auth.userProfile.phone_number || "+2348155230994",
        course: auth.userProfile.course || "Software Engineering",
        department: auth.userProfile.department || "Software Engineering",
        email: auth.userProfile.email || "mebuge3151@student.babcock.edu.ng",
        level: auth.userProfile.level || "400",
        hall: auth.userProfile.hall || "Emerald Hall",
        profile_image_url: auth.userProfile.profile_image_url || "https://via.placeholder.com/100"
      });
    } else {
      // Add mock data when no profile exists
      setTempData({
        full_name: "Mebuge Kamsiyochukwu",
        matric_no: "21/1367",
        phone_number:"+2348155230994",
        course: "Software Engineering",
        department: "Software Engineering",
        email: "mebuge3151@student.babcock.edu.ng",
        level: "400",
        hall: "Emerald Hall",
        profile_image_url: "https://ui-avatars.com/api/?name=Emmanuel+James&background=0D8ABC&color=fff&size=128"
      });
    }
  }, [auth.userProfile]);
  
  // Request permissions on component mount
  useEffect(() => {
    requestPermissions();
  }, []);
  
  // Add refresh on screen focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log("Profile screen focused, refreshing profile");
      if (typeof auth.refreshProfile === 'function') {
        auth.refreshProfile();
      }
    });

    return unsubscribe;
  }, [navigation]);
  
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
      }
    }
  };
  
  // Function to upload an image to Supabase Storage
  const uploadImage = async (uri) => {
    if (!uri) return null;
    
    try {
      setLoading(true);
      
      // Get the file name from the URI
      const fileName = uri.split('/').pop();
      // Get the file extension
      const fileExt = fileName.split('.').pop();
      // Create a unique file name to prevent overwriting
      const filePath = `${Date.now()}.${fileExt}`;
      
      // Convert the image to a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      console.log("Uploading image to Supabase storage...");
      
      // Upload the image to Supabase Storage
      const { data, error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true
        });
      
      if (error) throw error;
      
      // Get the public URL of the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);
      
      console.log("Image uploaded successfully, URL:", publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
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
      setTempData({...tempData});
      setEditing(true);
    }
  };
  
  const handleCancel = () => {
    if (auth.userProfile) {
      // Reset to current profile data
      setTempData({
        full_name: auth.userProfile.full_name || "Emmanuel James",
        matric_no: auth.userProfile.matric_no || "BU/22/CSC/1234",
        phone_number: auth.userProfile.phone_number || "+2348012345678",
        course: auth.userProfile.course || "Computer Science",
        department: auth.userProfile.department || "Computer Science & Mathematics",
        email: auth.userProfile.email || "emmanuel.james@student.babcock.edu.ng",
        level: auth.userProfile.level || "300",
        hall: auth.userProfile.hall || "Nelson Mandela Hall",
        profile_image_url: auth.userProfile.profile_image_url || "https://ui-avatars.com/api/?name=Emmanuel+James&background=0D8ABC&color=fff&size=128"
      });
    } else {
      // Reset to mock data if no profile
      setTempData({
        full_name: "Emmanuel James",
        matric_no: "BU/22/CSC/1234",
        phone_number: "+2348012345678",
        course: "Computer Science",
        department: "Computer Science & Mathematics",
        email: "emmanuel.james@student.babcock.edu.ng",
        level: "300",
        hall: "Nelson Mandela Hall",
        profile_image_url: "https://ui-avatars.com/api/?name=Emmanuel+James&background=0D8ABC&color=fff&size=128"
      });
    }
    setEditing(false);
  };
  
  const saveUserData = async () => {
    try {
      setLoading(true);
      
      // Validate inputs
      if (!tempData.full_name) {
        Alert.alert("Validation Error", "Name is required");
        setLoading(false);
        return;
      }
      
      let imageUrl = tempData.profile_image_url;
      
      // Check if image needs to be uploaded (if it's a local URI)
      if (tempData.profile_image_url && !tempData.profile_image_url.startsWith('http')) {
        console.log("Uploading new profile image from local URI");
        const uploadedUrl = await uploadImage(tempData.profile_image_url);
        if (uploadedUrl) {
          imageUrl = uploadedUrl;
        }
      }
      
      // Prepare update data
      const updates = {
        full_name: tempData.full_name,
        phone_number: tempData.phone_number || null,
        hall: tempData.hall || null,
        profile_image_url: imageUrl
      };
      
      // Only include fields that can be edited by the user
      if (!auth.userProfile?.course) updates.course = tempData.course || null;
      if (!auth.userProfile?.department) updates.department = tempData.department || null;
      if (!auth.userProfile?.level) updates.level = tempData.level || null;
      
      console.log("Saving profile with updates:", updates);
      
      // Update profile in Supabase
      if (auth.updateProfile) {
        const result = await auth.updateProfile(updates);
        
        if (result.error) throw result.error;
        
        // Refresh the profile data
        if (typeof auth.refreshProfile === 'function') {
          await auth.refreshProfile();
        }
      } else {
        // Handle case where auth.updateProfile might not be available
        console.log("Profile would be updated with:", updates);
      }
      
      setEditing(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error saving user data:", error.message);
      Alert.alert("Update Error", "Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
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
      
      if (!result.canceled) {
        console.log("Image picked successfully");
        // Update the temporary data with the image URI
        setTempData({
          ...tempData,
          profile_image_url: result.assets[0].uri
        });
        
        // If not in editing mode, save immediately
        if (!editing) {
          const uploadedUrl = await uploadImage(result.assets[0].uri);
          if (uploadedUrl) {
            // Update profile with new image URL
            if (auth.updateProfile) {
              await auth.updateProfile({ profile_image_url: uploadedUrl });
              
              if (typeof auth.refreshProfile === 'function') {
                await auth.refreshProfile();
              }
            }
            
            Alert.alert("Success", "Profile picture updated successfully");
          }
        }
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

  // If showing settings or help screens
  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }
  
  if (showHelp) {
    return <HelpScreen onBack={() => setShowHelp(false)} />;
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
        <TouchableOpacity onPress={() => navigation.goBack()}>
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
      >
        {/* Profile Picture */}
        <View style={styles.profileContainer}>
          <Image 
            source={{ 
              uri: editing 
                ? tempData.profile_image_url 
                : (auth.userProfile?.profile_image_url || tempData.profile_image_url || "https://ui-avatars.com/api/?name=Emmanuel+James&background=0D8ABC&color=fff&size=128") 
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
          {editing ? tempData.full_name : (auth.userProfile?.full_name || tempData.full_name || "User")}
        </Text>
        <Text style={[styles.profileRole, { color: theme.secondaryText }]}>Student</Text>
        
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

          <InfoField 
            label="FULL NAME:" 
            value={auth.userProfile?.full_name || tempData.full_name || ""}
            tempValue={tempData.full_name}
            editing={editing}
            onChangeText={(value) => handleTextChange('full_name', value)}
            editable={true}
            theme={theme}
          />

          <InfoField 
            label="Matric No:" 
            value={auth.userProfile?.matric_no || tempData.matric_no || ""}
            tempValue={tempData.matric_no}
            editing={editing}
            onChangeText={(value) => handleTextChange('matric_no', value)}
            editable={false}
            helperText="Matric number cannot be changed"
            theme={theme}
          />

          <InfoField 
            label="Phone No:" 
            value={auth.userProfile?.phone_number || tempData.phone_number || ""}
            tempValue={tempData.phone_number}
            editing={editing}
            onChangeText={(value) => handleTextChange('phone_number', value)}
            editable={true}
            keyboardType="phone-pad"
            theme={theme}
          />
          
          <InfoField 
            label="Email:" 
            value={auth.userProfile?.email || tempData.email || ""}
            tempValue={tempData.email}
            editing={editing}
            onChangeText={(value) => handleTextChange('email', value)}
            editable={false}
            keyboardType="email-address"
            helperText="Email cannot be changed"
            theme={theme}
          />

          <InfoField 
            label="Course:" 
            value={auth.userProfile?.course || tempData.course || ""}
            tempValue={tempData.course}
            editing={editing}
            onChangeText={(value) => handleTextChange('course', value)}
            editable={!auth.userProfile?.course}
            helperText={auth.userProfile?.course ? "Contact admin to change course" : null}
            theme={theme}
          />

          <InfoField 
            label="Department:" 
            value={auth.userProfile?.department || tempData.department || ""}
            tempValue={tempData.department}
            editing={editing}
            onChangeText={(value) => handleTextChange('department', value)}
            editable={!auth.userProfile?.department}
            helperText={auth.userProfile?.department ? "Contact admin to change department" : null}
            theme={theme}
          />
          
          <InfoField 
            label="Level:" 
            value={auth.userProfile?.level || tempData.level || ""}
            tempValue={tempData.level}
            editing={editing}
            onChangeText={(value) => handleTextChange('level', value)}
            editable={!auth.userProfile?.level}
            helperText={auth.userProfile?.level ? "Level is updated by administration" : null}
            theme={theme}
          />

          <InfoField 
            label="Hall of Residence:" 
            value={auth.userProfile?.hall || tempData.hall || ""}
            tempValue={tempData.hall}
            editing={editing}
            onChangeText={(value) => handleTextChange('hall', value)}
            editable={true}
            theme={theme}
          />
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

// Reusable component for info fields
const InfoField = ({ 
  label, 
  value, 
  tempValue, 
  editing, 
  onChangeText, 
  editable = true,
  helperText = null,
  keyboardType = "default",
  theme
}) => {
  return (
    <View style={styles.info}>
      <Text style={[styles.label, { color: theme.secondaryText }]}>{label}</Text>
      <View style={styles.valueContainer}>
        {editing ? (
          <TextInput 
            style={[
              styles.input, 
              !editable && styles.disabledInput,
              { 
                color: theme.text, 
                borderBottomColor: editable ? "#FFD700" : theme.border,
                backgroundColor: !editable ? (theme.isDark ? '#333' : '#f0f0f0') : 'transparent'
              }
            ]} 
            value={tempValue} 
            onChangeText={onChangeText} 
            editable={editable}
            keyboardType={keyboardType}
            placeholderTextColor={theme.secondaryText}
            placeholder={`Enter ${label.toLowerCase().replace(':', '')}`}
          />
        ) : (
          <Text style={[styles.value, { color: theme.text, borderBottomColor: theme.border }]}>
            {value || 'Not specified'}
          </Text>
        )}
        {helperText && editing && (
          <Text style={[styles.helperText, { color: theme.secondaryText }]}>{helperText}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1
  },
  
  // Loading overlay
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
  
  // Header
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

  // Dropdown menu
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

  // Profile section
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

  // Details section
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

  // Info fields
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
  
  // Status section
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
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  statusText: {
    fontSize: 14
  },
  
 // Modal styles
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

// Footer
footer: {
  alignItems: 'center',
  padding: 20,
  marginTop: 10
},
versionText: {
  fontSize: 12
}
});