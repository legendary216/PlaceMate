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
import { X } from 'lucide-react-native';

// Accepts: isVisible, onClose, onSubmit, companyToEdit, styles
function EditCompanyModal({ isVisible, onClose, onSubmit, companyToEdit, styles }) {
  // --- State for editing ---
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [editCompanyName, setEditCompanyName] = useState('');
  const [editCompanyDesc, setEditCompanyDesc] = useState('');
  const [editCompanyWebsite, setEditCompanyWebsite] = useState('');
  const [editCompanyRoles, setEditCompanyRoles] = useState('');
  const [editCompanyLocation, setEditCompanyLocation] = useState('');

  // --- Populate form when companyToEdit or isVisible changes ---
  useEffect(() => {
    if (isVisible && companyToEdit) {
      setEditCompanyName(companyToEdit.name || '');
      setEditCompanyDesc(companyToEdit.description || '');
      setEditCompanyWebsite(companyToEdit.website || '');
      setEditCompanyRoles(companyToEdit.rolesOffered ? companyToEdit.rolesOffered.join(', ') : '');
      setEditCompanyLocation(companyToEdit.location || '');
      setModalError('');
      setModalLoading(false);
    } else if (!isVisible) {
      // Optional: Clear fields when modal is hidden (might not be needed if parent manages companyToEdit correctly)
      setEditCompanyName('');
      setEditCompanyDesc('');
      setEditCompanyWebsite('');
      setEditCompanyRoles('');
      setEditCompanyLocation('');
    }
  }, [isVisible, companyToEdit]);

  const handleInternalSubmit = async () => {
     if (!editCompanyName.trim()) {
        setModalError("Company Name is required.");
        return;
    }
    setModalLoading(true);
    setModalError('');
    try {
      const rolesArray = editCompanyRoles.split(',').map(role => role.trim()).filter(role => role);
      // Call the onSubmit function passed from the parent
      await onSubmit(companyToEdit._id, { // Pass ID and updated data
        name: editCompanyName,
        description: editCompanyDesc,
        website: editCompanyWebsite,
        rolesOffered: rolesArray,
        location: editCompanyLocation,
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
            {/* Use companyToEdit safely with optional chaining */}
            <Text style={styles.modalTitle}>Edit Company: {companyToEdit?.name}</Text>
            <Pressable style={styles.modalCloseBtn} onPress={onClose}><X size={20} /></Pressable>
          </View>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.formGrid}>
              {/* Use edit* state variables */}
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Company Name *</Text> <TextInput style={styles.formInput} value={editCompanyName} onChangeText={setEditCompanyName} required /> </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Website</Text> <TextInput style={styles.formInput} value={editCompanyWebsite} onChangeText={setEditCompanyWebsite} placeholder="https://..." keyboardType="url" /> </View>
             <View style={styles.formGroup}> <Text style={styles.formLabel}>Description</Text> <TextInput style={[styles.formInput, styles.formTextarea]} value={editCompanyDesc} onChangeText={setEditCompanyDesc} multiline numberOfLines={3} /> </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Location</Text> <TextInput style={styles.formInput} value={editCompanyLocation} onChangeText={setEditCompanyLocation} /> </View>
              <View style={styles.formGroup}> <Text style={styles.formLabel}>Roles Offered (comma-separated)</Text> <TextInput style={styles.formInput} value={editCompanyRoles} onChangeText={setEditCompanyRoles} placeholder="e.g., SDE, Analyst, Manager" /> </View>
            </View>
            {modalError && <Text style={styles.modalError}>{modalError}</Text>}
          </ScrollView>
          <View style={styles.modalActions}>
            <Pressable style={styles.buttonCancel} onPress={onClose}><Text style={styles.buttonCancelText}>Cancel</Text></Pressable>
            <Pressable style={styles.buttonConfirm} onPress={handleInternalSubmit} disabled={modalLoading}>
              {modalLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonConfirmText}>Save Changes</Text>}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default EditCompanyModal;