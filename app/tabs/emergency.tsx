import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Alert, 
  ActivityIndicator, 
  Linking,
  StatusBar,
  Platform
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";
import EmergencyContacts from "./emergency-contacts";

export default function EmergencyScreen() {
  const navigation = useNavigation();
  const auth = useAuth();
  
  const [countdown, setCountdown] = useState(3);
  const [holding, setHolding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [locationAddress, setLocationAddress] = useState("");
  const [alertSent, setAlertSent] = useState(false);
  const timerRef = useRef(null);

  // Get location permission and initial location on component mount
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setPermissionGranted(true);
        fetchLocation();
      } else {
        Alert.alert(
          "Location Permission Required",
          "This app needs your location to send accurate emergency alerts. Please enable location services."
        );
      }
    })();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const fetchLocation = async () => {
    try {
      setLoading(true);
      
      // Get actual GPS coordinates with high accuracy and longer timeout
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        timeout: 20000
      });
      
      let { latitude, longitude } = loc.coords;
      
      // Try to get the address
      try {
        const geocode = await Location.reverseGeocodeAsync({
          latitude,
          longitude
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
      } catch (geoError) {
        console.warn("Geocoding error:", geoError);
        setLocationAddress("Unknown location");
      }
      
      setLocation({
        latitude,
        longitude
      });
      
      console.log(`Location detected: ${latitude}, ${longitude} - ${locationAddress}`);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching location:", error);
      // Set a default location
      setLocationAddress("Location unavailable");
      setLoading(false);
    }
  };

  const triggerEmergency = async () => {
    try {
      // Check if user is authenticated
      if (!auth.user) {
        Alert.alert("Error", "You must be logged in to send an emergency alert");
        return;
      }
      
      setLoading(true);
      
      // Try to get location if not already available
      if (!location && permissionGranted) {
        await fetchLocation();
      }
      
      // Prepare the emergency alert data
     // Prepare the emergency alert data
     const alertData = {
      user_id: auth.user.id,
      location_latitude: location?.latitude,
      location_longitude: location?.longitude,
      location_address: locationAddress || "Unknown location",
      user_profile: auth.userProfile ? JSON.stringify({
        name: auth.userProfile.full_name,
        phone: auth.userProfile.phone_number,
        matric_no: auth.userProfile.matric_no
      }) : null
    };
    
    console.log("Sending emergency alert:", alertData);
    
    // Save emergency alert to database
    const { data, error } = await supabase
      .from('emergency_alerts')
      .insert([alertData]);
    
    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }
    
    console.log("Emergency alert sent successfully:", data);
    setAlertSent(true);
    
    // Show success alert to user
    Alert.alert(
      "🚨 Emergency Alert Sent!", 
      "Your emergency personals have been notified of your location.",
      [
        { 
          text: "OK", 
          onPress: () => {
            // Fetch location in the background after alert is acknowledged
            fetchLocation();
          } 
        }
      ]
    );
  } catch (error) {
    console.error("Error sending emergency alert:", error);
    Alert.alert(
      "Alert Error", 
      "There was an issue sending your emergency alert. Please try again or call emergency services directly."
    );
  } finally {
    setLoading(false);
  }
};

const startCountdown = () => {
  setHolding(true);
  setCountdown(3);

  timerRef.current = setInterval(() => {
    setCountdown((prev) => {
      if (prev === 1) {
        clearInterval(timerRef.current);
        triggerEmergency();
        setHolding(false);
        return 3;
      }
      return prev - 1;
    });
  }, 1000);
};

const cancelCountdown = () => {
  if (timerRef.current) {
    clearInterval(timerRef.current);
    timerRef.current = null;
  }
  setHolding(false);
  setCountdown(3);
};

const callEmergency = () => {
  Alert.alert(
    "Call Campus Emergency",
    "Are you sure you want to call the campus emergency helpline?",
    [
      { text: "Cancel", style: "cancel" },
      { text: "Call", onPress: () => Linking.openURL('tel:+2348023456789') }
    ]
  );
};

const toggleEmergencyContacts = () => {
  setShowContacts(true); // Show the contacts view
};

const navigateToReport = () => {
  navigation.navigate("report");
};

// Render EmergencyContacts component when showContacts is true
if (showContacts) {
  return <EmergencyContacts onBack={() => setShowContacts(false)} />;
}

return (
  <View style={styles.container}>
    <StatusBar barStyle="light-content" backgroundColor="#2D2D2D" />
    
    {/* Back Button */}
    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
      <Ionicons name="arrow-back" size={28} color="white" />
    </TouchableOpacity>

    <Text style={styles.title}>Emergency Alert System</Text>
    
    {/* Location Display */}
    <View style={styles.locationContainer}>
      {loading ? (
        <ActivityIndicator size="small" color="white" />
      ) : location ? (
        <>
          <Text style={styles.locationTitle}>Your Current Location:</Text>
          <Text style={styles.locationText} numberOfLines={2}>
            {locationAddress || `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`}
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchLocation}>
            <Ionicons name="refresh" size={16} color="white" />
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.locationTitle}>Your Current Location:</Text>
          <Text style={styles.locationText}>Location unavailable</Text>
          <TouchableOpacity style={styles.refreshButton} onPress={fetchLocation}>
            <Ionicons name="refresh" size={16} color="white" />
          </TouchableOpacity>
        </>
      )}
    </View>

    <View style={styles.circle}>
      <Text style={styles.countdown}>{holding ? countdown : "🚨"}</Text>
    </View>

    <Text style={styles.alertText}>
      The Campus SOS Emergency Officers will be notified
    </Text>
    
    <Text style={styles.subText}>Hold for 3s to trigger alert. Release to cancel.</Text>

    {/* Panic Button */}
    <TouchableOpacity
      style={[styles.panicButton, holding && styles.panicButtonActive]}
      activeOpacity={0.7}
      onPressIn={startCountdown}
      onPressOut={cancelCountdown}
    >
      <Text style={styles.panicText}>{holding ? "SENDING..." : "HOLD TO SEND"}</Text>
    </TouchableOpacity>
    
    {/* Report Incident Button */}
    <TouchableOpacity 
      style={styles.reportButton} 
      onPress={navigateToReport}
      activeOpacity={0.8}
    >
      <Ionicons name="warning-outline" size={24} color="white" />
      <Text style={styles.reportButtonText}>Report Incident</Text>
    </TouchableOpacity>

    {/* Quick Contact Buttons */}
    <View style={styles.quickContactsContainer}>
      <TouchableOpacity 
        style={[styles.quickContactButton, { backgroundColor: "#FF3B30" }]} 
        onPress={callEmergency}
        activeOpacity={0.8}
      >
        <Ionicons name="call-outline" size={20} color="white" />
        <Text style={styles.quickContactText}>Campus Emergency</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.quickContactButton} 
        onPress={toggleEmergencyContacts}
        activeOpacity={0.8}
      >
        <Ionicons name="people-outline" size={20} color="white" />
        <Text style={styles.quickContactText}>Emergency Contacts</Text>
      </TouchableOpacity>
    </View>
  </View>
);
}

const styles = StyleSheet.create({
container: { 
  flex: 1, 
  justifyContent: "center", 
  alignItems: "center", 
  backgroundColor: "#2D2D2D" 
},
backButton: { 
  position: "absolute", 
  top: 50, 
  left: 20, 
  zIndex: 10,
  backgroundColor: "rgba(0,0,0,0.3)",
  borderRadius: 20,
  width: 40,
  height: 40,
  justifyContent: "center",
  alignItems: "center"
},
title: { 
  fontSize: 24, 
  fontWeight: "bold", 
  color: "white", 
  textAlign: "center", 
  marginBottom: 20,
  marginTop: -60
},
locationContainer: {
  backgroundColor: "rgba(0,0,0,0.3)",
  padding: 15,
  borderRadius: 10,
  width: "85%",
  marginBottom: 20,
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.1)"
},
locationTitle: {
  fontSize: 14,
  color: "#CCC",
  marginBottom: 5
},
locationText: {
  fontSize: 16,
  color: "white",
  textAlign: "center",
  fontWeight: "500"
},
refreshButton: {
  position: "absolute",
  right: 10,
  top: 10,
  padding: 5,
  backgroundColor: "rgba(255,255,255,0.1)",
  borderRadius: 15,
  width: 30,
  height: 30,
  justifyContent: "center",
  alignItems: "center"
},
retryButton: {
  backgroundColor: "#007AFF",
  paddingVertical: 6,
  paddingHorizontal: 12,
  borderRadius: 8
},
retryText: {
  color: "white",
  fontWeight: "500"
},
circle: { 
  width: 120, 
  height: 120, 
  borderRadius: 60, 
  backgroundColor: "#FF3B30", 
  justifyContent: "center", 
  alignItems: "center",
  borderWidth: 3,
  borderColor: "rgba(255,255,255,0.3)",
  shadowColor: "#FF3B30",
  shadowOffset: { width: 0, height: 0 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 10
},
countdown: { 
  fontSize: 40, 
  color: "white", 
  fontWeight: "bold" 
},
alertText: {
  fontSize: 18,
  fontWeight: "bold",
  color: "white",
  marginTop: 20,
  textAlign: "center"
},
subText: { 
  fontSize: 14, 
  color: "#CCC", 
  marginTop: 10, 
  marginBottom: 30,
  textAlign: "center", 
  paddingHorizontal: 20 
},
panicButton: {
  width: 180,
  height: 180,
  borderRadius: 90,
  backgroundColor: "#FF3B30",
  justifyContent: "center",
  alignItems: "center",
  shadowColor: "#FF3B30",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.5,
  shadowRadius: 8,
  elevation: 10,
  borderWidth: 3,
  borderColor: "rgba(255,255,255,0.2)"
},
panicButtonActive: {
  backgroundColor: "#CC2A20",
  transform: [{ scale: 0.95 }]
},
panicText: { 
  fontSize: 20, 
  color: "white", 
  fontWeight: "bold" 
},
reportButton: {
  position: "absolute",
  bottom: 120, // Position above the quick contact buttons
  backgroundColor: "#4CAF50", 
  paddingVertical: 12,
  paddingHorizontal: 25,
  borderRadius: 30,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 8,
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.2)"
},
reportButtonText: {
  color: "white",
  fontWeight: "bold",
  fontSize: 16,
  marginLeft: 10
},
quickContactsContainer: {
  flexDirection: "row",
  justifyContent: "space-around",
  width: "90%", // Increased width
  position: "absolute",
  bottom: 40
},
quickContactButton: {
  backgroundColor: "#007AFF",
  padding: 12,
  borderRadius: 15,
  alignItems: "center",
  width: 170, // Increased width
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 6,
  elevation: 8,
  flexDirection: "row",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "rgba(255,255,255,0.2)"
},
quickContactText: {
  color: "white",
  marginLeft: 8,
  fontWeight: "600",
  fontSize: 15
}
});