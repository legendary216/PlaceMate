import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function Home() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>🎉 Welcome to the Home Screen!</Text>
      <TouchableOpacity 
        onPress={() => router.replace("/")} 
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
