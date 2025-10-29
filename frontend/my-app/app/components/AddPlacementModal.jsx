import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet, // Assuming styles are passed or defined here
} from 'react-native';
import { Picker } from '@react-native-picker/picker'; // Keep Picker here
import { X } from 'lucide-react-native';

// Accepts: isVisible, onClose, onSubmit, availableYears, defaultYear, styles
function AddPlacementModal({ isVisible, onClose, onSubmit, availableYears, defaultYear, styles }) {
  // --- State for adding placement ---
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [newPlacementEmail, setNewPlacementEmail] = useState('');
  const [newPlacementCompany, setNewPlacementCompany] = useState('');
  const [newPlacementYear, setNewPlacementYear] = useState(defaultYear);
  const [newPlacementPackage, setNewPlacementPackage] = useState('');

  // --- Reset form when modal becomes visible or defaultYear changes ---
  useEffect(() => {
    if (isVisible) {
      setNewPlacementEmail('');
      setNewPlacementCompany('');
      setNewPlacementYear(defaultYear); // Use the passed default year
      setNewPlacementPackage('');
      setModalError('');
      setModalLoading(false);
    }
  }, [isVisible, defaultYear]);

  const handleInternalSubmit = async () => {
    if (!newPlacementEmail.trim() || !newPlacementCompany.trim() || !newPlacementYear) {
        setModalError("Student Email, Company Name, and Year are required.");
        return;
    }
    // Basic email format check (optional but good)
    if (!/\S+@\S+\.\S+/.test(newPlacementEmail)) {
         setModalError("Please enter a valid student email address.");
         return;
    }

    setModalLoading(true);
    setModalError('');
    try {
      // Call the onSubmit function passed from the parent
      await onSubmit({
        studentEmail: newPlacementEmail,
        companyName: newPlacementCompany,
        year: newPlacementYear,
        packageLPA: newPlacementPackage || undefined, // Send undefined if empty
      });
      // Parent's onSubmit should handle closing on success
    } catch (err) {
      setModalError(err.message || 'An unexpected error occurred.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add Placement Record</Text>
            <Pressable style={styles.modalCloseBtn} onPress={onClose}><X size={20} /></Pressable>
          </View>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.formGrid}>
              {/* Use local state variables */}
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Student Email *</Text> <TextInput style={styles.formInput} value={newPlacementEmail} onChangeText={setNewPlacementEmail} required placeholder="student@example.com" keyboardType="email-address" autoCapitalize="none"/> </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Company Name *</Text> <TextInput style={styles.formInput} value={newPlacementCompany} onChangeText={setNewPlacementCompany} required placeholder="Enter exact company name" /> </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Placement Year *</Text>
                 {/* Keep Picker here, but remove wrapper if needed */}
                 {/* Assuming pickerWithoutWrapper style is defined/passed */}
                 <View style={styles.pickerWrapper}> {/* 👈 ADD WRAPPER BACK */}
               <Picker
                  selectedValue={newPlacementYear}
                  onValueChange={setNewPlacementYear}
                  style={styles.formPicker} // 👈 Just formPicker style
                  itemStyle={{ color: '#1f2937', fontSize: 16 }}
               >
                 {availableYears.map(year => ( <Picker.Item key={year} label={year} value={year} /> ))}
               </Picker>
             </View> {/* 👈 END WRAPPER */}
              </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Package (LPA)</Text> <TextInput style={styles.formInput} value={newPlacementPackage} onChangeText={setNewPlacementPackage} keyboardType="numeric" placeholder="e.g., 12.5" /> </View>
            </View>
            {modalError && <Text style={styles.modalError}>{modalError}</Text>}
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable style={styles.buttonCancel} onPress={onClose}><Text style={styles.buttonCancelText}>Cancel</Text></Pressable>
            <Pressable style={styles.buttonConfirm} onPress={handleInternalSubmit} disabled={modalLoading}>
              {modalLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonConfirmText}>Add Record</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default AddPlacementModal;