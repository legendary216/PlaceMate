import React from "react";
import { View, Text, StyleSheet, TouchableOpacity,Platform } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";



export default function Home() {
  const router = useRouter();

    const showMessage = (title, message) => {
    if (Platform.OS === "web") {
      window.alert(`${title}\n${message}`);
    } else {
      Alert.alert(title, message);
    }
  };


  const handleLogout = async () => {
    try {
     
      const res = await fetch("http://192.168.0.147:5000/api/auth/users/logout", {
  method: "POST",
  credentials: "include",   // include cookie
  headers: {
    "Content-Type": "application/json",
  },
});

      console.log("res: ",res);
      if (res.ok) {
       
        await AsyncStorage.removeItem("token");

        showMessage("Success", "You have been logged out");
        router.replace("/"); // Go back to Login
      } else {
        showMessage("Error", "Logout failed");
      }
    } catch (err) {
      console.error(err);
      showMessage("Error", "Could not connect to server");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎉 Welcome to the Home Screen!</Text>
     
      <TouchableOpacity 
        onPress={handleLogout} 
        style={styles.button}
      >
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  text: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  button: { backgroundColor: "red", padding: 10, borderRadius: 5 },
  buttonText: { color: "#fff", fontWeight: "bold" }
});
