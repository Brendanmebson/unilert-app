import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  SectionList, 
  TouchableOpacity, 
  Linking, 
  StyleSheet, 
  ScrollView,
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Image,
  Platform
} from "react-native";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

const helplinesData = [
  { id: "1", name: "Academic Affairs", phone: "+234-802-123-4567", icon: "school" },
  { id: "2", name: "Admissions Office", phone: "+234-803-234-5678", icon: "file-document" },
  { id: "3", name: "BU Clinic", phone: "+234-805-345-6789", icon: "medical-services" },
  { id: "4", name: "BU Security", phone: "+234-806-456-7890", emergency: true, icon: "security" },
  { id: "5", name: "Bursary Department", phone: "+234-807-567-8901", icon: "account-balance" },
  { id: "6", name: "Campus Police", phone: "+234-808-678-9012", emergency: true, icon: "local-police" },
  { id: "7", name: "Chaplaincy", phone: "+234-809-789-0123", icon: "church" },
  { id: "8", name: "Counseling Center", phone: "+234-810-890-1234", icon: "psychology" },
  { id: "9", name: "Dean of Student Affairs", phone: "+234-811-901-2345", icon: "groups" },
  { id: "10", name: "Electrical Maintenance", phone: "+234-812-012-3456", icon: "electrical-services" },
  { id: "11", name: "Emergency Response", phone: "911", emergency: true, icon: "emergency" },
  { id: "12", name: "Fire Department", phone: "101", emergency: true, icon: "local-fire-department" },
  { id: "13", name: "Hostel Warden (Male)", phone: "+234-813-123-4567", icon: "hotel" },
  { id: "14", name: "Hostel Warden (Female)", phone: "+234-814-234-5678", icon: "hotel" },
  { id: "15", name: "ICT Helpdesk", phone: "+234-815-345-6789", icon: "computer" },
  { id: "16", name: "IT Support", phone: "+234-816-456-7890", icon: "desktop-mac" },
  { id: "17", name: "Library Services", phone: "+234-817-567-8901", icon: "menu-book" },
  { id: "18", name: "Medical Emergency", phone: "102", emergency: true, icon: "emergency" },
  { id: "19", name: "Mental Health Support", phone: "+234-818-678-9012", icon: "health-and-safety" },
  { id: "20", name: "Registrar's Office", phone: "+234-819-789-0123", icon: "assignment-ind" },
  { id: "21", name: "Sports Complex", phone: "+234-820-890-1234", icon: "sports-basketball" },
  { id: "22", name: "Student Affairs", phone: "+234-821-901-2345", icon: "people" },
  { id: "23", name: "Technical Support", phone: "+234-822-012-3456", icon: "build" },
  { id: "24", name: "University Transport", phone: "+234-823-123-4567", icon: "directions-bus" },
  { id: "25", name: "Women's Safety Hotline", phone: "+234-824-234-5678", emergency: true, icon: "female" },
];

export default function HelplinesScreen() {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [filteredSections, setFilteredSections] = useState([]);
  const [showLetterOverlay, setShowLetterOverlay] = useState(false);
  const [currentLetter, setCurrentLetter] = useState("");
  const router = useRouter();
  const sectionListRef = useRef(null);
  
  // Animated values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleLetter = useRef(new Animated.Value(1)).current;
  
  // Filter and group helplines based on search term
  useEffect(() => {
    setLoading(true);
    
    const timeout = setTimeout(() => {
      const filteredData = search
        ? helplinesData.filter(item => 
            item.name.toLowerCase().includes(search.toLowerCase()) ||
            item.phone.includes(search)
          )
        : helplinesData;
      
      // First show emergency contacts if applicable
      const emergencyContacts = filteredData.filter(item => item.emergency);
      
      // Then group the rest alphabetically
      const normalContacts = filteredData.filter(item => !item.emergency);
      const groupedHelplines = normalContacts.reduce((acc, helpline) => {
        const letter = helpline.name[0].toUpperCase();
        if (!acc[letter]) acc[letter] = [];
        acc[letter].push(helpline);
        return acc;
      }, {});
      
      const sectionData = [];
      
      // Add emergency section if there are emergency contacts
      if (emergencyContacts.length > 0) {
        sectionData.push({
          title: "⚠️ EMERGENCY",
          data: emergencyContacts,
        });
      }
      
      // Add alphabetical sections
      Object.keys(groupedHelplines)
        .sort()
        .forEach((letter) => {
          sectionData.push({
            title: letter,
            data: groupedHelplines[letter],
          });
        });
      
      setFilteredSections(sectionData);
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(timeout);
  }, [search]);

  const showLetterIndicator = (letter) => {
    setCurrentLetter(letter);
    setShowLetterOverlay(true);
    
    // Animate the letter appearance
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleLetter, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(scaleLetter, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowLetterOverlay(false);
      scaleLetter.setValue(1);
    });
  };

  const callHelpline = (phone, name) => {
    Alert.alert(
      "Call Helpline",
      `Are you sure you want to call ${name}?`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Call", 
          style: "default", 
          onPress: () => Linking.openURL(`tel:${phone}`) 
        }
      ],
      { cancelable: true }
    );
  };

  const scrollToSection = (letter) => {
    showLetterIndicator(letter);
    
    const index = filteredSections.findIndex((section) => section.title === letter);
    if (index !== -1) {
      sectionListRef.current?.scrollToLocation({ 
        sectionIndex: index, 
        itemIndex: 0, 
        animated: true,
        viewOffset: 20 
      });
    }
  };

  const clearSearch = () => {
    setSearch("");
  };
  
  const getIconComponent = (iconName, emergency = false) => {
    return (
      <MaterialIcons 
        name={iconName} 
        size={24} 
        color={emergency ? "#fff" : "#555"} 
        style={styles.itemIcon}
      />
    );
  };

  const renderHelplineItem = ({ item, index }) => (
    <Animated.View
      style={{
        opacity: 1,
        transform: [{ 
          translateY: 0
        }]
      }}
    >
      <TouchableOpacity 
        style={[
          styles.helplineItem, 
          item.emergency && styles.emergencyItem,
          index % 2 === 0 ? styles.evenItem : styles.oddItem
        ]} 
        onPress={() => callHelpline(item.phone, item.name)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {getIconComponent(item.icon, item.emergency)}
        </View>
        <View style={styles.helplineInfo}>
          <Text 
            style={[
              styles.helplineName, 
              item.emergency && styles.emergencyText
            ]}
          >
            {item.name}
          </Text>
          <Text 
            style={[
              styles.helplinePhone, 
              item.emergency && styles.emergencyText
            ]}
          >
            {item.phone}
          </Text>
        </View>
        <View style={[
          styles.callButton,
          item.emergency && styles.emergencyCallButton
        ]}>
          <Ionicons 
            name="call-outline" 
            size={22} 
            color={item.emergency ? "#D9534F" : "#fff"} 
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Ionicons name="arrow-back-outline" size={24} color="#0A356D" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Safety Helplines</Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or number..."
          placeholderTextColor="#888"
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity 
            onPress={clearSearch}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          >
            <Ionicons name="close-circle" size={20} color="#888" />
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0A356D" />
          <Text style={styles.loadingText}>Loading helplines...</Text>
        </View>
      ) : filteredSections.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <FontAwesome5 name="phone-slash" size={50} color="#ddd" />
          <Text style={styles.noResultsText}>No helplines found</Text>
          <Text style={styles.noResultsSubtext}>Try a different search term</Text>
          <TouchableOpacity 
            style={styles.clearSearchButton}
            onPress={clearSearch}
          >
            <Text style={styles.clearSearchText}>Clear Search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {/* Main list */}
          <SectionList
            ref={sectionListRef}
            sections={filteredSections}
            keyExtractor={(item) => item.id}
            renderItem={renderHelplineItem}
            renderSectionHeader={({ section: { title } }) => (
              <View style={[
                styles.sectionHeaderContainer, 
                title === "⚠️ EMERGENCY" && styles.emergencySectionHeaderContainer
              ]}>
                <Text style={[
                  styles.sectionHeader, 
                  title === "⚠️ EMERGENCY" && styles.emergencySectionHeader
                ]}>
                  {title}
                </Text>
                {title === "⚠️ EMERGENCY" && (
                  <Text style={styles.emergencySubheader}>
                    Call for immediate assistance
                  </Text>
                )}
              </View>
            )}
            stickySectionHeadersEnabled={true}
            contentContainerStyle={styles.sectionListContent}
            showsVerticalScrollIndicator={false}
          />

          {/* Alphabet Scroll Sidebar (only show when not searching) */}
          {!search && filteredSections.length > 3 && (
            <View style={styles.letterSidebarContainer}>
              <BlurView intensity={80} style={styles.letterSidebarBlur} tint="light">
                <ScrollView 
                  style={styles.letterSidebar} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.letterSidebarContent}
                >
                  {filteredSections.map((section) => (
                    section.title !== "⚠️ EMERGENCY" && (
                      <TouchableOpacity 
                        key={section.title} 
                        onPress={() => scrollToSection(section.title)}
                        style={styles.letterButton}
                      >
                        <Text style={styles.letter}>{section.title}</Text>
                      </TouchableOpacity>
                    )
                  ))}
                </ScrollView>
              </BlurView>
            </View>
          )}
        </View>
      )}

      {/* Letter Overlay Animation */}
      {showLetterOverlay && (
        <Animated.View 
          style={[
            styles.letterOverlay,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleLetter }]
            }
          ]}
        >
          <Text style={styles.letterOverlayText}>{currentLetter}</Text>
        </Animated.View>
      )}

      {/* Report Incident Button */}
      <View style={styles.reportButtonContainer}>
        <TouchableOpacity 
          style={styles.reportButton} 
          onPress={() => router.push("/tabs/report")}
          activeOpacity={0.8}
        >
          <Ionicons name="alert-circle-outline" size={24} color="#fff" />
          <Text style={styles.reportButtonText}>Report an Incident</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// Polished styles
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f8f9fa",
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  backButton: { 
    padding: 5,
    backgroundColor: "#f0f0f0",
    borderRadius: 12,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: { 
    fontSize: 22, 
    fontWeight: "bold", 
    color: "#0A356D", 
  },
  headerRightPlaceholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 20,
    marginBottom: 15,
    backgroundColor: "#fff",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 50,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#333",
  },
  listContainer: {
    flex: 1,
    flexDirection: "row",
  },
  sectionListContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for the report button
  },
  sectionHeaderContainer: {
    padding: 10,
    backgroundColor: "#fff",
    marginVertical: 5,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  emergencySectionHeaderContainer: {
    backgroundColor: "#ffebeb",
    borderLeftWidth: 5,
    borderLeftColor: "#D9534F",
  },
  sectionHeader: { 
    fontSize: 18, 
    fontWeight: "bold", 
    color: "#444",
  },
  emergencySectionHeader: {
    color: "#D9534F",
  },
  emergencySubheader: {
    fontSize: 13,
    color: "#D9534F",
    fontStyle: "italic",
    marginTop: 3,
  },
  helplineItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderRadius: 15,
    backgroundColor: "#fff",
    marginVertical: 5,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  evenItem: {
    backgroundColor: "#fff",
  },
  oddItem: {
    backgroundColor: "#fafbfc",
  },
  emergencyItem: {
    backgroundColor: "#D9534F",
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemIcon: {
    opacity: 0.8,
  },
  helplineInfo: {
    flex: 1,
  },
  helplineName: { 
    fontSize: 16, 
    fontWeight: "bold", 
    color: "#333",
    marginBottom: 4,
  },
  helplinePhone: {
    fontSize: 14,
    color: "#666",
  },
  emergencyText: {
    color: "#black",
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0A356D",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
  emergencyCallButton: {
    backgroundColor: "#fff",
  },
  letterSidebarContainer: {
    position: "absolute", 
    right: 5,
    top: 0,
    bottom: 0,
    justifyContent: "center",
    zIndex: 10,
  },
  letterSidebarBlur: {
    borderRadius: 20,
    overflow: "hidden",
    paddingVertical: 10,
  },
  letterSidebar: {
    maxHeight: height * 0.6,
  },
  letterSidebarContent: {
    paddingVertical: 10,
  },
  letterButton: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
  },
  letter: { 
    fontSize: 14, 
    fontWeight: "bold", 
    color: "#0A356D", 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#888",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  noResultsText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#666",
    marginTop: 15,
  },
  noResultsSubtext: {
    fontSize: 14,
    color: "#888",
    marginTop: 5,
    textAlign: "center",
  },
  clearSearchButton: {
    marginTop: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#f0f0f0",
    borderRadius: 10,
  },
  clearSearchText: {
    color: "#0A356D",
    fontWeight: "bold",
  },
  letterOverlay: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100,
  },
  letterOverlayText: {
    fontSize: 80,
    fontWeight: "bold",
    color: "#fff",
    backgroundColor: "rgba(10,53,109,0.7)",
    width: 120,
    height: 120,
    textAlign: "center",
    lineHeight: 120,
    borderRadius: 60,
  },
  reportButtonContainer: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
  },
  reportButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#D9534F", 
    padding: 15, 
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  reportButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "bold", 
    marginLeft: 10 
  },
});