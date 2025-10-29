  import React, { useState, useEffect } from "react";
  import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    Modal,
    TextInput,
    Alert,
    Linking, // For opening meeting links (not used here, but good practice)
    Platform,
    StatusBar
  } from 'react-native';
  import { LogOut, Loader2, Check, X, Users, RefreshCw, Calendar, Clock, Link2, XCircle, ArrowLeft } from 'lucide-react-native';
  import { useRouter, Link } from "expo-router";
  import dayjs from 'dayjs';
  import AsyncStorage from "@react-native-async-storage/async-storage";

  export default function MentorHome() {
    // State for Connection Requests
    const [requests, setRequests] = useState([]);
    const [isLoadingRequests, setIsLoadingRequests] = useState(true);
    const [fetchRequestsError, setFetchRequestsError] = useState(null);

    // State for Schedule
    const [schedule, setSchedule] = useState([]);
    const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
    const [fetchScheduleError, setFetchScheduleError] = useState(null);

    // State for Pending Bookings
    const [pendingBookings, setPendingBookings] = useState([]);
    const [isLoadingPendingBookings, setIsLoadingPendingBookings] = useState(true);
    const [fetchPendingBookingsError, setFetchPendingBookingsError] = useState(null);
    const [showAcceptModal, setShowAcceptModal] = useState(false);
    const [currentBookingToAccept, setCurrentBookingToAccept] = useState(null); // Stores { _id, studentName, time }
    const [meetingLink, setMeetingLink] = useState('');
    const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);
    const [cancelLoading, setCancelLoading] = useState(null);

    const [user, setUser] = useState(null);
    const [actionLoading, setActionLoading] = useState(null); // For connection requests accept/reject
    const router = useRouter();

    // Fetch all initial data
    useEffect(() => {
      const initialize = async () => {
        const storedUserString = await AsyncStorage.getItem("user");
        if (storedUserString) {
          setUser(JSON.parse(storedUserString));
        }
        fetchAllData();
      };
      initialize();
    }, []);

    const fetchAllData = () => {
      fetchRequests();
      fetchSchedule();
      fetchPendingBookings();
    };

    // --- Fetch Connection Requests ---
    const fetchRequests = async () => {
      setIsLoadingRequests(true);
      setFetchRequestsError(null);
      const token = await AsyncStorage.getItem("token");
      try {
        const res = await fetch("https://placemate-ru7v.onrender.com/api/connections/my-requests", { headers: { "Authorization": `Bearer ${token}` } });
        if (!res.ok) throw new Error("Could not fetch connection requests.");
        const data = await res.json();
        setRequests(data);
      } catch (err) { setFetchRequestsError(err.message); } finally { setIsLoadingRequests(false); }
    };

    // --- Fetch Confirmed Schedule ---
    const fetchSchedule = async () => {
      setIsLoadingSchedule(true);
      setFetchScheduleError(null);
      const token = await AsyncStorage.getItem("token");
      try {
        const res = await fetch("https://placemate-ru7v.onrender.com/api/bookings/my-schedule", { headers: { "Authorization": `Bearer ${token}` } });
        if (!res.ok) throw new Error("Could not fetch schedule.");
        const data = await res.json();
        setSchedule(data);
      } catch (err) { setFetchScheduleError(err.message); } finally { setIsLoadingSchedule(false); }
    };

    // --- Fetch Pending Booking Requests ---
    const fetchPendingBookings = async () => {
      setIsLoadingPendingBookings(true);
      setFetchPendingBookingsError(null);
      const token = await AsyncStorage.getItem("token");
      try {
        const res = await fetch("https://placemate-ru7v.onrender.com/api/bookings/my-pending-requests", { headers: { "Authorization": `Bearer ${token}` } });
        if (!res.ok) throw new Error("Could not fetch pending booking requests.");
        const data = await res.json();
        setPendingBookings(data);
      } catch (err) { setFetchPendingBookingsError(err.message); } finally { setIsLoadingPendingBookings(false); }
    };

    // --- Handle Connection Request Response ---
   const handleConnectionResponse = async (requestId, newStatus) => {
    // Set loading state to ID + Type BEFORE opening the alert
    setActionLoading({ id: requestId, type: newStatus }); 

    const token = await AsyncStorage.getItem("token");
    const verb = newStatus === 'accepted' ? 'accept' : 'reject'; // Fixes the UX bug from before

    Alert.alert(
        "Confirm Action",
        `Are you sure you want to ${verb} this connection request?`, // Corrected UX text
        [
            // Clear loading state if user cancels the confirmation
            { text: "Cancel", style: "cancel", onPress: () => setActionLoading(null) }, 
            {
                text: newStatus.charAt(0).toUpperCase() + newStatus.slice(1),
                style: newStatus === 'rejected' ? 'destructive' : 'default',
                onPress: async () => {
                    try {
                        const res = await fetch(`https://placemate-ru7v.onrender.com/api/connections/respond/${requestId}`, {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                            body: JSON.stringify({ status: newStatus })
                        });
                        if (!res.ok) throw new Error("Action failed.");
                        setRequests(prev => prev.filter(req => req._id !== requestId));
                        Alert.alert("Success", `Connection request ${newStatus}!`);
                    } catch (err) { 
                        Alert.alert("Error", err.message); 
                    } finally { 
                        setActionLoading(null); // Clear loading state after operation finishes/fails
                    }
                }
            }
        ]
    );
};
    // --- Open Accept Modal ---
    const handleAcceptBooking = (booking) => {
      setCurrentBookingToAccept({
        _id: booking._id,
        studentName: booking.student.name,
        time: dayjs(booking.startTime).format('ddd, MMM D, h:mm A')
      });
      setMeetingLink(''); // Clear previous link
      setShowAcceptModal(true);
    };

    // --- Submit Booking Confirmation ---
    const submitAcceptBooking = async () => {
      if (!meetingLink.trim() || !currentBookingToAccept) return;
      setIsConfirmingBooking(true);
      const token = await AsyncStorage.getItem("token");
      try {
        const res = await fetch(`https://placemate-ru7v.onrender.com/api/bookings/confirm/${currentBookingToAccept._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
          body: JSON.stringify({ meetingLink: meetingLink.trim() })
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to confirm booking.");
        }
        setShowAcceptModal(false);
        setCurrentBookingToAccept(null);
        Alert.alert("Success", "Booking confirmed and student notified!");
        fetchAllData(); // Refresh all lists
      } catch (err) {
        Alert.alert("Error", `Error: ${err.message}`);
      } finally {
        setIsConfirmingBooking(false);
      }
    };

    // --- Handle Booking Rejection ---
    const handleRejectBooking = async (bookingId) => {
      Alert.alert(
          "Confirm Rejection",
          "Are you sure you want to reject this booking request?",
          [
              { text: "Cancel", style: "cancel" },
              {
                  text: "Reject",
                  style: "destructive",
                  onPress: async () => {
                      setActionLoading(bookingId); // Show spinner on the specific item's button
                      const token = await AsyncStorage.getItem("token");
                      try {
                          const res = await fetch(`https://placemate-ru7v.onrender.com/api/bookings/reject/${bookingId}`, {
                              method: "PATCH",
                              headers: { "Authorization": `Bearer ${token}` }
                          });
                          if (!res.ok) throw new Error("Failed to reject booking.");
                          Alert.alert("Success", "Booking request rejected.");
                          fetchPendingBookings(); // Only refresh pending list
                      } catch (err) {
                          Alert.alert("Error", err.message);
                      } finally {
                          setActionLoading(null); // Clear spinner
                      }
                  }
              }
          ]
      );
    };

    const handleLogout = async () => {
      // Note: Logout logic should ideally be inside app/home.jsx or a service, 
      // but replicating functionality here for completeness.
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      router.replace("/");
    };


    const handleCancelByMentor = async (bookingId) => {
      Alert.alert(
          "Confirm Cancellation",
          "Are you sure you want to cancel this scheduled session?",
          [
              { text: "No", style: "cancel" },
              {
                  text: "Yes, Cancel",
                  style: "destructive",
                  onPress: async () => {
                      setCancelLoading(bookingId); // Show spinner on cancel button
                      const token = await AsyncStorage.getItem("token");
                      try {
                          const res = await fetch(`https://placemate-ru7v.onrender.com/api/bookings/cancel/mentor/${bookingId}`, {
                              method: "PATCH",
                              headers: { "Authorization": `Bearer ${token}` }
                          });
                          if (!res.ok) throw new Error("Failed to cancel booking.");
                          Alert.alert("Success", "Booking cancelled successfully.");
                          fetchSchedule(); // Refresh the schedule list
                      } catch (err) {
                          Alert.alert("Error", err.message);
                      } finally {
                          setCancelLoading(null); // Clear spinner
                      }
                  }
              }
          ]
      );
    };

    // --- Rendering Functions ---
    const renderRequests = () => {
      if (isLoadingRequests) { return <View style={styles.infoContainer}><ActivityIndicator size="small" color="#4f46e5" /><Text style={styles.infoText}>Loading requests...</Text></View>; }
      if (fetchRequestsError) { return <Text style={styles.errorText}>{fetchRequestsError}</Text>; }
      if (requests.length === 0) { return (<View style={[styles.infoContainer, styles.emptyState]}><Users size={40} color="#6b7280" /><Text style={styles.emptyTitle}>All Caught Up!</Text><Text style={styles.emptySubtitle}>You have no new connection requests.</Text></View>); }
      const isItemLoading = (id, type) => actionLoading && actionLoading.id === id && actionLoading.type === type;
      return (<View style={styles.itemList}>{requests.map(req => (
          <View key={req._id} style={[styles.listItem, styles.requestItem]}>
              <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{req.student.name}</Text>
                  <Text style={styles.itemEmail}>{req.student.email}</Text>
              </View>
              <View style={styles.itemActions}>
                <Pressable 
    style={styles.buttonReject} 
    onPress={() => handleConnectionResponse(req._id, 'rejected')} 
    disabled={isItemLoading(req._id, 'rejected')} // 👈 UPDATED CHECK
>
    {isItemLoading(req._id, 'rejected') // 👈 UPDATED CHECK
        ? <ActivityIndicator size="small" color="#991b1b" /> 
        : <X size={18} color="#991b1b" />}
</Pressable>

// Approve Button Check:
<Pressable 
    style={styles.buttonApprove} 
    onPress={() => handleConnectionResponse(req._id, 'accepted')} 
    disabled={isItemLoading(req._id, 'accepted')} // 👈 UPDATED CHECK
>
    {isItemLoading(req._id, 'accepted') // 👈 UPDATED CHECK
        ? <ActivityIndicator size="small" color="#166534" /> 
        : <Check size={18} color="#166534" />}
</Pressable>
              </View>
          </View>
      ))}</View>);
    };

    const renderSchedule = () => {
      if (isLoadingSchedule) { return <View style={styles.infoContainer}><ActivityIndicator size="small" color="#4f46e5" /><Text style={styles.infoText}>Loading schedule...</Text></View>; }
      if (fetchScheduleError) { return <Text style={styles.errorText}>{fetchScheduleError}</Text>; }
      if (schedule.length === 0) { return (<View style={[styles.infoContainer, styles.emptyState]}><Calendar size={40} color="#6b7280" /><Text style={styles.emptyTitle}>No Upcoming Sessions</Text><Text style={styles.emptySubtitle}>Your schedule is clear for now.</Text></View>); }
      
      return (<View style={styles.itemList}>{schedule.map(booking => (
          <View key={booking._id} style={[styles.listItem, styles.scheduleItem]}>
              <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{booking.student.name}</Text>
                  <Text style={styles.itemEmail}>{dayjs(booking.startTime).format('ddd, MMM D, YYYY')}</Text>
                  <Text style={styles.itemTime}><Clock size={14} color="#4f46e5" style={{marginRight: 4}}/>{dayjs(booking.startTime).format('h:mm A')} - {dayjs(booking.endTime).format('h:mm A')}</Text>
                  {booking.meetingLink && (
                      <Pressable onPress={() => Linking.openURL(booking.meetingLink)}>
                          <Text style={styles.itemMeetingLink}><Link2 size={14} color="#4f46e5" /> Join Meeting</Text>
                      </Pressable>
                  )}
              </View>
              <View style={styles.itemActions}>
                  <Pressable
                      style={styles.buttonCancelSchedule}
                      onPress={() => handleCancelByMentor(booking._id)}
                      disabled={cancelLoading === booking._id}
                      title="Cancel Session"
                  >
                      {cancelLoading === booking._id ? <ActivityIndicator size="small" color="#991b1b" /> : <XCircle size={18} color="#991b1b" />}
                  </Pressable>
              </View>
          </View>
      ))}</View>);
    };

    const renderPendingBookings = () => {
      if (isLoadingPendingBookings) { return <View style={styles.infoContainer}><ActivityIndicator size="small" color="#4f46e5" /><Text style={styles.infoText}>Loading booking requests...</Text></View>; }
      if (fetchPendingBookingsError) { return <Text style={styles.errorText}>{fetchPendingBookingsError}</Text>; }
      if (pendingBookings.length === 0) { return (<View style={[styles.infoContainer, styles.emptyState]}><Clock size={40} color="#6b7280" /><Text style={styles.emptyTitle}>No Pending Bookings</Text><Text style={styles.emptySubtitle}>You have no booking requests waiting for approval.</Text></View>); }
      
      return (<View style={styles.itemList}>{pendingBookings.map(booking => (
          <View key={booking._id} style={[styles.listItem, styles.requestItem]}>
              <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{booking.student.name}</Text>
                  <Text style={styles.itemEmail}>{dayjs(booking.startTime).format('ddd, MMM D, h:mm A')}</Text>
              </View>
              <View style={styles.itemActions}>
                  <Pressable
                      style={styles.buttonReject}
                      onPress={() => handleRejectBooking(booking._id)}
                      disabled={actionLoading === booking._id}
                      title="Reject Booking"
                  >
                      {actionLoading === booking._id ? <ActivityIndicator size="small" color="#991b1b" /> : <X size={18} color="#991b1b" />}
                  </Pressable>
                  <Pressable
                      style={styles.buttonApprove}
                      onPress={() => handleAcceptBooking(booking)} // Opens modal
                      disabled={actionLoading === booking._id}
                      title="Accept Booking"
                  >
                      <Check size={18} color="#166534" />
                  </Pressable>
              </View>
          </View>
      ))}</View>);
    };


    return (
      <SafeAreaView style={styles.pageContainer}>
        <View style={styles.headerContainer}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Mentor Dashboard</Text>
            {user && <Text style={styles.headerSubtitle}>Welcome back, {user.fullName}!</Text>}
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={() => router.push('/mentor/availability')} style={styles.iconButton} title="Set Availability">
                <Calendar size={20} color="#4f46e5" />
            </Pressable>
            <Pressable onPress={fetchAllData} style={styles.iconButton} title="Refresh Data">
                <RefreshCw size={20} color="#4f46e5" />
            </Pressable>
            <Pressable onPress={handleLogout} style={styles.iconButton} title="Logout">
                <LogOut size={20} color="#4f46e5" />
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.mainContent}>
          {/* Column 1: Connection Requests */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}> <Text style={styles.sectionTitle}>Connection Requests</Text> </View>
            {renderRequests()}
          </View>

          {/* Column 2: Pending Booking Requests */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}> <Text style={styles.sectionTitle}>Pending Booking Requests</Text> </View>
            {renderPendingBookings()}
          </View>

          {/* Column 3: Upcoming Schedule */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}> <Text style={styles.sectionTitle}>Upcoming Sessions</Text> </View>
            {renderSchedule()}
          </View>
        </ScrollView>

        {/* --- ACCEPT BOOKING MODAL --- */}
        <Modal
          visible={showAcceptModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAcceptModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalBox}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Confirm Booking Request</Text>
                <Pressable style={styles.modalCloseBtn} onPress={() => setShowAcceptModal(false)}>
                    <X size={20} color="#1f2937" />
                </Pressable>
              </View>
              <View style={styles.modalBody}>
                  <Text style={styles.modalBodyText}>
                    Accept request from <Text style={styles.modalBodyTextStrong}>{currentBookingToAccept?.studentName}</Text> for <Text style={styles.modalBodyTextStrong}>{currentBookingToAccept?.time}</Text>?
                  </Text>
                  <View style={styles.formGroup}>
                      <Text style={styles.formLabel}>Meeting Link (required)</Text>
                      <TextInput
                          style={styles.formInput}
                          keyboardType="url"
                          value={meetingLink}
                          onChangeText={setMeetingLink}
                          placeholder="https://meet.google.com/..."
                          placeholderTextColor="#9ca3af"
                          autoCapitalize="none"
                          required
                      />
                  </View>
              </View>
              <View style={styles.modalActions}>
                  <Pressable style={styles.buttonCancel} onPress={() => setShowAcceptModal(false)}>
                      <Text style={styles.buttonCancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                      style={styles.buttonConfirm}
                      onPress={submitAcceptBooking}
                      disabled={isConfirmingBooking || !meetingLink.trim()}
                  >
                      {isConfirmingBooking ? 
                          <ActivityIndicator size="small" color="#fff" /> 
                          : <Check size={18} color="#fff" />
                      }
                      <Text style={styles.buttonConfirmText}>{isConfirmingBooking ? 'Confirming...' : 'Confirm & Send Link'}</Text>
                  </Pressable>
              </View>
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
      justifyContent: 'space-between',
      alignItems: 'center',
     paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 16, // Pushes header down on Android
    paddingBottom: 16,
      paddingHorizontal: 24,
      backgroundColor: '#fff',
      borderBottomWidth: 1,
      borderBottomColor: '#e5e7eb',
    },
    headerLeft: {
      flexDirection: 'column',
      flexShrink: 1,
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: '700',
      color: '#111827',
    },
    headerSubtitle: {
      fontSize: 14,
      color: '#4b5563',
    },
    headerRight: {
      flexDirection: 'row',
      gap: 12,
    },
    iconButton: {
      padding: 8,
      backgroundColor: '#eef2ff',
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    mainContent: {
      padding: 24,
      maxWidth: 1200,
      alignSelf: 'center',
      width: '100%',
      flexDirection: 'row', // Use flex for column layout on large screens
      flexWrap: 'wrap',
      gap: 24,
    },
    section: {
      flexGrow: 1,
      flexBasis: 300, // Provides a base width for each column
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 20,
      fontWeight: '600',
      color: '#1f2937',
    },
    itemList: {
      gap: 12,
    },
    listItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: '#fff',
      borderWidth: 1,
      borderColor: '#e5e7eb',
      borderRadius: 12,
      padding: 16,
      flexWrap: 'wrap',
    },
    itemInfo: {
      flexGrow: 1,
      overflow: 'hidden',
    },
    itemName: {
      fontWeight: '600',
      color: '#1f2937',
      fontSize: 16,
    },
    itemEmail: {
      color: '#4b5563',
      marginTop: 4,
      fontSize: 14,
    },
    itemTime: {
      color: '#4f46e5',
      marginTop: 4,
      fontSize: 14,
      fontWeight: '500',
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemMeetingLink: {
      color: '#4f46e5',
      fontSize: 14,
      fontWeight: '500',
      marginTop: 4,
      flexDirection: 'row',
      alignItems: 'center',
    },
    itemActions: {
      flexDirection: 'row',
      gap: 12,
      marginLeft: 16,
      flexShrink: 0,
    },
    buttonReject: {
      backgroundColor: '#fee2e2',
      padding: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonApprove: {
      backgroundColor: '#dcfce7',
      padding: 10,
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    buttonCancelSchedule: {
      backgroundColor: '#fee2e2',
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
    },
    infoContainer: {
      paddingVertical: 32,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoText: {
      color: '#6b7280',
      fontSize: 14,
      marginTop: 8,
    },
    errorText: {
      color: '#ef4444',
      fontWeight: '500',
      fontSize: 14,
      padding: 16,
      textAlign: 'center',
    },
    emptyState: {
      padding: 32,
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
    },
    emptySubtitle: {
      color: '#6b7280',
      fontSize: 14,
      textAlign: 'center',
    },
    // --- Modal Styles ---
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    modalBox: {
      backgroundColor: '#fff',
      borderRadius: 12,
      padding: 24,
      width: '90%',
      maxWidth: 448,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '600',
    },
    modalCloseBtn: {
      backgroundColor: '#f3f4f6',
      borderRadius: 20,
      padding: 8,
    },
    modalBody: {
      marginBottom: 16,
    },
    modalBodyText: {
      color: '#4b5563',
      marginBottom: 16,
      fontSize: 15,
    },
    modalBodyTextStrong: {
      fontWeight: '700',
      color: '#1f2937',
    },
    formGroup: {
      marginBottom: 24,
    },
    formLabel: {
      fontWeight: '500',
      marginBottom: 6,
      fontSize: 14,
    },
    formInput: {
      borderWidth: 1,
      borderColor: '#d1d5db',
      borderRadius: 8,
      padding: 12,
      fontSize: 16,
      backgroundColor: '#fff',
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
    },
    buttonCancel: {
      backgroundColor: '#f3f4f6',
      borderWidth: 1,
      borderColor: '#d1d5db',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
    },
    buttonCancelText: {
      color: '#1f2937',
      fontWeight: '600',
    },
    buttonConfirm: {
      backgroundColor: '#4f46e5',
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    buttonConfirmText: {
      color: 'white',
      fontWeight: '600',
    },
  });
