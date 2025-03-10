import React, { useState } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  StatusBar,
  Platform
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigation } from "@react-navigation/native";

export default function SettingsScreen() {
  const { theme, isDarkMode, toggleTheme } = useTheme();
  const { userProfile, signOut } = useAuth();
  const navigation = useNavigation();
  
  // Get initials for the profile icon
  const getInitials = () => {
    if (!userProfile?.fullname) return "U";
    
    const names = userProfile.fullname.split(' ');
    if (names.length === 1) return names[0].charAt(0).toUpperCase();
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  };
  
  // State management with more organized structure
  const [settings, setSettings] = useState({
    appearance: {
      widgetHomeScreen: false,
    },
    notifications: {
      app: true,
      email: true,
      marketing: false,
    },
    privacy: {
      locationAccess: true,
      dataCollection: false,
      fingerprint: false,
    },
    updates: {
      autoUpdate: true,
      updateOnWifiOnly: true,
      backgroundAppRefresh: true,
      useCellularData: false,
    }
  });

  // Update individual setting
  const updateSetting = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };
  
  // Handler for options that need confirmation
  const handleSensitiveSetting = (category, setting, currentValue, message) => {
    Alert.alert(
      "Confirm Change",
      message,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Confirm", 
          onPress: () => updateSetting(category, setting, !currentValue) 
        }
      ]
    );
  };

  // Handler for navigation actions
  const navigateTo = (screen) => {
    // Navigation logic would go here
    Alert.alert("Navigation", `Navigating to ${screen} screen`);
  };
  
  // Toggle setting with optional confirmation
  const toggleSetting = (category, setting, currentValue, needsConfirmation = false, confirmMessage = "") => {
    if (needsConfirmation) {
      handleSensitiveSetting(category, setting, currentValue, confirmMessage);
    } else {
      updateSetting(category, setting, !currentValue);
    }
  };

  // Render a section header
  const renderSectionHeader = (title, icon) => (
    <View style={styles.sectionHeader}>
      {icon && <Ionicons name={icon} size={22} color={theme.accentColor} style={styles.sectionIcon} />}
      <Text style={[styles.sectionTitle, {color: theme.textColor}]}>{title}</Text>
    </View>
  );

  // Render a setting item with switch
  const renderSettingSwitch = (title, category, setting, needsConfirmation = false, confirmMessage = "", disabled = false, description = null) => (
    <TouchableOpacity 
      style={[styles.settingItem, {backgroundColor: theme.cardBackground}]}
      disabled={disabled}
      onPress={() => disabled ? null : toggleSetting(category, setting, settings[category][setting], needsConfirmation, confirmMessage)}
    >
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingText, {color: theme.textColor}]}>{title}</Text>
        {description && <Text style={[styles.settingDescription, {color: theme.secondaryTextColor}]}>{description}</Text>}
      </View>
      <Switch 
        value={settings[category][setting]} 
        onValueChange={() => toggleSetting(category, setting, settings[category][setting], needsConfirmation, confirmMessage)}
        disabled={disabled}
        trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
        thumbColor={settings[category][setting] ? theme.switchThumbOn : theme.switchThumbOff}
        ios_backgroundColor={theme.switchTrackOff}
      />
    </TouchableOpacity>
  );

  // Render a setting item with navigation
  const renderSettingNavigation = (title, destination, icon = "chevron-forward", description = null) => (
    <TouchableOpacity 
      style={[styles.settingItem, {backgroundColor: theme.cardBackground}]}
      onPress={() => navigateTo(destination)}
    >
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingText, {color: theme.textColor}]}>{title}</Text>
        {description && <Text style={[styles.settingDescription, {color: theme.secondaryTextColor}]}>{description}</Text>}
      </View>
      <Ionicons name={icon} size={20} color={theme.secondaryTextColor} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.mainContainer, {backgroundColor: theme.backgroundColor}]}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Profile Section */}
        <TouchableOpacity 
          style={[styles.profileSection, {backgroundColor: theme.cardBackground}]}
          onPress={() => navigation.navigate("Profile")}
        >
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileInitials}>{getInitials()}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, {color: theme.textColor}]}>
              {userProfile?.fullname || "User Name"}
            </Text>
            <Text style={[styles.profileEmail, {color: theme.secondaryTextColor}]}>
              {userProfile?.email || "user@example.com"}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.secondaryTextColor} />
        </TouchableOpacity>
        
        {/* Preferences Settings */}
        {renderSectionHeader("Appearance", "color-palette-outline")}
        <TouchableOpacity 
          style={[styles.settingItem, {backgroundColor: theme.cardBackground}]}
          onPress={toggleTheme}
        >
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingText, {color: theme.textColor}]}>Dark Mode</Text>
          </View>
          <Switch 
            value={isDarkMode}
            onValueChange={toggleTheme}
            trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
            thumbColor={isDarkMode ? theme.switchThumbOn : theme.switchThumbOff}
            ios_backgroundColor={theme.switchTrackOff}
          />
        </TouchableOpacity>
        {renderSettingSwitch("Add Widget to Home Screen", "appearance", "widgetHomeScreen")}
        
        {/* Rest of settings sections */}
        {/* Notification Settings */}
        {renderSectionHeader("Notifications", "notifications-outline")}
        {renderSettingSwitch("App Notifications", "notifications", "app")}
        {renderSettingSwitch("Email Notifications", "notifications", "email")}
        {renderSettingSwitch("Marketing Emails", "notifications", "marketing")}
        
        {/* Account Settings */}
        {renderSectionHeader("Account", "person-outline")}
        {renderSettingNavigation("Change Password", "ChangePassword")}
        {renderSettingNavigation("Language", "LanguageSettings", "language-outline", "English (US)")}
        
        {/* Privacy Settings */}
        {renderSectionHeader("Privacy & Security", "shield-checkmark-outline")}
        {renderSettingSwitch("Location Access", "privacy", "locationAccess", true, "Allow this app to access your location?")}
        {renderSettingSwitch("Allow Data Collection", "privacy", "dataCollection", true, "Allow us to collect anonymous usage data to improve the app?")}
        {renderSettingNavigation("Privacy Policy", "PrivacyPolicy")}
        
        {/* Update Settings */}
        {renderSectionHeader("Updates & Data", "refresh-outline")}
        {renderSettingSwitch("Allow Auto App Updates", "updates", "autoUpdate")}
        {renderSettingSwitch("Update on Wi-Fi Only", "updates", "updateOnWifiOnly", false, "", !settings.updates.autoUpdate)}
        {renderSettingNavigation("Check for Updates", "CheckUpdates", "download-outline")}
        
        {/* Additional Info */}
        {renderSectionHeader("About", "information-circle-outline")}
        <View style={[styles.settingItem, {backgroundColor: theme.cardBackground}]}>
          <Text style={[styles.settingText, {color: theme.textColor}]}>App Version</Text>
          <Text style={[styles.versionText, {color: theme.secondaryTextColor}]}>1.0.5 (build 243)</Text>
        </View>
        {renderSettingNavigation("Send Feedback", "Feedback", "paper-plane-outline")}
        {renderSettingNavigation("Help Center", "HelpCenter", "help-circle-outline")}
        
        {/* Footer Links */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigateTo("Terms")}>
            <Text style={[styles.footerText, {color: theme.accentColor}]}>Terms and Conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dangerButton, {borderColor: theme.dangerColor}]}
            onPress={() => Alert.alert(
              "Logout", 
              "Are you sure you want to log out?", 
              [
                { text: "Cancel", style: "cancel" },
                { 
                  text: "Logout", 
                  style: "destructive", 
                  onPress: async () => {
                    await signOut();
                    navigation.replace("Login");
                  }
                }
              ]
            )}
          >
            <Text style={[styles.dangerButtonText, {color: theme.dangerColor}]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  settingTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  settingText: {
    fontSize: 16,
    fontWeight: "500",
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 2,
  },
  versionText: {
    fontSize: 14,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
  },
  profileImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4e54c8",
    justifyContent: "center",
    alignItems: "center",
  },
  profileInitials: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
  },
  profileInfo: {
    marginLeft: 16,
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "bold",
  },
  profileEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  footer: {
    marginTop: 32,
    alignItems: "center",
    paddingBottom: 16,
  },
  footerText: {
    fontSize: 14,
    marginVertical: 8,
  },
  dangerButton: {
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 20,
  },
  dangerButtonText: {
    fontWeight: "600",
  },
});