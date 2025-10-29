import React, { useState, useRef, useEffect } from 'react'; // Added useEffect
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    // TextInput, // Not used directly
    Alert,
    Platform, // Keep Platform if needed for other reasons, but web-specific logic removed
    StatusBar
} from 'react-native';
import {
    ArrowLeft,
    Loader2,
    UploadCloud,
    FileText,
    CheckCircle,
    AlertTriangle,
    Lightbulb,
    ThumbsUp,
    Trash2
} from 'lucide-react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';

// --- Helper Function: File Size Formatting ---
const formatFileSize = (bytes) => {
    // Added checks for null/undefined/zero bytes
    if (!bytes || bytes <= 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)));
    const sizeIndex = Math.min(i, sizes.length - 1);
    return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(1)) + ' ' + sizes[sizeIndex];
};


// --- UPDATED File Picker Hook ---
const useRNFilePicker = (setSelectedFile, setError) => {
    // Removed fileInputRef as web logic is gone

    const handleUploadClick = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
                ],
                copyToCacheDirectory: false, // Keep false if not needing cache access
            });

            console.log("Document Picker Result:", result);

            // Use 'canceled' property check for newer Expo SDK versions
            if (result.canceled) {
                console.log("File selection cancelled");
                return; // Exit if cancelled
            }

            // Use 'assets' array for newer Expo SDK versions
            if (result.assets && result.assets.length > 0) {
                const fileAsset = result.assets[0];

                if (!fileAsset || !fileAsset.uri) {
                     setError("File selection failed: No file URI found.");
                     setSelectedFile(null);
                     return;
                }

                if (fileAsset.size && fileAsset.size > 5 * 1024 * 1024) { // 5MB limit
                     setError('File size exceeds 5MB limit.');
                     setSelectedFile(null);
                     return;
                }

                const selected = {
                    uri: fileAsset.uri,
                    name: fileAsset.name || 'resume.pdf',
                    type: fileAsset.mimeType || 'application/pdf',
                    size: fileAsset.size,
                };

                setSelectedFile(selected);
                setError(null); // Clear previous errors on successful selection
                // REMOVED setAnalysisResult(null); - Parent handles this

            } else {
                 // Fallback for older SDKs or unexpected result structure
                 setError("File selection failed unexpectedly.");
                 setSelectedFile(null);
            }

        } catch (err) {
            console.error("Document Picker Error:", err);
            // Check if it's a cancellation error (structure might vary based on library version)
            // Example check, might need adjustment:
            if (err.code === 'CANCELLED' || (err.message && err.message.includes('cancel'))) {
                 console.log("User cancelled document picker");
            } else {
                 setError('An error occurred while picking the file.');
                 setSelectedFile(null);
            }
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setError(null);
    };

    return { handleUploadClick, handleRemoveFile }; // Removed fileInputRef
};


// --- Main Component ---
export default function ResumeAnalyzer() { // REMOVED duplicate export
    const router = useRouter();

    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    // Using the updated file picker logic
    const { handleUploadClick, handleRemoveFile } = useRNFilePicker(setSelectedFile, setError);

    // Reset analysis result when a new file is selected
    useEffect(() => {
        if (selectedFile) {
            setAnalysisResult(null); // Reset analysis if a new file is picked
            // setError(null); // Optionally clear errors too, or let handleAnalyze clear it
        }
    }, [selectedFile]);

    // Handle analysis request
    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError('Please select a resume file first.');
            return;
        }

        setIsLoading(true);
        setError(null); // Clear previous errors before analyzing
        setAnalysisResult(null);

        const token = await AsyncStorage.getItem("token");
        const formData = new FormData();

        // --- RN FILE UPLOAD ---
        formData.append('resumeFile', {
            uri: selectedFile.uri,
            name: selectedFile.name,
            type: selectedFile.type || 'application/pdf',
        });
        // -----------------------

        try {
            const res = await fetch("https://placemate-ru7v.onrender.com/api/resume/analyze", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData
            });

            const data = await res.json();
            if (!res.ok) { throw new Error(data.message || `Analysis failed (${res.status})`); }
            setAnalysisResult(data);
        } catch (err) {
            console.error("Analysis Error:", err);
            setError(err.message || "An unexpected error occurred during analysis.");
            setAnalysisResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    // --- Results Renderer (Moved inside Component) ---
    const renderResults = (analysisResult) => {
        if (!analysisResult) return null;

        let scoreColor = '#4f46e5'; // Default blue
        if (analysisResult.score >= 85) scoreColor = '#10b981'; // Green for high scores
        else if (analysisResult.score < 60) scoreColor = '#f59e0b'; // Amber for low scores

        // Ensure arrays exist before mapping
        const positiveAspects = analysisResult.positiveAspects || [];
        const areasForImprovement = analysisResult.areasForImprovement || [];

        return (
            <View style={styles.resultsSection}>
                <Text style={styles.resultsTitle}>Analysis Results</Text>
                <View style={styles.scoreDisplay}>
                    <Text style={[styles.scoreValue, { color: scoreColor }]}>{analysisResult.score}</Text>
                    <Text style={styles.scoreLabel}>/ 100</Text>
                </View>
                <View style={[styles.feedbackCard, styles.feedbackCardOverall]}>
                    <Text style={styles.feedbackCardHeader}>Overall Feedback</Text>
                    <Text style={styles.feedbackCardParagraph}>{analysisResult.overallFeedback || "N/A"}</Text>
                </View>
                <View style={[styles.feedbackCard, styles.feedbackCardPositive]}>
                    <View style={styles.feedbackCardTitleContainer}>
                        <ThumbsUp size={20} color="#15803d" />
                        <Text style={[styles.feedbackCardHeader, styles.feedbackCardHeaderPositive]}>Strengths</Text>
                    </View>
                    <View style={styles.feedbackCardList}>
                        {positiveAspects.length > 0 ?
                            positiveAspects.map((item, index) => (
                                <View key={`pos-${index}`} style={styles.feedbackCardListItem}>
                                    <CheckCircle size={16} color="#22c55e" style={styles.listIcon} />
                                    <Text style={styles.feedbackCardListItemText}>{item}</Text>
                                </View>
                            ))
                            : <Text style={[styles.feedbackCardListItemText, styles.noItems]}>No specific strengths highlighted.</Text>
                        }
                    </View>
                </View>
                <View style={[styles.feedbackCard, styles.feedbackCardImprovement]}>
                    <View style={styles.feedbackCardTitleContainer}>
                        <Lightbulb size={20} color="#b45309" />
                        <Text style={[styles.feedbackCardHeader, styles.feedbackCardHeaderImprovement]}>Areas for Improvement</Text>
                    </View>
                    <View style={styles.feedbackCardList}>
                        {areasForImprovement.length > 0 ?
                            areasForImprovement.map((item, index) => (
                                <View key={`imp-${index}`} style={styles.feedbackCardListItem}>
                                    <AlertTriangle size={16} color="#f59e0b" style={styles.listIcon} />
                                    <Text style={styles.feedbackCardListItemText}>{item}</Text>
                                </View>
                            ))
                            : <Text style={[styles.feedbackCardListItemText, styles.noItems]}>No specific areas for improvement suggested.</Text>
                        }
                    </View>
                </View>
            </View>
        );
    };


    // --- MAIN RENDER ---
    return (
        <SafeAreaView style={styles.pageContainer}>
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <Pressable
                        onPress={() => { router.canGoBack() ? router.back() : router.push('/home'); }}
                        style={styles.backButton}
                        title="Back"
                    >
                        <ArrowLeft size={24} color="#4f46e5" />
                    </Pressable>
                    <Text style={styles.headerTitle}>AI Resume Analyzer</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.mainContent}>
                {/* --- Conditionally Render Upload Section --- */}
                {!analysisResult && (
                    <View style={styles.uploadMainSection}>
                        <View style={styles.introTextContainer}>
                            <Text style={styles.introTitle}>Get Instant Resume Feedback</Text>
                            <Text style={styles.introSubtitle}>
                                Upload your resume (PDF or DOCX) below. Our AI will analyze it
                                based on clarity, impact, and common best practices to provide
                                a score and actionable feedback.
                            </Text>
                        </View>

                        {/* REMOVED Web Platform specific input */}

                        {!selectedFile ? (
                            <View style={styles.uploadSection}>
                                <Pressable
                                    style={styles.uploadBox}
                                    onPress={handleUploadClick} // Simplified onPress
                                >
                                    <UploadCloud size={40} color="#4f46e5" />
                                    <Text style={styles.uploadText}>Click to Upload Resume</Text>
                                    <Text style={styles.uploadHint}>PDF or DOCX, Max 5MB</Text>
                                </Pressable>
                            </View>
                        ) : (
                            <View style={styles.fileDisplayWrapper}>
                                <View style={styles.fileDisplay}>
                                    <View style={styles.fileInfo}>
                                        <FileText size={20} color="#4b5563" />
                                        <Text style={styles.fileName} numberOfLines={1}>{selectedFile.name}</Text>
                                    </View>
                                    <Pressable onPress={handleRemoveFile} style={styles.removeFileBtn} title="Remove file">
                                        <Trash2 size={18} color="#ef4444" />
                                    </Pressable>
                                </View>
                                {/* Conditionally render file size only if it exists */}
                                {selectedFile.size != null && (
                                     <Text style={styles.fileSizeText}>
                                        Size: {formatFileSize(selectedFile.size)}
                                    </Text>
                                )}
                                <Pressable
                                    style={[styles.analyzeButton, isLoading && styles.analyzeButtonDisabled]}
                                    onPress={handleAnalyze}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <ActivityIndicator size="small" color="#fff" /> /* Use ActivityIndicator */ : <CheckCircle size={18} color="white" />}
                                    <Text style={styles.analyzeButtonText}>
                                        {isLoading ? 'Analyzing...' : 'Analyze Resume'}
                                    </Text>
                                </Pressable>
                            </View>
                        )}

                        
                         {/* <View style={styles.statusMessage}>
                            
                             {isLoading && (
                                 <View style={styles.loadingIndicator}>
                                     
                                     <ActivityIndicator size="small" color="#4f46e5" />
                                     <Text style={styles.loadingText}>Analyzing, please wait...</Text>
                                 </View>
                             )}
                             {error && !isLoading && (
                                 <View style={styles.errorContainer}> 
                                     <AlertTriangle size={18} color="#ef4444" />
                                     <Text style={styles.errorText}>{error}</Text>
                                 </View>
                             )}
                         </View> */}
                    </View>
                )}
                {/* --- End Conditional Upload Section --- */}

                {/* --- Results Area --- */}
                {/* Show results even if loading new file, hide only if analyzing */}
                {analysisResult && !isLoading && renderResults(analysisResult)}

            </ScrollView>
        </SafeAreaView>
    );
}

// --- StyleSheet ---
const styles = StyleSheet.create({
    // --- Base & Layout Styles ---
    pageContainer: { flex: 1, backgroundColor: '#f9fafe' },
    headerContainer: { flexDirection: 'row', alignItems: 'center', paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
    backButton: { padding: 8, backgroundColor: '#eef2ff', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    headerTitle: { fontSize: 24, fontWeight: '700', color: '#1f2937' }, // Adjusted size slightly
    mainContent: { paddingVertical: 32, paddingHorizontal: 24, maxWidth: 800, alignSelf: 'center', width: '100%', alignItems: 'center' },
    uploadMainSection: { width: '100%', alignItems: 'center' },
    introTextContainer: { alignItems: 'center', marginBottom: 32, maxWidth: 600 },
    introTitle: { fontSize: 26, fontWeight: '600', color: '#1f2937', marginBottom: 12, textAlign: 'center' }, // Adjusted size
    introSubtitle: { fontSize: 16, color: '#6b7280', lineHeight: 24, textAlign: 'center' },
    uploadSection: { width: '100%', maxWidth: 500, marginBottom: 24, alignItems: 'center' },
    uploadBox: { borderWidth: 2, borderStyle: 'dashed', borderColor: '#a5b4fc', backgroundColor: '#eef2ff', borderRadius: 12, paddingVertical: 48, paddingHorizontal: 24, justifyContent: 'center', alignItems: 'center', gap: 12, width: '100%' }, // Increased border radius and padding
    uploadText: { color: '#4338ca', fontWeight: '600', fontSize: 18, textAlign: 'center' },
    uploadHint: { color: '#6b7280', fontSize: 14, marginTop: 4, textAlign: 'center' },
    fileDisplayWrapper: { width: '100%', maxWidth: 500, alignItems: 'center', gap: 16 },
    fileDisplay: { paddingVertical: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#d1d5db', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1, width: '100%', justifyContent: 'space-between' },
    fileInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flexShrink: 1, overflow: 'hidden', paddingRight: 10 /* Add padding to prevent text touching button */ },
    fileName: { color: '#1f2937', fontWeight: '500', flexShrink: 1 },
    fileSizeText: { color: '#6b7280', fontSize: 14, alignSelf: 'flex-start', marginLeft: 16, marginTop: -8 /* Pull up slightly */ },
    removeFileBtn: { padding: 4, flexShrink: 0 },
    analyzeButton: { backgroundColor: '#4f46e5', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 8, flexDirection: 'row', alignItems: 'center', gap: 10, width: '100%', justifyContent: 'center', minHeight: 48 }, // Increased padding/gap, added minHeight
    analyzeButtonText: { color: 'white', fontWeight: '600', fontSize: 16 },
    analyzeButtonDisabled: { backgroundColor: '#a5b4fc', opacity: 0.7 }, // Added opacity
    statusMessage: { width: '100%', maxWidth: 500, marginTop: 20, alignItems: 'center', minHeight: 40 /* Ensure space for message */ },
    errorContainer: { // Added container for error layout
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 10,
        backgroundColor: '#fee2e2', // Light red background for errors
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#fca5a5'
    },
    errorText: { color: '#b91c1c', fontWeight: '500', fontSize: 15, textAlign: 'center', flexShrink: 1 /* Allow text wrap */ },
    loadingIndicator: { paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
    loadingText: { color: '#4f46e5', fontWeight: '500', fontSize: 16 },
    // Removed spinner style, using ActivityIndicator
    resultsSection: { marginTop: 40, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 12, padding: 24, width: '100%', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }, // Increased padding
    resultsTitle: { textAlign: 'center', fontSize: 24, fontWeight: '600', color: '#1f2937', marginTop: 8, marginBottom: 24 },
    scoreDisplay: { alignItems: 'center', marginBottom: 32 },
    scoreValue: { fontSize: 60, fontWeight: 'bold', lineHeight: 60 }, // Increased size slightly
    scoreLabel: { fontSize: 16, color: '#6b7280', fontWeight: '500', marginTop: 4 },
    feedbackCard: { marginBottom: 24, padding: 20, borderRadius: 8, borderWidth: 1, borderColor: '#e5e7eb', backgroundColor: '#f9fafb' }, // Adjusted padding
    feedbackCardTitleContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 12, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' }, // Added marginBottom
    feedbackCardHeader: { fontSize: 18, fontWeight: '600', color: '#1f2937' }, // Adjusted size
    feedbackCardParagraph: { color: '#374151', lineHeight: 24, fontSize: 15 }, // Adjusted line height
    feedbackCardList: { marginTop: 12, gap: 10 }, // Added gap between list items
    feedbackCardListItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, // Adjusted gap
    feedbackCardListItemText: { fontSize: 15, flexShrink: 1, color: '#374151', lineHeight: 22 }, // Added line height
    listIcon: { marginTop: 4, flexShrink: 0 },
    noItems: { fontStyle: 'italic', color: '#6b7280' },
    feedbackCardOverall: { backgroundColor: '#fff', borderColor: '#e5e7eb' },
    feedbackCardPositive: { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' },
    feedbackCardHeaderPositive: { color: '#15803d' },
    feedbackCardImprovement: { backgroundColor: '#fffbeb', borderColor: '#fde68a' },
    feedbackCardHeaderImprovement: { color: '#b45309' },
});