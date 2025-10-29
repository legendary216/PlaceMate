import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  Platform, // 👈 ADD THIS
  StatusBar,
} from "react-native";
import {
  MessageSquare,
  Users,
  Building,
  FileText,
  LogOut,
  Calendar,
} from 'lucide-react-native';
import { useRouter, Link } from 'expo-router'; // <-- Updated imports
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    // Use AsyncStorage to load user data
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          // If no user found, redirect to login
          router.replace("/");
        }
      } catch (e) {
        console.error("Failed to load user data from AsyncStorage", e);
        router.replace("/");
      }
    };
    loadUser();
  }, []);

  // Base features
  let features = [
    { id: 1, title: "Interview Qs", Icon: MessageSquare, nav: "/interviewQuestions" },
    { id: 2, title: "Mentor Connect", Icon: Users, nav: "/mentorconnect" },
   // { id: 3, title: "My Bookings", Icon: Calendar, nav: "/my-bookings" }, // Added Bookings page
    { id: 4, title: "Company Analysis", Icon: Building, nav: "/company" },
    { id: 5, title: "AI Resume", Icon: FileText, nav: "/resume" },
  ];

  // Handle conditional navigation for admins
  const updatedFeatures = features.map(feature => {
      if (feature.title === "Mentor Connect" && user && user.role === 'admin') {
          return { ...feature, nav: "/adminMentors" }; // Admins go to admin page
      }
      return feature;
  });

  const showNotification = (message, type = 'danger') => {
    setNotification({ show: true, message, type });
    setTimeout(() => {
      setNotification({ show: false, message: '', type: '' });
    }, 3000);
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("https://placemate-ru7v.onrender.com/api/auth/login/logoutUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        await AsyncStorage.removeItem("token");
        await AsyncStorage.removeItem("user");
        showNotification("You have been logged out successfully.", "success");
        setTimeout(() => {
          router.replace("/"); // Redirect using router
        }, 1000);
      } else {
        const errorData = await res.json();
        showNotification(errorData.message || "Could not log out.");
      }
    } catch (err) {
      console.error(err);
      showNotification("Could not connect to the server.");
    }
  };

  // --- Rendering the component ---
  return (
    <SafeAreaView style={styles.container}>
      {/* Notification View (Fixed Position) */}
      {notification.show && (
        <View style={[styles.notification, styles[`notification${notification.type}`]]}>
          <Text style={styles.notificationText}>{notification.message}</Text>
        </View>
      )}

      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>PlaceMate</Text>
        <Pressable onPress={handleLogout} style={styles.logoutButton} title="Logout">
          <LogOut size={24} color="#4f46e5" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {user && <Text style={styles.welcomeText}>Welcome, {user.name || 'User'}!</Text>}
        
        <View style={styles.grid}>
          {updatedFeatures.map(({ id, title, Icon, nav }) => (
            <Link key={id} href={nav} asChild>
              <Pressable style={styles.card}>
                <Icon size={40} color="#4f46e5" />
                <Text style={styles.cardText}>{title}</Text>
              </Pressable>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafe',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 16 : 16, // 👈 ADD THIS
    paddingBottom: 16, // 👈 ADD THIS
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  logoutButton: {
    padding: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainContent: {
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  welcomeText: {
    fontSize: 24,
    textAlign: 'center',
    color: '#374151',
    marginBottom: 32,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    width: '45%', 
    minWidth: 150,
    aspectRatio: 1, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#eef2ff',
  },
  cardText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
  },
  notification: {
    position: 'absolute',
    top: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 40,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    zIndex: 1000,
  },
  notificationText: {
    color: '#fff',
    fontWeight: '500',
  },
  notificationSuccess: {
    backgroundColor: '#10b981',
  },
  notificationDanger: {
    backgroundColor: '#ef4444',
  },
});