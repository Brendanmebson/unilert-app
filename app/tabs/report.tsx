import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Switch,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

export default function ReportScreen() {
  const router = useRouter();
  const auth = useAuth();
  
  // Form state
  const [name, setName] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [department, setDepartment] = useState("");
  const [incident, setIncident] = useState("");
  const [incidentType, setIncidentType] = useState("");
  const [showIncidentTypeError, setShowIncidentTypeError] = useState(false);
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [anonymous, setAnonymous] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [locationAddress, setLocationAddress] = useState("");
  const [locationPermission, setLocationPermission] = useState("unknown");

  // Incident types
  const incidentTypes = [
    "Fire",
    "Medical Emergency",
    "Theft",
    "Suspicious Activity",
    "Vandalism",
    "Harassment",
    "Utility Issue",
    "Flooding",
    "Property Damage",
    "Other"
  ];

  // Check for required permissions on component mount
  useEffect(() => {
    // Set user info if available
    if (auth.userProfile) {
      setName(auth.userProfile.full_name || "");
      setMatricNo(auth.userProfile.matric_no || "");
      setPhone(auth.userProfile.phone_number || "");
    }

    (async () => {
      // Check camera permissions
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to attach photos to your report.",
          [{ text: "OK" }]
        );
      }
      
      // Check location permissions
      checkLocationPermission();
    })();
  }, [auth.userProfile]);

  const checkLocationPermission = async () => {
    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      setLocationPermission(status);
      
      if (status === "granted") {
        getLocation();
      }
    } catch (error) {
      console.error("Error checking location permission:", error);
    }
  };

  // Check and request location permission
  const checkAndRequestLocationPermission = async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      
      if (status !== "granted") {
        let { status: newStatus } = await Location.requestForegroundPermissionsAsync();
        setLocationPermission(newStatus);
        
        if (newStatus === "granted") {
          // Get location automatically once permission is granted
          getLocation();
          Alert.alert("Success", "Location permission granted");
        } else {
          Alert.alert(
            "Permission Denied",
            "Location permission is needed for emergency response. Please enable it in your device settings.",
            [{ text: "OK" }]
          );
        }
      } else {
        // Permission already granted, get location
        getLocation();
      }
    } catch (error) {
      console.error("Error checking location permission:", error);
      Alert.alert("Error", "Could not access location services");
    }
  };

  // Validate form before submission
  const validateForm = () => {
    let errors = {};
    let isValid = true;

    if (!incidentType) {
      setShowIncidentTypeError(true);
      isValid = false;
    } else {
      setShowIncidentTypeError(false);
    }

    if (!incident.trim()) {
      errors.incident = "Incident details are required";
      isValid = false;
    }

    if (!anonymous) {
      if (!name.trim()) {
        errors.name = "Name is required";
        isValid = false;
      }
      
      if (!matricNo.trim()) {
        errors.matricNo = "Matric No is required";
        isValid = false;
      }
      
      if (!phone.trim()) {
        errors.phone = "Phone number is required";
        isValid = false;
      } else if (!/^\d{10,11}$/.test(phone.replace(/\D/g, ''))) {
        errors.phone = "Please enter a valid phone number";
        isValid = false;
      }
    }

    setFormErrors(errors);
    return isValid;
  };

  // Submit the report to Supabase
  const submitReport = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please fill in all required fields correctly");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Check if user is authenticated
      if (!auth.user) {
        Alert.alert("Error", "You must be logged in to submit a report");
        setIsSubmitting(false);
        return;
      }
      
      // Try to get location if not already available
      if (!location && locationPermission === "granted") {
        await getLocation();
      }
      
      // Upload image if present
      let imageUrl = null;
      if (image) {
        imageUrl = await uploadImage(image);
      }
      
      // Prepare personal info
      const personalInfo = !anonymous ? {
        name,
        matricNo,
        phone,
        course,
        department
      } : null;
      
      // Construct the report data for Supabase
      const reportData = {
        user_id: auth.user.id,
        incident_type: incidentType,
        description: incident,
        location_latitude: location?.latitude,
        location_longitude: location?.longitude,
        location_address: locationAddress,
        image_url: imageUrl,
        anonymous: anonymous,
        personal_info: personalInfo ? JSON.stringify(personalInfo) : null
      };
      
      console.log("Submitting report to Supabase:", reportData);
      
      // Insert into Supabase
      const { data, error } = await supabase
        .from('incidents')
        .insert([reportData]);
      
      if (error) {
        console.error("Supabase error:", error);
        throw error;
      }
      
      console.log("Report submitted successfully:", data);
      
      // Show success message
      Alert.alert(
        "Report Submitted",
        "Thank you for submitting your report. It has been received and will be reviewed shortly.",
        [{ 
          text: "OK", 
          onPress: () => {
            // Reset form and navigate back
            resetForm();
            router.back();
          }
        }]
      );
    } catch (error) {
      console.error("Submission error:", error);
      Alert.alert("Error", "Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset the form
  const resetForm = () => {
    setIncident("");
    setIncidentType("");
    setImage(null);
    setLocation(null);
    setLocationAddress("");
    setAnonymous(false);
    setFormErrors({});
    setShowIncidentTypeError(false);
  };

  // Upload image to Supabase storage
  const uploadImage = async (uri) => {
    try {
      console.log("Starting image upload...");
      // Get the file name from the URI
      const fileName = uri.split('/').pop();
      // Get the file extension
      const fileExt = fileName.split('.').pop();
      // Create a unique file name to prevent overwriting
      const filePath = `incident-reports/${Date.now()}.${fileExt}`;
      
      // Convert the image to a blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      console.log("Uploading to Supabase storage path:", filePath);
      
      // Upload the image to Supabase Storage
      const { data, error } = await supabase.storage
        .from('incident-reports')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: true
        });
      
      if (error) {
        console.error("Storage upload error:", error);
        throw error;
      }
      
      // Get the public URL of the uploaded image
      const { data: publicUrlData } = supabase.storage
        .from('incident-reports')
        .getPublicUrl(filePath);
      
      console.log("Image uploaded, public URL:", publicUrlData.publicUrl);
      return publicUrlData.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert("Warning", "Failed to upload image, but your report will be submitted without the image.");
      return null;
    }
  };

  // Pick image from camera
  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to capture image. Please try again.");
      console.error("Camera error:", error);
    }
  };

  // Pick image from gallery
  const pickImageFromGallery = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to select image. Please try again.");
      console.error("Gallery error:", error);
    }
  };

  // Get current location
  const getLocation = async () => {
    setLocationLoading(true);
    
    try {
      // Get actual GPS coordinates with high accuracy
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest
      });
      
      let { latitude, longitude } = loc.coords;
      
      // Get human-readable address
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: latitude,
          longitude: longitude
        });
        
        if (geocode && geocode.length > 0) {
          const address = geocode[0];
          const addressStr = [
            address.street,
            address.district,
            address.city,
            address.region,
          ].filter(Boolean).join(", ");
          
          setLocationAddress(addressStr);
        }
      } catch (error) {
        console.warn("Geocoding error:", error);
      }
      
      setLocation({
        latitude: latitude,
        longitude: longitude
      });
    } catch (error) {
      console.error("Location error:", error);
      Alert.alert("Error", "Failed to get current location. Please try again or enter location manually.");
    } finally {
      setLocationLoading(false);
    }
  };

  // Remove attached image
  const removeImage = () => {
    setImage(null);
  };

  // Handle back button press
  const handleGoBack = () => {
    router.back();
  };

  // Render input field with error handling
  const renderInput = (placeholder, value, setValue, error, keyboardType = "default", maxLength = null) => (
    <View style={styles.inputContainer}>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        placeholder={placeholder}
        value={value}
        onChangeText={setValue}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#0A356D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report an Incident</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Anonymous toggle */}
          <View style={styles.card}>
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Submit Anonymously</Text>
              <Switch 
                value={anonymous} 
                onValueChange={setAnonymous}
                trackColor={{ false: "#d1d1d1", true: "#81b0ff" }}
                thumbColor={anonymous ? "#003366" : "#f4f3f4"}
              />
            </View>
            <Text style={styles.switchHint}>
              {anonymous 
                ? "Your personal details will not be included in this report" 
                : "Your personal details will be included in this report"}
            </Text>
          </View>
          
          {/* Personal information section */}
          {!anonymous && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Personal Information</Text>
              {renderInput("Full Name", name, setName, formErrors.name)}
              {renderInput("Matric Number", matricNo, setMatricNo, formErrors.matricNo)}
              {renderInput("Phone Number", phone, setPhone, formErrors.phone, "phone-pad", 15)}
              {renderInput("Course", course, setCourse)}
              {renderInput("Department", department, setDepartment)}
            </View>
          )}
          
          {/* Incident Type Selection */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Incident Type</Text>
            <View style={styles.buttonGrid}>
              {incidentTypes.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.incidentTypeButton,
                    incidentType === type && styles.incidentTypeButtonActive
                  ]}
                  onPress={() => setIncidentType(type)}
                >
                  <Text
                    style={[
                      styles.incidentTypeText,
                      incidentType === type && styles.incidentTypeTextActive
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {showIncidentTypeError && (
              <Text style={styles.errorText}>Please select an incident type</Text>
            )}
          </View>
          
          {/* Incident details section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Incident Details</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textArea,
                  formErrors.incident ? styles.inputError : null
                ]}
                placeholder={
                  incidentType ? 
                  `Describe the ${incidentType.toLowerCase()} incident in detail...` : 
                  "First select an incident type above, then describe what happened..."
                }
                multiline
                textAlignVertical="top"
                value={incident}
                onChangeText={setIncident}
              />
              {formErrors.incident && (
                <Text style={styles.errorText}>{formErrors.incident}</Text>
              )}
            </View>
          </View>
          
          {/* Attachments section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Attachments</Text>
            
            <View style={styles.buttonGrid}>
              <TouchableOpacity 
                style={styles.attachButton} 
                onPress={pickImage}
              >
                <Ionicons name="camera" size={24} color="#fff" />
                <Text style={styles.buttonText}>Camera</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.attachButton} 
                onPress={pickImageFromGallery}
              >
                <Ionicons name="images" size={24} color="#fff" />
                <Text style={styles.buttonText}>Gallery</Text>
              </TouchableOpacity>
            </View>
            
            {/* Location Access Message */}
            <View style={styles.locationInfoContainer}>
              <View style={styles.locationInfoContent}>
                <Ionicons name="location" size={24} color="#003366" />
                <View style={styles.locationInfoTextContainer}>
                  <Text style={styles.locationInfoTitle}>Location Services</Text>
                  <Text style={styles.locationInfoText}>
                    Your current location will be included with this report for emergency response purposes.
                  </Text>
                </View>
              </View>
              
              {locationPermission !== "granted" && (
                <TouchableOpacity 
                  style={styles.locationPermissionButton} 
                  onPress={checkAndRequestLocationPermission}
                >
                  <Text style={styles.locationPermissionText}>Grant Access</Text>
                </TouchableOpacity>
              )}

              {locationLoading && (
                <ActivityIndicator 
                  color="#003366" 
                  size="small" 
                  style={{ marginTop: 8 }}
                />
              )}
            </View>
            
            {/* Image preview */}
            {image && (
              <View style={styles.attachmentPreview}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={removeImage}
                >
                  <Ionicons name="close-circle" size={24} color="#ff3b30" />
                </TouchableOpacity>
              </View>
            )}
            
            {/* Location preview */}
            {location && (
              <View style={styles.locationPreview}>
                <View style={styles.locationContent}>
                  <Ionicons name="location" size={24} color="#003366" />
                  <View style={styles.locationTextContainer}>
                    <Text style={styles.locationCoords}>
                      {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                    </Text>
                    {locationAddress ? (
                      <Text style={styles.locationAddress}>{locationAddress}</Text>
                    ) : null}
                  </View>
                </View>
              </View>
            )}
          </View>
          
          {/* Submit button */}
          <TouchableOpacity
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={submitReport}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#fff" style={styles.submitIcon} />
                <Text style={styles.submitButtonText}>Submit Report</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f2f5"
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    backgroundColor: "#FFF"
  },
  backButton: {
    padding: 5,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#003366"
  },
  headerRight: {
    width: 40, // Same width as the back button
  },
  flex: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#003366",
    marginBottom: 16,
    textAlign: "center"
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#003366"
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between"
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: "500"
  },
  switchHint: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    fontStyle: "italic"
  },
  inputContainer: {
    marginBottom: 12
  },
  input: {
    height: 50,
    borderColor: "#d1d1d1",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9"
  },
  inputError: {
    borderColor: "#ff3b30",
    borderWidth: 1.5
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4
  },
  textArea: {
    height: 120,
    borderColor: "#d1d1d1",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#f9f9f9"
  },
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginVertical: 10
  },
  incidentTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d1d1",
    marginRight: 8,
    marginBottom: 8
  },
  incidentTypeButtonActive: {
    backgroundColor: "#003366",
    borderColor: "#003366"
  },
  incidentTypeText: {
    fontSize: 14,
    color: "#333"
  },
  incidentTypeTextActive: {
    color: "white",
    fontWeight: "500"
  },
  attachButton: {
    backgroundColor: "#003366",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "45%", // Changed from 30% to make buttons wider with only two
    flexDirection: "column",
    marginRight: 8,
    marginBottom: 8
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
    marginTop: 4,
    fontSize: 14
  },
  locationInfoContainer: {
    backgroundColor: "#f0f7ff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#d0e1f9",
    marginBottom: 16,
  },
  locationInfoContent: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  locationInfoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  locationInfoTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#003366",
    marginBottom: 4,
  },
  locationInfoText: {
    fontSize: 14,
    color: "#555",
    lineHeight: 20,
  },
  locationPermissionButton: {
    backgroundColor: "#003366",
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: "flex-end",
    marginTop: 10,
  },
  locationPermissionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
  attachmentPreview: {
    position: "relative",
    alignSelf: "center",
    marginVertical: 8
  },
  imagePreview: {
    width: 200,
    height: 200,
    borderRadius: 8
  },
  removeButton: {
    position: "absolute",
    top: -10,
    right: -10,
    backgroundColor: "#fff",
    borderRadius: 12,
    zIndex: 1
  },
  locationPreview: {
    backgroundColor: "#f0f7ff",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#d0e1f9"
  },
  locationContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1
  },
  locationTextContainer: {
    marginLeft: 8,
    flex: 1
  },
  locationCoords: {
    fontSize: 14,
    fontWeight: "500",
    color: "#003366"
  },
  locationAddress: {
    fontSize: 14,
    color: "#666",
    marginTop: 2
  },
  submitButton: {
    backgroundColor: "#003366",
    borderRadius: 8,
    paddingVertical: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 8
  },
  submitButtonDisabled: {
    backgroundColor: "#8ba5bd"
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center"
  },
  submitIcon: {
    marginRight: 8
  }
});