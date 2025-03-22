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
import { useRouter } from "expo-router";
import { useTheme } from "../../contexts/ThemeContext";

export default function SettingsScreen() {
  const router = useRouter();
  const { theme, isDark, setDarkMode } = useTheme();
  
  
  // State management with more organized structure
  const [settings, setSettings] = useState({
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
    // Navigation logic
    router.push(screen);
  };
  
  // Toggle setting with optional confirmation
  const toggleSetting = (category, setting, currentValue, needsConfirmation = false, confirmMessage = "") => {
    if (needsConfirmation) {
      handleSensitiveSetting(category, setting, currentValue, confirmMessage);
    } else {
      updateSetting(category, setting, !currentValue);
    }
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
          onPress: () => router.replace("../login"),
          style: "destructive"
        }
      ]
    );
  };

  // Render a section header
  const renderSectionHeader = (title, icon) => (
    <View style={styles.sectionHeader}>
      {icon && <Ionicons name={icon} size={22} color={theme.accent} style={styles.sectionIcon} />}
      <Text style={[styles.sectionTitle, {color: theme.text}]}>{title}</Text>
    </View>
  );

  // Render a setting item with switch
  const renderSettingSwitch = (title, category, setting, needsConfirmation = false, confirmMessage = "", disabled = false, description = null) => (
    <TouchableOpacity 
      style={[styles.settingItem, {backgroundColor: theme.card}]}
      disabled={disabled}
      onPress={() => disabled ? null : toggleSetting(category, setting, settings[category][setting], needsConfirmation, confirmMessage)}
    >
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingText, {color: theme.text}]}>{title}</Text>
        {description && <Text style={[styles.settingDescription, {color: theme.secondaryText}]}>{description}</Text>}
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
      style={[styles.settingItem, {backgroundColor: theme.card}]}
      onPress={() => navigateTo(destination)}
    >
      <View style={styles.settingTextContainer}>
        <Text style={[styles.settingText, {color: theme.text}]}>{title}</Text>
        {description && <Text style={[styles.settingDescription, {color: theme.secondaryText}]}>{description}</Text>}
      </View>
      <Ionicons name={icon} size={20} color={theme.secondaryText} />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.mainContainer, {backgroundColor: theme.background}]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={theme.background} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        {/* Profile Section */}
        <TouchableOpacity 
          style={[styles.profileSection, {backgroundColor: theme.card}]}
          onPress={() => navigateTo("/tabs/profile")}
        >
          <View style={[styles.profileImagePlaceholder, { backgroundColor: isDark ? "#4dabf7" : "#0A356D" }]}>
            <Text style={styles.profileInitials}>EJ</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, {color: theme.text}]}>Emmanuel James</Text>
            <Text style={[styles.profileEmail, {color: theme.secondaryText}]}>emmanuel@student.babcock.edu.ng</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.secondaryText} />
        </TouchableOpacity>
        
        {/* Preferences Settings */}
        {renderSectionHeader("Appearance", "color-palette-outline")}
        <TouchableOpacity 
          style={[styles.settingItem, {backgroundColor: theme.card}]}
          onPress={() => setDarkMode(!isDark)}
        >
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingText, {color: theme.text}]}>Dark Mode</Text>
            <Text style={[styles.settingDescription, {color: theme.secondaryText}]}>
              {isDark ? "Switch to light theme" : "Switch to dark theme"}
            </Text>
          </View>
          <Switch 
            value={isDark} 
            onValueChange={(value) => setDarkMode(value)}
            trackColor={{ false: theme.switchTrackOff, true: theme.switchTrackOn }}
            thumbColor={isDark ? theme.switchThumbOn : theme.switchThumbOff}
            ios_backgroundColor={theme.switchTrackOff}
          />
        </TouchableOpacity>
        
        {/* Notification Settings */}
        {renderSectionHeader("Notifications", "notifications-outline")}
        {renderSettingSwitch("App Notifications", "notifications", "app")}
        {renderSettingSwitch("Email Notifications", "notifications", "email")}
        {renderSettingSwitch("Marketing Emails", "notifications", "marketing")}
        {renderSettingNavigation("Notification Preferences", "/tabs/notifications", "options-outline", "Configure which types of notifications you receive")}
        
        {/* Privacy Settings */}
        {renderSectionHeader("Privacy & Security", "shield-checkmark-outline")}
        {renderSettingSwitch("Location Access", "privacy", "locationAccess", true, "Allow this app to access your location?")}
        {renderSettingSwitch("Allow Data Collection", "privacy", "dataCollection", true, "Allow us to collect anonymous usage data to improve the app?")}
        {renderSettingSwitch(
          "Enable Fingerprint Authentication", 
          "privacy", 
          "fingerprint", 
          true, 
          "Use your fingerprint to unlock the app?",
          Platform.OS !== 'ios' && Platform.OS !== 'android',
          Platform.OS !== 'ios' && Platform.OS !== 'android' ? "Not available on this device" : null
        )}
        {renderSettingNavigation("Privacy Policy", "/privacy-policy")}
        
        {/* Update Settings */}
        {renderSectionHeader("Updates & Data", "refresh-outline")}
        {renderSettingSwitch("Allow Auto App Updates", "updates", "autoUpdate")}
        {renderSettingSwitch("Update on Wi-Fi Only", "updates", "updateOnWifiOnly", false, "", !settings.updates.autoUpdate)}
        {renderSettingSwitch("Background App Refresh", "updates", "backgroundAppRefresh")}
        {renderSettingSwitch("Use Cellular Data", "updates", "useCellularData", false, "", !settings.updates.backgroundAppRefresh)}
        
        {/* Additional Info */}
        {renderSectionHeader("About", "information-circle-outline")}
        <View style={[styles.settingItem, {backgroundColor: theme.card}]}>
          <Text style={[styles.settingText, {color: theme.text}]}>App Version</Text>
          <Text style={[styles.versionText, {color: theme.secondaryText}]}>1.0.5 (build 243)</Text>
        </View>
        {renderSettingNavigation("Help Center", "/tabs/help", "help-circle-outline")}
        
        {/* Footer Links */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigateTo("/terms")}>
            <Text style={[styles.footerText, {color: theme.accent}]}>Terms and Conditions</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigateTo("/about")}>
            <Text style={[styles.footerText, {color: theme.accent}]}>About Us</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.dangerButton, {borderColor: theme.danger}]}
            onPress={handleLogout}
          >
            <Text style={[styles.dangerButtonText, {color: theme.danger}]}>Logout</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
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