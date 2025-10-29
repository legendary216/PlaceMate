import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter, Link } from "expo-router";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [generalError, setGeneralError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const emailRegex = /\S+@\S+\.\S+/;

  const validateInputs = () => {
    let valid = true;
    setEmailError("");
    setPasswordError("");
    setGeneralError("");

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setGeneralError("All fields are required");
      valid = false;
    }

    if (!emailRegex.test(email)) {
      setEmailError("Enter a valid email address");
      valid = false;
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    }

    return valid;
  };

  const handleRegister = async () => {
    try {
      if (!validateInputs()) return;

      const res = await fetch(
        "https://placemate-ru7v.onrender.com/api/auth/register/registerUser",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: fullName, email, password }),
        }
      );

      const errorData = await res.json();
      if (res.ok) {
        setShowSuccess(true);
      } else {
        setGeneralError(errorData.message || "Registration failed");
      }
    } catch (err) {
      setGeneralError("Could not connect to server");
      console.error(err);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.registerWrapper}>
            <Text style={styles.title}>Create Account</Text>

            {generalError ? (
              <Text style={styles.error}>{generalError}</Text>
            ) : null}

            <TextInput
              style={[
                styles.inputField,
                (generalError && !fullName) && styles.inputError,
              ]}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor="#999"
            />

            <TextInput
              style={[
                styles.inputField,
                emailError && styles.inputError,
              ]}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              placeholderTextColor="#999"
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {emailError ? <Text style={styles.error}>{emailError}</Text> : null}

            <TextInput
              style={[
                styles.inputField,
                passwordError && styles.inputError,
              ]}
              placeholder="Password (min. 6 characters)"
              value={password}
              onChangeText={setPassword}
              placeholderTextColor="#999"
              secureTextEntry
            />
            {passwordError ? (
              <Text style={styles.error}>{passwordError}</Text>
            ) : null}

            <Pressable style={styles.buttonPrimary} onPress={handleRegister}>
              <Text style={styles.buttonPrimaryText}>Register</Text>
            </Pressable>

            <Link href="/" asChild>
              <Pressable style={styles.link}>
                <Text style={styles.linkText}>Already have an account? Login</Text>
              </Pressable>
            </Link>
          </View>

          <Modal transparent visible={showSuccess} animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalBox}>
                <Text style={styles.modalIcon}>✅</Text>
                <Text style={styles.modalTitle}>Registration successful!</Text>
                <Text style={styles.modalSubtitle}>
                  Your account has been created. Please log in.
                </Text>
                <Pressable
                  style={styles.buttonPrimary}
                  onPress={() => {
                    setShowSuccess(false);
                    router.replace("/");
                  }}
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

// Updated styles to match index.jsx
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
  registerWrapper: {
    width: "100%",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#222",
    textAlign: "center",
    marginBottom: 24,
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
  inputError: {
    borderColor: "#ef4444", // Red border for error
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
    marginBottom: 10, // Increased margin for spacing
    textAlign: "left",
    paddingLeft: 4,
  },
  // Modal styles
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