import React, { useState, useRef } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Pressable,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    Alert,
    Platform, // Used for platform-specific file handling placeholder
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
import AsyncStorage from '@react-native-async-storage/async-storage'; // RN equivalent of localStorage
import * as DocumentPicker from 'expo-document-picker';

// --- Helper Function: File Size Formatting ---
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};


// --- Placeholder for RN File Picker (REQUIRED FOR ACTUAL FUNCTIONALITY) ---
const useRNFilePicker = (setSelectedFile, setError) => {
    // In a real React Native app, you would integrate a library like 
    // react-native-document-picker here.
    
    // This ref is only used to simulate state reset, not actual DOM manipulation.
    const fileInputRef = useRef(null); 

    const handleUploadClick = async () => {
        // --- START PLACEHOLDER ---
        // --- NATIVE FILE PICKER LOGIC ---
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: [
                    'application/pdf',
                    'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
                ],
                copyToCacheDirectory: false, // Optional: Usually true, but false might save space if you only need the URI briefly
            });

            console.log("Document Picker Result:", result); // Log the result for debugging

            // Check the structure of the result (might vary slightly)
            if (result.type === 'success' || (result.assets && result.assets.length > 0)) {
                // Expo SDK 48+ uses assets array
                const fileAsset = result.assets ? result.assets[0] : result; 

                if (!fileAsset || !fileAsset.uri) {
                     setError("File selection failed: No file URI found.");
                     setSelectedFile(null);
                     return;
                }

                // Basic size check (fileAsset.size might be null/undefined sometimes)
                if (fileAsset.size && fileAsset.size > 5 * 1024 * 1024) { // 5MB limit
                     setError('File size exceeds 5MB limit.');
                     setSelectedFile(null);
                     return;
                }

                // Construct the file object needed for upload
                const selected = {
                    uri: fileAsset.uri,
                    name: fileAsset.name || 'resume.pdf', // Use provided name or default
                    type: fileAsset.mimeType || 'application/pdf', // Use mimeType or default
                    size: fileAsset.size, 
                };

                setSelectedFile(selected);
                setError(null);
                setAnalysisResult(null); // Reset analysis on new file select

            } else if (result.type === 'cancel') {
                // User cancelled the picker - do nothing or provide feedback
                console.log("File selection cancelled");
            } else {
                 setError("File selection failed unexpectedly.");
                 setSelectedFile(null);
            }

        } catch (err) {
            console.error("Document Picker Error:", err);
            // Handle specific errors if needed (e.g., permissions)
            if (DocumentPicker.isCancel(err)) {
                 console.log("User cancelled document picker");
            } else {
                 setError('An error occurred while picking the file.');
                 setSelectedFile(null);
                 // Rethrow or handle error appropriately
                 // throw err; 
            }
        }
        // --- END NATIVE LOGIC ---
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setError(null);
        // Optional: Resetting value property of file input is not necessary in RN
       // if (fileInputRef.current) {
            // Placeholder for any state cleanup if needed
       // }
    };
    
    return { fileInputRef, handleUploadClick, handleRemoveFile };
};


// --- Results Renderer (Converted to RN) ---
const renderResults = (analysisResult) => {
    if (!analysisResult) return null;

    let scoreColor = '#4f46e5';
    if (analysisResult.score >= 85) scoreColor = '#10b981';
    else if (analysisResult.score < 60) scoreColor = '#f59e0b';

    return (
        <View style={styles.resultsSection}>
            <Text style={styles.resultsTitle}>Analysis Results</Text>
            
            {/* Score Display */}
            <View style={styles.scoreDisplay}>
                <Text style={[styles.scoreValue, { color: scoreColor }]}>{analysisResult.score}</Text>
                <Text style={styles.scoreLabel}>/ 100</Text>
            </View>

            {/* Overall Feedback Card */}
            <View style={[styles.feedbackCard, styles.feedbackCardOverall]}>
                <Text style={styles.feedbackCardHeader}>Overall Feedback</Text>
                <Text style={styles.feedbackCardParagraph}>{analysisResult.overallFeedback}</Text>
            </View>

            {/* Positives Card */}
            <View style={[styles.feedbackCard, styles.feedbackCardPositive]}>
                <View style={styles.feedbackCardTitleContainer}>
                    <ThumbsUp size={20} color="#15803d" />
                    <Text style={[styles.feedbackCardHeader, styles.feedbackCardHeaderPositive]}>Strengths</Text>
                </View>
                <View style={styles.feedbackCardList}>
                    {analysisResult.positiveAspects.length > 0 ?
                        analysisResult.positiveAspects.map((item, index) => ( 
                            <View key={index} style={styles.feedbackCardListItem}> 
                                <CheckCircle size={16} color="#22c55e" style={styles.listIcon} /> 
                                <Text style={styles.feedbackCardListItemText}>{item}</Text> 
                            </View> 
                        ))
                        : <Text style={[styles.feedbackCardListItemText, styles.noItems]}>No specific strengths highlighted.</Text>
                    }
                </View>
            </View>

            {/* Improvements Card */}
            <View style={[styles.feedbackCard, styles.feedbackCardImprovement]}>
                <View style={styles.feedbackCardTitleContainer}>
                    <Lightbulb size={20} color="#b45309" />
                    <Text style={[styles.feedbackCardHeader, styles.feedbackCardHeaderImprovement]}>Areas for Improvement</Text>
                </View>
                <View style={styles.feedbackCardList}>
                    {analysisResult.areasForImprovement.length > 0 ?
                        analysisResult.areasForImprovement.map((item, index) => ( 
                            <View key={index} style={styles.feedbackCardListItem}> 
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


// --- Main Component (Converted to RN) ---
export default function ResumeAnalyzer() {
    const router = useRouter();

    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    // Using the placeholder file picker logic
    const { fileInputRef, handleUploadClick, handleRemoveFile } = useRNFilePicker(setSelectedFile, setError);

    // Placeholder for browser file change handler
    const handleFileChange = () => { /* Logic handled by useRNFilePicker hook */ };

    // Handle analysis request
    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError('Please select a resume file first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        
        // --- RN specific: Use AsyncStorage instead of localStorage ---
        const token = await AsyncStorage.getItem("token");

        // The FormData approach is correct, but 'selectedFile' needs to be a 
        // proper object with a 'uri' and 'type' for RN to handle file upload.
        // The fetch body logic needs adjustment for RN's fetch/FormData usage.
        
        const formData = new FormData();
        
        // --- VITAL RN FILE UPLOAD ADJUSTMENT ---
        // For actual RN file upload, you must include file URI and type:
        if (Platform.OS === 'web') {
            // Browser behavior (use for local testing)
            formData.append('resumeFile', selectedFile);
        } else {
            // React Native behavior: use the URI and mime type
            formData.append('resumeFile', {
                uri: selectedFile.uri, // URI obtained from document picker
                name: selectedFile.name,
                type: selectedFile.type || 'application/pdf',
            });
        }
        // ----------------------------------------
        
        try {
            const res = await fetch("https://placemate-ru7v.onrender.com/api/resume/analyze", {
                method: "POST",
                headers: { 
                    "Authorization": `Bearer ${token}`,
                    // VITAL: Do NOT set Content-Type header when using FormData in RN fetch.
                    // Let the system set it, including the boundary.
                },
                body: formData
            });
            
            const data = await res.json();
            if (!res.ok) { throw new Error(data.message || `Analysis failed (${res.status})`); }
            setAnalysisResult(data);
        } catch (err) {
            console.error("Analysis Error:", err);
            setError(err.message);
            setAnalysisResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.pageContainer}>
            <View style={styles.headerContainer}>
                <View style={styles.headerLeft}>
                    <Pressable
                        onPress={() => {
                            if (router.canGoBack()) {
                                router.back();
                            } else {
                                router.push('/home');
                            }
                        }}
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
        
        {/* --- INTRODUCTORY TEXT ADDED HERE --- */}
        <View style={styles.introTextContainer}>
            <Text style={styles.introTitle}>Get Instant Resume Feedback</Text>
            <Text style={styles.introSubtitle}>
                Upload your resume (PDF or DOCX) below. Our AI will analyze it
                based on clarity, impact, and common best practices to provide
                a score and actionable feedback.
            </Text>
        </View>
        {/* ------------------------------------ */}

        {/* --- 1. THE FIX: Standard HTML Input for Web --- */}
        {Platform.OS === 'web' && (
            <input
                type="file"
                ref={fileInputRef}
                onChange={(event) => {
                    // This is the file change handler specific to the web
                    const file = event.target.files[0];
                    if (file) {
                        if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                            if (file.size <= 5 * 1024 * 1024) { // 5MB limit
                                setSelectedFile(file);
                                setError(null);
                                setAnalysisResult(null);
                            } else { setError('File size exceeds 5MB limit.'); setSelectedFile(null); }
                        } else { setError('Invalid file type. Please upload a PDF or DOCX file.'); setSelectedFile(null); }
                    }
                }}
                accept=".pdf,.docx"
                style={{ display: 'none' }}
            />
        )}
        {/* ------------------------------------------------ */}

        {!selectedFile ? (
            <View style={styles.uploadSection}>
              <Pressable 
                    style={styles.uploadBox} 
                    onPress={handleUploadClick} // 👈 Simply call the hook's function
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
                                <Text style={styles.fileSizeText}>
                                    Size: {formatFileSize(selectedFile.size)}
                                </Text>
                                <Pressable
                                    style={[styles.analyzeButton, isLoading && styles.analyzeButtonDisabled]}
                                    onPress={handleAnalyze}
                                    disabled={isLoading}
                                >
                                    {isLoading ? <Loader2 size={18} color="white" style={styles.spinner} /> : <CheckCircle size={18} color="white" />}
                                    <Text style={styles.analyzeButtonText}>
                                        {isLoading ? 'Analyzing...' : 'Analyze Resume'}
                                    </Text>
                                </Pressable>
                            </View>
                        )}

                        {/* <View style={styles.statusMessage}>
                            {isLoading && (
                                <View style={styles.loadingIndicator}>
                                    <Text style={styles.loadingText}>Loading...</Text>
                                </View>
                            )}
                            {error && !isLoading && (
                                <Text style={styles.errorText}>
                                    <AlertTriangle size={18} color="#ef4444" /> {error}
                                </Text>
                            )}
                        </View> */}
                    </View>
                )}
                {/* --- End Conditional Upload Section --- */}

                {/* --- Results Area (Rendered when analysisResult is available) --- */}
                {!isLoading && analysisResult && renderResults(analysisResult)}

            </ScrollView>
        </SafeAreaView>
    );
}

// --- StyleSheet (Converted from CSS) ---
const styles = StyleSheet.create({
    // --- Base & Layout Styles ---
    pageContainer: {
        flex: 1,
        backgroundColor: '#f9fafe',
    },
    headerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 12 : 12, // 👈 ADDED
        paddingBottom: 12, // 👈 ADDED
        paddingHorizontal: 16, // 1.5rem = 24px
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16, // 1rem = 16px
    },
    backButton: {
        padding: 8, // 0.5rem = 8px
        backgroundColor: '#eef2ff',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 28, // 1.75rem = 28px
        fontWeight: '700',
        color: '#1f2937',
    },
    mainContent: {
        paddingVertical: 32,
        paddingHorizontal: 24,
        maxWidth: 800,
        alignSelf: 'center',
        width: '100%',
        alignItems: 'center',
    },
    
    // --- Intro Text Styles ---
    uploadMainSection: {
        width: '100%',
        alignItems: 'center',
    },
    introTextContainer: {
        alignItems: 'center',
        marginBottom: 32, // 2rem
        maxWidth: 600,
    },
    introTitle: {
        fontSize: 28, // 1.8rem approx
        fontWeight: '600',
        color: '#1f2937',
        marginBottom: 12, // 0.75rem
        textAlign: 'center',
    },
    introSubtitle: {
        fontSize: 16, // 1rem
        color: '#6b7280',
        lineHeight: 24, // 1.6
        margin: 0,
        textAlign: 'center',
    },

    // --- Upload Area ---
    uploadSection: {
        width: '100%',
        maxWidth: 500,
        marginBottom: 24, // 1.5rem
        alignItems: 'center',
    },
    uploadBox: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#a5b4fc',
        backgroundColor: '#eef2ff',
        borderRadius: 8,
        paddingVertical: 40, // 2.5rem
        paddingHorizontal: 24, // 1.5rem
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12, // 0.75rem
        width: '100%',
    },
    uploadText: {
        color: '#4338ca',
        fontWeight: '600',
        fontSize: 18, // 1.1rem approx
        textAlign: 'center',
    },
    uploadHint: {
        color: '#6b7280',
        fontSize: 14, // 0.9rem
        marginTop: 4, // 0.25rem
        textAlign: 'center',
    },
    
    // --- File Display ---
    fileDisplayWrapper: {
        width: '100%',
        maxWidth: 500,
        alignItems: 'center',
        gap: 16, // 1.5rem
    },
    fileDisplay: {
        paddingVertical: 12, // 0.75rem
        paddingHorizontal: 16, // 1rem
        backgroundColor: '#fff',
        borderRadius: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#d1d5db',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
        width: '100%',
        justifyContent: 'space-between',
    },
    fileInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexShrink: 1,
        overflow: 'hidden',
    },
    fileName: {
        color: '#1f2937',
        fontWeight: '500',
        flexShrink: 1,
    },
    fileSizeText: {
        color: '#6b7280',
        fontSize: 14,
        alignSelf: 'flex-start',
        marginLeft: 16,
    },
    removeFileBtn: {
        padding: 4,
        flexShrink: 0,
    },
    analyzeButton: {
        backgroundColor: '#4f46e5',
        paddingVertical: 13, // 0.8rem
        paddingHorizontal: 32, // 2rem
        borderRadius: 8,
        fontWeight: '600',
        fontSize: 16, // 1rem
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8, // 0.5rem
        width: '100%',
        justifyContent: 'center',
    },
    analyzeButtonText: {
        color: 'white',
        fontWeight: '600',
        fontSize: 16,
    },
    analyzeButtonDisabled: {
        backgroundColor: '#a5b4fc',
    },

    // --- Status Messages ---
    statusMessage: {
        width: '100%',
        maxWidth: 500,
        marginTop: 16, // 1rem
        alignItems: 'center',
    },
    errorText: {
        color: '#ef4444',
        fontWeight: '500',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        fontSize: 15, // 0.95rem
    },
    loadingIndicator: {
        paddingVertical: 32, // 2rem
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        color: '#4f46e5',
        fontWeight: '500',
        fontSize: 16,
    },
    spinner: {
        transform: [{ rotate: '0deg' }], // Animation handled via native driver if possible, or manual Animated in RN
    },

    // --- Results Section ---
    resultsSection: {
        marginTop: 40, // 2.5rem
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 12,
        padding: 16, // 1rem
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    resultsTitle: {
        textAlign: 'center',
        fontSize: 24, // 1.5rem
        fontWeight: '600',
        color: '#1f2937',
        marginTop: 8,
        marginBottom: 24, // 1.5rem
    },

    // --- Score Display ---
    scoreDisplay: {
        alignItems: 'center',
        marginBottom: 32, // 2rem
    },
    scoreValue: {
        fontSize: 56, // 3.5rem
        fontWeight: 'bold',
        lineHeight: 56,
    },
    scoreLabel: {
        fontSize: 16, // 1rem
        color: '#6b7280',
        fontWeight: '500',
    },

    // --- Feedback Card ---
    feedbackCard: {
        marginBottom: 24, // 1.5rem
        padding: 24, // 1.5rem
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
    },
    feedbackCardTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10, // 0.6rem
        paddingBottom: 12, // 0.75rem
        borderBottomWidth: 1,
        borderBottomColor: '#e5e7eb',
    },
    feedbackCardHeader: {
        fontSize: 19, // 1.2rem
        fontWeight: '600',
        color: '#1f2937',
        margin: 0,
    },
    feedbackCardParagraph: {
        color: '#374151',
        lineHeight: 25.5, // 1.7
        marginTop: 12,
        fontSize: 15, // 0.95rem
    },
    feedbackCardList: {
        marginTop: 8, // 0.5rem
        // RN equivalent of ul
    },
    feedbackCardListItem: {
        color: '#374151',
        lineHeight: 25.5, // 1.7
        marginBottom: 12, // 0.75rem
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12, // 0.75rem
    },
    feedbackCardListItemText: {
        fontSize: 15, // 0.95rem
        flexShrink: 1,
        color: '#374151',
    },
    listIcon: {
        marginTop: 4, // Aligns icon with text line-height
        flexShrink: 0,
    },
    noItems: {
        fontStyle: 'italic',
        color: '#6b7280',
    },

    // Card Specific Colors
    feedbackCardOverall: {
        backgroundColor: '#fff',
        borderColor: '#e5e7eb',
    },
    feedbackCardPositive: {
        backgroundColor: '#f0fdf4',
        borderColor: '#bbf7d0',
    },
    feedbackCardHeaderPositive: {
        color: '#15803d',
    },
    feedbackCardImprovement: {
        backgroundColor: '#fffbeb',
        borderColor: '#fde68a',
    },
    feedbackCardHeaderImprovement: {
        color: '#b45309',
    },
});