import React from "react";
import {  View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Loader2 } from 'lucide-react-native'; // Import from react-native
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function PendingPage() {
  const router = useRouter();

  const handleLogout = async () => {
    // Use AsyncStorage and router
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
    router.replace("/"); // Redirect to login
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.box}>
        <View style={styles.iconWrapper}>
          {/* Use the color prop for lucide icons */}
          <Loader2 size={32} color="#4f46e5" />
        </View>
        <Text style={styles.title}>Application Pending</Text>
        <Text style={styles.subtitle}>
          Your mentor application has been received and is currently under review by our team.
          You will be notified via email once a decision is made.
        </Text>
        <Pressable onPress={handleLogout} style={styles.buttonLogout}>
          <Text style={styles.buttonLogoutText}>Back to Login</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

// Converted StyleSheet
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f9fafe',
  },
  box: {
    backgroundColor: '#fff',
    borderRadius: 12, // 0.75rem
    padding: 40, // 2.5rem
    width: '100%',
    maxWidth: 448, // 28rem
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#eef2ff',
  },
  iconWrapper: {
    width: 64, // 4rem
    height: 64, // 4rem
    borderRadius: 32, // 50%
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24, // 1.5rem
  },
  title: {
    fontSize: 24, // 1.5rem
    fontWeight: '700',
    marginBottom: 8, // 0.5rem
    textAlign: 'center',
    color: '#111827',
  },
  subtitle: {
    color: '#4b5563',
    marginBottom: 24, // 1.5rem
    lineHeight: 22, // 1.6
    textAlign: 'center',
  },
  buttonLogout: {
    width: '100%',
    backgroundColor: '#4f46e5',
    paddingVertical: 14, // 0.875rem
    borderRadius: 12, // 0.75rem
    alignItems: 'center',
  },
  buttonLogoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16, // 1rem
  },
});