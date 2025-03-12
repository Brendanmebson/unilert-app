import { useState } from "react";
import { View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity, StatusBar } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function AllAlerts() {
  const router = useRouter();
  const [alerts, setAlerts] = useState([
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
    },
    {
      id: 3,
      message: "Campus gates 2 and 3 will be closed for maintenance from 11 PM to 5 AM tonight.",
      time: "",
      date: "March 2, 2025",
      urgent: false
    },
    {
      id: 4,
      message: "URGENT: Temporary water outage in Hostels A and B. Maintenance team working on it. Expected resolution by 3 PM.",
      time: "45 minutes ago",
      date: "March 25, 2025",
      urgent: true
    },
    {
      id: 5,
      message: "Library hours extended until midnight during exam week (March 10-17).",
      time: "3 days ago",
      date: "March 22, 2025",
      urgent: false
    },
    {
      id: 6,
      message: "Friendly reminder: Make sure to follow COVID safety protocols in all campus buildings.",
      time: "1 week ago",
      date: "March 17, 2025",
      urgent: false
    },
    {
      id: 7,
      message: "Career fair scheduled for next Tuesday in the Main Hall from 9 AM to 3 PM.",
      time: "5 days ago",
      date: "March 20, 2025",
      urgent: false
    }
  ]);

  const renderAlert = ({ item }) => (
    <View style={[styles.alertContainer, item.urgent && styles.urgentAlert]}>
      <Text style={styles.alertText}>{item.message}</Text>
      <View style={styles.alertFooter}>
        <View style={styles.timeContainer}>
          <Text style={styles.alertTime}>{item.time}</Text>
          <Text style={styles.alertDate}>{item.date}</Text>
        </View>
        {item.urgent && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>URGENT</Text>
          </View>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>All Alerts</Text>
        <View style={styles.headerRight}>
          {/* This empty View helps center the title */}
        </View>
      </View>
      
      {/* Content */}
      <FlatList
        data={alerts}
        renderItem={renderAlert}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={64} color="#CCCCCC" />
            <Text style={styles.emptyText}>No alerts at this time</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#F8F9FA",
  },
  header: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#EFEFEF",
    backgroundColor: "#FFF"
  },
  backButton: {
    padding: 5,
  },
  headerTitle: { 
    fontSize: 18, 
    fontWeight: "700",
    color: "#333"
  },
  headerRight: {
    width: 24,
  },
  listContainer: {
    padding: 15,
    paddingBottom: 40,
  },
  alertContainer: { 
    backgroundColor: "#FFF", 
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
    backgroundColor: "#FFF5F5"
  },
  alertText: { 
    fontSize: 14, 
    fontWeight: "500",
    color: "#333",
    lineHeight: 20
  },
  alertFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8
  },
  timeContainer: {
    flexDirection: "column",
  },
  alertTime: { 
    fontSize: 12, 
    color: "#888",
    fontWeight: "500"
  },
  alertDate: { 
    fontSize: 12, 
    color: "#888" 
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
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
  },
  emptyText: {
    marginTop: 15,
    fontSize: 16,
    color: "#999",
    fontWeight: "500"
  }
});