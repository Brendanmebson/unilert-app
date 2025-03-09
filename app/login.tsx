import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert,
  ActivityIndicator
} from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { signIn, loading } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (text) => {
    setEmail(text);
    
    // Check if it's a valid school email
    if (text && !text.includes("@") || (text && !text.toLowerCase().endsWith(".edu.ng"))) {
      setEmailError("Please use a valid school email (.edu.ng)");
    } else {
      setEmailError("");
    }
  };

  const handleLogin = async () => {
    console.log("Login button pressed");
    
    // Reset errors
    setEmailError("");
    setPasswordError("");
    
    // Validate email before proceeding
    if (!email || !email.includes("@") || !email.toLowerCase().endsWith(".edu.ng")) {
      console.log("Email validation failed");
      setEmailError("Please use a valid school email (.edu.ng)");
      return;
    }
    
    // Check if password is entered
    if (!password) {
      console.log("Password validation failed");
      setPasswordError("Please enter your password");
      return;
    }
    
    console.log("Attempting to sign in with:", email);
    
    try {
      // Attempt to sign in
      const { success, error } = await signIn(email, password);
      
      console.log("Sign in result:", success, error);
      
      if (success) {
        console.log("Login successful, navigating to dashboard");
        router.replace("/tabs/dashboard");
      } else {
        console.log("Login failed:", error);
        Alert.alert("Login Failed", error || "Invalid email or password");
      }
    } catch (err) {
      console.error("Login error:", err);
      Alert.alert("Login Error", "An unexpected error occurred");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundColor }]}>
      {/* Background Shapes */}
      <View style={styles.backgroundShapes}>
        <View style={[styles.shape, styles.shape1, { backgroundColor: theme.isDarkMode ? 'rgba(0, 102, 204, 0.2)' : 'rgba(0, 102, 204, 0.1)' }]} />
        <View style={[styles.shape, styles.shape2, { backgroundColor: theme.isDarkMode ? 'rgba(0, 102, 204, 0.15)' : 'rgba(0, 102, 204, 0.08)' }]} />
        <View style={[styles.shape, styles.shape3, { backgroundColor: theme.isDarkMode ? 'rgba(0, 102, 204, 0.25)' : 'rgba(0, 102, 204, 0.15)' }]} />
      </View>

      {/* Content Container with Shadow */}
      <View style={[styles.contentContainer, { backgroundColor: theme.cardBackground }]}>
        {/* Logo Section */}
        <Image 
          source={theme.isDarkMode ? require("../assets/icons/unilert-logo-light.png") : require("../assets/icons/unilert-logo-dark.png")} 
          style={styles.logo} 
        />
        <Text style={styles.brand}>UNILERT</Text>
        <Text style={[styles.subtitle, { color: theme.textColor }]}>Login to your Account</Text>

        {/* Input Fields */}
        <TextInput
          style={[
            styles.input, 
            { 
              backgroundColor: theme.inputBackground,
              borderColor: emailError ? theme.dangerColor : theme.borderColor,
              color: theme.textColor
            }
          ]}
          placeholder="School Email"
          placeholderTextColor={theme.placeholderColor}
          onChangeText={validateEmail}
          keyboardType="email-address"
          value={email}
        />
        {emailError ? <Text style={[styles.errorText, { color: theme.dangerColor }]}>{emailError}</Text> : null}
        
        <TextInput
          style={[
            styles.input,
            { 
              backgroundColor: theme.inputBackground,
              borderColor: passwordError ? theme.dangerColor : theme.borderColor,
              color: theme.textColor
            }
          ]}
          placeholder="Password"
          placeholderTextColor={theme.placeholderColor}
          secureTextEntry
          onChangeText={setPassword}
          value={password}
        />
        {passwordError ? <Text style={[styles.errorText, { color: theme.dangerColor }]}>{passwordError}</Text> : null}

        {/* Login Button */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.buttonText}>Log in</Text>
          )}
        </TouchableOpacity>

        <Text style={[styles.orText, { color: theme.secondaryTextColor }]}>- Or sign in with -</Text>

        {/* Google Sign In Only */}
        <View style={styles.socialContainer}>
          <TouchableOpacity>
            <Image source={require("../assets/icons/google.png")} style={styles.socialIcon} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.schoolAccountText, { color: theme.secondaryTextColor }]}>*Use your School Account</Text>

        {/* Sign Up Link */}
        <TouchableOpacity onPress={() => router.push("/signup")}>
          <Text style={[styles.signupText, { color: theme.textColor }]}>
            Don't have an account? <Text style={[styles.signupLink, { color: theme.accentColor }]}>Sign up</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  backgroundShapes: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  shape: {
    position: 'absolute',
    borderRadius: 50,
  },
  shape1: {
    width: 200,
    height: 200,
    top: '10%',
    left: '-10%',
    transform: [{ rotate: '45deg' }],
  },
  shape2: {
    width: 150,
    height: 150,
    bottom: '15%',
    right: '-5%',
  },
  shape3: {
    width: 100,
    height: 100,
    top: '40%',
    right: '20%',
    borderRadius: 25,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    // Shadow for iOS
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 8,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  brand: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#E8A317",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 25,
  },
  input: {
    width: "100%",
    height: 55,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    alignSelf: "flex-start",
    marginBottom: 10,
    marginTop: -10,
  },
  button: {
    width: 280,
    backgroundColor: "#003366",
    padding: 15,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
    // Button shadow
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  orText: {
    marginVertical: 20,
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginBottom: 5,
  },
  socialIcon: {
    width: 35,
    height: 35,
  },
  schoolAccountText: {
    fontSize: 12,
    marginBottom: 10,
    fontStyle: "italic",
  },
  signupText: {
    marginTop: 20,
    fontSize: 15,
  },
  signupLink: {
    fontWeight: "bold",
  },
});