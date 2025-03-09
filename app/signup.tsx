import { useState } from "react";
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  Alert,
  ActivityIndicator,
  ScrollView
} from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function SignupScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const validateEmail = (text) => {
    setEmail(text);
    
    // Check if it's a valid school email
    if (text && !text.includes("@") || (text && !text.toLowerCase().endsWith(".edu.ng"))) {
      setEmailError("Please use a valid school email address that ends with .edu.ng");
    } else {
      setEmailError("");
    }
  };

  const validateConfirmPassword = (text) => {
    setConfirmPassword(text);
    
    if (password && text && password !== text) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const handleSignup = async () => {
    console.log("Sign up button pressed");
    
    // Check if all fields are filled
    if (!name || !email || !password || !confirmPassword || !matricNo) {
      console.log("Missing required fields:", {
        name: !!name,
        email: !!email,
        password: !!password,
        confirmPassword: !!confirmPassword,
        matricNo: !!matricNo
      });
      Alert.alert("Error", "Please fill all required fields");
      return;
    }
  
    // Validate school email
    if (!email || !email.includes("@") || !email.toLowerCase().endsWith(".edu.ng")) {
      console.log("Email validation failed:", email);
      setEmailError("Please use a valid school email address that ends with .edu.ng");
      return;
    }
  
    // Validate password match
    if (password !== confirmPassword) {
      console.log("Password match validation failed");
      setPasswordError("Passwords do not match");
      return;
    }
  
    const userData = {
      fullname: name,
      matricNo,
      phoneNo: "", // Can be updated later
      course: "Not specified", // Default value, user will update in profile
      department: "Not specified", // Default value, user will update in profile
      level: "Not specified" // Default value, user will update in profile
    };
  
    console.log("Attempting to sign up with:", email);
    console.log("User data:", userData);
  
    try {
      const { success, error } = await signUp(email, password, userData);
      
      console.log("Sign up result:", success, error);
      
      if (success) {
        console.log("Sign up successful");
        Alert.alert(
          "Account Created", 
          "Your account has been created successfully. Please check your email for verification.",
          [{ text: "OK", onPress: () => router.replace("/login") }]
        );
      } else {
        console.log("Sign up failed:", error);
        Alert.alert("Signup Failed", error || "Failed to create account. Please try again.");
      }
    } catch (err) {
      console.error("Sign up error:", err);
      Alert.alert("Signup Error", "An unexpected error occurred");
    }
  };

  return (
    <View style={styles.container}>
      {/* Background Shapes */}
      <View style={styles.backgroundShapes}>
        <View style={[styles.shape, styles.shape1]} />
        <View style={[styles.shape, styles.shape2]} />
        <View style={[styles.shape, styles.shape3]} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Content Container with Shadow */}
        <View style={styles.contentContainer}>
          {/* Logo Section */}
          <Image source={require("../assets/icons/unilert-logo-dark.png")} style={styles.logo} />
          <Text style={styles.brand}>UNILERT</Text>
          <Text style={styles.subtitle}>Create your Account</Text>

          {/* Input Fields */}
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#555"
            onChangeText={setName}
            value={name}
          />
          <TextInput
            style={[styles.input, emailError ? styles.inputError : null]}
            placeholder="School Email"
            placeholderTextColor="#555"
            keyboardType="email-address"
            onChangeText={validateEmail}
            value={email}
          />
          {emailError ? (
            <Text style={styles.errorText}>{emailError}</Text>
          ) : (
            <Text style={styles.helperText}>Use a valid school email address (.edu.ng)</Text>
          )}
          
          <TextInput
            style={styles.input}
            placeholder="Matric Number"
            placeholderTextColor="#555"
            onChangeText={setMatricNo}
            value={matricNo}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#555"
            secureTextEntry
            onChangeText={setPassword}
            value={password}
          />
          <TextInput
            style={[styles.input, passwordError ? styles.inputError : null]}
            placeholder="Confirm Password"
            placeholderTextColor="#555"
            secureTextEntry
            onChangeText={validateConfirmPassword}
            value={confirmPassword}
          />
          {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

          {/* Signup Button */}
          <TouchableOpacity 
            style={styles.button} 
            onPress={handleSignup}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.orText}>- Or sign up with -</Text>

          {/* Google Sign Up Only */}
          <View style={styles.socialContainer}>
            <TouchableOpacity>
              <Image source={require("../assets/icons/google.png")} style={styles.socialIcon} />
            </TouchableOpacity>
          </View>
          <Text style={styles.schoolAccountText}>*Use your School Account</Text>

          {/* Login Link */}
          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Log in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
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
  helperText: {
    color: "#666",
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
  loginText: {
    color: "#333",
    marginTop: 20,
    fontSize: 15,
  },
  loginLink: {
    color: "#003366",
    fontWeight: "bold",
  },
});