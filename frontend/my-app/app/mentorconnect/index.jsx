import React, { useState, useEffect } from "react";
import {
 
  ScrollView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Platform, // 👈 CRITICAL: MUST BE IMPORTED
    StatusBar,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Search,
  Loader2,
  ChevronRight,
  Calendar,
} from 'lucide-react-native'; // Native icons
import { useRouter, Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Renamed component to 'Index' for the index.jsx file
export default function Index() { 
  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);

  // --- 1. Fetch User Role & Mentors ---
  useEffect(() => {
    // Check user role (using AsyncStorage for native)
    const initialize = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          setUserRole(userData.role);
        } else {
          setUserRole(null);
        }
      } catch (e) {
        console.error("Failed to parse user data from AsyncStorage", e);
        setUserRole(null);
      }
    };
    
    // Fetch mentors
    const fetchApprovedMentors = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        const response = await fetch("https://placemate-ru7v.onrender.com/api/mentors/approved");
        if (!response.ok) throw new Error('Network response was not ok');
        const data = await response.json();
        setMentors(data);
        setFilteredMentors(data);
      } catch (error) {
        console.error("Failed to fetch mentors:", error);
        setFetchError("Could not load mentors. Please check your connection.");
      } finally {
        setIsLoading(false);
      }
    };
    
    initialize();
    fetchApprovedMentors();
  }, []);

  // --- 2. Handle Search Logic ---
  useEffect(() => {
    const results = mentors.filter(mentor =>
      (mentor.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mentor.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mentor.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (mentor.expertise || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredMentors(results);
  }, [searchTerm, mentors]);

  // --- 3. Navigation ---
  const viewProfile = (mentorId) => {
    // Navigate to the dynamic mentor profile page: /mentorconnect/[id]
    router.push(`/mentorconnect/${mentorId}`);
  };
  
  // --- 4. Render Content ---
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.infoContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.infoText}>Loading mentors...</Text>
        </View>
      );
    }
    if (fetchError) {
      return <Text style={styles.errorText}>{fetchError}</Text>;
    }
    if (filteredMentors.length === 0 && !isLoading) {
      return <Text style={styles.infoText}>No mentors found matching your criteria.</Text>;
    }
    
    return (
      <View style={styles.mentorList}>
        {filteredMentors.map((mentor) => (
          // Use Pressable for the clickable list item
          <Pressable 
            key={mentor._id} 
            style={styles.mentorItem} 
            onPress={() => viewProfile(mentor._id)}
          >
            <Image
              source={{ uri: mentor.profilePic || 'https://via.placeholder.com/150' }}
              style={styles.itemAvatar}
            />
            <View style={styles.itemContent}>
              <Text style={styles.itemName}>{mentor.fullName}</Text>
              <Text style={styles.itemTitle}>{mentor.jobTitle} at {mentor.company}</Text>
              <Text style={styles.itemExpertise} numberOfLines={1}>
                Expertise: {mentor.expertise || "Not specified"}
              </Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" style={styles.itemChevron} />
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.pageContainer}>
      <View style={styles.headerContainer}>
        {/* Group back button and title */}
        <View style={styles.headerLeft}>
          <Link href="/home" asChild>
            <Pressable style={styles.backButton} title="Back to Home">
              <ArrowLeft size={24} color="#4f46e5" />
            </Pressable>
          </Link>
          <Text style={styles.headerTitle}>Find a Mentor</Text>
        </View>

        {/* My Bookings Button (Visible only to 'user') */}
        {userRole === 'user' && (
          <Pressable
            onPress={() => router.push('/my-bookings')}
            style={styles.myBookingsButton}
          >
            <Calendar size={18} color="#4338ca" />
            <Text style={styles.myBookingsButtonText}>My Bookings</Text>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        <View style={styles.searchContainer}>
          <View style={styles.searchIcon}>
            <Search size={20} color="#9ca3af" />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, company, or expertise..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            placeholderTextColor="#9ca3af"
          />
        </View>

        <View style={styles.mentorListContainer}>
          {renderContent()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- Converted StyleSheet ---
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f9fafe',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
   //paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 16, // Pushes header down on Android
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  // My Bookings Button
  myBookingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#eef2ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  myBookingsButtonText: {
    color: '#4338ca',
    fontWeight: '600',
    fontSize: 14,
  },
  mainContent: {
    padding: 24,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 32,
    alignSelf: 'center',
    width: '100%',
    maxWidth: 600,
  },
  searchIcon: {
    position: 'absolute',
    left: 14,
    top: '50%',
    transform: [{ translateY: -10 }],
    zIndex: 1,
  },
  searchInput: {
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 14,
    paddingHorizontal: 14,
    paddingLeft: 44, // Space for the icon
    borderRadius: 12,
    fontSize: 16,
    color: '#111827',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mentorListContainer: {
    // Container for the list section
  },
  mentorList: {
    flexDirection: 'column',
    gap: 16,
  },
  mentorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  itemAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: 'cover',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    overflow: 'hidden',
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  itemTitle: {
    fontSize: 15,
    color: '#4f46e5',
    marginVertical: 4,
    fontWeight: '500',
  },
  itemExpertise: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  itemChevron: {
    flexShrink: 0,
    marginLeft: 16,
  },
  infoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  infoText: {
    textAlign: 'center',
    color: '#6b7280',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    textAlign: 'center',
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500',
    paddingVertical: 48,
  },
});
