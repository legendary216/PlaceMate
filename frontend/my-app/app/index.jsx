import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showMessage } from "react-native-flash-message";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  // ✅ validation
  const validateInputs = () => {
    let valid = true;
    const emailRegex = /\S+@\S+\.\S+/;

    if (!emailRegex.test(email)) {
      setEmailError("Enter a valid email address");
      valid = false;
    } else {
      setEmailError("");
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters");
      valid = false;
    } else {
      setPasswordError("");
    }

    return valid;
  };

  // ✅ login function
  const handleLogin = async () => {
    try {
      if (!email.trim() || !password.trim()) {
        showMessage({
          message: "Error",
          description: "All fields are required",
          type: "danger",
        });
        return;
      }

      if (!validateInputs()) return;

      const res = await fetch("http://192.168.0.147:5000/api/auth/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ✅ keeps cookies
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();

        // store token & user
        await AsyncStorage.setItem("token", data.token);
        await AsyncStorage.setItem("user", JSON.stringify(data.user));

        showMessage({
          message: "Login Successful 🎉",
          description: `Welcome back, ${data.user.name || "User"}!`,
          type: "success",
          icon: "success",
        });

        // ✅ go to home
        router.replace("/home");
      } else {
        const errorData = await res.json();
        showMessage({
          message: "Login Failed",
          description: errorData.message || "Invalid credentials",
          type: "danger",
        });
      }
    } catch (err) {
      showMessage({
        message: "Error",
        description: "Could not connect to server",
        type: "danger",
      });
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>

      {emailError ? <Text style={styles.error}>{emailError}</Text> : null}
      <TextInput
        style={[styles.input, emailError ? { borderColor: "red" } : {}]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
      <TextInput
        style={[styles.input, passwordError ? { borderColor: "red" } : {}]}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log In</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push("/register")}>
        <Text style={styles.link}>Don’t have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, textAlign: "center", marginBottom: 20, fontWeight: "bold" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 10, marginBottom: 8, borderRadius: 5 },
  button: { backgroundColor: "#007AFF", padding: 15, borderRadius: 5, marginTop: 10 },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
  link: { textAlign: "center", color: "#007AFF", marginTop: 15 },
  error: { color: "red", fontSize: 12, marginBottom: 5 },
});
