import React from "react";
import { SafeAreaView, View, Text, Pressable, StyleSheet } from "react-native";
import { XCircle } from 'lucide-react-native'; // <-- Import from react-native
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function RejectedPage() {
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
          <XCircle size={32} color="#ef4444" />
        </View>
        <Text style={styles.title}>Application Not Approved</Text>
        <Text style={styles.subtitle}>
          We appreciate your interest in becoming a mentor. After careful review,
          we are unable to approve your application at this time.
          Please contact support for more details.
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
    borderRadius: 12,
    padding: 40,
    width: '100%',
    maxWidth: 448,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32, // 50%
    backgroundColor: '#fee2e2',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
    color: '#111827',
  },
  subtitle: {
    color: '#4b5563',
    marginBottom: 24,
    lineHeight: 22, // 1.6
    textAlign: 'center',
  },
  buttonLogout: {
    width: '100%',
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonLogoutText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});