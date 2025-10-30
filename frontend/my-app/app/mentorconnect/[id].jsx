import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Linking, // To open ID proof URL
  Platform, // 👈 CRITICAL: MUST BE IMPORTED
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Loader2, Briefcase, Brain, Clock, Award, Calendar, Send, CheckCircle, Hourglass, DollarSign, FileText } from 'lucide-react-native'; // Native icons
import { useRouter, useLocalSearchParams, Link } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Helper component for rendering detail cards
function DetailCard({ Icon, title, value }) {
  return (
    <View style={styles.detailCard}>
      <View style={styles.detailIcon}>
        <Icon size={20} color="#4f46e5" />
      </View>
      <View style={styles.detailTextContent}>
        <Text style={styles.detailTitle}>{title}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function MentorProfile() {
  const router = useRouter();
  // useLocalSearchParams is correct for reading the [id] slug
  const { id } = useLocalSearchParams(); 

  const [mentor, setMentor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [connectionStatus, setConnectionStatus] = useState('loading');
  const [isRequesting, setIsRequesting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null); // To prevent users from connecting to themselves

  useEffect(() => {
    if (!id) return; 

    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);
      setConnectionStatus('loading');
      
      const token = await AsyncStorage.getItem("token");
      const storedUserString = await AsyncStorage.getItem('user');
      const storedUser = storedUserString ? JSON.parse(storedUserString) : null;
      
      setUserRole(storedUser?.role);
      setCurrentUserId(storedUser?._id);

      try {
        // 1. Fetch mentor profile
        const profilePromise = fetch(`https://placemate-ru7v.onrender.com/api/mentors/${id}`);
        
        // 2. Fetch connection status (only if logged in as a 'user' and a token exists)
        let statusPromise = Promise.resolve(null);
        if (token && storedUser?.role === 'user' && storedUser?._id !== id) {
          statusPromise = fetch(`https://placemate-ru7v.onrender.com/api/connections/status/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
        }

        const [profileRes, statusRes] = await Promise.all([profilePromise, statusPromise]);

        // Process profile response
        if (profileRes.status === 404) throw new Error('Mentor not found.');
        if (!profileRes.ok) throw new Error('Could not load mentor profile.');
        const profileData = await profileRes.json();
        setMentor(profileData);

        // Process status response (if applicable)
        if (statusRes) {
          if (!statusRes.ok) { 
            console.error("Failed to fetch connection status:", statusRes.statusText);
            setConnectionStatus('none');
          } else {
            const statusData = await statusRes.json();
            setConnectionStatus(statusData.status || 'none');
          }
        } else {
          setConnectionStatus('none');
        }

      } catch (error) {
        console.error("Failed to fetch data:", error);
        setFetchError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Makes the actual API call
  const handleRequestConnection = async () => {
    const token = await AsyncStorage.getItem("token");
    if (!token || userRole !== 'user') {
      Alert.alert("Login Required", "Please log in as a student to send a connection request.");
      router.push('/');
      return;
    }

    setIsRequesting(true);
    try {
      const res = await fetch("https://placemate-ru7v.onrender.com/api/connections/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ mentorId: id }) 
      });

      const data = await res.json();
      
      let message = data.message || "Request sent!";
      
      if (!res.ok) {
        if (res.status === 400) {
           message = data.message || "Request already sent or connection exists.";
        } else {
           throw new Error(data.message || "Failed to send request.");
        }
      }
      
      Alert.alert("Status", message); 
      setConnectionStatus('pending'); 
      
    } catch (err) {
      Alert.alert("Error", err.message);
      console.error(err);
    } finally {
      setIsRequesting(false);
    }
  };
  
  // Placeholder for booking
  const handleBookSession = () => {
    // This assumes you have a dynamic booking page named 'book' inside mentorconnect
    // The path would be /mentorconnect/book/[id]
    router.push(`/mentorconnect/book/${id}`); 
  };

  const renderActionButton = () => {
    // 1. If it's the mentor's own profile, show nothing or a message
    if (mentor && mentor._id === currentUserId) {
        return <Text style={styles.selfProfileText}>This is your mentor profile.</Text>;
    }
    
    // 2. If not a user, show nothing
    if (userRole !== 'user') {
        return null; 
    }

    // 3. Conditional Button Logic for 'user' role
    if (connectionStatus === 'loading') {
      return (
        <View style={[styles.connectButton, styles.disabledButton]}>
          <ActivityIndicator size="small" color="#eef2ff" style={{ marginRight: 8 }} />
          <Text style={styles.disabledButtonText}>Checking Status...</Text>
        </View>
      );
    } else if (connectionStatus === 'none' || connectionStatus === 'rejected') {
      return (
        <Pressable 
          style={styles.connectButton} 
          onPress={handleRequestConnection} 
          disabled={isRequesting}
        >
          {isRequesting ? 
            <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} /> 
            : <Send size={18} color="white" style={{ marginRight: 8 }} />
          }
          <Text style={styles.connectButtonText}>Request Connection</Text>
        </Pressable>
      );
    } else if (connectionStatus === 'pending') {
      return (
        <View style={[styles.connectButton, styles.disabledButton]}>
          <Hourglass size={18} color="#eef2ff" style={{ marginRight: 8 }} />
          <Text style={styles.disabledButtonText}>Request Sent</Text>
        </View>
      );
    } else if (connectionStatus === 'accepted') {
      return (
        <Pressable 
          style={[styles.connectButton, styles.bookButton]} 
          onPress={handleBookSession}
        >
          <Calendar size={18} color="white" style={{ marginRight: 8 }} />
          <Text style={styles.connectButtonText}>Book a Session</Text>
        </Pressable>
      );
    }
    return null;
  };
  
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.infoContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.infoText}>Loading profile...</Text>
        </View>
      );
    }
    if (fetchError) {
      return <Text style={styles.errorText}>{fetchError}</Text>;
    }
    if (!mentor) {
      return <Text style={styles.infoText}>Mentor data is unavailable.</Text>;
    }

    return (
      <View style={styles.profileContent}>
        <Image 
          source={{ uri: mentor.profilePic || 'https://via.placeholder.com/150' }}
          style={styles.profileAvatar}
        />
        <Text style={styles.profileName}>{mentor.fullName}</Text>
        <Text style={styles.profileTitle}>{mentor.jobTitle} at {mentor.company}</Text>
        
        {renderActionButton()}
        
        <View style={styles.profileDivider} />
        
        {/* --- Availability Section --- */}
        <Text style={styles.sectionTitle}>Availability</Text>
        <View style={styles.availabilityList}>
          {mentor.availabilitySlots && mentor.availabilitySlots.length > 0 ? (
            mentor.availabilitySlots.map((slot, index) => (
              <View key={index} style={styles.availabilitySlot}>
                <Text style={styles.slotDay}>{slot.day}</Text>
                <Text style={styles.slotTime}>{slot.startTime} - {slot.endTime}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noSlotsText}>Availability not set by mentor.</Text>
          )}
        </View>

        <View style={styles.profileDivider} />

        <Text style={styles.sectionTitle}>Details</Text>
        <View style={styles.detailsGrid}>
          <DetailCard Icon={Briefcase} title="Experience" value={`${mentor.experience || 'N/A'} years`} />
          <DetailCard Icon={Award} title="Qualification" value={mentor.qualification || 'N/A'} />
          <DetailCard Icon={Brain} title="Areas of Expertise" value={mentor.expertise || 'N/A'} />
          <DetailCard
            Icon={DollarSign}
            title="Session Fee"
            value={mentor.fees > 0 ? `₹${mentor.fees}` : 'Free'}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.pageContainer}>
      <View style={styles.headerContainer}>
        <Pressable onPress={() => router.back()} style={styles.backButton} title="Back to list">
          <ArrowLeft size={24} color="#4f46e5" />
        </Pressable>
        <Text style={styles.headerTitle}>Mentor Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

// Helper component (unchanged)
// Helper component for rendering detail cards (React Native)
// Note: This needs to be outside the main component scope or defined here.
// We define it inside the file scope for simplicity.


// --- StyleSheet ---
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f9fafe',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 16, // Pushes header down on Android
    paddingBottom: 16,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  backButton: {
    padding: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 20,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  mainContent: {
    padding: 24,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  infoContainer: {
    paddingVertical: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: '#6b7280',
    fontSize: 18,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '500',
    paddingVertical: 64,
    textAlign: 'center',
  },
  profileContent: {
    alignItems: 'center',
    width: '100%',
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    resizeMode: 'cover',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
  },
  profileName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    textAlign: 'center',
  },
  profileTitle: {
    fontSize: 18,
    color: '#4f46e5',
    marginBottom: 24,
    fontWeight: '500',
    textAlign: 'center',
  },
  profileDivider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 32,
    width: '100%',
  },
  // --- Button Styles ---
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 24,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  connectButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  disabledButton: {
    backgroundColor: '#a5b4fc',
    shadowColor: 'transparent',
    elevation: 0,
  },
  disabledButtonText: {
    color: '#eef2ff',
    fontWeight: '600',
    fontSize: 16,
  },
  bookButton: {
    backgroundColor: '#10b981', // Green for booking
  },
  selfProfileText: {
    color: '#d97706',
    fontWeight: '600',
    fontSize: 16,
    marginTop: 24,
    padding: 8,
    backgroundColor: '#fffbeb',
    borderRadius: 8,
  },
  // --- Details Grid Styles ---
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
    width: '100%',
    textAlign: 'left',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  detailCard: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    width: '100%',
    minWidth: '48%',
    flexGrow: 1,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eef2ff',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  detailTextContent: {
    flexDirection: 'column',
    flex: 1,
  },
  detailTitle: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
    lineHeight: 22,
  },
  // --- Availability Styles ---
  availabilityList: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 24,
  },
  availabilitySlot: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  slotDay: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: 16,
  },
  slotTime: {
    fontWeight: '500',
    color: '#4b5563',
    fontSize: 16,
  },
  noSlotsText: {
    color: '#6b7280',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
});
