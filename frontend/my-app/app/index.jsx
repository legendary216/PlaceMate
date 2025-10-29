import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useRouter, Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// This is the new, correct React Native component for your login screen.
export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Expo Router's hook for navigation

  const validateInputs = () => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    setError("");
    return true;
  };

  // --- THIS FUNCTION IS NOW UPDATED FOR REACT NATIVE ---
  const handleLogin = async () => {
    try {
      if (!email.trim() || !password.trim()) {
        setError("All fields are required");
        return;
      }
      if (!validateInputs()) return;

      setIsLoading(true);

      const res = await fetch(
        "https://placemate-ru7v.onrender.com/api/auth/login/handlelogin",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        // Use AsyncStorage instead of localStorage
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({ ...data.user, role: role })
        );

        // Check mentor status
        if (role === "mentor") {
          if (data.user.status === "pending") {
            router.replace("/pending"); // Use router.replace for navigation
            return;
          }
          if (data.user.status === "rejected") {
            router.replace("/rejected"); // Use router.replace for navigation
            return;
          }
        }

        // For Admins, Users, and Approved Mentors:
        setShowSuccess(true);
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Could not connect to the server. Please check your connection.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- THIS FUNCTION IS UPDATED FOR REACT NATIVE ---
  const handleSuccessRedirect = () => {
    setShowSuccess(false);
    
    // Redirect based on the role using router
    if (role === "admin") {
      router.replace("/home");
    } else if (role === "user") {
      router.replace("/home");
    } else if (role === "mentor") {
      router.replace("/mentor");
    } else {
      router.replace("/home");
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.loginWrapper}>
            {/* 🌟 LOGO 🌟 */}
            <View style={styles.logoContainer}>
              <Image
                source={{
                  uri: "https://res.cloudinary.com/dp1mmwwom/image/upload/v1761598183/placemate/profile_pics/j49x0sjyt1iz0opzlsbh.png",
                }}
                alt="PlaceMate Logo"
                style={styles.logoImage}
              />
            </View>
            {/* 🌟 END LOGO 🌟 */}

            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Log in to continue to PlaceMate</Text>

            <View style={styles.roleSelectorContainer}>
              <Pressable
                style={[
                  styles.roleButton,
                  role === "user" && styles.roleButtonSelected,
                ]}
                onPress={() => setRole("user")}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === "user" && styles.roleButtonTextSelected,
                  ]}
                >
                  User
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.roleButton,
                  role === "mentor" && styles.roleButtonSelected,
                ]}
                onPress={() => setRole("mentor")}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === "mentor" && styles.roleButtonTextSelected,
                  ]}
                >
                  Mentor
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.roleButton,
                  role === "admin" && styles.roleButtonSelected,
                ]}
                onPress={() => setRole("admin")}
              >
                <Text
                  style={[
                    styles.roleButtonText,
                    role === "admin" && styles.roleButtonTextSelected,
                  ]}
                >
                  Admin
                </Text>
              </Pressable>
            </View>

            {error && <Text style={styles.error}>{error}</Text>}

            <TextInput
              style={styles.inputField}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.inputField}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry // Hides the password
              placeholderTextColor="#999"
            />
<Pressable
              style={styles.buttonPrimary}
              onPress={handleLogin}
              disabled={isLoading} // 👈 ADD THIS
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" /> // 👈 ADD THIS
              ) : (
                <Text style={styles.buttonPrimaryText}>Log In</Text> // 👈 YOUR ORIGINAL TEXT
              )}
            </Pressable>

            {role !== "admin" && (
              <Link
                href={role === "mentor" ? "/mentor-register" : "/register"}
                asChild
              >
                <Pressable style={styles.link}>
                  <Text style={styles.linkText}>
                    Don’t have an account? Register
                  </Text>
                </Pressable>
              </Link>
            )}
          </View>

          {/* This is the React Native Modal */}
          <Modal
            visible={showSuccess}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowSuccess(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalIcon}>🎉</Text>
                <Text style={styles.modalTitle}>Login Successful!</Text>
                <Text style={styles.modalSubtitle}>
                  Welcome back! Redirecting you now...
                </Text>
                <Pressable
                  onPress={handleSuccessRedirect}
                  style={styles.buttonPrimary}
                >
                  <Text style={styles.buttonPrimaryText}>Ok</Text>
                </Pressable>
              </View>
            </View>
          </Modal>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// This is the React Native StyleSheet, which replaces the <style> tag.
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9fafe",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  loginWrapper: {
    width: "100%",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoImage: {
    width: 120,
    height: 120,
    resizeMode: "contain",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  roleSelectorContainer: {
    flexDirection: "row",
    marginBottom: 20,
    backgroundColor: "#eef2ff",
    borderRadius: 12,
    padding: 4,
  },
  roleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
  },
  roleButtonSelected: {
    backgroundColor: "#4f46e5",
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  roleButtonText: {
    color: "#4f46e5",
    fontWeight: "600",
    fontSize: 15,
    textAlign: "center",
  },
  roleButtonTextSelected: {
    color: "#fff",
  },
  inputField: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 15,
    marginBottom: 12,
    borderRadius: 12,
    fontSize: 16,
    color: "#333",
  },
  buttonPrimary: {
    width: "100%",
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 10,
    alignItems: "center",
  },
  buttonPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  link: {
    marginTop: 20,
  },
  linkText: {
    color: "#4f46e5",
    fontWeight: "500",
    fontSize: 15,
    textAlign: "center",
  },
  error: {
    color: "#ef4444",
    fontSize: 14,
    marginBottom: 12,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    width: "90%",
    maxWidth: 384,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  modalSubtitle: {
    color: "#4b5563",
    marginBottom: 24,
    textAlign: "center",
    fontSize: 16,
  },
});
