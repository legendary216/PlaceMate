import React, { useState, useEffect } from 'react';
import {
  
  ScrollView,
  View,
  Text,
  Pressable,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking, // For opening meeting links
  Platform,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Loader2,
  Calendar,
  Clock,
  RefreshCw,
  Link2,
  Hourglass,
  Trash2,
  PackageX, // Used for empty state
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs'; // Make sure to run: npx expo install dayjs
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MyBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(null); // Tracks which booking is being cancelled

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setIsLoading(true);
    setFetchError(null);
    const token = await AsyncStorage.getItem('token');
    try {
      const res = await fetch(
        'https://placemate-ru7v.onrender.com/api/bookings/my-schedule-student',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Could not fetch bookings.');
      }
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelByStudent = async (bookingId, status) => {
    const confirmMessage =
      status === 'pending_mentor_approval'
        ? 'Are you sure you want to cancel this booking request?'
        : 'Are you sure you want to cancel this confirmed session?';

    // Use React Native Alert API
    Alert.alert('Confirm Cancellation', confirmMessage, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes, Cancel',
        style: 'destructive',
        onPress: async () => {
          setCancelLoading(bookingId);
          const token = await AsyncStorage.getItem('token');
          try {
            const res = await fetch(
              `https://placemate-ru7v.onrender.com/api/bookings/cancel/student/${bookingId}`,
              {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            if (!res.ok) throw new Error('Failed to cancel booking.');
            Alert.alert('Success', 'Booking cancelled successfully.');
            fetchBookings(); // Refresh the booking list
          } catch (err) {
            Alert.alert('Error', err.message);
          } finally {
            setCancelLoading(null);
          }
        },
      },
    ]);
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.infoContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.infoText}>Loading bookings...</Text>
        </View>
      );
    }

    if (fetchError) {
      return (
        <View style={styles.infoContainer}>
          <AlertTriangle size={40} color="#ef4444" />
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      );
    }

    if (bookings.length === 0) {
      return (
        <View style={[styles.infoContainer, styles.emptyState]}>
          <PackageX size={48} color="#6b7280" />
          <Text style={styles.emptyTitle}>No Sessions Found</Text>
          <Text style={styles.emptySubtitle}>
            You haven't booked any sessions yet.
          </Text>
          <Pressable
            style={styles.findMentorBtn}
            onPress={() => router.push('/mentorconnect')}
          >
            <Text style={styles.findMentorBtnText}>Find a Mentor</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={styles.itemList}>
        {bookings.map((booking) => (
          <View key={booking._id} style={styles.listItem}>
            <Image
              source={{
                uri:
                  booking.mentor.profilePic ||
                  'https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg',
              }}
              style={styles.itemAvatar}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{booking.mentor.fullName}</Text>
              <Text style={styles.itemDetail}>
                {booking.mentor.jobTitle} at {booking.mentor.company}
              </Text>
              <Text style={styles.itemDate}>
                {dayjs(booking.startTime).format('dddd, MMMM D, YYYY')}
              </Text>
              <Text style={styles.itemTime}>
                <Clock size={14} color="#4f46e5" />
                {' '}
                {dayjs(booking.startTime).format('h:mm A')} -{' '}
                {dayjs(booking.endTime).format('h:mm A')}
              </Text>

              {/* Status and Link rendering */}
              {booking.status === 'pending_mentor_approval' && (
                <Text style={styles.statusPending}>
                  <Hourglass size={14} color="#d97706" />
                  {' '}Pending Mentor Approval
                </Text>
              )}
              {booking.status === 'confirmed' && (
                <View style={styles.statusConfirmed}>
                  <Text style={{ fontWeight: '500', color: '#059669', marginBottom: 4 }}>
                    Status: Confirmed
                  </Text>
                  {booking.meetingLink ? (
                    <Pressable onPress={() => Linking.openURL(booking.meetingLink)}>
                      <Text style={styles.meetingLink}>
                        <Link2 size={14} color="#4f46e5" />
                        {' '}Join Meeting
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={styles.noLinkText}>
                      Mentor will provide meeting link.
                    </Text>
                  )}
                </View>
              )}
            </View>
            {(booking.status === 'pending_mentor_approval' ||
              booking.status === 'confirmed') && (
              <View style={styles.itemActions}>
                <Pressable
                  style={styles.buttonCancelBooking}
                  onPress={() => handleCancelByStudent(booking._id, booking.status)}
                  disabled={cancelLoading === booking._id}
                >
                  {cancelLoading === booking._id ? (
                    <ActivityIndicator size="small" color="#991b1b" />
                  ) : (
                    <Trash2 size={18} color="#991b1b" />
                  )}
                </Pressable>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.pageContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#4f46e5" />
          </Pressable>
          <Text style={styles.headerTitle}>My Upcoming Sessions</Text>
        </View>
        <Pressable onPress={fetchBookings} style={styles.iconButton}>
          <RefreshCw size={20} color="#4f46e5" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

// Converted StyleSheet
const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f9fafe',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 16, // Pushes header down on Android
    paddingBottom: 12,
    paddingHorizontal: 16,
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
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
  },
  iconButton: {
    padding: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 20,
  },
  mainContent: {
    padding: 16,
  },
  itemList: {
    gap: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  itemAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    flexShrink: 0,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontWeight: '600',
    fontSize: 18,
    color: '#1f2937',
    marginBottom: 4,
  },
  itemDetail: {
    color: '#4b5563',
    marginBottom: 8,
    fontSize: 14,
  },
  itemDate: {
    fontWeight: '500',
    color: '#374151',
    marginVertical: 4,
    fontSize: 15,
  },
  itemTime: {
    color: '#4f46e5',
    fontSize: 15,
    fontWeight: '500',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusPending: {
    fontSize: 14,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    color: '#d97706',
    fontWeight: '500',
  },
  statusConfirmed: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  meetingLink: {
    color: '#4f46e5',
    fontWeight: '500',
    marginTop: 4,
  },
  noLinkText: {
    fontSize: 13,
    color: '#6b7280',
    fontStyle: 'italic',
    marginTop: 4,
  },
  itemActions: {
    marginLeft: 'auto',
    paddingLeft: 16,
    flexShrink: 0,
  },
  buttonCancelBooking: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fee2e2',
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  infoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    minHeight: 300,
  },
  infoText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    textAlign: 'center',
    color: '#ef4444',
    fontWeight: '500',
    fontSize: 16,
    marginTop: 8,
  },
  emptyState: {
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
  },
  emptyTitle: {
    marginTop: 16,
    marginBottom: 8,
    fontWeight: '600',
    color: '#374151',
    fontSize: 18,
  },
  emptySubtitle: {
    marginBottom: 24,
    maxWidth: 300,
    color: '#6b7280',
    fontSize: 14,
    textAlign: 'center',
  },
  findMentorBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  findMentorBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 15,
  },
});