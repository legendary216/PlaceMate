import React from "react";
import { View, Text, StyleSheet, TouchableOpacity,Platform } from "react-native";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { showMessage } from "react-native-flash-message";


export default function Home() {
  const router = useRouter();

    


  const handleLogout = async () => {
    try {
     
      const res = await fetch("http://192.168.0.147:5000/api/auth/login/logoutUser", {
  method: "POST",
  credentials: "include",   
  headers: {
    "Content-Type": "application/json",
  },
});

      console.log("res: ",res);
      if (res.ok) {
       
        await AsyncStorage.removeItem("token");

        showMessage({
          message: "Logout Successful 🎉",
          description: `user logged out successfully!`,
          type: "success",
          icon: "success",
        });

      
        router.replace("/"); 
      } else {
        showMessage("Error", "Logout failed","danger" );
      }
    } catch (err) {
      console.error(err);
      showMessage("Error", "Could not connect to server" ,"danger","danger");
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
