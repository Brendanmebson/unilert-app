import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen 
        name="index" 
        options={{ title: "Dashboard", tabBarIcon: ({ color }) => (<Ionicons name="home-outline" size={24} color={color} />) }} 
      />
      <Tabs.Screen 
        name="report" 
        options={{ title: "Report", tabBarIcon: ({ color }) => (<Ionicons name="document-text-outline" size={24} color={color} />) }} 
      />
      <Tabs.Screen 
        name="emergency" 
        options={{ title: "Emergency", tabBarIcon: ({ color }) => (<Ionicons name="alert-circle-outline" size={24} color={color} />) }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ title: "Profile", tabBarIcon: ({ color }) => (<Ionicons name="person-outline" size={24} color={color} />) }} 
      />
      <Tabs.Screen 
        name="settings" 
        options={{ title: "Settings", tabBarIcon: ({ color }) => (<Ionicons name="settings-outline" size={24} color={color} />) }} 
      />
    </Tabs>
  );
}
