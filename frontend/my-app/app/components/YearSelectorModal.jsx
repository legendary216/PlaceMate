import React, { useState, useEffect,memo } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet, // Assuming styles are passed or defined here
} from 'react-native';
import { X } from 'lucide-react-native';

// Accepts: isVisible, onClose, onSelectYear, availableYears, currentSelectedYear, styles
function YearSelectorModal({ isVisible, onClose, onSelectYear, availableYears, currentSelectedYear, styles }) {
console.log("--- YearSelectorModal Rendering ---", isVisible);
  const [tempSelectedYear, setTempSelectedYear] = useState(currentSelectedYear);

  // Update temp year if the external selection changes while modal is open (or just initially)
  useEffect(() => {
    if (isVisible) {
      setTempSelectedYear(currentSelectedYear);
    }
  }, [isVisible, currentSelectedYear]);


  const handleSelectAndClose = () => {
    onSelectYear(tempSelectedYear); // Pass selected year back to parent
    onClose();                    // Close modal
  };

  return (
    <Modal visible={isVisible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalBox, styles.yearModalBox]}> {/* Use specific year modal styles */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Academic Year</Text>
            <Pressable style={styles.modalCloseBtn} onPress={onClose}><X size={20} /></Pressable>
          </View>

          <ScrollView style={styles.yearListScrollView}>
            {availableYears.map(year => (
              <Pressable
                key={year}
                style={[
                  styles.yearListItem,
                  tempSelectedYear === year && styles.yearListItemSelected
                ]}
                onPress={() => setTempSelectedYear(year)}
              >
                <Text
                  style={[
                    styles.yearListItemText,
                    tempSelectedYear === year && styles.yearListItemTextSelected
                  ]}
                >
                  {year}
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

export default memo(YearSelectorModal);