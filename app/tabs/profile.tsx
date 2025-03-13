import React, { useState, useEffect } from "react";
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
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Import pages
import SettingsScreen from "./settings"; // Adjust the path as needed
import HelpScreen from "./help"; // Adjust the path as needed
import LoginScreen from "../login"; // Adjust the path as needed

export default function ProfileScreen() {
  const navigation = useNavigation();
  const [menuVisible, setMenuVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  
  // States to control which screen to show
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // User profile data state
const [profileData, setProfileData] = useState({
  name: "Emmanuel James",
  matricNo: "21/2345",
  phoneNo: "", // Set to empty string
  course: "Software Engineering",
  department: "Software Engineering",
  email: "emmanuel@student.babcock.edu.ng",
  level: "300 Level",
  Hall: "", // Set to empty string
  profileImage: "https://via.placeholder.com/100"
});
  
  // Temporary state for editing
  const [tempData, setTempData] = useState({...profileData});
  
  // Load user data on mount
  useEffect(() => {
    loadUserData();
    requestPermissions();
  }, []);
  
  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to upload images.');
      }
    }
  };
  
  const loadUserData = async () => {
    try {
      setLoading(true);
      // In a real app, this would come from an API or AsyncStorage
      const savedData = await AsyncStorage.getItem('userProfile');
      if (savedData) {
        const userData = JSON.parse(savedData);
        setProfileData(userData);
        setTempData(userData);
      }
      setLoading(false);
    } catch (error) {
      console.error("Error loading user data:", error);
      setLoading(false);
    }
  };
  
  const saveUserData = async () => {
    try {
      setLoading(true);
      // Validate inputs
      if (!tempData.name || !tempData.phoneNo) {
        Alert.alert("Validation Error", "Name and Phone Number are required fields");
        setLoading(false);
        return;
      }
      
      // In a real app, this would be sent to an API
      await AsyncStorage.setItem('userProfile', JSON.stringify(tempData));
      setProfileData(tempData);
      setEditing(false);
      setLoading(false);
      Alert.alert("Success", "Profile updated successfully");
    } catch (error) {
      console.error("Error saving user data:", error);
      setLoading(false);
      Alert.alert("Error", "Failed to update profile. Please try again.");
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Logout",
          onPress: () => {
            // Navigate to the login screen
            navigation.replace("login");
          },
          style: "destructive"
        }
      ]
    );
  };
  
  const handleEditToggle = () => {
    if (editing) {
      // If we're saving changes
      saveUserData();
    } else {
      // If we're starting to edit
      setTempData({...profileData});
      setEditing(true);
    }
  };
  
  const handleCancel = () => {
    setTempData({...profileData});
    setEditing(false);
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
        // Update the temporary data
        setTempData({
          ...tempData,
          profileImage: result.assets[0].uri
        });
        
        // If we're not in editing mode, save the image immediately
        if (!editing) {
          setProfileData({
            ...profileData,
            profileImage: result.assets[0].uri
          });
          
          // Save to storage
          const updatedData = {
            ...profileData,
            profileImage: result.assets[0].uri
          };
          await AsyncStorage.setItem('userProfile', JSON.stringify(updatedData));
          Alert.alert("Success", "Profile picture updated successfully");
        }
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
    }
  };
  
  const handleTextChange = (field, value) => {
    setTempData({
      ...tempData,
      [field]: value
    });
  };

  // If showing settings or help screens
  if (showSettings) {
    return <SettingsScreen onBack={() => setShowSettings(false)} />;
  }
  
  if (showHelp) {
    return <HelpScreen onBack={() => setShowHelp(false)} />;
  }

  return (
    <View style={styles.container}>
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFD700" />
        </View>
      )}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Profile</Text>
        {/* Menu Icon */}
        <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
          <Entypo name="menu" size={28} color="black" />
        </TouchableOpacity>
        {/* Dropdown Menu */}
        {menuVisible && (
          <View style={styles.dropdown}>
            <TouchableOpacity 
              style={styles.dropdownItem} 
              onPress={() => {
                setMenuVisible(false);
                setShowSettings(true);
              }}
            >
              <Ionicons name="settings-outline" size={18} color="black" />
              <Text style={styles.dropdownText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dropdownItem} 
              onPress={() => {
                setMenuVisible(false);
                setShowHelp(true);
              }}
            >
              <Feather name="help-circle" size={18} color="black" />
              <Text style={styles.dropdownText}>Help</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
              <Feather name="log-out" size={18} color="red" />
              <Text style={[styles.dropdownText, {color: 'red'}]}>Log Out</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Picture */}
        <View style={styles.profileContainer}>
          <Image 
            source={{ uri: editing ? tempData.profileImage : profileData.profileImage }} 
            style={styles.profileImage} 
          />
          <TouchableOpacity 
            style={styles.editIcon}
            onPress={() => setImagePickerVisible(true)}
          >
            <Ionicons name="camera" size={22} color="white" />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.profileName}>{editing ? tempData.name : profileData.name}</Text>
        <Text style={styles.profileRole}>Student</Text>
        
        {/* User Details */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>Personal Information</Text>
            <View style={styles.actionButtons}>
              {editing && (
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
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
  value={profileData.name}
  tempValue={tempData.name}
  editing={editing}
  onChangeText={(value) => handleTextChange('name', value)}
  editable={true}
/>

          <InfoField 
            label="Matric No:" 
            value={profileData.matricNo}
            tempValue={tempData.matricNo}
            editing={editing}
            onChangeText={(value) => handleTextChange('matricNo', value)}
            editable={false}
            helperText="Matric number cannot be changed"
          />

<InfoField 
  label="Phone No:" 
  value={profileData.phoneNo}
  tempValue={tempData.phoneNo}
  editing={editing}
  onChangeText={(value) => handleTextChange('phoneNo', value)}
  editable={true}  // This allows editing
  keyboardType="phone-pad"
/>
          
          <InfoField 
            label="Email:" 
            value={profileData.email}
            tempValue={tempData.email}
            editing={editing}
            onChangeText={(value) => handleTextChange('email', value)}
            editable={false}
            keyboardType="email-address"
            helperText="School email address cannot be changed"
          />

          <InfoField 
            label="Course:" 
            value={profileData.course}
            tempValue={tempData.course}
            editing={editing}
            onChangeText={(value) => handleTextChange('course', value)}
            editable={false}
            helperText="Contact admin to change course"
          />

          <InfoField 
            label="Department:" 
            value={profileData.department}
            tempValue={tempData.department}
            editing={editing}
            onChangeText={(value) => handleTextChange('department', value)}
            editable={false}
            helperText="Contact admin to change department"
          />
          
          <InfoField 
            label="Level:" 
            value={profileData.level}
            tempValue={tempData.level}
            editing={editing}
            onChangeText={(value) => handleTextChange('level', value)}
            editable={false}
            helperText="Level is updated by administration"
          />

<InfoField 
  label="Hall of Residence:" 
  value={profileData.Hall}
  tempValue={tempData.Hall}
  editing={editing}
  onChangeText={(value) => handleTextChange('Hall', value)}
  editable={true}  // This allows editing
/>
        </View>
        
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Safety Status</Text>
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, { backgroundColor: '#4CAF50' }]}>
                <FontAwesome name="check" size={16} color="white" />
              </View>
              <Text style={styles.statusText}>Emergency Contacts Verified</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, { backgroundColor: '#4CAF50' }]}>
                <FontAwesome name="check" size={16} color="white" />
              </View>
              <Text style={styles.statusText}>Campus ID Card Active</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, { backgroundColor: '#FFC107' }]}>
                <Feather name="clock" size={16} color="white" />
              </View>
              <Text style={styles.statusText}>Safety Training: 1 Module Pending</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, { backgroundColor: '#4CAF50' }]}>
                <FontAwesome name="check" size={16} color="white" />
              </View>
              <Text style={styles.statusText}>Location Services Enabled</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusIcon, { backgroundColor: '#F44336' }]}>
                <FontAwesome name="times" size={16} color="white" />
              </View>
              <Text style={styles.statusText}>Dormitory Security Badge Missing</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.footer}>
          <Text style={styles.versionText}>App Version 1.0.5</Text>
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
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Profile Picture</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={() => pickImage('camera')}>
              <Ionicons name="camera" size={24} color="#333" />
              <Text style={styles.modalOptionText}>Take a photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={() => pickImage('gallery')}>
              <Ionicons name="images" size={24} color="#333" />
              <Text style={styles.modalOptionText}>Choose from gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => setImagePickerVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
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
  keyboardType = "default" 
}) => {
  return (
    <View style={styles.info}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.valueContainer}>
        {editing ? (
          <TextInput 
            style={[
              styles.input, 
              !editable && styles.disabledInput
            ]} 
            value={tempValue} 
            onChangeText={onChangeText} 
            editable={editable}
            keyboardType={keyboardType}
          />
        ) : (
          <Text style={styles.value}>{value}</Text>
        )}
        {helperText && editing && (
          <Text style={styles.helperText}>{helperText}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "white"
  },
  
  // Loading overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
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
    marginBottom: 20
  },
  title: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#FFD700" 
  },

  // Dropdown menu
  dropdown: {
    position: "absolute",
    top: 40,
    right: 10,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 5,
    width: 150,
    zIndex: 100
  },
  dropdownItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0"
  },
  dropdownText: { 
    marginLeft: 10, 
    color: "black",
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
    color: '#666',
    marginBottom: 20
  },

  // Details section
  detailsContainer: { 
    marginTop: 10,
    backgroundColor: "#f9f9f9",
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
    fontWeight: "bold",
    color: "#333"
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
    color: '#666'
  },

  // Info fields
  info: { 
    marginTop: 18
  },
  label: { 
    fontWeight: "bold", 
    fontSize: 14,
    color: "#666",
    marginBottom: 5
  },
  valueContainer: {
    marginTop: 2
  },
  value: { 
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#eee"
  },
  input: {
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#FFD700",
    paddingVertical: 8,
    color: "#333"
  },
  disabledInput: {
    backgroundColor: "#f0f0f0",
    color: "#999",
    borderRadius: 4,
    paddingHorizontal: 5
  },
  helperText: {
    fontSize: 12,
    color: "#999",
    marginTop: 3,
    fontStyle: "italic"
  },
  
  // Status section
  sectionContainer: {
    marginTop: 25,
    marginHorizontal: 20,
    backgroundColor: "white",
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
    marginBottom: 15,
    color: "#333"
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
    fontSize: 14,
    color: '#333'
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: 'white',
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
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
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
    color: 'red',
    fontWeight: '600'
  },
  
  // Footer
  footer: {
    alignItems: 'center',
    padding: 20,
    marginTop: 10
  },
  versionText: {
    color: '#999',
    fontSize: 12
  }
});