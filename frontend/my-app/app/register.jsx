import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from "react-native";
import { useRouter } from "expo-router";

export default function Register() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [errorP, setErrorP] = useState("");
  const router = useRouter();

  const emailRegex = /\S+@\S+\.\S+/;

  const showMessage = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  const validinputs = () => {
    let valid = true;

    if (!emailRegex.test(email)) {
      setError("Enter a valid email address");
      valid = false;
    } else {
      setError("");
    }

    if (password.length < 6) {
      setErrorP("Password must be at least 6 characters");
      valid = false;
    } else {
      setErrorP("");
    }

    return valid;
  };

  const handleRegister = async () => {
    try {
      if (!fullName.trim() || !email.trim() || !password.trim()) {
        showMessage("Error", "All fields are required");
        return;
      }

      if (!validinputs()) return;

      const res = await fetch(
        "http://192.168.0.147:5000/api/auth/users/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: fullName, email, password }),
        }
      );

      if (res.ok) {
        showMessage("Success", "Registration successful!");
        router.replace("/"); // Go back to Login
      } else {
        const errorData = await res.json();
        showMessage("Error", errorData.message || "Registration failed");
      }
    } catch (err) {
      showMessage("Error", "Could not connect to server");
      console.error(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Register</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={fullName}
        onChangeText={setFullName}
      />

      {error ? <Text style={{ color: "red" }}>{error}</Text> : null}
      <TextInput
        style={[styles.input, error ? { borderColor: "red" } : {}]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />

      {errorP ? <Text style={{ color: "red" }}>{errorP}</Text> : null}
      <TextInput
        style={[styles.input, errorP ? { borderColor: "red" } : {}]}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <TouchableOpacity style={styles.button} onPress={handleRegister}>
        <Text style={styles.buttonText}>Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace("/")}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 24,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
  button: {
    backgroundColor: "#007AFF",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: { color: "white", textAlign: "center", fontWeight: "bold" },
  link: { textAlign: "center", color: "#007AFF", marginTop: 10 },
});
