import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  ActivityIndicator,
  StyleSheet, // Import StyleSheet
} from 'react-native';
import { X } from 'lucide-react-native';

// Pass styles down if needed, or redefine them here. For simplicity, let's assume styles are passed or global.
// If styles are complex, redefine necessary ones here or pass the 'styles' object as a prop.
// For now, let's assume `modalStyles` are defined below or passed as a prop.

function AddCompanyModal({ isVisible, onClose, onSubmit, styles }) {
  // --- State moved from parent ---
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyDesc, setNewCompanyDesc] = useState('');
  const [newCompanyWebsite, setNewCompanyWebsite] = useState('');
  const [newCompanyRoles, setNewCompanyRoles] = useState('');
  const [newCompanyLocation, setNewCompanyLocation] = useState('');

  // --- Reset form when modal becomes visible ---
  useEffect(() => {
    if (isVisible) {
      setNewCompanyName('');
      setNewCompanyDesc('');
      setNewCompanyWebsite('');
      setNewCompanyRoles('');
      setNewCompanyLocation('');
      setModalError('');
      setModalLoading(false);
    }
  }, [isVisible]);

  const handleInternalSubmit = async () => {
    // Basic validation
     if (!newCompanyName.trim()) {
        setModalError("Company Name is required.");
        return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      const rolesArray = newCompanyRoles.split(',').map(role => role.trim()).filter(role => role);
      // Call the onSubmit function passed from the parent
      await onSubmit({
        name: newCompanyName,
        description: newCompanyDesc,
        website: newCompanyWebsite,
        rolesOffered: rolesArray,
        location: newCompanyLocation,
      });
      // Parent's onSubmit should handle closing on success
    } catch (err) {
      // If parent throws error, display it
      setModalError(err.message || 'An unexpected error occurred.');
    } finally {
      setModalLoading(false);
    }
  };

  // Close handler also resets state
  const handleClose = () => {
     onClose(); // Call parent's close function
  };


  return (
    <Modal visible={isVisible} transparent animationType="slide" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Add New Company</Text>
            <Pressable style={styles.modalCloseBtn} onPress={handleClose}><X size={20} /></Pressable>
          </View>
        <ScrollView style={styles.modalScrollView}>
            <View style={styles.formGrid}>
              {/* Use formGroup for ALL items now */}
              <View style={styles.formGroup}> 
                  <Text style={styles.formLabel}>Company Name *</Text> 
                  <TextInput style={styles.formInput} value={newCompanyName} onChangeText={setNewCompanyName} required /> 
              </View>
              <View style={styles.formGroup}> 
                  <Text style={styles.formLabel}>Website</Text> 
                  <TextInput style={styles.formInput} value={newCompanyWebsite} onChangeText={setNewCompanyWebsite} placeholder="https://..." keyboardType="url"  autoCapitalize="none"  autoCorrect={false} /> 
              </View>
              <View style={styles.formGroup}> {/* 👈 CHANGED from formGroupFull */}
                  <Text style={styles.formLabel}>Description</Text> 
                  <TextInput style={[styles.formInput, styles.formTextarea]} value={newCompanyDesc} onChangeText={setNewCompanyDesc} multiline numberOfLines={3} /> 
              </View>
              <View style={styles.formGroup}> 
                  <Text style={styles.formLabel}>Location</Text> 
                  <TextInput style={styles.formInput} value={newCompanyLocation} onChangeText={setNewCompanyLocation} /> 
              </View>
              <View style={styles.formGroup}> {/* 👈 CHANGED from formGroupFull */}
                  <Text style={styles.formLabel}>Roles Offered (comma-separated)</Text> 
                  <TextInput style={styles.formInput} value={newCompanyRoles} onChangeText={setNewCompanyRoles} placeholder="e.g., SDE, Analyst, Manager" /> 
              </View>
            </View>
            {modalError && <Text style={styles.modalError}>{modalError}</Text>}
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable style={styles.buttonCancel} onPress={handleClose}><Text style={styles.buttonCancelText}>Cancel</Text></Pressable>
            <Pressable style={styles.buttonConfirm} onPress={handleInternalSubmit} disabled={modalLoading}>
              {modalLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonConfirmText}>Add Company</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Optionally wrap with React.memo for further optimization if needed
export default AddCompanyModal;

// --- Minimal Styles needed if not passed as props ---
// If you don't pass the 'styles' prop, you'll need to copy the relevant
// modal, form, and button styles from CompanyAnalysis.js here.
// For example:
/*
const modalStyles = StyleSheet.create({
  modalOverlay: { ... },
  modalBox: { ... },
  // ... include all styles used by the modal JSX ...
});
*/