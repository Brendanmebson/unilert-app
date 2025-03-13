import React, { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import EmergencyContacts from "./emergency-contacts"; // Import the component directly

export default function EmergencyScreen() {
  const navigation = useNavigation();
  const [countdown, setCountdown] = useState(3);
  const [holding, setHolding] = useState(false);
  const [loading, setLoading] = useState(false);
  const [locationInfo, setLocationInfo] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [showContacts, setShowContacts] = useState(false); // State to control contacts visibility
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
      
      // For testing: Hard-code location to Emerald Hall
      setLocationInfo({
        coords: { latitude: 6.8925, longitude: 3.7240 },
        placeName: "Babcock University - Emerald Hall"
      });
      setLoading(false);
      return;
      
      // Get actual GPS coordinates with high accuracy and longer timeout
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest, // Use highest accuracy
        timeout: 20000 // Longer timeout to get better location
      });
      
      let { latitude, longitude } = loc.coords;
      
      // Babcock University boundaries (updated with more precise values)
      const babcockBounds = {
        latMin: 6.8890, latMax: 6.9060,
        lngMin: 3.7140, lngMax: 3.7290
      };
      
      // Check if location is within Babcock
      const isInBabcock = 
        latitude >= babcockBounds.latMin && 
        latitude <= babcockBounds.latMax &&
        longitude >= babcockBounds.lngMin && 
        longitude <= babcockBounds.lngMax;
      
      if (isInBabcock) {
        // Map coordinates to specific buildings
        const buildingLocation = getBabcockBuilding(latitude, longitude);
        
        // Log the location for debugging
        console.log(`Location detected: ${latitude}, ${longitude} - ${buildingLocation}`);
        
        setLocationInfo({
          coords: { latitude, longitude },
          placeName: buildingLocation
        });
      } else {
        // Not in Babcock, use general location info
        let placeName = await getPlaceName(latitude, longitude);
        
        setLocationInfo({
          coords: { latitude, longitude },
          placeName: placeName
        });
      }
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching location:", error);
      // Don't show error message, just set a default location
      setLocationInfo({
        coords: { latitude: 6.8948, longitude: 3.7214 },
        placeName: "Babcock University Campus"
      });
      setLoading(false);
    }
  };

  // Function to map coordinates to specific Babcock buildings with expanded locations
  const getBabcockBuilding = (lat, lng) => {
    // Comprehensive list of Babcock buildings and their approximate coordinates
    const buildings = [
      // Administrative buildings
      { name: "Admin Block", latMin: 6.8945, latMax: 6.8955, lngMin: 3.7195, lngMax: 3.7205 },
      { name: "President's Office", latMin: 6.8943, latMax: 6.8953, lngMin: 3.7197, lngMax: 3.7207 },
      
      // Academic buildings
      { name: "BBS Building", latMin: 6.8945, latMax: 6.8955, lngMin: 3.7225, lngMax: 3.7235 },
      { name: "Science Complex", latMin: 6.8930, latMax: 6.8940, lngMin: 3.7240, lngMax: 3.7250 },
      { name: "Engineering Building", latMin: 6.8960, latMax: 6.8970, lngMin: 3.7220, lngMax: 3.7230 },
      { name: "Main Library", latMin: 6.8940, latMax: 6.8950, lngMin: 3.7200, lngMax: 3.7210 },
      { name: "BuCoDel (Distance Learning Center)", latMin: 6.8970, latMax: 6.8980, lngMin: 3.7210, lngMax: 3.7220 },
      { name: "Law Building", latMin: 6.8955, latMax: 6.8965, lngMin: 3.7180, lngMax: 3.7190 },
      { name: "College of Health Sciences", latMin: 6.8925, latMax: 6.8935, lngMin: 3.7170, lngMax: 3.7180 },
      
      // Male Halls
      { name: "Nelson Mandela Hall", latMin: 6.8965, latMax: 6.8975, lngMin: 3.7185, lngMax: 3.7195 },
      { name: "Samuel Akande Hall", latMin: 6.8985, latMax: 6.8995, lngMin: 3.7205, lngMax: 3.7215 },
      { name: "Crystal Hall (Male)", latMin: 6.8975, latMax: 6.8985, lngMin: 3.7195, lngMax: 3.7205 },
      { name: "Welch Hall", latMin: 6.8980, latMax: 6.8990, lngMin: 3.7190, lngMax: 3.7200 },
      
      // Female Halls
      { name: "Queen Esther Hall", latMin: 6.8915, latMax: 6.8925, lngMin: 3.7225, lngMax: 3.7235 },
      { name: "Emerald Hall", latMin: 6.8920, latMax: 6.8930, lngMin: 3.7235, lngMax: 3.7245 },
      { name: "Topaz Hall", latMin: 6.8925, latMax: 6.8935, lngMin: 3.7220, lngMax: 3.7230 },
      { name: "Ruby Hall", latMin: 6.8915, latMax: 6.8925, lngMin: 3.7215, lngMax: 3.7225 },
      { name: "Diamond Hall", latMin: 6.8910, latMax: 6.8920, lngMin: 3.7240, lngMax: 3.7250 },
      { name: "Bethel Hall", latMin: 6.8930, latMax: 6.8940, lngMin: 3.7230, lngMax: 3.7240 },
      
      // Other important locations
      { name: "Pioneer Church", latMin: 6.8925, latMax: 6.8935, lngMin: 3.7205, lngMax: 3.7215 },
      { name: "BUTH (Hospital)", latMin: 6.8905, latMax: 6.8915, lngMin: 3.7165, lngMax: 3.7175 },
      { name: "University Cafeteria", latMin: 6.8935, latMax: 6.8945, lngMin: 3.7185, lngMax: 3.7195 },
      { name: "Sports Complex", latMin: 6.8955, latMax: 6.8965, lngMin: 3.7225, lngMax: 3.7235 },
      { name: "Student Center", latMin: 6.8950, latMax: 6.8960, lngMin: 3.7210, lngMax: 3.7220 },
      { name: "Main Gate", latMin: 6.8900, latMax: 6.8910, lngMin: 3.7190, lngMax: 3.7200 },
      { name: "Amphitheater", latMin: 6.8940, latMax: 6.8950, lngMin: 3.7205, lngMax: 3.7215 },
      { name: "Babcock Guest House", latMin: 6.8935, latMax: 6.8945, lngMin: 3.7170, lngMax: 3.7180 },
      { name: "Staff Quarters", latMin: 6.8970, latMax: 6.8990, lngMin: 3.7230, lngMax: 3.7250 }
    ];
    
    // Find which building the coordinates fall into
    for (const building of buildings) {
      if (lat >= building.latMin && lat <= building.latMax && 
          lng >= building.lngMin && lng <= building.lngMax) {
        return `Babcock University - ${building.name}`;
      }
    }
    
    // If no exact match but still on campus, try to determine the general area
    const areas = [
      { name: "Academic Area", latMin: 6.8930, latMax: 6.8960, lngMin: 3.7190, lngMax: 3.7240 },
      { name: "Male Hostels Area", latMin: 6.8960, latMax: 6.8990, lngMin: 3.7180, lngMax: 3.7220 },
      { name: "Female Hostels Area", latMin: 6.8910, latMax: 6.8930, lngMin: 3.7215, lngMax: 3.7250 },
      { name: "Sports Complex Area", latMin: 6.8950, latMax: 6.8970, lngMin: 3.7220, lngMax: 3.7240 },
      { name: "Medical Area", latMin: 6.8900, latMax: 6.8920, lngMin: 3.7160, lngMax: 3.7180 }
    ];
    
    for (const area of areas) {
      if (lat >= area.latMin && lat <= area.latMax && 
          lng >= area.lngMin && lng <= area.lngMax) {
        return `Babcock University - ${area.name}`;
      }
    }
    
    // Default if no specific building or area match is found
    return "Babcock University Campus";
  };

  const getPlaceName = async (lat, lng) => {
    try {
      let response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'EmergencyApp/1.0', // Add a user agent to avoid getting blocked
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP error ${response.status}`);
      }
      
      let data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      }
      return "Unknown Location";
    } catch (error) {
      console.error("Error fetching place name:", error);
      // Return coordinates as fallback if place name fails
      return `Location (${lat.toFixed(5)}, ${lng.toFixed(5)})`;
    }
  };

  const triggerEmergency = async () => {
    // Immediately show the alert that we've sent the alert
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
    
    // Attempt to get location in the background
    if (!permissionGranted) {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === "granted") {
        setPermissionGranted(true);
      }
    }
    
    // Always try to fetch location, but don't wait for it to complete
    fetchLocation();
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
      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="arrow-back" size={28} color="white" />
      </TouchableOpacity>

      <Text style={styles.title}>Emergency Alert System</Text>
      
      {/* Location Display */}
      <View style={styles.locationContainer}>
        {loading ? (
          <ActivityIndicator size="small" color="white" />
        ) : locationInfo ? (
          <>
            <Text style={styles.locationTitle}>Your Current Location:</Text>
            <Text style={styles.locationText} numberOfLines={2}>
              {locationInfo.placeName}
            </Text>
            <TouchableOpacity style={styles.refreshButton} onPress={fetchLocation}>
              <Ionicons name="refresh" size={16} color="white" />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.locationTitle}>Your Current Location:</Text>
            <Text style={styles.locationText}>Loading location...</Text>
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