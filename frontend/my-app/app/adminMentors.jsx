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
  Image,
  Alert,
  Linking,
} from 'react-native';
import { ArrowLeft, Check, X, Loader2, FileText, AlertTriangle } from 'lucide-react-native';
import { useRouter, Link } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AdminMentors() {
  const [pendingMentors, setPendingMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();

  // Selected Mentor is the state that crashes the app if null
  const [selectedMentor, setSelectedMentor] = useState(null); 
  const [actionLoading, setActionLoading] = useState(null);

  useEffect(() => {
    const initialize = async () => {
      try {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          
          if (userData.role === 'admin') {
            setUser(userData);
            fetchPendingMentors();
          } else {
            setIsLoading(false);
            setFetchError("Access Denied. You must be an admin to view this page.");
          }
        } else {
          setIsLoading(false);
          setFetchError("Access Denied. Please log in as an admin.");
        }
      } catch (e) {
        console.error("Failed to parse user data from AsyncStorage", e);
        setIsLoading(false);
        setFetchError("Failed to load user data.");
      }
    };
    initialize();
  }, []);

  const fetchPendingMentors = async () => {
    setIsLoading(true);
    setFetchError(null);
    const token = await AsyncStorage.getItem('token');
    try {
      const response = await fetch("https://placemate-ru7v.onrender.com/api/admin/mentors/pending", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.status === 403) throw new Error('Access Denied. Admins only.');
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setPendingMentors(data);
    } catch (error) {
      console.error("Failed to fetch pending mentors:", error);
      setFetchError(error.message || "Could not load mentors.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = (mentorId, action) => {
    Alert.alert(
      "Confirm Action",
      `Are you sure you want to ${action} this mentor?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: action === 'reject' ? 'destructive' : 'default',
          onPress: async () => {
            setActionLoading(mentorId);
            const token = await AsyncStorage.getItem('token');
            const url = `https://placemate-ru7v.onrender.com/api/admin/mentors/${action}/${mentorId}`;
            
            try {
              const res = await fetch(url, {
                method: 'PATCH',
                headers: { "Authorization": `Bearer ${token}` }
              });

              if (res.ok) {
                Alert.alert("Success", `Mentor ${action}ed successfully!`);
                setPendingMentors(prevMentors => prevMentors.filter(m => m._id !== mentorId));
                if (selectedMentor && selectedMentor._id === mentorId) {
                  setSelectedMentor(null); 
                }
              } else {
                const errorData = await res.json();
                Alert.alert("Error", `Failed to ${action} mentor: ${errorData.message}`);
              }
            } catch (err) {
              Alert.alert("Server Error", "A server error occurred.");
              console.error(err);
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const renderMentorList = () => {
    if (pendingMentors.length === 0) {
      return (
        <View style={styles.infoContainer}>
          <Text style={styles.infoText}>No pending mentor applications.</Text>
        </View>
      );
    }

    return (
      <View style={styles.mentorList}>
        {pendingMentors.map(mentor => (
          <View key={mentor._id} style={styles.mentorItem}>
            <View style={styles.mentorInfo}>
              <Image 
                source={{ uri: mentor.profilePic || 'https://via.placeholder.com/150' }}
                style={styles.itemAvatar}
              />
              <View>
                <Text style={styles.itemName}>{mentor.fullName}</Text>
                <Text style={styles.itemDetail}>{mentor.jobTitle} at {mentor.company}</Text>
                <Text style={styles.itemDetailEmail}>{mentor.email}</Text>
              </View>
            </View>
            <View style={styles.itemActions}>
              <Pressable 
                style={styles.buttonView}
                onPress={() => setSelectedMentor(mentor)}
                disabled={actionLoading === mentor._id}
              >
                <Text style={styles.buttonViewText}>Details</Text>
              </Pressable>
              <Pressable 
                style={styles.buttonReject}
                onPress={() => handleAction(mentor._id, 'reject')}
                disabled={actionLoading === mentor._id}
              >
                {actionLoading === mentor._id ? 
                  <ActivityIndicator size="small" color="#991b1b" /> 
                  : <X size={18} color="#991b1b" />
                }
              </Pressable>
              <Pressable 
                style={styles.buttonApprove}
                onPress={() => handleAction(mentor._id, 'approve')}
                disabled={actionLoading === mentor._id}
              >
                {actionLoading === mentor._id ? 
                  <ActivityIndicator size="small" color="#166534" /> 
                  : <Check size={18} color="#166534" />
                }
              </Pressable>
            </View>
          </View>
        ))}
      </View>
    );
  };

  const renderContent = () => {
    if (isLoading) return (
        <View style={styles.infoContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.infoText}>Loading applications...</Text>
        </View>
    );
    if (fetchError) return (
        <View style={styles.infoContainer}>
            <AlertTriangle size={32} color="#ef4444" />
            <Text style={styles.errorText}>{fetchError}</Text>
        </View>
    );
    if (!user) return (
        <View style={styles.infoContainer}>
            <Text style={styles.errorText}>Access Denied. Please log in as an admin.</Text>
        </View>
    );
    
    return renderMentorList();
  };

  return (
    <SafeAreaView style={styles.pageContainer}>
      <View style={styles.headerContainer}>
        <Link href="/home" asChild>
            <Pressable style={styles.backButton} title="Back to Home">
                <ArrowLeft size={24} color="#4f46e5" />
            </Pressable>
        </Link>
        <Text style={styles.headerTitle}>Mentor Applications</Text>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {renderContent()}
      </ScrollView>

      {/* Details Modal */}
      <Modal
        visible={!!selectedMentor}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedMentor(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Mentor Details</Text>
              <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedMentor(null)}>
                <X size={20} color="#1f2937" />
              </Pressable>
            </View>
            
            <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
                {/* Use selectedMentor?. to safely access properties */}
                {selectedMentor && (
                    <View style={styles.detailGrid}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Profile Picture</Text>
                        <Image 
                            // Use optional chaining
                            source={{ uri: selectedMentor.profilePic || 'https://via.placeholder.com/150' }}
                            style={styles.detailAvatar}
                        />
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Full Name</Text>
                        <Text style={styles.detailValue}>{selectedMentor.fullName}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Email</Text>
                        <Text style={styles.detailValue}>{selectedMentor.email}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Phone</Text>
                        <Text style={styles.detailValue}>{selectedMentor.phone}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Job Title</Text>
                        <Text style={styles.detailValue}>{selectedMentor.jobTitle}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Company</Text>
                        <Text style={styles.detailValue}>{selectedMentor.company}</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Experience</Text>
                        <Text style={styles.detailValue}>{selectedMentor.experience} years</Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Qualification</Text>
                        <Text style={styles.detailValue}>{selectedMentor.qualification}</Text>
                      </View>
                      <View style={styles.detailItemFull}>
                        <Text style={styles.detailLabel}>Expertise</Text>
                        <Text style={styles.detailValue}>{selectedMentor.expertise}</Text>
                      </View>
                      {selectedMentor.availability && (
                          <View style={styles.detailItem}>
                            <Text style={styles.detailLabel}>Availability</Text>
                            <Text style={styles.detailValue}>{selectedMentor.availability} ({selectedMentor.hours} hrs/week)</Text>
                          </View>
                      )}
                      <View style={styles.detailItemFull}>
                        <Text style={styles.detailLabel}>ID Proof</Text>
                        <Pressable 
                            onPress={() => Linking.openURL(selectedMentor.idProof)}
                            style={styles.idProofLink}
                        >
                          <FileText size={16} color="#4f46e5" />
                          <Text style={styles.idProofLinkText}>View Uploaded ID</Text>
                        </Pressable>
                      </View>
                    </View>
                )}
            </ScrollView>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={[styles.buttonReject, styles.modalActionButton]}
                onPress={() => handleAction(selectedMentor?._id, 'reject')}
                disabled={actionLoading === selectedMentor?._id}
              >
                {actionLoading === selectedMentor?._id ? 
                  <ActivityIndicator size="small" color="#991b1b" /> 
                  : <><X size={18} color="#991b1b" /> <Text style={styles.buttonRejectText}>Reject</Text></>
                }
              </Pressable>
              <Pressable 
                style={[styles.buttonApprove, styles.modalActionButton]}
                onPress={() => handleAction(selectedMentor?._id, 'approve')}
                disabled={actionLoading === selectedMentor?._id}
              >
                {actionLoading === selectedMentor?._id ? 
                  <ActivityIndicator size="small" color="#166534" /> 
                  : <><Check size={18} color="#166534" /> <Text style={styles.buttonApproveText}>Approve</Text></>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  pageContainer: {
    flex: 1,
    backgroundColor: '#f9fafe',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  mainContent: {
    padding: 24,
  },
  mentorList: {
    gap: 16,
  },
  mentorItem: {
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
  mentorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexShrink: 1,
  },
  itemAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'cover',
  },
  itemName: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: 18,
  },
  itemDetail: {
    color: '#4b5563',
    fontSize: 14,
  },
  itemDetailEmail: {
    color: '#4f46e5',
    fontSize: 14,
    fontWeight: '500',
  },
  itemActions: {
    flexDirection: 'row',
    gap: 12,
    marginLeft: 'auto',
    flexShrink: 0,
    marginTop: 8,
  },
  buttonView: {
    backgroundColor: '#eef2ff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  buttonViewText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonReject: {
    backgroundColor: '#fee2e2',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonRejectText: {
    color: '#991b1b',
    fontWeight: '600',
    fontSize: 14,
  },
  buttonApprove: {
    backgroundColor: '#dcfce7',
    padding: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonApproveText: {
    color: '#166534',
    fontWeight: '600',
    fontSize: 14,
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
  },
  errorText: {
    color: '#ef4444',
    fontSize: 18,
    fontWeight: '500',
    marginTop: 16,
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
    width: '100%',
    maxWidth: 480,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
  detailItem: {
    width: '48%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  detailItemFull: {
    width: '100%',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#1f2937',
  },
  detailAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginTop: 4,
  },
  idProofLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  idProofLinkText: {
    color: '#4f46e5',
    fontWeight: '500',
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    justifyContent: 'space-between',
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
});
