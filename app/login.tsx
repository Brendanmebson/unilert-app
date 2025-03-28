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
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const auth = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

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
    // Validate email before proceeding
    if (!email || !email.includes("@") || !email.toLowerCase().endsWith(".edu.ng")) {
      setEmailError("Please use a valid school email (.edu.ng)");
      return;
    }
    
    // Check if password is entered
    if (!password) {
      setPasswordError("Please enter your password");
      return;
    } else {
      setPasswordError("");
    }
    
    setLoading(true);
    
    try {
      console.log("[Login] Bypassing authentication and proceeding to dashboard");
      
      // Just navigate directly to dashboard
      setTimeout(() => {
        router.replace("/tabs/dashboard");
      }, 300);
    } catch (error) {
      console.error("[Login] Login error:", error.message);
      
      // Just navigate to dashboard anyway
      setTimeout(() => {
        router.replace("/tabs/dashboard");
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password
  const handleForgotPassword = async () => {
    if (!email) {
      setEmailError("Please enter your email address");
      return;
    }
    
    if (!email.includes("@") || !email.toLowerCase().endsWith(".edu.ng")) {
      setEmailError("Please enter a valid school email (.edu.ng)");
      return;
    }
    
    setLoading(true);
    
    try {
      console.log("[Login] Bypassing password reset and proceeding to dashboard");
      
      // Just navigate to dashboard
      setTimeout(() => {
        router.replace("/tabs/dashboard");
      }, 300);
    } catch (error) {
      console.error("Reset password error:", error.message);
      
      // Just navigate to dashboard anyway
      setTimeout(() => {
        router.replace("/tabs/dashboard");
      }, 300);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In
  const handleGoogleLogin = async () => {
    console.log("[Login] Bypassing Google login and proceeding to dashboard");
    setTimeout(() => {
      router.replace("/tabs/dashboard");
    }, 300);
  };

  return (
    <View style={styles.container}>
      {/* Background Shapes */}
      <View style={styles.backgroundShapes}>
        <View style={[styles.shape, styles.shape1]} />
        <View style={[styles.shape, styles.shape2]} />
        <View style={[styles.shape, styles.shape3]} />
      </View>

      {/* Content Container with Shadow */}
      <View style={styles.contentContainer}>
        {/* Logo Section */}
        <Image source={require("../assets/icons/unilert-logo-dark.png")} style={styles.logo} />
        <Text style={styles.brand}>UNILERT</Text>
        <Text style={styles.subtitle}>Login to your Account</Text>

        {/* Input Fields */}
        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="School Email"
          placeholderTextColor="#555"
          onChangeText={validateEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        
        <View style={styles.passwordContainer}>
          <TextInput
            style={[styles.passwordInput, passwordError ? styles.inputError : null]}
            placeholder="Password"
            placeholderTextColor="#555"
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
            value={password}
            autoCapitalize="none"
          />
          <TouchableOpacity 
            style={styles.eyeIcon} 
            onPress={() => setShowPassword(!showPassword)}
          >
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#555" />
          </TouchableOpacity>
        </View>
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

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

        {/* Forgot Password */}
        <TouchableOpacity 
          style={styles.forgotContainer}
          onPress={handleForgotPassword}
        >
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <Text style={styles.orText}>- Or sign in with -</Text>

        {/* Google Sign In */}
        <View style={styles.socialContainer}>
          <TouchableOpacity onPress={handleGoogleLogin}>
            <Image source={require("../assets/icons/google.png")} style={styles.socialIcon} />
          </TouchableOpacity>
        </View>
        <Text style={styles.schoolAccountText}>*Use your School Account</Text>

        {/* Sign Up Link */}
        <TouchableOpacity onPress={() => router.replace("/tabs/dashboard")}>
          <Text style={styles.signupText}>Don't have an account? <Text style={styles.signupLink}>Sign up</Text></Text>
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
    backgroundColor: "#f5f9ff",
  },
  backgroundShapes: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  shape: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 102, 204, 0.1)',
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
    backgroundColor: 'rgba(0, 102, 204, 0.08)',
  },
  shape3: {
    width: 100,
    height: 100,
    top: '40%',
    right: '20%',
    backgroundColor: 'rgba(0, 102, 204, 0.15)',
    borderRadius: 25,
  },
  contentContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: 'white',
    padding: 30,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#003366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
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
    color: "#333",
    marginBottom: 25,
  },
  input: {
    width: "100%",
    height: 55,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 15,
    backgroundColor: "#F7F7F7",
    fontSize: 16,
  },
  inputError: {
    borderColor: "#ff3b30",
  },
  errorText: {
    color: "#ff3b30",
    fontSize: 12,
    alignSelf: "flex-start",
    marginBottom: 10,
    marginTop: -10,
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#F7F7F7",
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    height: 55,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: "transparent",
  },
  eyeIcon: {
    paddingHorizontal: 15,
    height: 55,
    justifyContent: "center",
  },
  button: {
    width: 280,
    backgroundColor: "#003366",
    padding: 15,
    alignItems: "center",
    borderRadius: 8,
    marginTop: 10,
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
  forgotContainer: {
    marginTop: 15,
  },
  forgotText: {
    color: "#003366",
    fontSize: 14,
  },
  orText: {
    color: "#555",
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
    color: "#555",
    marginBottom: 10,
    fontStyle: "italic",
  },
  signupText: {
    color: "#333",
    marginTop: 20,
    fontSize: 15,
  },
  signupLink: {
    color: "#003366",
    fontWeight: "bold",
  },
});