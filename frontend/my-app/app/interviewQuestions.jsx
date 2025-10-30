import React, { useState, useEffect } from "react";
import {
  
  ScrollView,
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Code,
  User,
  BrainCircuit,
  Plus,
  Sparkles,
  Trash2,
  RotateCw,
  ChevronDown,
  AlertTriangle,
} from 'lucide-react-native';
import { useRouter, Link } from 'expo-router';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Picker } from "@react-native-picker/picker";

// --- Constants ---
const difficultyMap = { 'Easy': 1, 'Medium': 2, 'Hard': 3 };
const difficultyOptions = ["Easy", "Medium", "Hard"];
const categoryOptions = ["technical", "hr", "aptitude"];

export default function InterviewPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('technical');
  const [questions, setQuestions] = useState([]);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);
  const [sortOrder, setSortOrder] = useState('newest');

  // --- State for Admin & AI Features ---
  const [userRole, setUserRole] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("technical");
  const [newDifficulty, setNewDifficulty] = useState("Medium");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // --- State for Data Fetching ---
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    // Fetch user role from AsyncStorage
    const initialize = async () => {
        const userDataString = await AsyncStorage.getItem('user');
        if (userDataString) {
            const userData = JSON.parse(userDataString);
            setUserRole(userData.role);
        }
        // Fetch initial questions
        fetchQuestions('technical');
    };
    initialize();
  }, []);

  // Re-fetch questions when the tab changes, and then apply sort
  useEffect(() => {
    fetchQuestions(activeTab);
  }, [activeTab, sortOrder]);


  const fetchQuestions = async (category) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(`https://placemate-ru7v.onrender.com/api/questions/${category}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      // Apply the current sort order right after fetching
      const sortedData = sortQuestions(data, sortOrder);
      setQuestions(sortedData);

    } catch (error) {
      console.error("Failed to fetch questions:", error);
      setFetchError("Could not load questions. Please ensure the server is running.");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const sortQuestions = (data, sortType) => {
    const questionsToSort = [...data];
    return questionsToSort.sort((a, b) => {
      
      if (sortType === 'easy' || sortType === 'hard') {
        const difficultyA = difficultyMap[a.difficulty] || 99;
        const difficultyB = difficultyMap[b.difficulty] || 99;
        
        if (sortType === 'easy') {
          return difficultyA - difficultyB; // Easy (asc)
        } else {
          return difficultyB - difficultyA; // Hard (desc)
        }
      } 
      
      // Sort by Time/Date
      const dateA = new Date(a.createdAt || 0); 
      const dateB = new Date(b.createdAt || 0);
      
      if (sortType === 'newest') {
        return dateB.getTime() - dateA.getTime(); // Newest first (desc)
      } else if (sortType === 'oldest') {
        return dateA.getTime() - dateB.getTime(); // Oldest first (asc)
      }

      return 0;
    });
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setExpandedQuestionId(null);
    // Note: fetchQuestions will run due to the useEffect dependency [activeTab]
  };

  const handleQuestionClick = (id) => {
    setExpandedQuestionId(expandedQuestionId === id ? null : id);
  };

  const handleAddQuestionSubmit = async () => {
    // No need for e.preventDefault() in React Native Pressable
    if (!newQuestion.trim() || !newAnswer.trim()) {
        Alert.alert("Error", "Question and Answer cannot be empty.");
        return;
    }
    const token = await AsyncStorage.getItem('token');
    if (!token) {
        Alert.alert("Error", "You must be logged in to perform this action.");
        return;
    }

    try {
      const res = await fetch("https://placemate-ru7v.onrender.com/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ question: newQuestion, answer: newAnswer, category: newCategory, difficulty: newDifficulty }),
      });
      if (res.ok) {
        Alert.alert("Success", "Question added successfully!"); 
        setShowAddForm(false);
        setNewQuestion("");
        setNewAnswer("");
        setNewDifficulty("Medium"); 
        if (newCategory === activeTab) {
          fetchQuestions(activeTab); // Refresh current list
        }
      } else {
        const errorData = await res.json();
        Alert.alert("Failed", `Failed to add question: ${errorData.message}`); 
      }
    } catch (err) {
      Alert.alert("Server Error", "Could not connect to the server."); 
      console.error("A server error occurred:", err);
    }
  };

  const handleDeleteQuestion = (questionId) => {
    // Use React Native Alert for confirmation
    Alert.alert(
        "Confirm Deletion",
        "Are you sure you want to delete this question?",
        [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const token = await AsyncStorage.getItem('token');
                    try {
                        const res = await fetch(`https://placemate-ru7v.onrender.com/api/questions/${questionId}`, {
                            method: "DELETE",
                            headers: { "Authorization": `Bearer ${token}` }
                        });
                        if (res.ok) {
                            Alert.alert("Success", "Question deleted successfully!"); 
                            fetchQuestions(activeTab);
                        } else {
                            const errorData = await res.json();
                            Alert.alert("Error", `Failed to delete: ${errorData.message}`);
                        }
                    } catch (err) {
                        Alert.alert("Server Error", "A server error occurred during deletion.");
                        console.error(err);
                    }
                }
            }
        ]
    );
  };

  const handleCloseModal = () => {
    setShowAddForm(false); // Close the modal
    
    // Reset all the form fields to their default values
    setNewQuestion("");
    setNewAnswer("");
    setNewCategory("technical");
    setNewDifficulty("Medium");
    setIsGenerating(false); // Also reset the AI button
  };

  // --- Client-Side AI Generation (Using API Call) ---
  const handleGenerateAnswer = async () => {
    if (!newQuestion.trim()) {
      Alert.alert("Input Error", "Please enter a question first.");
      return;
    }
    
    setIsGenerating(true);
    setNewAnswer("✨ Generating a high-quality answer with Gemini...");
    
    const apiKey = "AIzaSyDd9V4VDVxmU0zvRlFFzNM0d_Xe1PvYnUA"; // Canvas will inject the key at runtime
    const modelName = "gemini-2.5-flash-preview-09-2025"; 
    
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
    
    const systemPrompt = "You are an expert hiring manager. Provide a clear, comprehensive, and well-structured answer to the following interview question, suitable for a job candidate. Format the response using markdown.";
    
    const payload = {
        contents: [
            { 
                parts: [{ 
                    text: `Question: "${newQuestion}"` 
                }] 
            }
        ],
        systemInstruction: { 
            parts: [{ 
                text: systemPrompt 
            }] 
        },
    };

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
            const errorData = await response.json();
            console.error("Gemini API call failed (Client-side):", errorData);
            throw new Error(`API error: ${response.statusText}`);
      }
      
      const result = await response.json();
      const generatedText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (generatedText) {
        setNewAnswer(generatedText);
      } else {
        setNewAnswer("Sorry, the AI could not generate an answer (empty response).");
      }
      
    } catch (error) {
      console.error("Gemini API call failed:", error);
      setNewAnswer(`Failed to generate answer: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };
  // --------------------------------------------------------------------
  
  // --- Render Questions Content ---
  const renderContent = () => {
    if (isLoading) return (
        <View style={styles.infoContainer}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={styles.infoText}>Loading questions...</Text>
        </View>
    );
    if (fetchError) return (
        <View style={styles.infoContainer}>
            <AlertTriangle size={32} color="#ef4444" />
            <Text style={styles.errorText}>{fetchError}</Text>
        </View>
    );
    
    if (questions.length === 0) return (
        <View style={styles.emptyState}>
            <Text style={styles.infoText}>No questions found for this category.</Text>
        </View>
    );
    
    return questions.map((q) => (
      <View key={q._id} style={styles.questionCard}>
        <Pressable 
          onPress={() => handleQuestionClick(q._id)}
          style={styles.questionHeader}
        >
          <View style={styles.questionToggle}>
            <Text style={styles.questionText}>{q.question}</Text>
          </View>
          <View style={styles.questionControls}>
            <View 
                style={[
                    styles.difficultyBadge, 
                    styles[`difficulty-${q.difficulty?.toLowerCase()}`]
                ]}
            >
              <Text style={styles.difficultyText}>{q.difficulty}</Text>
            </View>
            {userRole === 'admin' && (
              <Pressable 
                style={styles.deleteButton}
                onPress={() => handleDeleteQuestion(q._id)}
                hitSlop={10} // Makes it easier to tap
              >
                <Trash2 size={18} color="#ef4444" />
              </Pressable>
            )}
          </View>
        </Pressable>
        {expandedQuestionId === q._id && (
            <ScrollView 
                style={styles.questionAnswerContainer}
tr             nestedScrollEnabled={true} // 👈 ADD THIS LINE
            >
                <Text style={styles.questionAnswerText}>
                    {q.answer}
                </Text>
            </ScrollView>
        )}
      </View>
    ));
  };


  return (
    <SafeAreaView style={styles.pageContainer}>
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Link href="/home" asChild>
            <Pressable style={styles.backButton} title="Back to Home">
              <ArrowLeft size={24} color="#4f46e5" />
            </Pressable>
          </Link>
          <Text style={styles.headerTitle}>Interview Questions</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.mainContent}>
        {/* NEW CONTROL BAR: Houses Add Button (Left) and Sort Dropdown (Right) */}
        <View style={styles.controlBar}>
          {userRole === 'admin' && (
            <Pressable style={styles.addQuestionBtn} onPress={() => setShowAddForm(true)}>
              <Plus size={20} color="white" />
              <Text style={styles.addQuestionBtnText}>Add</Text>
            </Pressable>
          )}

          {/* SORT BAR */}
          <View style={styles.sortBar}>
            <Text style={styles.sortLabel}>Sort By:</Text>
            <View style={styles.sortControlGroup}>
              <Picker
                    selectedValue={sortOrder}
                    onValueChange={(itemValue) => setSortOrder(itemValue)} // 👈 RIGHT
                    style={styles.sortSelect}
                    dropdownIconColor="#4f46e5"
                >
                    <Picker.Item label="Time (Newest)" value="newest" />
                    <Picker.Item label="Time (Oldest)" value="oldest" />
                    <Picker.Item label="Difficulty (Hardest)" value="hard" />
                    <Picker.Item label="Difficulty (Easiest)" value="easy" />
                </Picker>
            </View>
          </View>
          {/* END SORT BAR */}
        </View>
        {/* END CONTROL BAR */}

        <View style={styles.accordionContainer}>
          {renderContent()}
        </View>
      </ScrollView>

      <View style={styles.bottomTabBar}>
        <Pressable 
            style={[styles.tabButton, activeTab === 'technical' && styles.tabButtonActive]} 
            onPress={() => handleTabClick('technical')}
        >
            <Code size={24} color={activeTab === 'technical' ? '#4f46e5' : '#6b7280'} />
            <Text style={[styles.tabButtonText, activeTab === 'technical' && styles.tabButtonTextActive]}>Technical</Text>
        </Pressable>
        <Pressable 
            style={[styles.tabButton, activeTab === 'hr' && styles.tabButtonActive]} 
            onPress={() => handleTabClick('hr')}
        >
            <User size={24} color={activeTab === 'hr' ? '#4f46e5' : '#6b7280'} />
            <Text style={[styles.tabButtonText, activeTab === 'hr' && styles.tabButtonTextActive]}>HR</Text>
        </Pressable>
        <Pressable 
            style={[styles.tabButton, activeTab === 'aptitude' && styles.tabButtonActive]} 
            onPress={() => handleTabClick('aptitude')}
        >
            <BrainCircuit size={24} color={activeTab === 'aptitude' ? '#4f46e5' : '#6b7280'} />
            <Text style={[styles.tabButtonText, activeTab === 'aptitude' && styles.tabButtonTextActive]}>Aptitude</Text>
        </Pressable>
      </View>

      {/* --- ADD QUESTION MODAL --- */}
      <Modal
        visible={showAddForm}
        transparent={true}
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Add a New Interview Question</Text>
            <ScrollView 
            contentContainerStyle={styles.modalScroll} 
            style={styles.scrollViewWindow} // 👈 ADD THIS
          >
                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Category</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={newCategory}
                            onValueChange={setNewCategory}
                            style={styles.formPicker}
                        >
                            {categoryOptions.map((cat) => (
                                <Picker.Item key={cat} label={cat.charAt(0).toUpperCase() + cat.slice(1)} value={cat} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Difficulty</Text>
                    <View style={styles.pickerWrapper}>
                        <Picker
                            selectedValue={newDifficulty}
                            onValueChange={setNewDifficulty}
                            style={styles.formPicker}
                        >
                            {difficultyOptions.map((diff) => (
                                <Picker.Item key={diff} label={diff} value={diff} />
                            ))}
                        </Picker>
                    </View>
                </View>

                <View style={styles.formGroup}>
                    <Text style={styles.formLabel}>Question</Text>
                    <TextInput
                        style={[styles.formInput, styles.formTextarea]}
                        value={newQuestion}
                        onChangeText={setNewQuestion}
                        multiline
                        numberOfLines={3}
                        required
                    />
                </View>

                <View style={styles.formGroup}>
                    <View style={styles.labelContainer}>
                        <Text style={styles.formLabel}>Answer</Text>
                        <Pressable style={styles.aiButton} onPress={handleGenerateAnswer} disabled={isGenerating}>
                            {isGenerating ? 
                                <ActivityIndicator color="#4f46e5" size="small" style={styles.animateSpin} /> 
                                : <Sparkles size={16} color="#4f46e5" />
                            }
                            <Text style={styles.aiButtonText}>
                                {isGenerating ? 'Generating...' : 'Generate Answer'}
                            </Text>
                        </Pressable>
                    </View>
                    <TextInput
                        style={[styles.formInput, styles.formTextarea]}
                        value={newAnswer}
                        onChangeText={setNewAnswer}
                        multiline
                        numberOfLines={6}
                        required
                    />
                </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable style={styles.buttonCancel} onPress={handleCloseModal}>
                <Text style={styles.buttonCancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.buttonPrimary} onPress={handleAddQuestionSubmit} disabled={isGenerating}>
                <Text style={styles.buttonPrimaryText}>Save Question</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    // paddingVertical: 12, // 👈 REMOVE THIS
    
    paddingVertical: 12, // 👈 ADD THIS
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  backButton: {
    padding: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  mainContent: {
    padding: 24,
    paddingBottom: 100, // Space for the bottom bar
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  controlBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 8,
    backgroundColor: '#f9fafe',
    zIndex: 10,
    // Add sticky effect manually if needed, but ScrollView handles top placement
  },
  addQuestionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#4f46e5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addQuestionBtnText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  sortBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  sortLabel: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  sortControlGroup: {
    width: 160,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    justifyContent: 'center', // 👈 Keep this
},
  sortSelect: {
    width: '100%',
    //height: 40,
    color: '#1f2937',
  },
  accordionContainer: {
    gap: 16,
  },
  questionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  questionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  questionToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  questionText: {
    fontWeight: '600',
    color: '#1f2937',
    fontSize: 16,
    flexShrink: 1,
    paddingRight: 16,
  },
  questionControls: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 0,
  },
  questionAnswerContainer: {
    backgroundColor: '#f9fafb',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    padding: 20,
    maxHeight: 300, // Limit height of answer area
  },
  questionAnswerText: {
    color: '#4b5563',
    fontSize: 15,
    lineHeight: 24,
  },
  difficultyBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 99,
    marginRight: 16,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  'difficulty-easy': { backgroundColor: '#dcfce7', color: '#166534' },
  'difficulty-medium': { backgroundColor: '#fef3c7', color: '#92400e' },
  'difficulty-hard': { backgroundColor: '#fee2e2', color: '#991b1b' },
  'difficulty-text-easy': { color: '#166534' },
  'difficulty-text-medium': { color: '#92400e' },
  'difficulty-text-hard': { color: '#991b1b' },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
  },
  infoContainer: {
    alignItems: 'center',
    padding: 32,
  },
  infoText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 8,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
  emptyState: {
    padding: 48,
    alignItems: 'center',
  },
  // --- Bottom Tab Bar Styles ---
  bottomTabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingVertical: 8,
  },
  tabButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
  },
  tabButtonActive: {
    // No specific background change, rely on icon/text color
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 4,
  },
  tabButtonTextActive: {
    color: '#4f46e5',
  },
  // --- Modal Styles ---
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
 modalBox: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '90%',
    maxWidth: 512,
    maxHeight: '80%', 
    flexShrink: 1, // 👈 ADD THIS LINE
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalScroll: {
  //  maxHeight: 400, // Limit scroll view height
  },
  scrollViewWindow: {
    maxHeight: 400, 
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontWeight: '500',
    marginBottom: 6,
    color: '#1f2937',
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  formTextarea: {
    minHeight: 100,
    textAlignVertical: 'top', // Align text to the top on Android
  },
  labelContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: '#eef2ff',
    borderRadius: 6,
  },
  aiButtonText: {
    color: '#4f46e5',
    fontWeight: '600',
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  buttonCancel: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonCancelText: {
    color: '#1f2937',
    fontWeight: '600',
  },
  buttonPrimary: {
    backgroundColor: '#4f46e5',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonPrimaryText: {
    color: 'white',
    fontWeight: '600',
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  formPicker: {
    width: '100%',
    //height: 40,
    color: '#1f2937',
  },
  animateSpin: {
    // This style is often needed to correctly apply animation on some native views
    transform: [{ rotate: '0deg' }], 
  },
});