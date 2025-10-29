import React, { useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter, Link } from "expo-router";
import {
  Camera,
  CloudUpload,
  Check,
  FileText,
  Loader2,
  Plus,
  Trash2,
  DollarSign,
} from "lucide-react-native";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

// --- Helper constants for Step 3 ---
const daysOfWeek = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];
const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => {
  // 30-min intervals
  const totalMinutes = i * 30;
  const hours = Math.floor(totalMinutes / 60)
    .toString()
    .padStart(2, "0");
  const minutes = (totalMinutes % 60).toString().padStart(2, "0");
  return `${hours}:${minutes}`;
});
// ---

export default function MentorRegister() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [experience, setExperience] = useState("");
  const [qualification, setQualification] = useState("");
  const [expertise, setExpertise] = useState("");
  const [fees, setFees] = useState("");
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  const [profilePic, setProfilePic] = useState(null); // Will store ImagePicker result
  const [idProof, setIdProof] = useState(null); // Will store DocumentPicker result
  const [agree, setAgree] = useState(false);

  const [generalError, setGeneralError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emailRegex = /\S+@\S+\.\S+/;

  // --- NEW NATIVE FILE HANDLERS ---
  const handleProfilePicChange = async () => {
    // Request permission (iOS only)
    await ImagePicker.requestMediaLibraryPermissionsAsync();

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 0.7,
    });

    if (!result.canceled) {
      setProfilePic(result.assets[0]);
    }
  };

  const handleIdProofChange = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled) {
        setIdProof(result.assets[0]);
      }
    } catch (err) {
      console.error("Failed to pick document", err);
      setGeneralError("Failed to pick document.");
    }
  };
  // ---

  // --- Helper functions for new Step 3 (No changes) ---
  const addSlot = () => {
    setAvailabilitySlots([
      ...availabilitySlots,
      { day: "Monday", startTime: "09:00", endTime: "10:00" },
    ]);
  };

  const removeSlot = (index) => {
    setAvailabilitySlots(availabilitySlots.filter((_, i) => i !== index));
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...availabilitySlots];
    newSlots[index][field] = value;
    setAvailabilitySlots(newSlots);
  };
  // ---

  const validateStep = () => {
    setGeneralError("");
    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
        setGeneralError("All fields on this page are required");
        return false;
      }
      if (!emailRegex.test(email)) {
        setGeneralError("Please enter a valid email address");
        return false;
      }
      if (password.length < 6) {
        setGeneralError("Password must be at least 6 characters");
        return false;
      }
    }
    // You could add validation for step 2 & 3 here if needed
    if (step === 4) {
      if (!idProof) {
        setGeneralError("Please upload your ID for verification.");
        return false;
      }
      if (!agree) {
        setGeneralError("You must agree to the Terms & Conditions.");
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      if (step < 4) setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // --- UPDATED SUBMIT HANDLER ---
  const handleRegister = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    setGeneralError("");

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("password", password);
    formData.append("jobTitle", jobTitle);
    formData.append("company", company);
    formData.append("experience", experience);
    formData.append("qualification", qualification);
    formData.append("expertise", expertise);
    formData.append("fees", fees);
    formData.append("availabilitySlots", JSON.stringify(availabilitySlots));

    // --- NEW NATIVE FILE APPEND ---
    if (profilePic) {
      formData.append("profilePic", {
        uri: profilePic.uri,
        name: profilePic.fileName || `profile.jpg`,
        type: profilePic.mimeType || "image/jpeg",
      });
    }
    if (idProof) {
      formData.append("idProof", {
        uri: idProof.uri,
        name: idProof.name,
        type: idProof.mimeType,
      });
    }
    // ---

    try {
      const res = await fetch(
        "https://placemate-ru7v.onrender.com/api/auth/register/registerMentor",
        {
          method: "POST",
          body: formData,
          // DO NOT set Content-Type, fetch API does it automatically with boundary
        }
      );

      const data = await res.json();
      if (res.ok) {
        setShowSuccess(true);
      } else {
        setGeneralError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setGeneralError("Could not connect to the server. Please check your connection.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- UPDATED RENDER FUNCTIONS for Native ---
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <View>
            <Text style={styles.title}>Mentor Registration</Text>
            <Text style={styles.subtitle}>Let's start with the basics.</Text>
            
            <Pressable
              style={styles.uploadCircle}
              onPress={handleProfilePicChange}
            >
              {profilePic ? (
                <Image
                  source={{ uri: profilePic.uri }}
                  style={styles.profilePreview}
                />
              ) : (
                <Camera size={32} color="#4f46e5" />
              )}
            </Pressable>
            <Text style={styles.hintText}>Upload Profile Picture</Text>
            
            <TextInput
              style={styles.inputField}
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.inputField}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.inputField}
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.inputField}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholderTextColor="#9ca3af"
            />
          </View>
        );
      case 2:
        return (
          <View>
            <Text style={styles.title}>Professional Details</Text>
            <Text style={styles.subtitle}>Tell us about your experience.</Text>
            <TextInput
              style={styles.inputField}
              placeholder="Current Job Title"
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.inputField}
              placeholder="Company"
              value={company}
              onChangeText={setCompany}
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.inputField}
              placeholder="Years of Experience"
              value={experience}
              onChangeText={setExperience}
              keyboardType="number-pad"
              placeholderTextColor="#9ca3af"
            />
            <TextInput
              style={styles.inputField}
              placeholder="Highest Qualification"
              value={qualification}
              onChangeText={setQualification}
              placeholderTextColor="#9ca3af"
            />
          </View>
        );
      case 3:
        return (
          <View>
            <Text style={styles.title}>Mentorship Preferences</Text>
            <Text style={styles.subtitle}>
              Set your expertise, availability, and fees.
            </Text>

            <TextInput
              style={styles.inputField}
              placeholder="Areas of Expertise (e.g., React, UI/UX)"
              value={expertise}
              onChangeText={setExpertise}
              placeholderTextColor="#9ca3af"
            />

            <View style={styles.inputWithIcon}>
              <DollarSign size={18} style={styles.inputIcon} />
              <TextInput
                style={[styles.inputField, { paddingLeft: 40 }]}
                placeholder="Session Fee (e.g., 500)"
                value={fees}
                onChangeText={setFees}
                keyboardType="number-pad"
                placeholderTextColor="#9ca3af"
              />
            </View>
            <Text style={styles.feeHint}>
              Enter fee per session (optional, leave 0 if free).
            </Text>

            <Text style={styles.availabilityTitle}>
              Set Your Weekly Availability
            </Text>
            <View style={styles.slotsList}>
              {availabilitySlots.map((slot, index) => (
                <View key={index} style={styles.slotCard}>
                  <View style={styles.slotInputs}>
                    {/* --- NATIVE PICKER --- */}
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={slot.day}
                        onValueChange={(value) =>
                          updateSlot(index, "day", value)
                        }
                        style={styles.formPicker}
                      >
                        {daysOfWeek.map((day) => (
                          <Picker.Item key={day} label={day} value={day} />
                        ))}
                      </Picker>
                    </View>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={slot.startTime}
                        onValueChange={(value) =>
                          updateSlot(index, "startTime", value)
                        }
                        style={styles.formPicker}
                      >
                        {timeSlots.map((time) => (
                          <Picker.Item key={time} label={time} value={time} />
                        ))}
                      </Picker>
                    </View>
                    <View style={styles.pickerWrapper}>
                      <Picker
                        selectedValue={slot.endTime}
                        onValueChange={(value) =>
                          updateSlot(index, "endTime", value)
                        }
                        style={styles.formPicker}
                      >
                        {timeSlots.map((time) => (
                          <Picker.Item key={time} label={time} value={time} />
                        ))}
                      </Picker>
                    </View>
                  </View>
                  <Pressable
                    onPress={() => removeSlot(index)}
                    style={styles.deleteBtn}
                  >
                    <Trash2 size={18} color="#991b1b" />
                  </Pressable>
                </View>
              ))}
              <Pressable onPress={addSlot} style={styles.addBtn}>
                <Plus size={18} color="#4f46e5" />
                <Text style={styles.addBtnText}>Add Time Slot</Text>
              </Pressable>
            </View>
          </View>
        );
      case 4:
        return (
          <View>
            <Text style={styles.title}>Verification & Submission</Text>
            <Text style={styles.subtitle}>
              One last step to complete your profile.
            </Text>
            <Pressable
              onPress={handleIdProofChange}
              style={styles.uploadBox}
            >
              <CloudUpload size={40} color="#4f46e5" />
              <Text style={styles.uploadBoxText}>
                {idProof ? "ID Selected!" : "Upload Your ID"}
              </Text>
            </Pressable>
            {idProof && (
              <View style={styles.fileDisplay}>
                <FileText size={16} color="#4b5563" />
                <Text style={styles.fileDisplayText}>{idProof.name}</Text>
              </View>
            )}

            <Pressable
              onPress={() => setAgree(!agree)}
              style={styles.checkboxContainer}
            >
              <View
                style={[styles.checkbox, agree && styles.checkboxChecked]}
              >
                {agree && <Check size={16} color="white" />}
              </View>
              <Text style={styles.termsText}>
                I agree to the Terms & Conditions.
              </Text>
            </Pressable>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <View style={styles.container}>
            <View style={styles.formWrapper}>
              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBar,
                    { width: `${(step / 4) * 100}%` },
                  ]}
                />
              </View>

              <View style={styles.stepContainer}>
                {generalError && (
                  <Text style={styles.errorMessage}>{generalError}</Text>
                )}
                {renderStep()}
              </View>

              <View style={styles.navigationButtons}>
                {step > 1 && (
                  <Pressable
                    onPress={prevStep}
                    style={styles.buttonSecondary}
                    disabled={isLoading}
                  >
                    <Text style={styles.buttonSecondaryText}>Back</Text>
                  </Pressable>
                )}
                {step < 4 ? (
                  <Pressable
                    onPress={nextStep}
                    style={styles.buttonPrimary}
                    disabled={isLoading}
                  >
                    <Text style={styles.buttonPrimaryText}>Next</Text>
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={handleRegister}
                    style={styles.buttonPrimary}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.buttonPrimaryText}>
                        Submit Registration
                      </Text>
                    )}
                  </Pressable>
                )}
              </View>

              <Link href="/" asChild>
                <Pressable>
                  <Text style={styles.loginLink}>
                    Already have an account? Login
                  </Text>
                </Pressable>
              </Link>
            </View>

            {/* --- MODAL --- */}
            <Modal
              transparent
              visible={showSuccess}
              animationType="fade"
              onRequestClose={() => {
                setShowSuccess(false);
                router.replace("/");
              }}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalBox}>
                  <Text style={styles.modalIcon}>✅</Text>
                  <Text style={styles.modalTitle}>Registration Successful!</Text>
                  <Text style={styles.modalSubtitle}>
                    Your mentor application has been submitted for review.
                  </Text>
                  <Pressable
                    onPress={() => {
                      setShowSuccess(false);
                      router.replace("/");
                    }}
                    style={styles.modalButton}
                  >
                    <Text style={styles.modalButtonText}>Ok</Text>
                  </Pressable>
                </View>
              </View>
            </Modal>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- Converted StyleSheet ---
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f8fafc" },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  formWrapper: {
    width: "100%",
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 9999,
    overflow: "hidden",
    marginBottom: 20,
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#4f46e5",
    borderRadius: 9999,
  },
  stepContainer: {
    minHeight: 450,
  },
  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#1f2937",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  hintText: {
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
    fontSize: 14,
  },
  errorMessage: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "500",
  },
  loginLink: {
    textAlign: "center",
    color: "#4f46e5",
    marginTop: 20,
    fontWeight: "500",
    fontSize: 14,
  },
  inputField: {
    width: "100%",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    fontSize: 16,
    color: "#111827",
  },
  navigationButtons: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 16,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: "#4f46e5",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 18,
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#d1d5db",
    padding: 14,
    borderRadius: 12,
    marginRight: 12,
  },
  buttonSecondaryText: {
    color: "#374151",
    fontWeight: "700",
    fontSize: 18,
  },
  uploadCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#e0e7ff",
    alignSelf: "center",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#c7d2fe",
    overflow: "hidden",
    marginBottom: 8,
  },
  profilePreview: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  uploadBox: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#c7d2fe",
    borderStyle: "dashed",
    borderRadius: 12,
    paddingVertical: 32,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#eef2ff",
  },
  uploadBoxText: {
    color: "#4f46e5",
    marginTop: 8,
    fontWeight: "700",
  },
  fileDisplay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    color: "#4b5563",
    marginTop: -8,
    marginBottom: 20,
  },
  fileDisplayText: {
    fontSize: 14,
    color: "#4b5563",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    paddingVertical: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  termsText: {
    fontSize: 14,
    color: "#4b5563",
  },
  // Step 3 Styles
  inputWithIcon: {
    position: "relative",
    marginBottom: 4,
  },
  inputIcon: {
    position: "absolute",
    left: 14,
    top: 15,
    color: "#9ca3af",
    zIndex: 1,
  },
  feeHint: {
    marginTop: -8,
    marginBottom: 24,
    textAlign: "left",
    paddingLeft: 4,
    fontSize: 12,
    color: "#6b7280",
  },
  availabilityTitle: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 12,
  },
  slotsList: {
    flexDirection: "column",
    gap: 16,
  },
  slotCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 8,
  },
  slotInputs: {
    flexDirection: "row", // Changed to row
    gap: 8,
    flex: 1,
  },
  pickerWrapper: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: 'center', // Center picker on Android
  },
  formPicker: {
    width: "100%",
    height: 40, // Needs explicit height on iOS
    backgroundColor: 'transparent',
  },
  deleteBtn: {
    backgroundColor: "#fee2e2",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexShrink: 0,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#eef2ff",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
    width: "100%",
  },
  addBtnText: {
    color: "#4f46e5",
    fontWeight: "600",
    fontSize: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalBox: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    width: "90%",
    maxWidth: 384,
    alignItems: "center",
  },
  modalIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: "#4b5563",
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    width: "100%",
    backgroundColor: "#4f46e5",
    padding: 12,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
    textAlign: 'center',
  },
});