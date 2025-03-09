import React, { useState, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  Switch, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  StatusBar,
  Platform,
  useColorScheme
} from "react-native";
import { Ionicons } from "@expo/vector-icons"; // Assuming Expo is used

export default function SettingsScreen() {
  // System theme detection
  const deviceTheme = useColorScheme();
  
  // State management with more organized structure and light mode by default
  const [settings, setSettings] = useState({
    appearance: {
      darkMode: false, // Light mode by default
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

  // Update individual setting with immutable pattern
  const updateSetting = (category, setting, value) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: value
      }
    }));
  };
  
  // Removed the auto-detection of system theme to ensure light mode is always the default
  // We could still keep this function, but make it opt-in with a "Use System Theme" setting
  
  // Apply theme based on settings
  const theme = settings.appearance.darkMode ? darkTheme : lightTheme;
  
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
      <StatusBar barStyle={settings.appearance.darkMode ? "light-content" : "dark-content"} />
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Profile Section */}
        <TouchableOpacity 
          style={[styles.profileSection, {backgroundColor: theme.cardBackground}]}
          onPress={() => navigateTo("Profile")}
        >
          <View style={styles.profileImagePlaceholder}>
            <Text style={styles.profileInitials}>EJ</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, {color: theme.textColor}]}>Emmanuel James</Text>
            <Text style={[styles.profileEmail, {color: theme.secondaryTextColor}]}>emmanuel@student.babcock.edu.ng</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.secondaryTextColor} />
        </TouchableOpacity>
        
        {/* Preferences Settings */}
        {renderSectionHeader("Appearance", "color-palette-outline")}
        {renderSettingSwitch("Dark Mode", "appearance", "darkMode")}
        {renderSettingSwitch("Add Widget to Home Screen", "appearance", "widgetHomeScreen")}
        
        {/* Notification Settings */}
        {renderSectionHeader("Notifications", "notifications-outline")}
        {renderSettingSwitch("App Notifications", "notifications", "app")}
        {renderSettingSwitch("Email Notifications", "notifications", "email")}
        {renderSettingSwitch("Marketing Emails", "notifications", "marketing")}
        {renderSettingNavigation("Notification Preferences", "NotificationPreferences", "options-outline", "Configure which types of notifications you receive")}
        
        {/* Account Settings */}
        {renderSectionHeader("Account", "person-outline")}
        {renderSettingNavigation("Change Password", "ChangePassword")}
        {renderSettingNavigation("Manage Subscriptions", "Subscriptions")}
        {renderSettingNavigation("Two-Factor Authentication", "TwoFactorAuth")}
        {renderSettingNavigation("Linked Accounts", "LinkedAccounts")}
        {renderSettingNavigation("Language", "LanguageSettings", "language-outline", "English (US)")}
        
        {/* Privacy Settings */}
        {renderSectionHeader("Privacy & Security", "shield-checkmark-outline")}
        {renderSettingSwitch("Location Access", "privacy", "locationAccess", true, "Allow this app to access your location?")}
        {renderSettingSwitch("Allow Data Collection", "privacy", "dataCollection", true, "Allow us to collect anonymous usage data to improve the app?")}
        {renderSettingNavigation("Ad Preferences", "AdPreferences")}
        {renderSettingSwitch(
          "Enable Fingerprint Authentication", 
          "privacy", 
          "fingerprint", 
          true, 
          "Use your fingerprint to unlock the app?",
          Platform.OS !== 'ios' && Platform.OS !== 'android',
          Platform.OS !== 'ios' && Platform.OS !== 'android' ? "Not available on this device" : null
        )}
        {renderSettingNavigation("Privacy Policy", "PrivacyPolicy")}
        
        {/* Update Settings */}
        {renderSectionHeader("Updates & Data", "refresh-outline")}
        {renderSettingSwitch("Allow Auto App Updates", "updates", "autoUpdate")}
        {renderSettingSwitch("Update on Wi-Fi Only", "updates", "updateOnWifiOnly", false, "", !settings.updates.autoUpdate)}
        {renderSettingSwitch("Background App Refresh", "updates", "backgroundAppRefresh")}
        {renderSettingSwitch("Use Cellular Data", "updates", "useCellularData", false, "", !settings.updates.backgroundAppRefresh)}
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
          <TouchableOpacity onPress={() => navigateTo("About")}>
            <Text style={[styles.footerText, {color: theme.accentColor}]}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dangerButton, {borderColor: theme.dangerColor}]}
            onPress={() => Alert.alert(
              "Logout", 
              "Are you sure you want to log out?", 
              [
                { text: "Cancel", style: "cancel" },
                { text: "Logout", style: "destructive", onPress: () => Alert.alert("Logged Out", "You have been logged out.") }
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

// Theme configurations
const lightTheme = {
  backgroundColor: "#f8f9fa",
  cardBackground: "#ffffff",
  textColor: "#333333",
  secondaryTextColor: "#666666",
  accentColor: "#007bff",
  switchTrackOn: "#007bff",
  switchTrackOff: "#e2e2e2",
  switchThumbOn: "#ffffff",
  switchThumbOff: "#f4f3f4",
  dangerColor: "#dc3545",
  borderColor: "#e1e4e8",
  profileGradient: ["#4e54c8", "#8f94fb"],
};

const darkTheme = {
  backgroundColor: "#121212",
  cardBackground: "#1e1e1e",
  textColor: "#f1f1f1",
  secondaryTextColor: "#a0a0a0",
  accentColor: "#4dabf7",
  switchTrackOn: "#4dabf7",
  switchTrackOff: "#3a3a3a",
  switchThumbOn: "#ffffff",
  switchThumbOff: "#b7b7b7",
  dangerColor: "#f77",
  borderColor: "#2c2c2c",
  profileGradient: ["#2b303b", "#3a3f50"],
};

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