import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  StatusBar
} from 'react-native';
import { ArrowLeft, Loader2, Calendar, Clock, Send, AlertTriangle } from 'lucide-react-native'; // Native icons
import { useRouter, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function BookSession() {
  const router = useRouter();
  // id is the mentorId from the URL slug
  const { id: mentorId } = useLocalSearchParams(); 

  const [availableSlots, setAvailableSlots] = useState([]);
  const [groupedSlots, setGroupedSlots] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  useEffect(() => {
    if (!mentorId) return;

    const fetchAvailableSlots = async () => {
      setIsLoading(true);
      setFetchError(null);
      const token = await AsyncStorage.getItem("token"); // Use AsyncStorage

      try {
        const res = await fetch(`https://placemate-ru7v.onrender.com/api/bookings/available/${mentorId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Could not load available slots.");
        }
        const data = await res.json();
        setAvailableSlots(data);
        groupSlotsByDate(data);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [mentorId]);

  const groupSlotsByDate = (slots) => {
    const groups = {};
    slots.forEach(slot => {
      // Use dayjs for formatting the date header
      const dateStr = dayjs(slot.startTime).format('dddd, MMMM D');
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(slot);
    });
    setGroupedSlots(groups);
  };

  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setBookingError(null);
  };

  // --- Handle Confirm Booking Request ---
  const handleConfirmBooking = async () => {
    if (!selectedSlot) {
        setBookingError("Please select an available time slot first.");
        return;
    }

    setIsBooking(true);
    setBookingError(null);
    const token = await AsyncStorage.getItem("token"); // Use AsyncStorage

    try {
      const res = await fetch(`https://placemate-ru7v.onrender.com/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          mentorId: mentorId,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to send booking request.");
      }
      // Request successful! Show the "Request Sent" modal.
      setShowSuccessModal(true);
      
      // Optionally remove the booked slot from the list locally
      setGroupedSlots(prevGroups => {
          const newGroups = { ...prevGroups };
          // Logic to find and remove the booked slot goes here if needed
          return newGroups;
      });

    } catch (err) {
      setBookingError(err.message);
    } finally {
      setIsBooking(false);
    }
  };

  const renderSlots = () => {
    if (isLoading) {
      return (
        <View style={styles.infoContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.infoText}>Loading available times...</Text>
        </View>
      );
    }
    if (fetchError) {
      return (
        <View style={styles.infoContainer}>
          <AlertTriangle size={20} color="#ef4444" style={{ marginBottom: 8 }}/>
          <Text style={styles.errorText}>{fetchError}</Text>
        </View>
      );
    }
    if (Object.keys(groupedSlots).length === 0) {
      return <Text style={styles.infoText}>No available slots found for the next 7 days.</Text>;
    }

    return (
      <View>
        {Object.entries(groupedSlots).map(([date, slotsOnDate]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={styles.dateHeader}>{date}</Text>
            <View style={styles.slotsGrid}>
              {slotsOnDate.map((slot, index) => (
                <Pressable
                  key={index}
                  style={[
                    styles.slotButton,
                    selectedSlot?.startTime === slot.startTime && styles.slotButtonSelected
                  ]}
                  onPress={() => handleSelectSlot(slot)}
                >
                  <Text style={[
                      styles.slotButtonText,
                      selectedSlot?.startTime === slot.startTime && styles.slotButtonTextSelected
                  ]}>
                    {dayjs(slot.startTime).format('h:mm A')}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.pageContainer}>
      <View style={styles.headerContainer}>
        <Pressable onPress={() => router.back()} style={styles.backButton} title="Back to Profile">
          <ArrowLeft size={24} color="#4f46e5" />
        </Pressable>
        <Text style={styles.headerTitle}>Book Session</Text>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {renderSlots()}

        {selectedSlot && (
          <View style={styles.confirmationSection}>
            <Text style={styles.confirmTitle}>Request Session Time</Text>
            <Text style={styles.confirmDetails}>
              {dayjs(selectedSlot.startTime).format('dddd, MMMM D')}
            </Text>
            <Text style={styles.confirmDetailsTime}>
              {dayjs(selectedSlot.startTime).format('h:mm A')} - {dayjs(selectedSlot.endTime).format('h:mm A')}
            </Text>
            
            {bookingError && <Text style={styles.errorText}><AlertTriangle size={16} /> {bookingError}</Text>}

            <Pressable
              style={styles.confirmButton}
              onPress={handleConfirmBooking}
              disabled={isBooking}
            >
              {isBooking ? 
                <ActivityIndicator size="small" color="white" /> 
                : <Send size={18} color="white" />
              }
              <Text style={styles.confirmButtonText}>
                {isBooking ? 'Sending...' : 'Send Request'}
              </Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* --- Success Modal --- */}
      <Modal
        visible={showSuccessModal}
        transparent
        animationType="fade"
        onRequestClose={() => router.back()}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Send size={48} color="#4f46e5" style={styles.modalIcon} />
            <Text style={styles.modalTitle}>Request Sent!</Text>
            <Text style={styles.modalSubtitle}>
              Your request has been sent to the mentor. You will be notified when they respond.
            </Text>
            <Pressable
              onPress={() => router.back()} // Redirect back to mentor profile or my-bookings
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorText: {
    color: '#ef4444',
    fontWeight: '500',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  dateGroup: {
    marginBottom: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  dateHeader: {
    backgroundColor: '#f9fafb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 20,
  },
  slotButton: {
    backgroundColor: '#eef2ff',
    borderWidth: 1,
    borderColor: '#c7d2fe',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  slotButtonText: {
    color: '#4338ca',
    fontWeight: '600',
    fontSize: 14,
  },
  slotButtonSelected: {
    backgroundColor: '#4f46e5',
    borderColor: '#4f46e5',
  },
  slotButtonTextSelected: {
    color: 'white',
  },
  // --- Confirmation Section ---
  confirmationSection: {
    marginTop: 32,
    padding: 24,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    alignItems: 'center',
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#1f2937',
  },
  confirmDetails: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 16,
  },
  confirmDetailsTime: {
    color: '#4f46e5',
    fontWeight: '500',
    marginBottom: 24,
    fontSize: 16,
  },
  confirmButton: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    width: '90%',
    maxWidth: 384,
    alignItems: 'center',
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: '#4b5563',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    backgroundColor: '#4f46e5',
    padding: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
    textAlign: 'center',
  },
});
