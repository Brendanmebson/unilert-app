import { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator 
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function ResetPasswordScreen() {
 const router = useRouter();
 const params = useLocalSearchParams();
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');
 const [loading, setLoading] = useState(false);
 const [showPassword, setShowPassword] = useState(false);
 const [showConfirmPassword, setShowConfirmPassword] = useState(false);
 const [error, setError] = useState('');
 const [success, setSuccess] = useState(false);

 // Check for access token in URL params
 useEffect(() => {
   // This would be populated if coming from a reset password email link
   if (params.access_token) {
     console.log("Found access token in URL params");
   }
 }, [params]);

 const handleResetPassword = async () => {
   // Validate passwords
   if (newPassword.length < 8) {
     setError("Password must be at least 8 characters long");
     return;
   }

   if (newPassword !== confirmPassword) {
     setError("Passwords do not match");
     return;
   }

   setLoading(true);
   setError('');

   try {
     // Update password using the access token from URL
     const { error } = await supabase.auth.updateUser({
       password: newPassword
     });

     if (error) throw error;

     setSuccess(true);
     Alert.alert(
       "Password Updated",
       "Your password has been successfully reset.",
       [{ text: "OK", onPress: () => router.replace('/login') }]
     );
   } catch (error) {
     console.error("Password reset error:", error.message);
     setError(error.message);
   } finally {
     setLoading(false);
   }
 };

 return (
   <View style={styles.container}>
     <TouchableOpacity 
       style={styles.backButton} 
       onPress={() => router.replace('/login')}
     >
       <Ionicons name="arrow-back" size={24} color="#003366" />
     </TouchableOpacity>

     <Text style={styles.title}>Reset Password</Text>
     <Text style={styles.subtitle}>Enter your new password below</Text>

     {/* Password input */}
     <View style={styles.inputContainer}>
       <View style={styles.passwordContainer}>
         <TextInput
           style={styles.passwordInput}
           placeholder="New Password"
           placeholderTextColor="#555"
           secureTextEntry={!showPassword}
           value={newPassword}
           onChangeText={setNewPassword}
           autoCapitalize="none"
         />
         <TouchableOpacity 
           style={styles.eyeIcon} 
           onPress={() => setShowPassword(!showPassword)}
         >
           <Ionicons name={showPassword ? "eye-off" : "eye"} size={24} color="#555" />
         </TouchableOpacity>
       </View>

       <View style={styles.passwordContainer}>
         <TextInput
           style={styles.passwordInput}
           placeholder="Confirm New Password"
           placeholderTextColor="#555"
           secureTextEntry={!showConfirmPassword}
           value={confirmPassword}
           onChangeText={setConfirmPassword}
           autoCapitalize="none"
         />
         <TouchableOpacity 
           style={styles.eyeIcon} 
           onPress={() => setShowConfirmPassword(!showConfirmPassword)}
         >
           <Ionicons name={showConfirmPassword ? "eye-off" : "eye"} size={24} color="#555" />
         </TouchableOpacity>
       </View>

       {error ? <Text style={styles.errorText}>{error}</Text> : null}

       <TouchableOpacity 
         style={styles.resetButton} 
         onPress={handleResetPassword}
         disabled={loading}
       >
         {loading ? (
           <ActivityIndicator color="#fff" size="small" />
         ) : (
           <Text style={styles.resetButtonText}>Reset Password</Text>
         )}
       </TouchableOpacity>
     </View>
   </View>
 );
}

const styles = StyleSheet.create({
 container: {
   flex: 1,
   alignItems: 'center',
   padding: 20,
   backgroundColor: '#f5f9ff',
 },
 backButton: {
   alignSelf: 'flex-start',
   marginTop: 50,
   marginBottom: 20,
 },
 title: {
   fontSize: 28,
   fontWeight: 'bold',
   color: '#003366',
   marginBottom: 10,
 },
 subtitle: {
   fontSize: 16,
   color: '#666',
   marginBottom: 30,
   textAlign: 'center',
 },
 inputContainer: {
   width: '100%',
   maxWidth: 400,
 },
 passwordContainer: {
   flexDirection: 'row',
   alignItems: 'center',
   borderColor: '#ddd',
   borderWidth: 1,
   borderRadius: 8,
   backgroundColor: '#F7F7F7',
   marginBottom: 15,
 },
 passwordInput: {
   flex: 1,
   height: 55,
   paddingHorizontal: 15,
   fontSize: 16,
 },
 eyeIcon: {
   paddingHorizontal: 15,
   height: 55,
   justifyContent: 'center',
 },
 errorText: {
   color: '#ff3b30',
   marginBottom: 15,
 },
 resetButton: {
   backgroundColor: '#003366',
   padding: 15,
   alignItems: 'center',
   borderRadius: 8,
   marginTop: 10,
 },
 resetButtonText: {
   color: '#fff',
   fontSize: 16,
   fontWeight: 'bold',
 },
});