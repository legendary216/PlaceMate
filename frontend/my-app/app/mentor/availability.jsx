import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, Loader2, Plus, Trash2, Clock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';

// Helper constants (Unchanged)
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => { // 30-min intervals
  const totalMinutes = i * 30;
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});

export default function SetAvailability() {
  const router = useRouter();
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch the mentor's currently saved slots
  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoading(true);
      const token = await AsyncStorage.getItem("token");
      try {
        const res = await fetch("https://placemate-ru7v.onrender.com/api/mentors/my-availability", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Could not load availability.");
        const data = await res.json();
        setSlots(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlots();
  }, []);

  // 2. Functions to manage the 'slots' array state
  const addSlot = () => {
    setSlots([...slots, { day: 'Monday', startTime: '09:00', endTime: '10:00' }]);
  };

  const removeSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  };

  // 3. Send the updated array to the backend
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    const token = await AsyncStorage.getItem("token");
    try {
      const res = await fetch("https://placemate-ru7v.onrender.com/api/mentors/my-availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        // Send the complete array of slots
        body: JSON.stringify({ availabilitySlots: slots })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save.");
      }
      
      // Use React Native Alert
      Alert.alert("Success", "Availability saved!");
      router.back(); // Go back to the mentor dashboard
      
    } catch (err) {
      setError(err.message);
      // Show error alert as well
      Alert.alert("Error", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Render the UI
  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.infoContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.infoText}>Loading...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.slotsList}>
        {slots.map((slot, index) => (
          <View key={index} style={styles.slotCard}>
            <View style={styles.slotInputs}>
              {/* Day Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Day</Text>
                <View style={styles.pickerWrapper}>
                    <Picker 
                      selectedValue={slot.day} 
                      onValueChange={(value) => updateSlot(index, 'day', value)}
                      style={styles.formPicker}
                    >
                      {daysOfWeek.map(day => <Picker.Item key={day} label={day} value={day} />)}
                    </Picker>
                </View>
              </View>

              {/* Start Time Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>From</Text>
                <View style={styles.pickerWrapper}>
                    <Picker 
                      selectedValue={slot.startTime} 
                      onValueChange={(value) => updateSlot(index, 'startTime', value)}
                      style={styles.formPicker}
                    >
                      {timeSlots.map(time => <Picker.Item key={time} label={time} value={time} />)}
                    </Picker>
                </View>
              </View>

              {/* End Time Picker */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>To</Text>
                <View style={styles.pickerWrapper}>
                    <Picker 
                      selectedValue={slot.endTime} 
                      onValueChange={(value) => updateSlot(index, 'endTime', value)}
                      style={styles.formPicker}
                    >
                      {timeSlots.map(time => <Picker.Item key={time} label={time} value={time} />)}
                    </Picker>
                </View>
              </View>
            </View>
            
            <Pressable onPress={() => removeSlot(index)} style={styles.deleteBtn} title="Remove slot">
              <Trash2 size={18} color="#991b1b" />
            </Pressable>
          </View>
        ))}
        
        {slots.length === 0 && !isLoading && (
          <View style={[styles.infoContainer, styles.emptyState]}>
            <Clock size={30} color="#6b7280" style={{ marginBottom: 16 }}/>
            <Text style={styles.emptyText}>You have no availability slots. Add one to get started.</Text>
          </View>
        )}
        
        <Pressable onPress={addSlot} style={styles.addBtn}>
          <Plus size={18} color="#4f46e5" />
          <Text style={styles.addBtnText}>Add Time Slot</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.pageContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Pressable onPress={() => router.back()} style={styles.backButton} title="Back to Dashboard">
            <ArrowLeft size={24} color="#4f46e5" />
          </Pressable>
          <Text style={styles.headerTitle}>Set Your Availability</Text>
        </View>
        <Pressable onPress={handleSave} style={styles.saveBtn} disabled={isSaving}>
          {isSaving ? 
            <ActivityIndicator size="small" color="#fff" /> 
            : <Text style={styles.saveBtnText}>Save Changes</Text>
          }
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {error && <Text style={styles.errorText}>{error}</Text>}
        {renderContent()}
      </ScrollView>
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
    flexShrink: 1,
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
    flexShrink: 1,
  },
  mainContent: {
    padding: 24,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  slotsList: {
    flexDirection: 'column',
    gap: 16,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'flex-start', // Align to start to manage height better
    gap: 16,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 16,
  },
  slotInputs: {
    flex: 1,
    gap: 16,
  },
  inputGroup: {
    flexDirection: 'column',
    gap: 8,
    marginBottom: 8,
  },
  inputLabel: {
    fontWeight: '500',
    fontSize: 14,
    color: '#374151',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
    height: 48,
    overflow: 'hidden',
  },
  formPicker: {
    width: '100%',
    height: 48,
    color: '#111827',
  },
  deleteBtn: {
    backgroundColor: '#fee2e2',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 26, // Align with the top of the pickers
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#eef2ff',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  addBtnText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 16,
  },
  errorText: {
    color: '#ef4444',
    fontWeight: '500',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  infoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  infoText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 16,
  },
  emptyState: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
});
