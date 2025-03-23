import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Animated, 
  ActivityIndicator,
  Dimensions,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get screen dimensions for responsive design
const { width } = Dimensions.get("window");

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, isDark, toggleTheme } = useTheme();
  const auth = useAuth();
  
  // Add debug logging
  console.log("[Dashboard] Rendering with userProfile:", auth?.userProfile);
  
  const [greeting, setGreeting] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState(auth?.userProfile?.full_name || "User");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Safety Tips Carousel
  const safetyTips = [
    {
      id: 1,
      title: "Personal Awareness",
      tip: "Stay aware of your surroundings – avoid distractions like looking at your phone while walking, especially at night.",
      icon: "eye-outline"
    },
    {
      id: 2,
      title: "Location Sharing",
      tip: "Share your location with friends when traveling to unfamiliar places or when out late at night.",
      icon: "location-outline"
    },
    {
      id: 3,
      title: "Campus Escort",
      tip: "Use campus security escort services when walking late at night. Don't hesitate to call for assistance.",
      icon: "shield-checkmark-outline"
    },
    {
      id: 4,
      title: "Emergency Contacts",
      tip: "Save emergency contacts in your phone and memorize key numbers like campus security (08023456789).",
      icon: "call-outline"
    },
    {
      id: 5,
      title: "Room Security",
      tip: "Always lock your room or apartment door, even when you're inside or stepping out briefly.",
      icon: "lock-closed-outline"
    }
  ];
  
  // Campus Safety Updates
  const [safetyUpdates, setSafetyUpdates] = useState([]);
  
  // Carousel references and state
  const tipsCarouselRef = useRef(null);
  const [activeTipIndex, setActiveTipIndex] = useState(0);

  // Enhanced function to load user profile from multiple sources
  const loadUserProfile = async () => {
    try {
      console.log("[Dashboard] Attempting to load user profile");
      
      // First check if we have a userProfile in auth context
      if (auth?.userProfile) {
        console.log("[Dashboard] Using profile from auth context:", auth.userProfile.full_name);
        setUserName(auth.userProfile.full_name || "User");
        updateGreeting();
        return;
      }
      
      console.log("[Dashboard] No profile in auth context, checking other sources");
      
      // Try to get from AsyncStorage
      try {
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          const profileData = JSON.parse(storedProfile);
          console.log("[Dashboard] Found profile in AsyncStorage:", profileData.full_name);
          setUserName(profileData.full_name || "User");
          updateGreeting();
          return;
        }
      } catch (e) {
        console.error("[Dashboard] Error reading from AsyncStorage:", e);
      }
      
      // If we have a user but no profile, try to fetch directly
      if (auth?.user) {
        console.log("[Dashboard] Have user but no profile, fetching from Supabase:", auth.user.id);
        
        // Get profile directly from Supabase
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', auth.user.id)
          .single();
        
        if (error) {
          console.error("[Dashboard] Error fetching profile from Supabase:", error);
        } else if (data) {
          console.log("[Dashboard] Fetched profile from Supabase:", data.full_name);
          setUserName(data.full_name || "User");
          // Store for future use
          await AsyncStorage.setItem('userProfile', JSON.stringify(data));
          updateGreeting();
          return;
        }
      }
      
      // If all else fails, try to get active session and fetch profile
      console.log("[Dashboard] Checking for active session");
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session?.user) {
          console.log("[Dashboard] Found active session, fetching profile for:", sessionData.session.user.id);
          const userId = sessionData.session.user.id;
          
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (error) {
            console.error("[Dashboard] Error fetching profile from active session:", error);
          } else if (data) {
            console.log("[Dashboard] Successfully fetched profile from session:", data.full_name);
            setUserName(data.full_name || "User");
            await AsyncStorage.setItem('userProfile', JSON.stringify(data));
            updateGreeting();
            return;
          }
        } else {
          console.log("[Dashboard] No active session found, using default name");
        }
      } catch (e) {
        console.error("[Dashboard] Error checking session:", e);
      }
    } catch (error) {
      console.error("[Dashboard] Error loading profile:", error);
    } finally {
      updateGreeting(); // Make sure greeting is updated even if profile loading fails
    }
  };

  useEffect(() => {
    // Enhanced profile loading that tries multiple sources
    loadUserProfile();
    
    // Load alerts and safety updates
    fetchAlerts();
    fetchSafetyUpdates();
  }, []);
  
  // Update greeting whenever userName changes
  useEffect(() => {
    updateGreeting();
  }, [userName]);
  
  // Update userName when profile changes in auth context
  useEffect(() => {
    if (auth?.userProfile?.full_name) {
      console.log("[Dashboard] Profile updated in auth context:", auth.userProfile.full_name);
      setUserName(auth.userProfile.full_name);
    }
  }, [auth?.userProfile]);
  
  // Auto-scroll effect for tips carousel
  useEffect(() => {
    const interval = setInterval(() => {
      if (tipsCarouselRef.current) {
        const nextIndex = (activeTipIndex + 1) % safetyTips.length;
        tipsCarouselRef.current.scrollTo({
          x: nextIndex * (width - 30),
          animated: true
        });
        setActiveTipIndex(nextIndex);
      }
    }, 5000); // Scroll every 5 seconds

    return () => clearInterval(interval);
  }, [activeTipIndex]);

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

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      
      // Fetch alerts from Supabase
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      
      // Check if we have data
      if (!data || data.length === 0) {
        console.log("[Dashboard] No alerts found, creating sample data");
        // Create sample alerts
        const sampleAlerts = [
          {
            message: "Emergency drill scheduled for tomorrow at 10 AM.",
            is_urgent: true,
            created_at: new Date().toISOString()
          },
          {
            message: "Lost item reported: A black backpack found near the cafeteria. Claim at the security office.",
            is_urgent: false,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // 1 week ago
          }
        ];
        
        // Insert sample alerts
        const { error: insertError } = await supabase
          .from('alerts')
          .insert(sampleAlerts);
          
        if (insertError) {
          console.error("[Dashboard] Error inserting sample alerts:", insertError);
          // Fallback to static data
          setAlerts([
            {
              id: 1,
              message: "Emergency drill scheduled for tomorrow at 10 AM.",
              time: "2 hours ago",
              date: "March 24, 2025",
              urgent: true
            },
            {
              id: 2,
              message: "Lost item reported: A black backpack found near the cafeteria. Claim at the security office.",
              time: "",
              date: "March 17, 2025",
              urgent: false
            }
          ]);
        } else {
          // Fetch the newly inserted data
          const { data: freshData } = await supabase
            .from('alerts')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (freshData && freshData.length > 0) {
            setAlerts(freshData.map(alert => ({
              id: alert.id,
              message: alert.message,
              time: formatTimeAgo(alert.created_at),
              date: new Date(alert.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
              urgent: alert.is_urgent
            })));
          }
        }
      } else {
        // We have data from the database
        setAlerts(data.map(alert => ({
          id: alert.id,
          message: alert.message,
          time: formatTimeAgo(alert.created_at),
          date: new Date(alert.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
          urgent: alert.is_urgent
        })));
      }
    } catch (error) {
      console.error("[Dashboard] Error fetching alerts:", error);
      // Fallback to static data
      setAlerts([
        {
          id: 1,
          message: "Emergency drill scheduled for tomorrow at 10 AM.",
          time: "2 hours ago",
          date: "March 24, 2025",
          urgent: true
        },
        {
          id: 2,
          message: "Lost item reported: A black backpack found near the cafeteria. Claim at the security office.",
          time: "",
          date: "March 17, 2025",
          urgent: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchSafetyUpdates = async () => {
    try {
      // Fetch safety updates from Supabase
      const { data, error } = await supabase
        .from('safety_updates')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);
      
      if (error) throw error;
      
      // Check if we have data
      if (!data || data.length === 0) {
        console.log("[Dashboard] No safety updates found, creating sample data");
        // Create sample safety updates
        const sampleUpdates = [
          {
            title: "New Security Gates",
            description: "New security gates have been installed at all campus entrances with 24/7 monitoring.",
            icon: "shield-outline",
            created_at: new Date().toISOString()
          },
          {
            title: "Emergency Drills",
            description: "Monthly emergency drills scheduled to ensure preparedness. Next drill: April 10th.",
            icon: "fitness-outline",
            created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
          }
        ];
        
        // Insert sample updates
        const { error: insertError } = await supabase
          .from('safety_updates')
          .insert(sampleUpdates);
          
        if (insertError) {
          console.error("[Dashboard] Error inserting sample updates:", insertError);
          // Fallback to static data
          setSafetyUpdates([
            {
              id: 1,
              title: "New Security Gates",
              description: "New security gates have been installed at all campus entrances with 24/7 monitoring.",
              icon: "shield-outline",
              date: "March 24, 2025"
            },
            {
              id: 2,
              title: "Emergency Drills",
              description: "Monthly emergency drills scheduled to ensure preparedness. Next drill: April 10th.",
              icon: "fitness-outline",
              date: "March 22, 2025"
            }
          ]);
        } else {
          // Fetch the newly inserted data
          const { data: freshData } = await supabase
            .from('safety_updates')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(4);
            
          if (freshData && freshData.length > 0) {
            setSafetyUpdates(freshData.map(update => ({
              id: update.id,
              title: update.title,
              description: update.description,
              icon: update.icon || "shield-outline",
              date: new Date(update.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            })));
          }
        }
      } else {
        // We have data from the database
        setSafetyUpdates(data.map(update => ({
          id: update.id,
          title: update.title,
          description: update.description,
          icon: update.icon || "shield-outline",
          date: new Date(update.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        })));
      }
    } catch (error) {
      console.error("[Dashboard] Error fetching safety updates:", error);
      // Fallback to static data
      setSafetyUpdates([
        {
          id: 1,
          title: "New Security Gates",
          description: "New security gates have been installed at all campus entrances with 24/7 monitoring.",
          icon: "shield-outline",
          date: "March 24, 2025"
        },
        {
          id: 2,
          title: "Emergency Drills",
          description: "Monthly emergency drills scheduled to ensure preparedness. Next drill: April 10th.",
          icon: "fitness-outline",
          date: "March 22, 2025"
        }
      ]);
    }
  };

  const formatTimeAgo = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const seconds = Math.floor((now - date) / 1000);
    
    if (seconds < 60) return 'Just now';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
    
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'} ago`;
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    
    return '';
  };

  // Close dropdown when clicking outside
  const handlePressOutside = () => {
    if (showDropdown) {
      setShowDropdown(false);
    }
  };

  // Function to show Coming Soon alert for specific features
  const showComingSoonAlert = (featureName) => {
    Alert.alert(
      `${featureName} Coming Soon`,
      `The ${featureName} feature is currently under development and will be available in a future update.`,
      [{ text: "OK", onPress: () => console.log(`${featureName} alert closed`) }]
    );
  };

  // Handle logout with confirmation
  const handleLogout = () => {
    Alert.alert(
      "Confirm Logout",
      "Are you sure you want to logout from Unilert?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          onPress: async () => {
            try {
              if (auth?.signOut) {
                await auth.signOut();
              } else {
                // Fallback logout if auth context method is not available
                await supabase.auth.signOut();
                await AsyncStorage.removeItem('userProfile');
                await AsyncStorage.removeItem('user');
              }
              router.push("../login");
            } catch (error) {
              console.error("[Dashboard] Logout error:", error);
              Alert.alert("Error", "Failed to logout. Please try again.");
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  // Check session periodically to ensure we're still logged in
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          console.log("[Dashboard] Session expired, redirecting to login");
          router.replace("/login");
        }
      } catch (error) {
        console.error("[Dashboard] Error checking session:", error);
      }
    };

    // Check once when component mounts
    checkSession();

    // Set up interval to check periodically
    const interval = setInterval(checkSession, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={isDark ? "#121212" : "#FFF"} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.greeting, { color: theme.text }]}>{greeting}</Text>
        <View style={styles.headerControls}>
          {/* Theme toggle */}
          <TouchableOpacity 
            style={[styles.themeToggle, { backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} 
            onPress={toggleTheme}
          >
            <Ionicons 
              name={isDark ? "sunny-outline" : "moon-outline"} 
              size={22} 
              color={theme.text} 
            />
          </TouchableOpacity>
          
          {/* Profile button */}
          <TouchableOpacity onPress={() => setShowDropdown(!showDropdown)}>
            <Ionicons name="person-circle-outline" size={34} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Dropdown Menu */}
      {showDropdown && (
        <View style={[styles.dropdown, { backgroundColor: theme.card, shadowColor: isDark ? '#000' : '#333' }]}>
          <TouchableOpacity 
            style={[styles.dropdownItem, { borderBottomColor: theme.border }]} 
            onPress={() => {
              router.push("/tabs/profile");
              setShowDropdown(false);
            }}
          > 
            <Ionicons name="person-outline" size={20} color={theme.text} style={styles.dropdownIcon} />
            <Text style={[styles.dropdownText, { color: theme.text }]}>Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dropdownItem, { borderBottomColor: theme.border }]} 
            onPress={() => {
              router.push("/tabs/settings");
              setShowDropdown(false);
            }}
          > 
            <Ionicons name="settings-outline" size={20} color={theme.text} style={styles.dropdownIcon} />
            <Text style={[styles.dropdownText, { color: theme.text }]}>Settings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dropdownItem]} 
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color={theme.danger} style={styles.dropdownIcon} />
            <Text style={[styles.logoutText, { color: theme.danger }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={styles.content} 
        onScrollBeginDrag={handlePressOutside}
        contentContainerStyle={{ padding: 15 }}
      >
        {/* Debug info section - only in development */}
        {__DEV__ && (
          <View style={{
            padding: 10,
            margin: 10,
            backgroundColor: isDark ? '#333' : '#f0f0f0',
            borderRadius: 8
          }}>
            <Text style={{color: theme.text, fontWeight: 'bold'}}>Debug Info:</Text>
            <Text style={{color: theme.text}}>Auth state: {auth?.user ? 'Logged in' : 'Not logged in'}</Text>
            <Text style={{color: theme.text}}>User ID: {auth?.user?.id || 'None'}</Text>
            <Text style={{color: theme.text}}>Profile loaded: {auth?.userProfile ? 'Yes' : 'No'}</Text>
            <Text style={{color: theme.text}}>Name: {userName}</Text>
            <Text style={{color: theme.text}}>Current greeting: {greeting}</Text>
            <TouchableOpacity 
              style={{
                marginTop: 5,
                padding: 8,
                backgroundColor: isDark ? '#444' : '#ddd',
                borderRadius: 4,
                alignItems: 'center'
              }}
              onPress={loadUserProfile}
            >
              <Text style={{color: theme.text}}>Reload Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Weather Widget */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.weatherWidget}>
            <Ionicons name="partly-sunny" size={42} color={theme.warning} />
            <View style={styles.weatherInfo}>
              <Text style={[styles.weatherText, { color: theme.text }]}>28°C, Sunny</Text>
              <Text style={[styles.weatherSubText, { color: theme.secondaryText }]}>Babcock University</Text>
            </View>
          </View>
        </View>
        
        {/* User Profile Summary */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.profileSummary}>
            <View style={[styles.profileIcon, { backgroundColor: theme.accent }]}>
              <Text style={styles.profileInitials}>
                {userName.split(' ').map(name => name[0]).join('').toUpperCase()}
              </Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={[styles.profileName, {color: theme.text}]}>{userName}</Text>
              <Text style={[styles.profileInfo, {color: theme.secondaryText}]}>
                {auth?.userProfile?.matric_no || 'No Matric Number'} • {auth?.userProfile?.department || 'No Department'}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Daily Safety Tips Carousel */}
        <View style={[styles.card, { backgroundColor: theme.card }]}>
          <View style={styles.carouselHeader}>
            <Text style={[styles.carouselTitle, { color: theme.text }]}>Daily Safety Tips</Text>
            <Ionicons name="shield-checkmark" size={20} color={theme.accent} />
          </View>
          
          <ScrollView
            ref={tipsCarouselRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(event) => {
              const newIndex = Math.round(event.nativeEvent.contentOffset.x / (width - 30));
              setActiveTipIndex(newIndex);
            }}
          >
            {safetyTips.map((item) => (
              <View key={item.id} style={[styles.tipItem, { width: width - 30 }]}>
                <View style={[styles.tipContainer, {
                  backgroundColor: isDark ? 'rgba(77, 171, 247, 0.15)' : '#E3F2FD',
                  borderColor: isDark ? 'rgba(77, 171, 247, 0.3)' : '#C5E1FB'
                }]}>
                  <View style={styles.tipHeader}>
                    <Ionicons name={item.icon} size={28} color={theme.accent} />
                    <Text style={[styles.tipTitle, { color: theme.accent }]}>{item.title}</Text>
                  </View>
                  <Text style={[styles.tipText, { color: theme.text }]}>{item.tip}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          
          <View style={styles.paginationDots}>
            {safetyTips.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.paginationDot,
                  { backgroundColor: index === activeTipIndex ? theme.accent : isDark ? '#444' : '#ddd' },
                ]}
              />
            ))}
          </View>
        </View>

        {/* Safety Tools */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Safety Tools</Text>
        <View style={styles.toolsContainer}>
          <TouchableOpacity style={styles.toolButton} onPress={() => router.push("/tabs/helplines")}> 
            <View style={styles.toolIconContainer}>
              <Ionicons name="call" size={24} color="white" />
            </View>
            <Text style={[styles.toolText, { color: theme.text }]}>Safety Helplines</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolButton} onPress={() => router.push("/tabs/report")}> 
            <View style={[styles.toolIconContainer, { backgroundColor: "#4CAF50" }]}>
              <Ionicons name="document-text-outline" size={24} color="white" />
            </View>
            <Text style={[styles.toolText, { color: theme.text }]}>Report Incident</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.toolButton} 
            onPress={() => showComingSoonAlert("Safety Map")}
          > 
            <View style={[styles.toolIconContainer, { backgroundColor: "#9C27B0" }]}>
              <Ionicons name="map" size={24} color="white" />
            </View>
            <Text style={[styles.toolText, { color: theme.text }]}>Safety Map</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Alerts */}
        <View style={styles.alertsHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Alerts</Text>
          <TouchableOpacity onPress={() => router.push("/tabs/alerts")}>
            <Text style={[styles.viewAllText, { color: theme.accent }]}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {alerts.map((alert) => (
          <View 
            key={alert.id} 
            style={[
              styles.alertContainer, 
              { backgroundColor: theme.card },
              alert.urgent && [
                styles.urgentAlert, 
                { backgroundColor: isDark ? 'rgba(255, 59, 48, 0.2)' : '#FFF5F5' }
              ]
            ]}
          >
            <Text style={[
              styles.alertText, 
              { color: alert.urgent ? (isDark ? '#ff6b6b' : "#FF3B30") : theme.text }
            ]}>
              {alert.message}
            </Text>
            <View style={styles.alertFooter}>
              <Text style={[styles.alertTime, { color: theme.secondaryText }]}>{alert.time}</Text>
              {alert.urgent && (
                <View style={styles.urgentBadge}>
                  <Text style={styles.urgentText}>URGENT</Text>
                </View>
              )}
            </View>
          </View>
        ))}
        
        {/* Campus Safety Updates as a list */}
        <View style={styles.updatesHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Campus Safety Updates</Text>
        </View>
        
        {safetyUpdates.map((update) => (
          <View 
            key={update.id} 
            style={[
              styles.updateListItem, 
              { backgroundColor: theme.card }
            ]}
          >
            <View style={styles.updateIconWrapper}>
              <View style={[styles.updateIcon, { backgroundColor: isDark ? 'rgba(77, 171, 247, 0.2)' : '#e6f2ff' }]}>
                <Ionicons name={update.icon} size={22} color={theme.accent} />
              </View>
            </View>
            <View style={styles.updateContent}>
              <Text style={[styles.updateTitle, { color: theme.text }]}>{update.title}</Text>
              <Text style={[styles.updateDescription, { color: theme.secondaryText }]}>{update.description}</Text>
              <Text style={[styles.updateDate, { color: theme.secondaryText }]}>{update.date}</Text>
            </View>
          </View>
        ))}
        
        {/* Quick Access */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Quick Access</Text>
        <View style={styles.quickAccessContainer}>
          <TouchableOpacity 
            style={[styles.quickAccessButton, { backgroundColor: theme.card }]} 
            onPress={() => showComingSoonAlert("Safety Resources")}
          >
<Ionicons name="book-outline" size={24} color={theme.accent} />
            <Text style={[styles.quickAccessText, { color: theme.text }]}>Safety Resources</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickAccessButton, { backgroundColor: theme.card }]} 
            onPress={() => showComingSoonAlert("Safety Training")}
          >
            <Ionicons name="school-outline" size={24} color={theme.accent} />
            <Text style={[styles.quickAccessText, { color: theme.text }]}>Safety Training</Text>
          </TouchableOpacity>
        </View>
        
        {/* Add some padding at the bottom for the navbar */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Navigation Bar */}
      <View style={[
        styles.navbar, 
        { 
          backgroundColor: theme.card, 
          borderTopColor: theme.border,
          shadowColor: isDark ? '#000' : '#333'
        }
      ]}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/tabs/dashboard")}> 
          <Ionicons 
            name={pathname === "/tabs/dashboard" ? "home" : "home-outline"} 
            size={28} 
            color={pathname === "/tabs/dashboard" ? theme.accent : theme.secondaryText} 
          />
          <Text style={[
            styles.navText, 
            { color: pathname === "/tabs/dashboard" ? theme.accent : theme.secondaryText }
          ]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/tabs/emergency-contacts")}> 
          <Ionicons 
            name={pathname === "/tabs/emergency-contacts" ? "people" : "people-outline"} 
            size={28} 
            color={pathname === "/tabs/emergency-contacts" ? theme.accent : theme.secondaryText} 
          />
          <Text style={[
            styles.navText, 
            { color: pathname === "/tabs/emergency-contacts" ? theme.accent : theme.secondaryText }
          ]}>Contacts</Text>
        </TouchableOpacity>
        
        {/* Center SOS Button */}
        <View style={styles.navItem}>
          <TouchableOpacity style={styles.sosButton} onPress={() => router.push("/tabs/emergency")}> 
            <Ionicons name="alert" size={32} color="white" />
          </TouchableOpacity>
          <Text style={styles.sosText}>SOS</Text>
        </View>
        
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/tabs/profile")}> 
          <Ionicons 
            name={pathname === "/tabs/profile" ? "person" : "person-outline"} 
            size={28} 
            color={pathname === "/tabs/profile" ? theme.accent : theme.secondaryText} 
          />
          <Text style={[
            styles.navText, 
            { color: pathname === "/tabs/profile" ? theme.accent : theme.secondaryText }
          ]}>Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push("/tabs/notifications")}> 
          <Ionicons 
            name={pathname === "/tabs/notifications" ? "notifications" : "notifications-outline"} 
            size={28} 
            color={pathname === "/tabs/notifications" ? theme.accent : theme.secondaryText} 
          />
          <Text style={[
            styles.navText, 
            { color: pathname === "/tabs/notifications" ? theme.accent : theme.secondaryText }
          ]}>Notifications</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
  },
  profileSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  profileIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileDetails: {
    marginLeft: 10,
  },
  profileName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileInfo: {
    fontSize: 14,
    marginTop: 2,
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 15,
  },
  headerControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  themeToggle: {
    padding: 8,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  greeting: { 
    fontSize: 20, 
    fontWeight: "700",
  },
  content: {
    flex: 1,
  },
  dropdown: { 
    position: "absolute", 
    top: Platform.OS === 'android' ? 85 : 65,
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
    padding: 15,
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
  carouselHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  carouselTitle: {
    fontSize: 16,
    fontWeight: "bold",
  },
  tipItem: {
    paddingRight: 0,
  },
  tipContainer: {
    borderRadius: 12,
    padding: 15,
    borderWidth: 1,
  },
  tipHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 10,
  },
  tipText: {
    fontSize: 15,
    lineHeight: 22,
  },
  paginationDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4
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
  updatesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 5
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
  updateListItem: {
    flexDirection: "row",
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  updateIconWrapper: {
    marginRight: 15
  },
  updateIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center"
  },
  updateContent: {
    flex: 1
  },
  updateTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4
  },
  updateDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 5
  },
  updateDate: {
    fontSize: 12,
    fontStyle: "italic"
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
    color: "#FF3B30"
  }
});