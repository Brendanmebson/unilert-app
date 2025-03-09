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
import { useAuth } from "../../context/AuthContext";

export default function ProfileScreen() {
  const navigation = useNavigation();
  const { userProfile, updateProfile, signOut, loading: authLoading } = useAuth();
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePickerVisible, setImagePickerVisible] = useState(false);
  
  // States to control which screen to show
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  
  // Temporary state for editing
  const [tempData, setTempData] = useState({});
  
  // Set temp data whenever user profile changes
  useEffect(() => {
    if (userProfile) {
      setTempData({...userProfile});
    }
  }, [userProfile]);
  
  useEffect(() => {
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
          onPress: async () => {
            await signOut();
            navigation.replace("Login");
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
      setTempData({...userProfile});
      setEditing(true);
    }
  };
  
  const handleCancel = () => {
    setTempData({...userProfile});
    setEditing(false);
  };
  
  const saveUserData = async () => {
    try {
      setLoading(true);
      // Validate inputs
      if (!tempData.fullname || !tempData.phoneNo) {
        Alert.alert("Validation Error", "Fullname and Phone Number are required fields");
        setLoading(false);
        return;
      }
      
      // Only update fields that can be edited
      const updates = {
        phoneNo: tempData.phoneNo,
        course: tempData.course,
        department: tempData.department,
        profileImage: tempData.profileImage
      };
      
      const { success, error } = await updateProfile(updates);
      
      if (success) {
        setEditing(false);
        Alert.alert("Success", "Profile updated successfully");
      } else {
        Alert.alert("Error", error || "Failed to update profile. Please try again.");
      }
    } catch (error) {
      console.error("Error saving user data:", error);
      Alert.alert("Error", "Failed to update profile. Please try again.");
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
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        // Update the temporary data
        setTempData({
          ...tempData,
          profileImage: result.assets[0].uri
        });
        
        // If we're not in editing mode, save the image immediately
        if (!editing) {
          // In a real app, we would upload the image to storage first
          // then update the profile with the URL
          await updateProfile({
            profileImage: result.assets[0].uri
          });
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

  // Import and render Settings or Help screens if needed
  // For this example we'll just go back to the previous screen

  return (
    <View style={styles.container}>
      {(loading || authLoading) && (
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
                navigation.navigate("Settings");
              }}
            >
              <Ionicons name="settings-outline" size={18} color="black" />
              <Text style={styles.dropdownText}>Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.dropdownItem} 
              onPress={() => {
                setMenuVisible(false);
                navigation.navigate("Help");
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
            source={{ 
              uri: editing 
                ? tempData.profileImage || 'https://via.placeholder.com/100'
                : userProfile?.profileImage || 'https://via.placeholder.com/100'
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
        
        <Text style={styles.profilefullname}>{editing ? tempData.fullname : userProfile?.fullname || "User Name"}</Text>
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
            label="FULLNAME:" 
            value={userProfile?.fullname}
            tempValue={tempData.fullname}
            editing={editing}
            onChangeText={(value) => handleTextChange('fullname', value)}
            editable={false}
            helperText="Fullname cannot be changed"
          />

          <InfoField 
            label="Matric No:" 
            value={userProfile?.matricNo}
            tempValue={tempData.matricNo}
            editing={editing}
            onChangeText={(value) => handleTextChange('matricNo', value)}
            editable={false}
            helperText="Matric number cannot be changed"
          />

          <InfoField 
            label="Phone No:" 
            value={userProfile?.phoneNo}
            tempValue={tempData.phoneNo}
            editing={editing}
            onChangeText={(value) => handleTextChange('phoneNo', value)}
            editable={true}
            keyboardType="phone-pad"
          />
          
          <InfoField 
            label="School Email:" 
            value={userProfile?.email}
            tempValue={tempData.email}
            editing={editing}
            onChangeText={(value) => handleTextChange('email', value)}
            editable={false}
            keyboardType="email-address"
            helperText="School Email cannot be changed"
          />

          <InfoField 
            label="Course:" 
            value={userProfile?.course}
            tempValue={tempData.course}
            editing={editing}
            onChangeText={(value) => handleTextChange('course', value)}
            editable={true}
          />

<InfoField 
            label="Department:" 
            value={userProfile?.department}
            tempValue={tempData.department}
            editing={editing}
            onChangeText={(value) => handleTextChange('department', value)}
            editable={true}
          />
          
          <InfoField 
            label="Level:" 
            value={userProfile?.level}
            tempValue={tempData.level}
            editing={editing}
            onChangeText={(value) => handleTextChange('level', value)}
            editable={false}
            helperText="Level is updated by administration"
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
  profilefullname: {
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