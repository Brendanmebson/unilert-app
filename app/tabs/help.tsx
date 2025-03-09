import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  SafeAreaView
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const HelpScreen = () => {
  const navigation = useNavigation();
  const [expandedSection, setExpandedSection] = useState(null);

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };

  const helpTopics = [
    {
      id: 1,
      title: 'Account Management',
      content: 'To update your profile information, go to the Profile screen and tap the Edit button. Some information like Matric Number, Course, Department, and Level can only be changed by contacting an administrator.'
    },
    {
      id: 2,
      title: 'Course Registration',
      content: 'To register for courses, navigate to the Courses tab and select "Register Courses". Follow the on-screen instructions to complete your course registration for the semester.'
    },
    {
      id: 3,
      title: 'Payment Information',
      content: 'You can make school fee payments through the Payments section. We support various payment methods including credit/debit cards, bank transfers, and mobile money. Receipts will be sent to your registered email address.'
    },
    {
      id: 4,
      title: 'Technical Support',
      content: 'If you encounter any technical issues with the app, please try clearing the app cache or reinstalling. For persistent problems, contact our technical support team.'
    },
    {
      id: 5,
      title: 'App Navigation',
      content: 'The bottom navigation bar provides quick access to Home, Courses, Calendar, Notifications, and Profile sections. Swipe gestures can also be used in some screens for additional functionality.'
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="black" />
        </TouchableOpacity>
        <Text style={styles.title}>Help Center</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content}>
        <Text style={styles.welcomeText}>
          How can we help you today?
        </Text>

        <View style={styles.faqContainer}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          
          {helpTopics.map((topic) => (
            <View key={topic.id} style={styles.faqItem}>
              <TouchableOpacity 
                style={styles.faqHeader} 
                onPress={() => toggleSection(topic.id)}
              >
                <Text style={styles.faqTitle}>{topic.title}</Text>
                <Ionicons 
                  name={expandedSection === topic.id ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#555"
                />
              </TouchableOpacity>
              
              {expandedSection === topic.id && (
                <Text style={styles.faqContent}>{topic.content}</Text>
              )}
            </View>
          ))}
        </View>

        <View style={styles.contactContainer}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          
          <TouchableOpacity 
            style={styles.contactOption}
            onPress={() => Linking.openURL('mailto:support@university.edu')}
          >
            <View style={styles.contactIconContainer}>
              <Feather name="mail" size={22} color="white" />
            </View>
            <View style={styles.contactDetails}>
              <Text style={styles.contactTitle}>Email Support</Text>
              <Text style={styles.contactSubtitle}>support@university.edu</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#777" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactOption}
            onPress={() => Linking.openURL('tel:+2348012345678')}
          >
            <View style={[styles.contactIconContainer, { backgroundColor: '#4CAF50' }]}>
              <Feather name="phone" size={22} color="white" />
            </View>
            <View style={styles.contactDetails}>
              <Text style={styles.contactTitle}>Phone Support</Text>
              <Text style={styles.contactSubtitle}>+234 801 234 5678</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#777" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.contactOption}
            onPress={() => Linking.openURL('https://university.edu/live-chat')}
          >
            <View style={[styles.contactIconContainer, { backgroundColor: '#2196F3' }]}>
              <Feather name="message-circle" size={22} color="white" />
            </View>
            <View style={styles.contactDetails}>
              <Text style={styles.contactTitle}>Live Chat</Text>
              <Text style={styles.contactSubtitle}>Available 8AM - 5PM</Text>
            </View>
            <Feather name="chevron-right" size={20} color="#777" />
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>App Version 1.0.3</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeText: {
    fontSize: 18,
    marginBottom: 25,
    textAlign: 'center',
    color: '#333',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  faqContainer: {
    marginBottom: 30,
  },
  faqItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#eee',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  faqContent: {
    padding: 15,
    paddingTop: 0,
    lineHeight: 22,
    color: '#555',
    backgroundColor: '#f5f5f5',
  },
  contactContainer: {
    marginBottom: 30,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 12,
    padding: 15,
    borderWidth: 1,
    borderColor: '#eee',
  },
  contactIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  contactDetails: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contactSubtitle: {
    fontSize: 14,
    color: '#777',
    marginTop: 3,
  },
  footer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

export default HelpScreen;