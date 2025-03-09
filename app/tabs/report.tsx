import { useState, useEffect } from "react";
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

export default function ReportScreen({ navigation }) {
  // Form state
  const [name, setName] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [phone, setPhone] = useState("");
  const [course, setCourse] = useState("");
  const [department, setDepartment] = useState("");
  const [incident, setIncident] = useState("");
  const [image, setImage] = useState(null);
  const [location, setLocation] = useState(null);
  const [anonymous, setAnonymous] = useState(false);
  
  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [locationAddress, setLocationAddress] = useState("");

  // Check for required permissions on component mount
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraStatus !== 'granted') {
        Alert.alert(
          "Permission Required",
          "Camera permission is needed to attach photos to your report.",
          [{ text: "OK" }]
        );
      }
    })();
  }, []);

  // Validate form before submission
  const validateForm = () => {
    let errors = {};
    let isValid = true;

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

  // Submit the report
  const submitReport = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Please fill in all required fields correctly");
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Construct report data
      const reportData = {
        anonymous,
        incident,
        timestamp: new Date().toISOString(),
        hasImage: !!image,
        location: location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          address: locationAddress
        } : null
      };
      
      if (!anonymous) {
        reportData.personalInfo = {
          name,
          matricNo,
          phone,
          course,
          department
        };
      }
      
      console.log("Report submitted:", reportData);
      
      // Show success message
      Alert.alert(
        "Report Submitted",
        "Thank you for submitting your report. It has been received and will be reviewed shortly.",
        [{ 
          text: "OK", 
          onPress: () => {
            // Reset form and navigate back
            resetForm();
            navigation.goBack();
          }
        }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to submit report. Please try again.");
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset the form
  const resetForm = () => {
    setName("");
    setMatricNo("");
    setPhone("");
    setCourse("");
    setDepartment("");
    setIncident("");
    setImage(null);
    setLocation(null);
    setLocationAddress("");
    setAnonymous(false);
    setFormErrors({});
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
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Denied",
          "Location permission is needed to attach your current location to the report.",
          [{ text: "OK" }]
        );
        setLocationLoading(false);
        return;
      }
      
      let currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      // Get human-readable address
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude
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
      
      setLocation(currentLocation.coords);
      Alert.alert("Success", "Location added to your report");
    } catch (error) {
      Alert.alert("Error", "Failed to get location. Please try again.");
      console.error("Location error:", error);
    } finally {
      setLocationLoading(false);
    }
  };

  // Remove attached image
  const removeImage = () => {
    setImage(null);
  };

  // Remove attached location
  const removeLocation = () => {
    setLocation(null);
    setLocationAddress("");
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
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Text style={styles.title}>Report an Incident</Text>
          
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
          
          {/* Incident details section */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Incident Details</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={[
                  styles.textArea,
                  formErrors.incident ? styles.inputError : null
                ]}
                placeholder="Describe what happened in detail..."
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
              
              <TouchableOpacity 
                style={styles.attachButton} 
                onPress={getLocation}
                disabled={locationLoading}
              >
                {locationLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="location" size={24} color="#fff" />
                    <Text style={styles.buttonText}>Location</Text>
                  </>
                )}
              </TouchableOpacity>
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
                <TouchableOpacity 
                  style={styles.removeLocationButton}
                  onPress={removeLocation}
                >
                  <Ionicons name="close-circle" size={24} color="#ff3b30" />
                </TouchableOpacity>
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
    justifyContent: "space-between",
    marginBottom: 16
  },
  attachButton: {
    backgroundColor: "#003366",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    width: "30%",
    flexDirection: "column"
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
    marginTop: 4,
    fontSize: 14
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
  removeLocationButton: {
    marginLeft: 8
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