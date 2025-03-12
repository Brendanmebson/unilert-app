import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Alert } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [matricNo, setMatricNo] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateEmail = (text) => {
    setEmail(text);
    
    // Check if it's a valid school email
    if (text && !text.includes("@") || (text && !text.toLowerCase().endsWith(".edu.ng"))) {
      setEmailError("Please use a valid school email (.edu.ng)");
    } else {
      setEmailError("");
    }
  };

  const validatePasswordMatch = (text) => {
    setConfirmPassword(text);
    if (password && text && password !== text) {
      setPasswordError("Passwords do not match");
    } else {
      setPasswordError("");
    }
  };

  const handleSignup = () => {
    // Check if all fields are filled
    if (!name || !email || !password || !matricNo) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    // Validate school email
    if (!email || !email.includes("@") || !email.toLowerCase().endsWith(".edu.ng")) {
      setEmailError("Please use a valid school email (.edu.ng)");
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }

    // If all validations pass, navigate to login screen
    router.replace("/login");
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
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
        <Text style={styles.subtitle}>Create your Account</Text>

        {/* Input Fields */}
        <TextInput
          style={styles.input}
          placeholder="Full Name"
          placeholderTextColor="#555"
          onChangeText={setName}
        />
        <TextInput
          style={[styles.input, emailError ? styles.inputError : null]}
          placeholder="School Email"
          placeholderTextColor="#555"
          keyboardType="email-address"
          onChangeText={validateEmail}
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
        
        <TextInput
          style={styles.input}
          placeholder="Matric Number"
          placeholderTextColor="#555"
          onChangeText={setMatricNo}
        />
        
        {/* Password field with eye icon */}
        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            placeholderTextColor="#555"
            secureTextEntry={!showPassword}
            onChangeText={setPassword}
          />
          <TouchableOpacity style={styles.eyeIcon} onPress={togglePasswordVisibility}>
            <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#555" />
          </TouchableOpacity>
        </View>
        
        {/* Confirm password field - appears when user starts typing a password */}
        {password.length > 0 && (
          <>
            <View style={[
              styles.passwordContainer, 
              passwordError ? styles.passwordContainerError : null
            ]}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="#555"
                secureTextEntry={!showConfirmPassword}
                onChangeText={validatePasswordMatch}
                value={confirmPassword}
              />
              <TouchableOpacity style={styles.eyeIcon} onPress={toggleConfirmPasswordVisibility}>
                <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="#555" />
              </TouchableOpacity>
            </View>
            {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
          </>
        )}

        {/* Signup Button */}
        <TouchableOpacity 
          style={styles.button} 
          onPress={handleSignup}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
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
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: "#F7F7F7",
    marginBottom: 15,
    height: 55,
  },
  passwordContainerError: {
    borderColor: "#ff3b30",
    borderWidth: 1,
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
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
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