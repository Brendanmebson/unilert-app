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
  Platform,
  PixelRatio
} from "react-native";
import { useRouter, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../contexts/ThemeContext";
import { useAuth } from "../../contexts/AuthContext";
import { supabase } from "../../lib/supabase";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get("window");

// Normalize function to adjust sizes based on screen dimensions
const normalize = (size) => {
  const scale = width / 375; // based on iPhone 8's width
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

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

  // Check auth state and session on component mount
  useEffect(() => {
    const checkAndRefreshAuth = async () => {
      try {
        console.log("[Dashboard] Checking auth state and session");
        setLoading(true);
        
        // Always check for session first to ensure we have the most updated state
        const { data: sessionData } = await supabase.auth.getSession();
        
        if (sessionData?.session) {
          console.log("[Dashboard] Found active session, using that");
          
          // If we have a session, make sure the auth context is updated
          if (!auth.user && typeof auth.refreshProfile === 'function') {
            console.log("[Dashboard] Updating auth context with session data");
            await auth.refreshProfile();
          }
          
          // Load user profile from all sources
          await loadUserProfile();
        } else if (!auth.user) {
          // No session and no user, redirect to login
          console.log("[Dashboard] No active session found, redirecting to login");
          router.replace("/login");
          return;
        }
        
        // Fetch dashboard data
        await Promise.all([
          fetchAlerts(),
          fetchSafetyUpdates()
        ]);
      } catch (error) {
        console.error("[Dashboard] Error during initialization:", error);
      } finally {
        setLoading(false);
      }
    };
    
    checkAndRefreshAuth();
  }, []);

  // Enhanced function to load user profile from multiple sources
  const loadUserProfile = async () => {
    try {
      console.log("[Dashboard] Attempting to load user profile");
      
      // First check if we already have name data
      if (userName && userName !== "User") {
        console.log("[Dashboard] Already have user name:", userName);
        updateGreeting();
        
        // If we have a name but auth shows no user, try to fix the auth state
        if (!auth?.user) {
          console.log("[Dashboard] Have name but no auth user, attempting to restore session");
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session) {
            // We have a session but auth context doesn't recognize it
            // This is likely a synchronization issue
            console.log("[Dashboard] Found active session, manually syncing with auth context");
            
            // Try to force a refresh of the auth context
            if (typeof auth.refreshProfile === 'function') {
              await auth.refreshProfile();
            }
          }
        }
        return;
      }
      
      // Try to load profile from AsyncStorage first (fastest)
      try {
        const storedProfile = await AsyncStorage.getItem('userProfile');
        if (storedProfile) {
          const profileData = JSON.parse(storedProfile);
          console.log("[Dashboard] Found data in AsyncStorage:", profileData.full_name);
          setUserName(profileData.full_name || "User");
          
          // Also update auth context if possible
          if (!auth.userProfile && auth.user) {
            console.log("[Dashboard] Updating auth context with stored data");
            // If possible, directly update auth context
            if (typeof auth.updateProfile === 'function') {
              await auth.updateProfile(profileData);
            }
          }
          
          updateGreeting();
          return;
        }
      } catch (e) {
        console.error("[Dashboard] Error reading from AsyncStorage:", e);
      }
      
      // If we have a user ID but no profile, fetch from Supabase
      if (auth?.user?.id) {
        console.log("[Dashboard] Fetching profile from Supabase");
        
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', auth.user.id)
          .single();
          
        if (data && !error) {
          console.log("[Dashboard] Successfully fetched from Supabase");
          setUserName(data.full_name || "User");
          updateGreeting();
          
          // Save to AsyncStorage for future use
          await AsyncStorage.setItem('userProfile', JSON.stringify(data));
          
          // Update auth context
          if (auth?.updateProfile) {
            auth.updateProfile(data);
          }
          
          return;
        }
      }
    } catch (error) {
      console.error("[Dashboard] Error loading profile:", error);
    } finally {
      updateGreeting(); 
    }
  };

  const syncAuthState = async () => {
    console.log("[Dashboard] Syncing auth state");
    
    try {
      // Get session
      const { data: sessionData } = await supabase.auth.getSession();
      
      // Check if we have a session but auth context doesn't show it
      if (sessionData?.session?.user && !auth.user) {
        console.log("[Dashboard] Session exists but auth context doesn't reflect it");
        
        // First try to update auth context via refreshProfile
        if (typeof auth.refreshProfile === 'function') {
          console.log("[Dashboard] Attempting to refresh profile in auth context");
          await auth.refreshProfile();
        }
        
        // If that failed, we need a more direct approach
        if (!auth.user) {
          console.log("[Dashboard] Still no user in auth context, checking stored data");
          
          // Try to get user from storage
          const storedUser = await AsyncStorage.getItem('user');
          const storedProfile = await AsyncStorage.getItem('userProfile');
          
          if (storedProfile) {
            const profileData = JSON.parse(storedProfile);
            console.log("[Dashboard] Found stored profile:", profileData.full_name);
            setUserName(profileData.full_name || "User");
            updateGreeting();
          }
          
          // Force a page refresh if we have conflicting state
          if (storedUser && !auth.user) {
            console.log("[Dashboard] Auth state is out of sync, forcing refresh");
            // Navigate away and back to force context refresh
            setTimeout(() => {
              router.replace("/login");
              setTimeout(() => {
                router.replace("/tabs/dashboard");
              }, 100);
            }, 100);
          }
        }
      }
    } catch (error) {
      console.error("[Dashboard] Error syncing auth state:", error);
    }
  };

  useEffect(() => {
    // Update greeting whenever userName changes
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
          x: nextIndex * (width - normalize(30)),
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
// Continuation of Dashboard.tsx

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
<View style={[styles.header, { 
backgroundColor: theme.card, 
borderBottomColor: theme.border,
paddingVertical: normalize(15),
paddingHorizontal: normalize(20),
paddingTop: Platform.OS === 'android' ? normalize(40) : normalize(15)
}]}>
<Text style={[styles.greeting, { 
color: theme.text,
fontSize: normalize(20) 
}]}>{greeting}</Text>
<View style={styles.headerControls}>
{/* Theme toggle */}
<TouchableOpacity 
style={[styles.themeToggle, { 
backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
padding: normalize(8),
borderRadius: normalize(20)
}]} 
onPress={toggleTheme}
>
<Ionicons 
name={isDark ? "sunny-outline" : "moon-outline"} 
size={normalize(22)} 
color={theme.text} 
/>
</TouchableOpacity>

{/* Profile button */}
<TouchableOpacity onPress={() => setShowDropdown(!showDropdown)}>
<Ionicons name="person-circle-outline" size={normalize(34)} color={theme.text} />
</TouchableOpacity>
</View>
</View>

{/* Dropdown Menu */}
{showDropdown && (
<View style={[styles.dropdown, { 
backgroundColor: theme.card, 
shadowColor: isDark ? '#000' : '#333',
top: Platform.OS === 'android' ? normalize(85) : normalize(65),
right: normalize(15),
borderRadius: normalize(10),
width: normalize(180)
}]}>
<TouchableOpacity 
style={[styles.dropdownItem, { 
borderBottomColor: theme.border,
padding: normalize(12)
}]} 
onPress={() => {
router.push("/tabs/profile");
setShowDropdown(false);
}}
> 
<Ionicons name="person-outline" size={normalize(20)} color={theme.text} style={styles.dropdownIcon} />
<Text style={[styles.dropdownText, { 
color: theme.text,
fontSize: normalize(16),
marginLeft: normalize(10)
}]}>Profile</Text>
</TouchableOpacity>
<TouchableOpacity 
style={[styles.dropdownItem, { 
borderBottomColor: theme.border,
padding: normalize(12)
}]} 
onPress={() => {
router.push("/tabs/settings");
setShowDropdown(false);
}}
> 
<Ionicons name="settings-outline" size={normalize(20)} color={theme.text} style={styles.dropdownIcon} />
<Text style={[styles.dropdownText, { 
color: theme.text,
fontSize: normalize(16),
marginLeft: normalize(10)
}]}>Settings</Text>
</TouchableOpacity>
<TouchableOpacity 
style={[styles.dropdownItem, {
padding: normalize(12)
}]} 
onPress={handleLogout}
>
<Ionicons name="log-out-outline" size={normalize(20)} color={theme.danger} style={styles.dropdownIcon} />
<Text style={[styles.logoutText, { 
color: theme.danger,
fontSize: normalize(16),
marginLeft: normalize(10)
}]}>Logout</Text>
</TouchableOpacity>
</View>
)}

<ScrollView 
style={styles.content} 
onScrollBeginDrag={handlePressOutside}
contentContainerStyle={{ padding: normalize(15) }}
>
{/* Debug info section - only in development */}
{__DEV__ && (
<View style={{
padding: normalize(10),
margin: normalize(10),
backgroundColor: isDark ? '#333' : '#f0f0f0',
borderRadius: normalize(8)
}}>
<Text style={{color: theme.text, fontWeight: 'bold'}}>Debug Info:</Text>
<Text style={{color: theme.text}}>Auth state: {auth?.user ? 'Logged in' : 'Not logged in'}</Text>
<Text style={{color: theme.text}}>User ID: {auth?.user?.id || 'None'}</Text>
<Text style={{color: theme.text}}>Profile loaded: {auth?.userProfile ? 'Yes' : 'No'}</Text>
<Text style={{color: theme.text}}>Name: {userName}</Text>
<Text style={{color: theme.text}}>Current greeting: {greeting}</Text>
<TouchableOpacity 
style={{
  marginTop: normalize(5),
  padding: normalize(8),
  backgroundColor: isDark ? '#444' : '#ddd',
  borderRadius: normalize(4),
  alignItems: 'center'
}}
onPress={loadUserProfile}
>
<Text style={{color: theme.text}}>Reload Profile</Text>
</TouchableOpacity>
</View>
)}

{/* Weather Widget */}
<View style={[styles.card, { 
backgroundColor: theme.card,
padding: normalize(15),
borderRadius: normalize(12),
marginBottom: normalize(15)
}]}>
<View style={styles.weatherWidget}>
<Ionicons name="partly-sunny" size={normalize(42)} color={theme.warning} />
<View style={styles.weatherInfo}>
<Text style={[styles.weatherText, { 
  color: theme.text,
  fontSize: normalize(18)
}]}>28°C, Sunny</Text>
<Text style={[styles.weatherSubText, { 
  color: theme.secondaryText,
  fontSize: normalize(14)
}]}>Babcock University</Text>
</View>
</View>
</View>

{/* Daily Safety Tips Carousel */}
<View style={[styles.card, { 
backgroundColor: theme.card,
padding: normalize(5),
borderRadius: normalize(12),
marginBottom: normalize(15)
}]}>
<View style={styles.carouselHeader}>
<Text style={[styles.carouselTitle, { 
color: theme.text,
fontSize: normalize(16) ,
}]}>Daily Safety Tips</Text>
<Ionicons name="shield-checkmark" size={normalize(20)} color={theme.accent} />
</View>

<ScrollView
ref={tipsCarouselRef}
horizontal
pagingEnabled
showsHorizontalScrollIndicator={false}
onMomentumScrollEnd={(event) => {
const newIndex = Math.round(event.nativeEvent.contentOffset.x / (width - normalize(30)));
setActiveTipIndex(newIndex);
}}
>
{safetyTips.map((item) => (
<View key={item.id} style={[styles.tipItem, { width: width - normalize(30) }]}>
  <View style={[styles.tipContainer, {
    backgroundColor: isDark ? 'rgba(77, 171, 247, 0.15)' : '#E3F2FD',
    borderColor: isDark ? 'rgba(77, 171, 247, 0.3)' : '#C5E1FB',
    borderRadius: normalize(12),
    width: 375,
    padding: normalize(12)
  }]}>
    <View style={styles.tipHeader}>
      <Ionicons name={item.icon} size={normalize(28)} color={theme.accent} />
      <Text style={[styles.tipTitle, { 
        color: theme.accent,
        fontSize: normalize(16),
        marginLeft: normalize(10)
      }]}>{item.title}</Text>
    </View>
    <Text style={[styles.tipText, { 
      color: theme.text,
      fontSize: normalize(15),
      lineHeight: normalize(22)
    }]}>{item.tip}</Text>
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
    { 
      backgroundColor: index === activeTipIndex ? theme.accent : isDark ? '#444' : '#ddd',
      width: normalize(8),
      height: normalize(8),
      borderRadius: normalize(4),
      marginHorizontal: normalize(4)
    },
  ]}
/>
))}
</View>
</View>

{/* Safety Tools */}
<Text style={[styles.sectionTitle, { 
color: theme.text,
fontSize: normalize(18),
marginBottom: normalize(12),
marginTop: normalize(5)
}]}>Safety Tools</Text>
<View style={styles.toolsContainer}>
<TouchableOpacity style={[styles.toolButton, {
width: (width - normalize(50)) / 3
}]} onPress={() => router.push("/tabs/helplines")}> 
<View style={[styles.toolIconContainer, {
width: normalize(50),
height: normalize(50),
borderRadius: normalize(25),
backgroundColor: "#1E90FF",
marginBottom: normalize(8)
}]}>
<Ionicons name="call" size={normalize(24)} color="white" />
</View>
<Text style={[styles.toolText, { 
color: theme.text,
fontSize: normalize(13)
}]}>Safety Helplines</Text>
</TouchableOpacity>
<TouchableOpacity style={[styles.toolButton, {
width: (width - normalize(50)) / 3
}]} onPress={() => router.push("/tabs/report")}> 
<View style={[styles.toolIconContainer, { 
backgroundColor: "#4CAF50",
width: normalize(50),
height: normalize(50),
borderRadius: normalize(25),
marginBottom: normalize(8)
}]}>
<Ionicons name="document-text-outline" size={normalize(24)} color="white" />
</View>
<Text style={[styles.toolText, { 
color: theme.text,
fontSize: normalize(13)
}]}>Report Incident</Text>
</TouchableOpacity>
<TouchableOpacity 
style={[styles.toolButton, {
width: (width - normalize(50)) / 3
}]} 
onPress={() => showComingSoonAlert("Safety Map")}
> 
<View style={[styles.toolIconContainer, { 
backgroundColor: "#9C27B0",
width: normalize(50),
height: normalize(50),
borderRadius: normalize(25),
marginBottom: normalize(8)
}]}>
<Ionicons name="map" size={normalize(24)} color="white" />
</View>
<Text style={[styles.toolText, { 
color: theme.text,
fontSize: normalize(13)
}]}>Safety Map</Text>
</TouchableOpacity>
</View>

{/* Recent Alerts */}
<View style={styles.alertsHeader}>
<Text style={[styles.sectionTitle, { 
color: theme.text,
fontSize: normalize(18)
}]}>Recent Alerts</Text>
<TouchableOpacity onPress={() => router.push("/tabs/alerts")}>
<Text style={[styles.viewAllText, { 
color: theme.accent,
fontSize: normalize(14)
}]}>View All</Text>
</TouchableOpacity>
</View>

{alerts.map((alert) => (
<View 
key={alert.id} 
style={[
styles.alertContainer, 
{ 
  backgroundColor: theme.card,
  padding: normalize(15),
  borderRadius: normalize(12),
  marginBottom: normalize(15),
  borderLeftWidth: 4
},
alert.urgent && [
  styles.urgentAlert, 
  { 
    backgroundColor: isDark ? 'rgba(255, 59, 48, 0.2)' : '#FFF5F5',
    borderLeftColor: "#FF3B30"
  }
]
]}
>
<Text style={[
styles.alertText, 
{ 
  color: alert.urgent ? (isDark ? '#ff6b6b' : "#FF3B30") : theme.text,
  fontSize: normalize(14),
  lineHeight: normalize(20)
}
]}>
{alert.message}
</Text>
<View style={styles.alertFooter}>
<Text style={[styles.alertTime, { 
  color: theme.secondaryText,
  fontSize: normalize(12)
}]}>{alert.time}</Text>
{alert.urgent && (
  <View style={[styles.urgentBadge, {
    backgroundColor: "#FF3B30",
    paddingHorizontal: normalize(8),
    paddingVertical: normalize(3),
    borderRadius: normalize(4)
  }]}>
    <Text style={[styles.urgentText, {
      fontSize: normalize(10)
    }]}>URGENT</Text>
  </View>
)}
</View>
</View>
))}

{/* Campus Safety Updates */}
<View style={styles.updatesHeader}>
<Text style={[styles.sectionTitle, { 
color: theme.text,
fontSize: normalize(18)
}]}>Campus Safety Updates</Text>
</View>

{safetyUpdates.map((update) => (
<View 
key={update.id} 
style={[
styles.updateListItem, 
{ 
  backgroundColor: theme.card,
  padding: normalize(15),
  borderRadius: normalize(12),
  marginBottom: normalize(12)
}
]}
>
<View style={styles.updateIconWrapper}>
<View style={[styles.updateIcon, { 
  backgroundColor: isDark ? 'rgba(77, 171, 247, 0.2)' : '#e6f2ff',
  width: normalize(44),
  height: normalize(44),
  borderRadius: normalize(22)
}]}>
  <Ionicons name={update.icon} size={normalize(22)} color={theme.accent} />
</View>
</View>
<View style={styles.updateContent}>
<Text style={[styles.updateTitle, { 
  color: theme.text,
  fontSize: normalize(16)
}]}>{update.title}</Text>
<Text style={[styles.updateDescription, { 
  color: theme.secondaryText,
  fontSize: normalize(14),
  lineHeight: normalize(20)
}]}>{update.description}</Text>
<Text style={[styles.updateDate, { 
  color: theme.secondaryText,
  fontSize: normalize(12)
}]}>{update.date}</Text>
</View>
</View>
))}

{/* Quick Access */}
<Text style={[styles.sectionTitle, { 
color: theme.text,
fontSize: normalize(18)
}]}>Quick Access</Text>
<View style={styles.quickAccessContainer}>
<TouchableOpacity 
style={[styles.quickAccessButton, { 
backgroundColor: theme.card,
borderRadius: normalize(12),
padding: normalize(15),
width: (width - normalize(45)) / 2
}]} 
onPress={() => showComingSoonAlert("Safety Resources")}
>
<Ionicons name="book-outline" size={normalize(24)} color={theme.accent} />
<Text style={[styles.quickAccessText, { 
color: theme.text,
fontSize: normalize(14),
marginLeft: normalize(10)
}]}>Safety Resources</Text>
</TouchableOpacity>
<TouchableOpacity 
style={[styles.quickAccessButton, { 
backgroundColor: theme.card,
borderRadius: normalize(12),
padding: normalize(15),
width: (width - normalize(45)) / 2
}]} 
onPress={() => showComingSoonAlert("Safety Training")}
>
<Ionicons name="school-outline" size={normalize(24)} color={theme.accent} />
<Text style={[styles.quickAccessText, { 
color: theme.text,
fontSize: normalize(14),
marginLeft: normalize(10)
}]}>Safety Training</Text>
</TouchableOpacity>
</View>

{/* Add some padding at the bottom for the navbar */}
<View style={{ height: normalize(100) }} />
</ScrollView>

{/* Navigation Bar */}
<View style={[
styles.navbar, 
{ 
backgroundColor: theme.card, 
borderTopColor: theme.border,
shadowColor: isDark ? '#000' : '#333',
paddingVertical: normalize(8)
}
]}>
<TouchableOpacity style={styles.navItem} onPress={() => router.push("/tabs/dashboard")}> 
<Ionicons 
name={pathname === "/tabs/dashboard" ? "home" : "home-outline"} 
size={normalize(28)} 
color={pathname === "/tabs/dashboard" ? theme.accent : theme.secondaryText} 
/>
<Text style={[
styles.navText, 
{ 
color: pathname === "/tabs/dashboard" ? theme.accent : theme.secondaryText,
fontSize: normalize(12),
marginTop: normalize(2)
}
]}>Home</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.navItem} onPress={() => router.push("/tabs/emergency-contacts")}> 
<Ionicons 
name={pathname === "/tabs/emergency-contacts" ? "people" : "people-outline"} 
size={normalize(28)} 
color={pathname === "/tabs/emergency-contacts" ? theme.accent : theme.secondaryText} 
/>
<Text style={[
styles.navText, 
{ 
color: pathname === "/tabs/emergency-contacts" ? theme.accent : theme.secondaryText,
fontSize: normalize(12),
marginTop: normalize(2)
}
]}>Contacts</Text>
</TouchableOpacity>

{/* Center SOS Button */}
<View style={styles.navItem}>
<TouchableOpacity style={[styles.sosButton, {
backgroundColor: "#FF3B30",
width: normalize(60),
height: normalize(60),
borderRadius: normalize(30),
borderWidth: 3,
borderColor: "#FFF"
}]} onPress={() => router.push("/tabs/emergency")}> 
<Ionicons name="alert" size={normalize(32)} color="white" />
</TouchableOpacity>
<Text style={[styles.sosText, {
fontSize: normalize(12),
fontWeight: "700",
color: "#FF3B30"
}]}>SOS</Text>
</View>

<TouchableOpacity style={styles.navItem} onPress={() => router.push("/tabs/profile")}> 
<Ionicons 
name={pathname === "/tabs/profile" ? "person" : "person-outline"} 
size={normalize(28)} 
color={pathname === "/tabs/profile" ? theme.accent : theme.secondaryText} 
/>
<Text style={[
styles.navText, 
{ 
color: pathname === "/tabs/profile" ? theme.accent : theme.secondaryText,
fontSize: normalize(12),
marginTop: normalize(2)
}
]}>Profile</Text>
</TouchableOpacity>
<TouchableOpacity style={styles.navItem} onPress={() => router.push("/tabs/notifications")}> 
<Ionicons 
name={pathname === "/tabs/notifications" ? "notifications" : "notifications-outline"} 
size={normalize(28)} 
color={pathname === "/tabs/notifications" ? theme.accent : theme.secondaryText} 
/>
<Text style={[
styles.navText, 
{ 
color: pathname === "/tabs/notifications" ? theme.accent : theme.secondaryText,
fontSize: normalize(12),
marginTop: normalize(2)
}
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
},
profileIcon: {
justifyContent: 'center',
alignItems: 'center',
},
profileInitials: {
color: '#fff',
fontWeight: 'bold',
},
profileDetails: {
marginLeft: 10,
},
profileName: {
  fontWeight: 'bold',
},
profileInfo: {
  marginTop: 2,
},
header: { 
  flexDirection: "row", 
  justifyContent: "space-between", 
  alignItems: "center", 
  borderBottomWidth: 1,
},
headerControls: {
  flexDirection: "row",
  alignItems: "center",
  gap: 15,
},
themeToggle: {
  justifyContent: "center",
  alignItems: "center",
},
greeting: { 
  fontWeight: "700",
},
content: {
  flex: 1,
},
dropdown: { 
  position: "absolute", 
  zIndex: 1000,
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},
dropdownItem: { 
  flexDirection: "row", 
  alignItems: "center", 
  borderBottomWidth: 1,
},
dropdownIcon: {
  marginRight: 10
},
dropdownText: {
},
logoutItem: {
  borderBottomWidth: 0
},
logoutText: {
  fontWeight: "500"
},
card: {
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
  fontWeight: "bold",
},
weatherSubText: { 
  marginTop: 3
},
carouselHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 10,
},
carouselTitle: { 
  fontWeight: "bold",
},
tipItem: {
  paddingRight: 0,
},
tipContainer: {
  borderWidth: 1,
},
tipHeader: {
  flexDirection: "row",
  alignItems: "center",
  marginBottom: 10,
},
tipTitle: {
  fontWeight: "bold",
},
tipText: {
},
paginationDots: {
  flexDirection: "row",
  justifyContent: "center",
  marginTop: 10
},
paginationDot: {
},
sectionTitle: { 
  fontWeight: "bold", 
},
toolsContainer: { 
  flexDirection: "row", 
  justifyContent: "space-between", 
  marginBottom: 20,
  flexWrap: "wrap"
},
toolButton: { 
  alignItems: "center", 
  marginBottom: 10
},
toolIconContainer: {
  justifyContent: "center",
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 3,
  elevation: 2,
},
toolText: {
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
  fontWeight: "500"
},
alertContainer: { 
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
  fontWeight: "500",
},
alertFooter: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 8
},
alertTime: { 
},
urgentBadge: {
},
urgentText: {
  color: "white",
  fontWeight: "bold",
},
updateListItem: {
  flexDirection: "row",
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
  justifyContent: "center",
  alignItems: "center"
},
updateContent: {
  flex: 1
},
updateTitle: {
  fontWeight: "bold",
  marginBottom: 4
},
updateDescription: {
  marginBottom: 5
},
updateDate: {
  fontStyle: "italic"
},
quickAccessContainer: {
  flexDirection: "row",
  justifyContent: "space-between",
  marginBottom: 20
},
quickAccessButton: {
  flexDirection: "row",
  alignItems: "center",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.05,
  shadowRadius: 2,
  elevation: 1,
},
quickAccessText: {
  fontWeight: "500",
},
navbar: { 
  flexDirection: "row", 
  justifyContent: "space-around", 
  alignItems: "center", 
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
},
sosButton: {
  justifyContent: "center",
  alignItems: "center",
  marginBottom: 5,
  shadowColor: "#FF3B30",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.3,
  shadowRadius: 5,
  elevation: 8,
},
sosText: {
}
});