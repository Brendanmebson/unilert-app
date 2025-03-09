import React, { useEffect, useRef, useState } from "react";
import { 
  View, 
  Text, 
  Image, 
  StyleSheet, 
  Animated, 
  ActivityIndicator,
  Dimensions,
  StatusBar
} from "react-native";
import { useRouter } from "expo-router";

const SplashScreen = () => {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const taglineAnim = useRef(new Animated.Value(0)).current;
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Sequential animations
    Animated.sequence([
      // First fade in and scale logo
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
      // Then fade in tagline
      Animated.timing(taglineAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
        delay: 300,
      }),
    ]).start();

    // Preload any resources here if needed
    const preloadResources = async () => {
      try {
        // Simulate loading time
        await new Promise(resolve => setTimeout(resolve, 2500));
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to preload resources:", error);
        setIsLoading(false);
      }
    };

    preloadResources();

    const navigationTimer = setTimeout(() => {
      router.replace("/login");
    }, 3000);

    // Clean up timer if component unmounts
    return () => clearTimeout(navigationTimer);
  }, []);

  return (
    <View style={styles.splashContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#0A356D" />
      
      <Animated.View 
        style={[
          styles.contentContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }] 
          }
        ]}
      >
        <Animated.Image 
          source={require("../assets/icons/unilert-logo-light.png")} 
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.splashText}>UNILERT</Text>
        
        <Animated.Text 
          style={[
            styles.tagline,
            { opacity: taglineAnim }
          ]}
        >
          "Your safety, our priority"
        </Animated.Text>
      </Animated.View>

      {isLoading && (
        <ActivityIndicator 
          size="large" 
          color="#00AEEF" 
          style={styles.loader} 
        />
      )}

      <View style={styles.bottomInfo}>
        <Image 
          source={require("../assets/icons/security-icon.png")} 
          style={styles.smallIcon}
          resizeMode="contain" 
        />
        <Text style={styles.copyright}>
          © 2025 UNILERT | Est. 2024
        </Text>
      </View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: "#0A356D",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  contentContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: width * 0.45,
    height: width * 0.45,
    marginBottom: 20,
  },
  splashText: {
    color: "white",
    fontSize: 32,
    fontWeight: "bold",
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 4,
  },
  tagline: {
    color: "#B0C4DE",
    fontSize: 16,
    fontStyle: "italic",
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  loader: {
    marginTop: 40,
  },
  bottomInfo: {
    position: "absolute",
    bottom: height * 0.03,
    right: width * 0.05,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    borderRadius: 20,
  },
  smallIcon: {
    width: 20,
    height: 20,
    marginRight: 8,
  },
  copyright: {
    color: "white",
    fontSize: 12,
    fontWeight: '300',
  },
});

export default SplashScreen;