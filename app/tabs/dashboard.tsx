import { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  ScrollView, 
  SafeAreaView, 
  Image, 
  Dimensions, 
  Alert 
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";

// Get screen dimensions for responsive design
const { width } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const { userProfile, signOut } = useAuth();
  
  const [greeting, setGreeting] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Get user's first name from the full name
  const userName = userProfile?.fullname 
    ? userProfile.fullname.split(' ')[0] 
    : "User";
    
  const [alerts, setAlerts] = useState([
    {
      id: 1,
      message: "Emergency drill scheduled for tomorrow at 10 AM.",
      time: "2 hours ago",
      urgent: false
    },
    {
      id: 2,
      message: "Lost item reported: A black backpack found near the cafeteria. Claim at the security office.",
      time: "Now",
      urgent: false
    }
  ]);

  const safetyTips = [
    "Stay Aware of Your Surroundings – Avoid distractions like looking at your phone while walking, especially at night. Stay alert and trust your instincts if something feels off.",
    "Share Your Location – Let friends know where you're going and when you expect to arrive, especially when traveling alone.",
    "Use Campus Escort Services – Don't hesitate to use campus security escort services when walking late at night."
  ];
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    updateGreeting();
    // Rotate safety tips every 24 hours
    const tipIndex = Math.floor(new Date().getDate() % safetyTips.length);
    setCurrentTipIndex(tipIndex);
  }, [userProfile]);

  const updateGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting(`Good morning, ${userName}`);
    } else if (hour < 18) {
      setGreeting(`Good afternoon, ${userName}`);
    } else {
      setGreeting(`Good evening, ${userName}`);
    }
  };

  // Close dropdown when clicking outside
  const handlePressOutside = () => {
    if (showDropdown) {
      setShowDropdown(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive", 
          onPress: async () => {
            await signOut();
            router.replace("/login");
          }
        }
      ]
    );
  };

  // Function to show Coming Soon alert for specific features
  const showComingSoonAlert = (featureName) => {
    Alert.alert(
      `${featureName} Coming Soon`,
      `The ${featureName} feature is currently under development and will be available in a future update.`,
      [{ text: "OK", onPress: () => console.log(`${featureName} alert closed`) }]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.cardBackground, borderBottomColor: theme.borderColor }]}>
        <Text style={[styles.greeting, { color: theme.textColor }]}>{greeting}</Text>
        <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)}>
          <Ionicons name="person-circle-outline" size={34} color={theme.textColor} />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {showDropdown && (
        <View style={[styles.dropdown, { backgroundColor: theme.cardBackground, shadowColor: theme.textColor }]}>
          <TouchableOpacity 
            style={styles.dropdownItem} 
            onPress={() => {
              router.push("/tabs/profile");
              setShowDropdown(false);
            }}
          > 
            <Ionicons name="person-outline" size={20} color={theme.textColor} style={styles.dropdownIcon} />
            <Text style={[styles.dropdownText, { color: theme.textColor }]}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.dropdownItem} 
            onPress={() => {
              router.push("/tabs/settings");
              setShowDropdown(false);
            }}
          > 
            <Ionicons name="settings-outline" size={20} color={theme.textColor} style={styles.dropdownIcon} />
            <Text style={[styles.dropdownText, { color: theme.textColor }]}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dropdownItem, styles.logoutItem]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.dangerColor} style={styles.dropdownIcon} />
            <Text style={[styles.logoutText, { color: theme.dangerColor }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView style={styles.content} onScrollBeginDrag={handlePressOutside}>
        {/* Weather Widget */}
        <View style={[styles.card, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.weatherWidget}>
            <Ionicons name="partly-sunny" size={42} color="#FFD700" />
            <View style={styles.weatherInfo}>
              <Text style={[styles.weatherText, { color: theme.textColor }]}>28°C, Sunny</Text>
              <Text style={[styles.weatherSubText, { color: theme.secondaryTextColor }]}>Babcock University</Text>
            </View>
          </View>
        </View>

        {/* Daily Safety Tip */}
        <View style={[styles.safetyTip, { backgroundColor: theme.isDarkMode ? "#1A3A5A" : "#E3F2FD" }]}>
          <View style={styles.safetyHeaderRow}>
            <Text style={[styles.safetyTitle, { color: theme.accentColor }]}>Daily Safety Tip</Text>
            <Ionicons name="shield-checkmark" size={24} color={theme.accentColor} />
          </View>
          <Text style={[styles.safetyText, { color: theme.textColor }]}>{safetyTips[currentTipIndex]}</Text>
        </View>

        {/* Safety Tools */}
        <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Safety Tools</Text>
        <View style={styles.toolsContainer}>
          <TouchableOpacity style={styles.toolButton} onPress={() => router.push("/tabs/helplines")}> 
            <View style={styles.toolIconContainer}>
              <Ionicons name="call" size={24} color="white" />
            </View>
            <Text style={[styles.toolText, { color: theme.textColor }]}>Safety Helplines</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={() => router.push("/tabs/report")}> 
            <View style={[styles.toolIconContainer, { backgroundColor: "#4CAF50" }]}>
              <Ionicons name="document-text-outline" size={24} color="white" />
            </View>
            <Text style={[styles.toolText, { color: theme.textColor }]}>Report Incident</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolButton} 
            onPress={() => showComingSoonAlert("Safety Map")}
          > 
            <View style={[styles.toolIconContainer, { backgroundColor: "#9C27B0" }]}>
              <Ionicons name="map" size={24} color="white" />
            </View>
            <Text style={[styles.toolText, { color: theme.textColor }]}>Safety Map</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Alerts */}
        <View style={styles.alertsHeader}>
          <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Recent Alerts</Text>
          <TouchableOpacity onPress={() => router.push("/tabs/alerts")}>
            <Text style={[styles.viewAllText, { color: theme.accentColor }]}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {alerts.map((alert) => (
          <View 
            key={alert.id} 
            style={[
              styles.alertContainer, 
              alert.urgent ? [styles.urgentAlert, { backgroundColor: theme.isDarkMode ? "#3A1A1A" : "#FFF5F5" }] : { backgroundColor: theme.cardBackground }
            ]}
          >
            <Text style={[styles.alertText, { color: theme.textColor }]}>{alert.message}</Text>
            <View style={styles.alertFooter}>
              <Text style={[styles.alertTime, { color: theme.secondaryTextColor }]}>{alert.time}</Text>
              {alert.urgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
            </View>
          </View>
        ))}
        
        {/* Quick Access */}
        <Text style={[styles.sectionTitle, { color: theme.textColor }]}>Quick Access</Text>
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity 
            style={[styles.quickAccessButton, { backgroundColor: theme.cardBackground }]} 
            onPress={() => showComingSoonAlert("Safety Resources")}
          >
            <Ionicons name="book-outline" size={24} color={theme.accentColor} />
            <Text style={[styles.quickAccessText, { color: theme.textColor }]}>Safety Resources</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickAccessButton, { backgroundColor: theme.cardBackground }]} 
            onPress={() => showComingSoonAlert("Safety Training")}
          >
            <Ionicons name="school-outline" size={24} color={theme.accentColor} />
            <Text style={[styles.quickAccessText, { color: theme.textColor }]}>Safety Training</Text>
          </TouchableOpacity>
        </View>
        
        {/* Add some padding at the bottom for the navbar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Navigation Bar */}
      <View style={[styles.navbar, { backgroundColor: theme.cardBackground, borderTopColor: theme.borderColor }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/tabs/dashboard")}> 
          <Ionicons 
            name={pathname === "/tabs/dashboard" ? "home" : "home-outline"} 
            size={28} 
            color={pathname === "/tabs/dashboard" ? theme.accentColor : theme.secondaryTextColor} 
          />
          <Text style={[
            styles.navText, 
            pathname === "/tabs/dashboard" ? 
              [styles.activeNavText, { color: theme.accentColor }] : 
              { color: theme.secondaryTextColor }
          ]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/tabs/emergency-contacts")}> 
          <Ionicons 
            name={pathname === "/tabs/emergency-contacts" ? "people" : "people-outline"} 
            size={28} 
            color={pathname === "/tabs/emergency-contacts" ? theme.accentColor : theme.secondaryTextColor} 
          />
          <Text style={[
            styles.navText, 
            pathname === "/tabs/emergency-contacts" ? 
              [styles.activeNavText, { color: theme.accentColor }] : 
              { color: theme.secondaryTextColor }
          ]}>Contacts</Text>
        </TouchableOpacity>
        
        {/* Center SOS Button */}
        <View style={styles.navItem}>
          <TouchableOpacity style={styles.sosButton} onPress={() => router.push("/tabs/emergency")}> 
            <Ionicons name="alert" size={32} color="white" />
          </TouchableOpacity>
          <Text style={[styles.sosText, { color: theme.dangerColor }]}>SOS</Text>
        </View>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/tabs/profile")}> 
          <Ionicons 
            name={pathname === "/tabs/profile" ? "person" : "person-outline"} 
            size={28} 
            color={pathname === "/tabs/profile" ? theme.accentColor : theme.secondaryTextColor} 
          />
          <Text style={[
            styles.navText, 
            pathname === "/tabs/profile" ? 
              [styles.activeNavText, { color: theme.accentColor }] : 
              { color: theme.secondaryTextColor }
          ]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/tabs/notifications")}> 
          <Ionicons 
            name={pathname === "/tabs/notifications" ? "notifications" : "notifications-outline"} 
            size={28} 
            color={pathname === "/tabs/notifications" ? theme.accentColor : theme.secondaryTextColor} 
          />
          <Text style={[
            styles.navText, 
            pathname === "/tabs/notifications" ? 
              [styles.activeNavText, { color: theme.accentColor }] : 
              { color: theme.secondaryTextColor }
          ]}>Notifications</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  greeting: { 
    fontSize: 20, 
    fontWeight: "700",
  },
  content: {
    flex: 1,
    padding: 15,
  },
  dropdown: { 
    position: "absolute", 
    top: 65, 
    right: 15, 
    borderRadius: 10, 
    elevation: 5, 
    padding: 5, 
    width: 180, 
    zIndex: 1000,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  dropdownItem: { 
    padding: 12, 
    borderBottomWidth: 1, 
    borderBottomColor: "#EFEFEF",
    flexDirection: "row",
    alignItems: "center"
  },
  dropdownIcon: {
    marginRight: 10
  },
  dropdownText: {
    fontSize: 16,
  },
  logoutItem: {
    borderBottomWidth: 0
  },
  logoutText: {
    fontSize: 16,
    fontWeight: "500"
  },
  card: {
    borderRadius: 12,
    padding: 5,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  weatherWidget: { 
    flexDirection: "row", 
    alignItems: "center", 
    padding: 15, 
    borderRadius: 10,
  },
  weatherInfo: {
    marginLeft: 15
  },
  weatherText: { 
    fontSize: 18, 
    fontWeight: "bold",
  },
  weatherSubText: { 
    fontSize: 14,
    marginTop: 3
  },
  safetyTip: { 
    padding: 20, 
    borderRadius: 12, 
    marginBottom: 20,
    shadowColor: "#1E90FF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  safetyHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15
  },
  safetyTitle: { 
    fontSize: 22, 
    fontWeight: "bold",
  },
  safetyText: { 
    fontSize: 16, 
    lineHeight: 24,
  },
  sectionTitle: { 
    fontSize: 18, 
    fontWeight: "bold", 
    marginBottom: 12,
    marginTop: 5,
  },
  toolsContainer: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 20,
    flexWrap: "wrap"
  },
  toolButton: { 
    alignItems: "center", 
    width: (width - 50) / 3,
    marginBottom: 10
  },
  toolIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1E90FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  toolText: {
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
  },
  alertsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "500"
  },
  alertContainer: { 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: "#FFD700",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  urgentAlert: {
    borderLeftColor: "#FF3B30",
  },
  alertText: { 
    fontSize: 14, 
    fontWeight: "500",
    lineHeight: 20
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8
  },
  alertTime: { 
    fontSize: 12, 
  },
  urgentBadge: {
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4
  },
  urgentText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold"
  },
  quickAccessContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20
  },
  quickAccessButton: {
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    width: (width - 45) / 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 10,
  },
  navbar: { 
    flexDirection: "row", 
    justifyContent: "space-around", 
    alignItems: "center", 
    paddingVertical: 8, 
    position: "absolute", 
    bottom: 0, 
    left: 0, 
    right: 0, 
    borderTopWidth: 1, 
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 5,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center"
  },
  navText: {
    fontSize: 12,
    marginTop: 2
  },
  activeNavText: {
    fontWeight: "500"
  },
  sosButton: {
    backgroundColor: "#FF3B30",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#FFF"
  },
  sosText: {
    fontSize: 12,
    fontWeight: "700",
  }
});