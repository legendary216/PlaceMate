import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { X } from 'lucide-react-native';

// Accepts:
// - isVisible: boolean
// - onClose: function
// - options: array of strings (e.g., daysOfWeek or timeSlots)
// - selectedValue: string (current value)
// - onSelectValue: function(newValue)
// - title: string (e.g., "Select Day")
// - styles: object (passed from parent)
function CustomPickerModal({ isVisible, onClose, options, selectedValue, onSelectValue, title, styles }) {

  const [tempSelectedValue, setTempSelectedValue] = useState(selectedValue);

  // Update temp value if the external selection changes while modal is open
  useEffect(() => {
    if (isVisible) {
      setTempSelectedValue(selectedValue);
    }
  }, [isVisible, selectedValue]);

  const handleSelectAndClose = () => {
    onSelectValue(tempSelectedValue); // Pass selected value back to parent
    onClose();                       // Close modal
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        {/* Use a slightly smaller box for pickers */}
        <View style={[styles.modalBox, styles.pickerModalBox]}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title || "Select Option"}</Text>
            <Pressable style={styles.modalCloseBtn} onPress={onClose}><X size={20} /></Pressable>
          </View>

          <ScrollView style={styles.pickerListScrollView}>
            {options.map(option => (
              <Pressable
                key={option}
                style={[
                  styles.pickerListItem,
                  tempSelectedValue === option && styles.pickerListItemSelected
                ]}
                onPress={() => setTempSelectedValue(option)}
              >
                <Text
                  style={[
                    styles.pickerListItemText,
                    tempSelectedValue === option && styles.pickerListItemTextSelected
                  ]}
                >
                  {option}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.modalActions}>
            <Pressable style={styles.buttonCancel} onPress={onClose}>
              <Text style={styles.buttonCancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.buttonConfirm} onPress={handleSelectAndClose}>
              <Text style={styles.buttonConfirmText}>Done</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default CustomPickerModal;

// Minimal Styles needed if not passed as props (or define globally)
// Example:
/*
const localStyles = StyleSheet.create({
  pickerModalBox: { maxWidth: 300, maxHeight: '70%' },
  pickerListScrollView: { marginVertical: 10 },
  pickerListItem: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  pickerListItemSelected: { backgroundColor: '#eef2ff' },
  pickerListItemText: { fontSize: 16, color: '#374151', textAlign: 'center' },
  pickerListItemTextSelected: { color: '#4f46e5', fontWeight: '600' },
  // ... also need modalOverlay, modalBox, modalHeader, modalTitle, modalCloseBtn, modalActions, buttonCancel, buttonConfirm styles
});
*/