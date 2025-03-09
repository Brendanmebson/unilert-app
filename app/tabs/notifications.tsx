import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";

const initialNotifications = [
  { id: "1", type: "Security", title: "BU Fire Service", message: "If you notice anything smells like its burning, report to the hall admin.", time: "now", read: false },
  { id: "2", type: "App Update", title: "Version 1.0.5 Released", message: "Bug fixes and performance improvements.", time: "10m ago", read: false },
  { id: "3", type: "New Feature", title: "Emergency Alert", message: "Hold the SOS button for 3 seconds to trigger an emergency.", time: "1h ago", read: false },
  { id: "4", type: "Upcoming", title: "Live Chat Support", message: "We're adding 24/7 live chat for emergencies.", time: "Tomorrow", read: false },
];

const NotificationScreen = () => {
  const navigation = useNavigation();
  const [notifications, setNotifications] = useState(initialNotifications);

  // Mark notification as read
  const markAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((notif) => (notif.id === id ? { ...notif, read: true } : notif))
    );
  };

  // Delete a notification
  const deleteNotification = (id: string) => {
    Alert.alert("Delete Notification", "Are you sure you want to delete this?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => setNotifications((prev) => prev.filter((notif) => notif.id !== id)) }
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>🔔 Notifications</Text>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={[styles.card, getTypeStyle(item.type), item.read && styles.read]}>
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.message}>{item.message}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            
            {/* Actions: Mark as Read & Delete */}
            <View style={styles.actions}>
              {!item.read && (
                <TouchableOpacity onPress={() => markAsRead(item.id)} style={styles.iconButton}>
                  <Ionicons name="checkmark-done" size={22} color="#34C759" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => deleteNotification(item.id)} style={styles.iconButton}>
                <Ionicons name="trash" size={22} color="#FF3B30" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

// Function to apply styles based on notification type
const getTypeStyle = (type: string) => {
  switch (type) {
    case "Security": return { borderLeftColor: "#FF3B30" };
    case "App Update": return { borderLeftColor: "#007AFF" };
    case "New Feature": return { borderLeftColor: "#34C759" };
    case "Upcoming": return { borderLeftColor: "#FFD60A" };
    default: return {};
  }
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5", padding: 20 },
  headerContainer: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  backButton: { marginRight: 10 },
  header: { fontSize: 24, fontWeight: "bold", color: "#333" },

  card: {
    backgroundColor: "#fff",
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderLeftWidth: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: { flex: 1 },
  title: { fontSize: 16, fontWeight: "bold", color: "#000" },
  message: { fontSize: 14, color: "#555", marginVertical: 5 },
  time: { fontSize: 12, color: "#888", textAlign: "right" },

  read: { opacity: 0.6 },
  actions: { flexDirection: "row", alignItems: "center" },
  iconButton: { padding: 5, marginLeft: 10 },
});

export default NotificationScreen;
