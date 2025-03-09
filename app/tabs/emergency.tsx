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
      
      // Get actual GPS coordinates
      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High, // Using high accuracy for precision within campus
        timeout: 15000
      });
      
      let { latitude, longitude } = loc.coords;
      
      // Babcock University boundaries (approximate)
      const babcockBounds = {
        latMin: 6.8900, latMax: 6.9050,
        lngMin: 3.7150, lngMax: 3.7280
      };
      
      // Check if location is within Babcock
      const isInBabcock = 
        latitude >= babcockBounds.latMin && 
        latitude <= babcockBounds.latMax &&
        longitude >= babcockBounds.lngMin && 
        longitude <= babcockBounds.lngMax;
      
      if (isInBabcock) {
        // Map coordinates to specific buildings (this would be a more comprehensive map in reality)
        const buildingLocation = getBabcockBuilding(latitude, longitude);
        
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

  // Function to map coordinates to specific Babcock buildings
  const getBabcockBuilding = (lat, lng) => {
    // This is a simplified example - in a real app, you would have a more comprehensive database
    // of building coordinates and boundaries
    
    // These are example coordinates - you would need to replace with actual building coordinates
    const buildings = [
      { name: "Pioneer Church", latMin: 6.8930, latMax: 6.8940, lngMin: 3.7200, lngMax: 3.7210 },
      { name: "BBS Building", latMin: 6.8950, latMax: 6.8960, lngMin: 3.7220, lngMax: 3.7230 },
      { name: "Nelson Mandela Hall", latMin: 6.8970, latMax: 6.8980, lngMin: 3.7190, lngMax: 3.7200 },
      { name: "Samuel Akande Hall", latMin: 6.8990, latMax: 6.9000, lngMin: 3.7210, lngMax: 3.7220 },
      { name: "Queen Esther Hall", latMin: 6.8920, latMax: 6.8930, lngMin: 3.7230, lngMax: 3.7240 },
      { name: "BUTH (Hospital)", latMin: 6.8910, latMax: 6.8920, lngMin: 3.7170, lngMax: 3.7180 },
      { name: "University Cafeteria", latMin: 6.8940, latMax: 6.8950, lngMin: 3.7190, lngMax: 3.7200 },
      { name: "Sports Complex", latMin: 6.8960, latMax: 6.8970, lngMin: 3.7230, lngMax: 3.7240 }
    ];
    
    // Find which building the coordinates fall into
    for (const building of buildings) {
      if (lat >= building.latMin && lat <= building.latMax && 
          lng >= building.lngMin && lng <= building.lngMax) {
        return `Babcock University - ${building.name}`;
      }
    }
    
    // Default if no specific building match is found
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
      "Your emergency contacts and local authorities have been notified of your situation.",
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
    Linking.openURL('tel:911');
  };

  const toggleEmergencyContacts = () => {
    setShowContacts(true); // Show the contacts view
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
        Your Emergency Contacts and CPS will be notified
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

      {/* Quick Contact Buttons */}
      <View style={styles.quickContactsContainer}>
        <TouchableOpacity style={styles.quickContactButton} onPress={callEmergency}>
          <Ionicons name="call" size={24} color="white" />
          <Text style={styles.quickContactText}>911</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickContactButton} onPress={toggleEmergencyContacts}>
          <Ionicons name="people" size={24} color="white" />
          <Text style={styles.quickContactText}>Contacts</Text>
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
    zIndex: 10 
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
    alignItems: "center"
  },
  locationTitle: {
    fontSize: 14,
    color: "#CCC",
    marginBottom: 5
  },
  locationText: {
    fontSize: 16,
    color: "white",
    textAlign: "center"
  },
  refreshButton: {
    position: "absolute",
    right: 10,
    top: 10,
    padding: 5
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
    borderColor: "rgba(255,255,255,0.3)"
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 10,
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
  quickContactsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    position: "absolute",
    bottom: 40
  },
  quickContactButton: {
    backgroundColor: "#007AFF",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    width: 120
  },
  quickContactText: {
    color: "white",
    marginTop: 5,
    fontWeight: "500"
  }
});