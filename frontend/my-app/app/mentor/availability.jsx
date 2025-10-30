import React, { useState, useEffect } from 'react';
import {
    
    ScrollView,
    View,
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    Alert,
    Platform,
    StatusBar,
    Modal, // IMPORTANT: Must be imported for the CustomPickerModal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, X, Plus, Trash2, Clock, ChevronDown } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- Helper constants ---
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => { // 30-min intervals
    const totalMinutes = i * 30;
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
    const minutes = (totalMinutes % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}`;
});

// ====================================================================
// === 1. CustomPickerModal Component (Integrated for simplicity) ===
// ====================================================================
const CustomPickerModal = ({
    isVisible,
    onClose,
    options,
    selectedValue,
    onSelectValue,
    title,
    styles, // Passed shared styles
}) => {
    const [tempValue, setTempValue] = useState(selectedValue);

    useEffect(() => {
        setTempValue(selectedValue);
    }, [selectedValue, isVisible]);

    const handleConfirm = () => {
        onSelectValue(tempValue); 
        onClose(); 
    };

    const handleCancel = () => {
        onClose();
    };

    if (!isVisible) return null;

    return (
        <Modal
            transparent
            visible={isVisible}
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalBox, styles.pickerModalBox]}>
                    
                    {/* Header with Title and Close Button */}
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>{title}</Text>
                        <Pressable onPress={handleCancel} style={styles.modalCloseBtn}>
                            <X size={20} color="#4b5563" />
                        </Pressable>
                    </View>

                    {/* List of Options */}
                    <ScrollView 
                        style={styles.pickerListScrollView} 
                        showsVerticalScrollIndicator={false}
                    >
                        {options.map((option, index) => {
                            const isSelected = option === tempValue;
                            return (
                                <Pressable
                                    key={index}
                                    style={[
                                        styles.pickerListItem,
                                        isSelected && styles.pickerListItemSelected,
                                    ]}
                                    onPress={() => setTempValue(option)}
                                >
                                    <Text
                                        style={[
                                            styles.pickerListItemText,
                                            isSelected && styles.pickerListItemTextSelected,
                                        ]}
                                    >
                                        {option}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {/* Action Buttons */}
                    <View style={styles.modalActions}>
                        <Pressable onPress={handleCancel} style={styles.buttonCancel}>
                            <Text style={styles.buttonCancelText}>Cancel</Text>
                        </Pressable>
                        <Pressable onPress={handleConfirm} style={styles.buttonConfirm}>
                            <Text style={styles.buttonConfirmText}>Done</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        </Modal>
    );
};
// ====================================================================
// === 2. SetAvailability Main Component ==============================
// ====================================================================
export default function SetAvailability() {
    const router = useRouter();
    // Default to an empty array to match the backend expectations if none are fetched
    const [slots, setSlots] = useState([]); 
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState(null);

    // Custom Picker Modal States
    const [pickerModalVisible, setPickerModalVisible] = useState(false);
    const [currentPickerOptions, setCurrentPickerOptions] = useState([]);
    const [currentPickerTitle, setCurrentPickerTitle] = useState('');
    const [currentPickerValue, setCurrentPickerValue] = useState('');
    const [currentEditingIndex, setCurrentEditingIndex] = useState(null);
    const [currentEditingField, setCurrentEditingField] = useState('');

    // Fetch the mentor's currently saved slots
    useEffect(() => {
        const fetchSlots = async () => {
            setIsLoading(true);
            const token = await AsyncStorage.getItem("token");
            try {
                // Ensure the endpoint is correct for fetching
                const res = await fetch("https://placemate-ru7v.onrender.com/api/mentors/my-availability", {
                    headers: { "Authorization": `Bearer ${token}` }
                });
                
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.message || "Could not load availability.");
                }

                const data = await res.json();
                // Set the fetched slots. Use an empty array if data is null/undefined to avoid errors.
                setSlots(data || []); 
            } catch (err) {
                console.error("Fetch error:", err);
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchSlots();
    }, []);

    // Functions to manage the 'slots' array state
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

    // Function to open the Custom Picker Modal
    const openPickerModal = (index, field, currentValue) => {
        setCurrentEditingIndex(index);
        setCurrentEditingField(field);
        setCurrentPickerValue(currentValue);

        if (field === 'day') {
            setCurrentPickerOptions(daysOfWeek);
            setCurrentPickerTitle('Select Day');
        } else { // startTime or endTime
            setCurrentPickerOptions(timeSlots);
            setCurrentPickerTitle(field === 'startTime' ? 'Select Start Time' : 'Select End Time');
        }
        setPickerModalVisible(true);
    };

    // Send the updated array to the backend
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
                body: JSON.stringify({ availabilitySlots: slots })
            });

            if (!res.ok) {
                const errData = await res.json();
                throw new Error(errData.message || "Failed to save availability.");
            }
            
            Alert.alert("Success", "Availability saved!");
            router.back(); 
            
        } catch (err) {
            setError(err.message);
            Alert.alert("Error", err.message);
        } finally {
            setIsSaving(false);
        }
    };

    // Render the list of availability slots
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
                            
                            {/* Day Button */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>Day</Text>
                                <Pressable
                                    style={styles.pickerButton} 
                                    onPress={() => openPickerModal(index, 'day', slot.day)}
                                >
                                    <Text style={styles.pickerButtonText}>{slot.day}</Text>
                                    <ChevronDown size={16} color="#6b7280" />
                                </Pressable>
                            </View>

                            {/* Start Time Button */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>From</Text>
                                <Pressable
                                    style={styles.pickerButton}
                                    onPress={() => openPickerModal(index, 'startTime', slot.startTime)}
                                >
                                    <Text style={styles.pickerButtonText}>{slot.startTime}</Text>
                                    <ChevronDown size={16} color="#6b7280" />
                                </Pressable>
                            </View>

                            {/* End Time Button */}
                            <View style={styles.inputGroup}>
                                <Text style={styles.inputLabel}>To</Text>
                                <Pressable
                                    style={styles.pickerButton}
                                    onPress={() => openPickerModal(index, 'endTime', slot.endTime)}
                                >
                                    <Text style={styles.pickerButtonText}>{slot.endTime}</Text>
                                    <ChevronDown size={16} color="#6b7280" />
                                </Pressable>
                            </View>
                        </View>
                        
                        {/* DELETE BUTTON */}
                        <Pressable 
                            onPress={() => removeSlot(index)} 
                            style={styles.deleteBtn} 
                            title="Remove slot"
                        >
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

    // Main Layout
    return (
        <SafeAreaView style={styles.pageContainer}>
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <Pressable onPress={() => router.back()} style={styles.backButton} title="Back to Dashboard">
                        <ArrowLeft size={24} color="#4f46e5" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Set Your Availability</Text>
                </View>
                <Pressable onPress={handleSave} style={styles.saveBtn} disabled={isSaving || isLoading}>
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

            {/* --- CUSTOM PICKER MODAL RENDERING --- */}
            <CustomPickerModal
                isVisible={pickerModalVisible}
                onClose={() => setPickerModalVisible(false)}
                options={currentPickerOptions}
                selectedValue={currentPickerValue}
                onSelectValue={(newValue) => {
                    updateSlot(currentEditingIndex, currentEditingField, newValue);
                }}
                title={currentPickerTitle}
                styles={styles} 
            />
        </SafeAreaView>
    );
}

// ====================================================================
// === 3. StyleSheet ==================================================
// ====================================================================
const styles = StyleSheet.create({
    pageContainer: { flex: 1, backgroundColor: '#f9fafe' },
    
    // HEADER
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
       // paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 16,
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16, flexShrink: 1 },
    backButton: { padding: 8, backgroundColor: '#eef2ff', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: '700', color: '#111827', flexShrink: 1 },
    saveBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    saveBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },

    // MAIN CONTENT
    mainContent: { padding: 24, maxWidth: 800, alignSelf: 'center', width: '100%' },
    errorText: { color: '#ef4444', fontWeight: '500', fontSize: 16, textAlign: 'center', marginBottom: 16 },
    infoContainer: { alignItems: 'center', justifyContent: 'center', paddingVertical: 48 },
    infoText: { color: '#6b7280', fontSize: 16, marginTop: 16 },
    
    // LIST & SLOTS
    slotsList: { flexDirection: 'column', gap: 16 },
    slotCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 16,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16,
    },
    slotInputs: {
        flex: 1,
        flexDirection: 'row', // Display inputs side-by-side
        gap: 12,
    },
    inputGroup: {
        flex: 1, // Make each input group share horizontal space
        flexDirection: 'column',
        gap: 8,
    },
    inputLabel: { fontWeight: '500', fontSize: 14, color: '#374151' },
    
    // CUSTOM PICKER BUTTON (Replaces native Picker)
    pickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        backgroundColor: '#fff',
        paddingVertical: 10,
        paddingHorizontal: 10,
        minHeight: 40,
    },
    pickerButtonText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '500',
    },

    // ACTIONS
    deleteBtn: {
        backgroundColor: '#fee2e2',
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        flexShrink: 0,
        marginTop: 22, // Align with the top of the picker buttons
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
    addBtnText: { color: '#4f46e5', fontWeight: '600', fontSize: 16 },

    // EMPTY STATE
    emptyState: { 
        padding: 32, 
        backgroundColor: '#fff', 
        borderRadius: 12, 
        borderWidth: 1, 
        borderStyle: 'dashed', 
        borderColor: '#d1d5db',
        alignItems: 'center',
    },
    emptyText: { color: '#6b7280', fontSize: 16, textAlign: 'center', marginTop: 8 },

    // --- CUSTOM PICKER MODAL STYLES ---
    modalOverlay: { 
        flex: 1, 
        justifyContent: "center", 
        alignItems: "center", 
        backgroundColor: "rgba(0, 0, 0, 0.5)" 
    },
    modalBox: { 
        backgroundColor: "#fff", 
        borderRadius: 12, 
        padding: 24, 
        width: "90%", 
        maxWidth: 384, 
        alignItems: "center" 
    },
    
    pickerModalBox: {
        maxWidth: 280, // Narrower width
        maxHeight: '60%', // Shorter height
        padding: 16, 
        alignItems: 'stretch', // Crucial: allows ScrollView to take full width
    },
    
    // Picker Header
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
        paddingBottom: 16,
    },
    modalTitle: { 
        fontSize: 20, 
        fontWeight: '600',
        color: '#1f2937',
        flexShrink: 1,
        textAlign: 'left',
    },
    modalCloseBtn: { 
        padding: 6,
        backgroundColor: '#f3f4f6',
        borderRadius: 15,
    },

    // Picker List Items
    pickerListScrollView: { 
        marginVertical: 10, 
        maxHeight: 220, 
        width: '100%' 
    },
    pickerListItem: { 
        paddingVertical: 12, 
        paddingHorizontal: 16, 
        borderBottomWidth: 1, 
        borderBottomColor: '#f3f4f6', 
    },
    pickerListItemSelected: { 
        backgroundColor: '#eef2ff' 
    },
    pickerListItemText: { 
        fontSize: 16, 
        color: '#374151', 
        textAlign: 'center' 
    },
    pickerListItemTextSelected: {
        color: '#4f46e5',
        fontWeight: '600',
    },

    // Action Buttons
    modalActions: { // Container for Cancel/Done buttons
        flexDirection: 'row',
        justifyContent: 'flex-end', 
        gap: 16,
        marginTop: 16, 
        width: '100%', 
        borderTopWidth: 1,
        borderTopColor: '#e5e7eb', 
        paddingTop: 16, 
    },
    buttonCancel: { // Style for Cancel button
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
        fontSize: 15,
    },
    buttonConfirm: { // Style for Done/Confirm button
        backgroundColor: '#4f46e5',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        minHeight: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonConfirmText: { 
        color: '#fff',
        fontWeight: '600',
        fontSize: 15,
    },
});