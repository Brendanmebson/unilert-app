import React, { useState, useRef, useEffect } from "react";
import {
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  StyleSheet, 
  Alert,
  Modal,
  ScrollView,
  SectionList,
  Linking as RNLinking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import * as Linking from "expo-linking";
import AsyncStorage from "@react-native-async-storage/async-storage";

const initialContacts = [
  { id: "1", name: "BU Security", category: "Security", number: "+2348023456789", priority: "Very High", online: true },
  { id: "2", name: "BU Fire Service", category: "School", number: "+2348012345678", priority: "Very High", online: true },
  { id: "3", name: "BU Medical Center", category: "Health", number: "+2348034567890", priority: "Very High", online: true },
  { id: "4", name: "Local Police", category: "Government", number: "+2348045678901", priority: "High", online: false },
];

const EmergencyContactsScreen = () => {
  const navigation = useNavigation();
  const router = useRouter();
  const [contacts, setContacts] = useState(initialContacts);
  const [chatVisible, setChatVisible] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [currentContact, setCurrentContact] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const scrollViewRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [addContactVisible, setAddContactVisible] = useState(false);
  const [recentContacts, setRecentContacts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [typingIndicator, setTypingIndicator] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [inputHeight, setInputHeight] = useState(40);
  
  // Form state for new contact
  const [newContact, setNewContact] = useState({
    name: "",
    number: "",
    category: "",
    priority: "Medium",
    online: true
  });

  // Categories for filter buttons
  const categories = ["All", "Recent", "Security", "Health", "School", "Government"];

  useEffect(() => {
    // Load contacts from storage on component mount
    loadContacts();
    loadRecentContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const storedContacts = await AsyncStorage.getItem("contacts");
      if (storedContacts) {
        setContacts(JSON.parse(storedContacts));
      } else {
        // If no stored contacts, save the initial ones
        await AsyncStorage.setItem("contacts", JSON.stringify(initialContacts));
      }
    } catch (error) {
      console.error("Error loading contacts:", error);
    }
  };

  const loadRecentContacts = async () => {
    try {
      const recent = await AsyncStorage.getItem("recentContacts");
      if (recent) {
        setRecentContacts(JSON.parse(recent));
      }
    } catch (error) {
      console.error("Error loading recent contacts:", error);
    }
  };

  const handleCall = (number, contact) => {
    // Add to recent contacts
    addToRecent(contact);
    
    Linking.openURL(`tel:${number}`).catch(() => {
      Alert.alert("Error", "Your device does not support calling.");
    });
  };

  const addToRecent = async (contact) => {
    // Create a copy of recent contacts
    let updatedRecent = [...recentContacts];
    
    // Remove if already exists
    updatedRecent = updatedRecent.filter(item => item.id !== contact.id);
    
    // Add to beginning of array
    updatedRecent.unshift(contact);
    
    // Limit to 5 recent contacts
    if (updatedRecent.length > 5) {
      updatedRecent = updatedRecent.slice(0, 5);
    }
    
    setRecentContacts(updatedRecent);
    
    // Save to storage
    try {
      await AsyncStorage.setItem("recentContacts", JSON.stringify(updatedRecent));
    } catch (error) {
      console.error("Error saving recent contacts:", error);
    }
  };

  const openChat = async (contact) => {
    setCurrentContact(contact);
    addToRecent(contact);
    
    try {
      const storedMessages = await AsyncStorage.getItem(`chat_${contact.id}`);
      let initialMessages = storedMessages ? JSON.parse(storedMessages) : [];
      
      // Add welcome message if there are no messages yet
      if (initialMessages.length === 0) {
        const welcomeMessage = {
          id: Date.now().toString(),
          sender: contact.name,
          text: contact.isUserAdded 
            ? `Hey, it's ${contact.name}.` 
            : `Hello! How can we assist you at ${contact.name}?`,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          read: true,
          replyTo: null,
        };
        
        initialMessages = [welcomeMessage];
        await AsyncStorage.setItem(`chat_${contact.id}`, JSON.stringify(initialMessages));
      }
      
      setChatMessages(initialMessages);
      setChatVisible(true);
      setReplyingTo(null);
    } catch (error) {
      console.error("Error loading chat messages:", error);
      Alert.alert("Error", "Failed to load chat messages");
    }
  };

  const getTimeBasedGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const generateAutoResponse = (message, contact) => {
    const lowerMessage = message.toLowerCase();
    
    // Enhanced greeting detection with more variations
    const greetings = [
      "hello", "hi ", "hey", "howdy", "greetings", "good morning", 
      "good afternoon", "good evening", "good day", "what's up", 
      "how are you", "how's it going", "sup", "yo", "hiya"
    ];
    
    // Check if message contains any greeting
    const isGreeting = greetings.some(greeting => lowerMessage.includes(greeting));
    
    if (isGreeting) {
      // First provide a friendly greeting
      const timeGreeting = getTimeBasedGreeting();
      let greetingResponse = `${timeGreeting}! This is ${contact.name}. How can I assist you today?`;
      
      // Then add emergency-specific information based on contact category
      if (contact.category === "Security") {
        return {
          text: `${greetingResponse} If you're reporting a security incident, please provide your location and details about the situation.`,
          links: [
            { text: "Report Incident", screen: "/tabs/report" }
          ]
        };
      } else if (contact.category === "Health") {
        return {
          text: `${greetingResponse} For medical emergencies, please share your location and briefly describe the medical situation.`,
          links: [
            { text: "Medical Services", screen: "/tabs/emergency" }
          ]
        };
      } else if (contact.name.includes("Fire")) {
        return {
          text: `${greetingResponse} For fire emergencies, please provide your exact location and evacuate the area if possible.`,
          links: [
            { text: "Fire Services", screen: "/tabs/emergency" }
          ]
        };
      }
      
      // Default greeting for other categories
      return {
        text: greetingResponse,
        links: [
          { text: "Emergency Services", screen: "/tabs/emergency" },
          { text: "Report Incident", screen: "/tabs/report" }
        ]
      };
    }
    
    // Check for app page links
    if (lowerMessage.includes("report") || lowerMessage.includes("incident")) {
      return {
        text: "If you need to report an incident, you can use our Report Incident page. Would you like to go there now?",
        links: [
          { text: "Report Incident", screen: "/tabs/report" }
        ]
      };
    }
    
    if (lowerMessage.includes("help") && lowerMessage.includes("line")) {
      return {
        text: "You can access our Helpline page for more assistance options.",
        links: [
          { text: "Helpline Page", screen: "/tabs/helplines" }
        ]
      };
    }

    // Category-specific responses
    if (contact.category === "Security" && (lowerMessage.includes("theft") || lowerMessage.includes("stolen") || lowerMessage.includes("robbery"))) {
      return {
        text: "I'm sorry to hear about this security issue. Please provide more details about when and where this happened. You can also file a formal report through our app.",
        links: [
          { text: "Report Incident", screen: "/tabs/report" }
        ]
      };
    }
    
    if (contact.category === "Health" && (lowerMessage.includes("injury") || lowerMessage.includes("sick") || lowerMessage.includes("pain"))) {
      return {
        text: "For medical emergencies, please provide your exact location so we can send help immediately. Is anyone with you who can assist while waiting?",
        links: []
      };
    }
    
    if (contact.category === "School" && contact.name.includes("Fire")) {
      if (lowerMessage.includes("fire") || lowerMessage.includes("smoke")) {
        return {
          text: "This is a FIRE EMERGENCY. Please provide your exact location and evacuate the area immediately. Is the fire contained or spreading?",
          links: []
        };
      }
    }

    // Enhanced emergency keyword detection
    const emergencyKeywords = [
      "help", "emergency", "urgent", "danger", "accident", "hurt", 
      "injured", "critical", "serious", "assistance", "sos", "trapped", 
      "threat", "attack", "danger", "suspicious", "need help"
    ];
    
    const isEmergency = emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
    
    if (isEmergency) {
      return {
        text: "This sounds like an emergency situation. Please provide your exact location and details about what's happening so we can send appropriate help immediately.",
        links: [
          { text: "Emergency Services", screen: "/tabs/emergency" },
          { text: "Share Location", screen: "/tabs/dashboard" }
        ]
      };
    }

    // Generic responses
    if (lowerMessage.includes("thank")) {
      return {
        text: "You're welcome. Is there anything else we can help you with?",
        links: []
      };
    }
    
    // Default response
    return {
      text: "Thank you for your message. To better assist you, could you provide more details about your situation?",
      links: [
        { text: "Helpline", screen: "/tabs/helplines" },
        { text: "Report Incident", screen: "/tabs/report" }
      ]
    };
  };

  const sendMessage = async () => {
    if (newMessage.trim()) {
      const formattedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      
      // Create user message
      const userMessage = {
        id: Date.now().toString(),
        sender: "You",
        text: newMessage,
        time: formattedTime,
        read: false,
        replyTo: replyingTo ? replyingTo.id : null,
      };

      const updatedMessages = [...chatMessages, userMessage];
      setChatMessages(updatedMessages);
      setNewMessage("");
      setReplyingTo(null);
      
      // Save to storage
      try {
        await AsyncStorage.setItem(`chat_${currentContact.id}`, JSON.stringify(updatedMessages));
        
        // Only generate auto-response for default contacts (not user-added)
        if (!currentContact.isUserAdded) {
          // Show typing indicator
          setTypingIndicator(true);
          
          // Generate auto-response after delay
          setTimeout(async () => {
            setTypingIndicator(false);
            
            // Generate response with potential links
            const responseData = generateAutoResponse(newMessage, currentContact);
            
            const responseMessage = {
              id: (Date.now() + 1).toString(),
              sender: currentContact.name,
              text: responseData.text,
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              read: true,
              replyTo: userMessage.id,
              links: responseData.links || [],
            };

            const messagesWithResponse = [...updatedMessages, responseMessage];
            setChatMessages(messagesWithResponse);
            await AsyncStorage.setItem(`chat_${currentContact.id}`, JSON.stringify(messagesWithResponse));
          }, 1500 + Math.random() * 1000); // Random delay between 1.5-2.5 seconds for more natural feel
        }
      } catch (error) {
        console.error("Error saving chat message:", error);
        Alert.alert("Error", "Failed to save your message");
      }
    }
  };

  const clearChat = async (event) => {
    event.stopPropagation(); // Prevents triggering other click events
  
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to delete all messages?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          onPress: async () => {
            if (currentContact) {
              await AsyncStorage.removeItem(`chat_${currentContact.id}`);
            }
  
            setChatMessages([]); // Clear state
            setChatVisible(false);
            setMenuVisible(false);
          },
          style: "destructive",
        },
      ]
    );
  };
  
  const handleLongPressMessage = (message) => {
    setSelectedMessage(message);
    
    Alert.alert(
      "Message Options",
      "Choose an action",
      [
        { 
          text: "Reply", 
          onPress: () => {
            setReplyingTo(message);
            // Focus the input field
            // Would need to implement ref for TextInput
          }
        },
        { 
          text: "Delete", 
          onPress: () => deleteMessage(message.id),
          style: "destructive"
        },
        { text: "Cancel", style: "cancel" }
      ]
    );
  };
  
  const deleteMessage = async (messageId) => {
    try {
      const updatedMessages = chatMessages.filter(msg => msg.id !== messageId);
      setChatMessages(updatedMessages);
      await AsyncStorage.setItem(
        `chat_${currentContact.id}`,
        JSON.stringify(updatedMessages)
      );
    } catch (error) {
      console.error("Error deleting message:", error);
      Alert.alert("Error", "Failed to delete message");
    }
  };
  
  const navigateToScreen = (screenPath) => {
    setChatVisible(false);
    
    // Use router instead of navigation for Expo Router paths
    if (screenPath.startsWith('/')) {
      router.push(screenPath);
    } else {
      // For compatibility with old screen names
      switch(screenPath) {
        case "ReportIncident":
          router.push("/tabs/report");
          break;
        case "EmergencyServices":
          router.push("/tabs/emergency");
          break;
        case "Helpline":
          router.push("/tabs/helplines");
          break;
        case "LocationSharing":
          router.push("/tabs/dashboard");
          break;
        default:
          console.log("Unknown screen:", screenPath);
          router.push("/tabs/dashboard");
      }
    }
  };
  
  // Function to render the message with links
  const renderMessageText = (message) => {
    if (!message.links || message.links.length === 0) {
      return <Text style={message.sender === "You" ? styles.userChatText : styles.contactChatText}>{message.text}</Text>;
    }
    
    return (
      <View>
        <Text style={message.sender === "You" ? styles.userChatText : styles.contactChatText}>{message.text}</Text>
        <View style={styles.linkContainer}>
          {message.links.map((link, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.linkButton}
              onPress={() => navigateToScreen(link.screen)}
            >
              <Text style={styles.linkText}>{link.text}</Text>
              <Ionicons name="arrow-forward" size={14} color="#fff" />
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };
  
  // New function to handle contact deletion
  const handleDeleteContact = (contactId) => {
    Alert.alert(
      "Delete Contact",
      "Are you sure you want to delete this contact?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          onPress: async () => {
            try {
              // Remove from contacts list
              const updatedContacts = contacts.filter(contact => contact.id !== contactId);
              setContacts(updatedContacts);
              
              // Update AsyncStorage
              await AsyncStorage.setItem("contacts", JSON.stringify(updatedContacts));
              
              // Remove from recent contacts if present
              const updatedRecent = recentContacts.filter(contact => contact.id !== contactId);
              setRecentContacts(updatedRecent);
              await AsyncStorage.setItem("recentContacts", JSON.stringify(updatedRecent));
              
              // Delete any associated chat messages
              await AsyncStorage.removeItem(`chat_${contactId}`);
              
              Alert.alert("Success", "Contact deleted successfully");
            } catch (error) {
              console.error("Error deleting contact:", error);
              Alert.alert("Error", "Failed to delete contact");
            }
          },
          style: "destructive",
        },
      ]
    );
  };
  
  // Render the reply preview
  const renderReplyPreview = () => {
    if (!replyingTo) return null;
    
    const replyMessage = chatMessages.find(msg => msg.id === replyingTo.id) || replyingTo;
    
    return (
      <View style={styles.replyPreviewContainer}>
        <View style={styles.replyPreviewContent}>
          <Text style={styles.replyPreviewName}>{replyMessage.sender}</Text>
          <Text style={styles.replyPreviewText} numberOfLines={1}>
            {replyMessage.text}
          </Text>
        </View>
        <TouchableOpacity onPress={() => setReplyingTo(null)}>
          <Ionicons name="close" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    );
  };
  
  useEffect(() => {
    if (chatMessages.length > 0 && chatMessages[chatMessages.length - 1].sender === "You") {
      setTimeout(() => {
        setChatMessages((prev) =>
          prev.map((msg, i) => (i === prev.length - 1 ? { ...msg, read: true } : msg))
        );
      }, 1500);
    }
  }, [chatMessages]);

  useEffect(() => {
    if (scrollViewRef.current && chatMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [chatMessages, typingIndicator]);
  
  // Function to handle new contact creation
  const handleCreateContact = async () => {
    // Validation
    if (!newContact.name.trim() || !newContact.number.trim() || !newContact.category.trim()) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    // Create new contact object
    const newContactObj = {
      id: Date.now().toString(),
      name: newContact.name.trim(),
      number: newContact.number.trim(),
      category: newContact.category.trim(),
      priority: newContact.priority,
      online: newContact.online,
      isUserAdded: true // This flag indicates it's a user-added contact
    };

    // Update contacts state
    const updatedContacts = [...contacts, newContactObj];
    setContacts(updatedContacts);

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem("contacts", JSON.stringify(updatedContacts));
      
      // Create default welcome message for the new contact - simple and with no follow-up responses
      const initialMessages = [{
        id: Date.now().toString(),
        sender: newContact.name.trim(),
        text: `Hey, it's ${newContact.name.trim()}.`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        read: true,
        replyTo: null,
      }];
      
      // Save initial message to storage
      await AsyncStorage.setItem(`chat_${newContactObj.id}`, JSON.stringify(initialMessages));
      
      // Reset form
      setNewContact({
        name: "",
        number: "",
        category: "",
        priority: "Medium",
        online: true
      });
      // Close modal
      setAddContactVisible(false);
      
      Alert.alert("Success", "Contact added successfully");
    } catch (error) {
      console.error("Error saving contact:", error);
      Alert.alert("Error", "Failed to save contact");
    }
  };
  
  // Find the original message being replied to
  const findReplyMessage = (replyId) => {
    return chatMessages.find(msg => msg.id === replyId);
  };
  
  // Modified renderContactItem to include delete option
  const renderContactItem = ({ item }) => {
    // Check if it's one of the default contacts (can't delete initial contacts)
    const isDefaultContact = initialContacts.some(contact => contact.id === item.id);
    
    return (
      <View style={styles.card}>
        <View style={{ flex: 1 }}>
          <Text style={styles.contactName}>{item.name}</Text>
          <Text style={styles.contactNumber}>{item.number}</Text>
          <Text style={styles.contactCategory}>{item.category} - {item.priority}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity style={styles.iconButton} onPress={() => handleCall(item.number, item)}>
            <Ionicons name="call" size={20} color="#34C759" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconButton, { opacity: item.online ? 1 : 0.5 }]}
            onPress={() => item.online && openChat(item)}
            disabled={!item.online}
          >
            <Ionicons name="chatbubble" size={20} color="#007AFF" />
          </TouchableOpacity>
          {!isDefaultContact && (
            <TouchableOpacity 
              style={styles.iconButton} 
              onPress={() => handleDeleteContact(item.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Filter contacts based on active category
  const getFilteredContacts = () => {
    if (activeCategory === "All") {
      return contacts;
    } else if (activeCategory === "Recent") {
      return recentContacts;
    } else {
      return contacts.filter(contact => contact.category === activeCategory);
    }
  };

  // Organize contacts into sections by category
  const getSectionedContacts = () => {
    // Get filtered contacts first
    const filteredContacts = getFilteredContacts();
    
    // If we're already in a specific category or Recent, just show a flat list
    if (activeCategory !== "All") {
      return [{
        title: activeCategory,
        data: filteredContacts
      }];
    }
    
    // For "All" category, group by categories
    const categories = {};
    
    // First add recent contacts section if there are any
    if (recentContacts.length > 0) {
      categories["Recent"] = recentContacts.slice(0, 3); // Show only top 3 in main view
    }
    
    // Group other contacts by category
    filteredContacts.forEach(contact => {
      if (!categories[contact.category]) {
        categories[contact.category] = [];
      }
      categories[contact.category].push(contact);
    });
    
    // Convert to array for SectionList
    return Object.keys(categories).map(category => ({
      title: category,
      data: categories[category]
    }));
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.header}>Emergency & Non Emergency Contacts</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => setAddContactVisible(true)}
        >
          <Ionicons name="add" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      {/* Category Filter Buttons */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryFilterContainer}
      >
        {categories.map(category => (
          <TouchableOpacity
            key={category}
            style={[
              styles.categoryButton,
              activeCategory === category && styles.activeCategoryButton
            ]}
            onPress={() => setActiveCategory(category)}
          >
            <Text 
              style={[
                styles.categoryButtonText,
                activeCategory === category && styles.activeCategoryButtonText
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sectioned Contact List */}
      <SectionList
        sections={getSectionedContacts()}
        keyExtractor={(item) => item.id}
        renderItem={renderContactItem}
        renderSectionHeader={({ section: { title } }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{title}</Text>
          </View>
        )}
        stickySectionHeadersEnabled={false}
      />

      {/* Chat Modal */}
      <Modal visible={chatVisible} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#333" />
            </TouchableOpacity>

            <View style={styles.chatHeaderInfo}>
              <Text style={styles.modalTitle}>{currentContact?.name}</Text>
              <Text style={{ 
                color: currentContact?.online ? "green" : "red",
                fontSize: 12 
              }}>
                {currentContact?.online ? "Online" : "Offline"}
              </Text>
            </View>

            {/* Three-dot menu button */}
            <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)} style={styles.menuButton}>
              <Ionicons name="ellipsis-vertical" size={24} color="#333" />
            </TouchableOpacity>

            {/* Dropdown Menu */}
            {menuVisible && (
              <View style={styles.menuOverlay}>
                <TouchableOpacity style={styles.menuContainer} activeOpacity={1}>
                  <TouchableOpacity 
                    onPress={(event) => clearChat(event)} 
                    hitSlop={{ top: 20, bottom: 10, left: 20, right: 20 }}
                  >
                    <Text style={styles.clearChatText}>Clear Chat</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.menuBackground} 
                  activeOpacity={1} 
                  onPress={() => setMenuVisible(false)}
                />
              </View>
            )}
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={styles.chatBox}
            contentContainerStyle={styles.chatContentContainer}
          >
            {chatMessages.map((msg) => (
              <TouchableOpacity key={msg.id} onLongPress={() => handleLongPressMessage(msg)}>
                {msg.replyTo && (
                  <View 
                    style={[
                      styles.replyContainer,
                      msg.sender === "You" ? styles.userReplyContainer : styles.contactReplyContainer
                    ]}
                  >
                    <View style={styles.replyLine} />
                    <View style={styles.replyContent}>
                      {(() => {
                        const replyMsg = findReplyMessage(msg.replyTo);
                        if (replyMsg) {
                          return (
                            <>
                              <Text style={styles.replyName}>{replyMsg.sender}</Text>
                              <Text style={styles.replyText} numberOfLines={1}>{replyMsg.text}</Text>
                            </>
                          );
                        }
                        return <Text style={styles.replyText}>Original message not found</Text>;
                      })()}
                    </View>
                  </View>
                )}
                <View
                  style={[
                    styles.chatBubble,
                    msg.sender === "You" ? styles.userBubble : styles.contactBubble,
                  ]}
                >
                  {renderMessageText(msg)}
                  <Text
                    style={[
                      styles.chatTime,
                      msg.sender === "You" ? styles.userChatTime : styles.contactChatTime,
                    ]}
                  >
                    {msg.time} {msg.sender === "You" && (msg.read ? "✓✓" : "✓")}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
            
            {/* Typing indicator */}
            {typingIndicator && (
              <View style={[styles.chatBubble, styles.contactBubble, styles.typingBubble]}>
                <View style={styles.typingIndicator}>
                  <View style={styles.typingDot} />
                  <View style={[styles.typingDot, { animationDelay: "0.2s" }]} />
                  <View style={[styles.typingDot, { animationDelay: "0.4s" }]} />
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.chatInputContainer}>
            {renderReplyPreview()}
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { height: Math.max(40, Math.min(inputHeight, 100)) }]}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline
                onContentSizeChange={(e) => {
                  setInputHeight(e.nativeEvent.contentSize.height);
                }}
              />
             <TouchableOpacity 
                style={[
                  styles.sendButton,
                  !newMessage.trim() && styles.sendButtonDisabled
                ]} 
                onPress={sendMessage}
                disabled={!newMessage.trim()}
              >
                <Ionicons name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Create Contact Modal */}
      <Modal visible={addContactVisible} animationType="slide" transparent={true}>
        <View style={styles.centeredView}>
          <View style={styles.addContactModalView}>
            <View style={styles.addContactHeader}>
              <Text style={styles.addContactTitle}>Add New Contact</Text>
              <TouchableOpacity 
                onPress={() => setAddContactVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.formContainer}>
              <Text style={styles.inputLabel}>Name *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Contact Name"
                value={newContact.name}
                onChangeText={(text) => setNewContact({...newContact, name: text})}
              />
              
              <Text style={styles.inputLabel}>Phone Number *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="+2348012345678"
                value={newContact.number}
                onChangeText={(text) => setNewContact({...newContact, number: text})}
                keyboardType="phone-pad"
              />
              
              <Text style={styles.inputLabel}>Category *</Text>
              <TextInput
                 style={styles.formInput}
                 placeholder="e.g. Security, Health, School"
                 value={newContact.category}
                 onChangeText={(text) => setNewContact({...newContact, category: text})}
               />
               
               <Text style={styles.inputLabel}>Priority</Text>
               <View style={styles.priorityContainer}>
                 {["Low", "Medium", "High", "Very High"].map((priority) => (
                   <TouchableOpacity
                     key={priority}
                     style={[
                       styles.priorityButton,
                       newContact.priority === priority && styles.activePriorityButton
                     ]}
                     onPress={() => setNewContact({...newContact, priority: priority})}
                   >
                     <Text 
                       style={[
                         styles.priorityButtonText,
                         newContact.priority === priority && styles.activePriorityButtonText
                       ]}
                     >
                       {priority}
                     </Text>
                   </TouchableOpacity>
                 ))}
               </View>
               
               <View style={styles.onlineContainer}>
                 <Text style={styles.inputLabel}>Status:</Text>
                 <TouchableOpacity
                   style={styles.onlineToggle}
                   onPress={() => setNewContact({...newContact, online: !newContact.online})}
                 >
                   <View style={[
                     styles.onlineIndicator,
                     newContact.online ? styles.onlineActive : styles.onlineInactive
                   ]} />
                   <Text style={styles.onlineText}>
                     {newContact.online ? "Online" : "Offline"}
                   </Text>
                 </TouchableOpacity>
               </View>
             </ScrollView>
             
             <TouchableOpacity
               style={styles.saveButton}
               onPress={handleCreateContact}
             >
               <Text style={styles.saveButtonText}>Save Contact</Text>
             </TouchableOpacity>
           </View>
         </View>
       </Modal>
     </View>
   );
 };
 
 const styles = StyleSheet.create({
   container: { 
     flex: 1, 
     backgroundColor: "#f4f4f4" 
   },
   headerContainer: { 
     flexDirection: "row", 
     alignItems: "center", 
     padding: 15, 
     backgroundColor: "#fff", 
     elevation: 2 
   },
   backButton: { 
     marginRight: 10 
   },
   header: { 
     flex: 1, 
     fontSize: 18, 
     fontWeight: "bold" 
   },
   addButton: {
     padding: 5
   },
   categoryFilterContainer: {
     padding: 10,
     backgroundColor: "#fff",
     borderBottomWidth: 1,
     borderBottomColor: "#e0e0e0"
   },
   categoryButton: {
     paddingHorizontal: 15,
     paddingVertical: 8,
     marginRight: 8,
     borderRadius: 20,
     backgroundColor: "#f0f0f0",
     height: 35,
   },
   activeCategoryButton: {
     backgroundColor: "#007AFF",
   },
   categoryButtonText: {
     color: "#333",
     fontWeight: "500"
   },
   activeCategoryButtonText: {
     color: "#fff"
   },
   sectionHeader: {
     backgroundColor: "#f4f4f4",
     paddingHorizontal: 15,
     paddingVertical: 8,
     borderBottomWidth: 1,
     borderBottomColor: "#e0e0e0"
   },
   sectionHeaderText: {
     fontSize: 16,
     fontWeight: "bold",
     color: "#666"
   },
   card: { 
     flexDirection: "row", 
     justifyContent: "space-between", 
     padding: 15, 
     backgroundColor: "#fff", 
     marginHorizontal: 10,
     marginVertical: 5, 
     borderRadius: 10,
     elevation: 2
   },
   contactName: { 
     fontSize: 16, 
     fontWeight: "bold" 
   },
   contactNumber: { 
     color: "#666" 
   },
   contactCategory: { 
     fontSize: 12, 
     color: "#888",
     marginTop: 2
   },
   actions: { 
     flexDirection: "row" 
   },
   iconButton: { 
     padding: 10 
   },
   modalContainer: { 
     flex: 1, 
     backgroundColor: "#f4f4f4" 
   },
   chatHeader: { 
     flexDirection: "row", 
     alignItems: "center", 
     padding: 15, 
     backgroundColor: "#fff", 
     elevation: 2 
   },
   chatHeaderInfo: {
     flex: 1,
     marginLeft: 10
   },
   modalTitle: { 
     fontSize: 18, 
     fontWeight: "bold",
   },
   chatBox: { 
     flex: 1, 
     padding: 10 
   },
   chatContentContainer: {
     flexGrow: 1,
     paddingBottom: 10
   },
   chatBubble: { 
     padding: 10, 
     borderRadius: 15, 
     marginVertical: 5, 
     maxWidth: "75%" 
   },
   userBubble: { 
     alignSelf: "flex-end", 
     backgroundColor: "#007AFF"
   },
   contactBubble: { 
     alignSelf: "flex-start", 
     backgroundColor: "#e6e6e6" 
   },
   chatText: { 
     fontSize: 16 
   },
   userChatText: {
     fontSize: 16,
     color: "#fff"
   },
   contactChatText: {
     fontSize: 16,
     color: "#333"
   },
   chatTime: { 
     fontSize: 12, 
     textAlign: "right",
     marginTop: 4
   },
   userChatTime: {
     color: "rgba(255, 255, 255, 0.7)"
   },
   contactChatTime: {
     color: "#888"
   },
   chatInputContainer: { 
     padding: 10, 
     backgroundColor: "#fff",
     borderTopWidth: 1,
     borderTopColor: "#e0e0e0"
   },
   inputWrapper: {
     flexDirection: "row",
     alignItems: "flex-end",
     marginTop: 5
   },
   input: { 
     flex: 1, 
     paddingHorizontal: 15,
     paddingVertical: 10,
     borderWidth: 1, 
     borderColor: "#ddd",
     borderRadius: 20, 
     marginRight: 10,
     backgroundColor: "#f9f9f9",
     minHeight: 40,
     maxHeight: 100,
   },
   sendButton: { 
     backgroundColor: "#007AFF", 
     borderRadius: 50,
     width: 40,
     height: 40,
     justifyContent: "center",
     alignItems: "center",
     marginBottom: 2,
   },
   sendButtonDisabled: {
     backgroundColor: "#b3d9ff",
   },
   menuButton: {
     padding: 5
   },
   menuOverlay: {
     position: "absolute",
     top: 45,
     right: 10,
     justifyContent: "flex-start",
     alignItems: "flex-end",
     zIndex: 10,
   },
   menuContainer: {
     backgroundColor: "#fff",
     borderRadius: 8,
     paddingVertical: 10,
     paddingHorizontal: 15,
     elevation: 5,
     zIndex: 50,
   },
   clearChatButton: {
     paddingVertical: 10,
   },
   clearChatText: {
     color: "red",
     fontWeight: "bold",
     fontSize: 16,
   },
   menuBackground: {
     position: "absolute",
     top: 0,
     left: 0,
     right: 0,
     bottom: 0,
     backgroundColor: "transparent",
   },
   centeredView: {
     flex: 1,
     justifyContent: "center",
     alignItems: "center",
     backgroundColor: "rgba(0,0,0,0.5)"
   },
   addContactModalView: {
     width: "90%",
     maxHeight: "80%",
     backgroundColor: "white",
     borderRadius: 15,
     padding: 20,
     elevation: 5
   },
   addContactHeader: {
     flexDirection: "row",
     justifyContent: "space-between",
     alignItems: "center",
     marginBottom: 20
   },
   addContactTitle: {
     fontSize: 20,
     fontWeight: "bold"
   },
   closeButton: {
     padding: 5
   },
   formContainer: {
     maxHeight: 400
   },
   inputLabel: {
     fontSize: 16,
     fontWeight: "500",
     marginBottom: 5,
     marginTop: 10
   },
   formInput: {
     borderWidth: 1,
     borderColor: "#ddd",
     borderRadius: 8,
     padding: 12,
     fontSize: 16,
     backgroundColor: "#f9f9f9"
   },
   priorityContainer: {
     flexDirection: "row",
     flexWrap: "wrap",
     marginTop: 5
   },
   priorityButton: {
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 20,
     backgroundColor: "#f0f0f0",
     marginRight: 8,
     marginBottom: 8
   },
   activePriorityButton: {
     backgroundColor: "#007AFF"
   },
   priorityButtonText: {
     color: "#333"
   },
   activePriorityButtonText: {
     color: "#fff"
   },
   onlineContainer: {
     flexDirection: "row",
     alignItems: "center",
     marginTop: 15,
     marginBottom: 20
   },
   onlineToggle: {
     flexDirection: "row",
     alignItems: "center",
     marginLeft: 10
   },
   onlineIndicator: {
     width: 12,
     height: 12,
     borderRadius: 6,
     marginRight: 5
   },
   onlineActive: {
     backgroundColor: "green"
   },
   onlineInactive: {
     backgroundColor: "red"
   },
   onlineText: {
     fontSize: 16
   },
   saveButton: {
     backgroundColor: "#007AFF",
     paddingVertical: 12,
     borderRadius: 8,
     alignItems: "center",
     marginTop: 20
   },
   saveButtonText: {
     color: "#fff",
     fontSize: 16,
     fontWeight: "bold"
   },
   linkContainer: {
     flexDirection: "row",
     flexWrap: "wrap",
     marginTop: 8
   },
   linkButton: {
     backgroundColor: "#34C759",
     paddingHorizontal: 10,
     paddingVertical: 6,
     borderRadius: 15,
     marginRight: 8,
     marginBottom: 5,
     flexDirection: "row",
     alignItems: "center"
   },
   linkText: {
     color: "#fff",
     fontWeight: "500",
     marginRight: 5
   },
   typingBubble: {
     paddingVertical: 15,
     paddingHorizontal: 15,
     width: 70
   },
   typingIndicator: {
     flexDirection: "row",
     justifyContent: "space-between",
     width: 40
   },
   typingDot: {
     width: 8,
     height: 8,
     borderRadius: 4,
     backgroundColor: "#888",
     opacity: 0.5
   },
   replyPreviewContainer: {
     flexDirection: "row",
     alignItems: "center",
     backgroundColor: "#f0f0f0",
     paddingHorizontal: 12,
     paddingVertical: 8,
     borderRadius: 8,
     marginBottom: 8,
     borderLeftWidth: 3,
     borderLeftColor: "#007AFF"
   },
   replyPreviewContent: {
     flex: 1,
     marginRight: 10
   },
   replyPreviewName: {
     fontWeight: "bold",
     fontSize: 12,
     color: "#007AFF"
   },
   replyPreviewText: {
     color: "#666",
     fontSize: 14
   },
   replyContainer: {
     flexDirection: "row",
     marginBottom: -5,
     zIndex: 1
   },
   userReplyContainer: {
     alignSelf: "flex-end",
     marginRight: 15
   },
   contactReplyContainer: {
     alignSelf: "flex-start",
     marginLeft: 15
   },
   replyLine: {
     width: 2,
     backgroundColor: "#007AFF",
     borderRadius: 1,
     marginRight: 5
   },
   replyContent: {
     backgroundColor: "rgba(0, 122, 255, 0.1)",
     padding: 5,
     borderRadius: 5,
     maxWidth: 150
   },
   replyName: {
     fontSize: 10,
     fontWeight: "bold",
     color: "#007AFF"
   },
   replyText: {
     fontSize: 11,
     color: "#666"
   }
 });

export default EmergencyContactsScreen;