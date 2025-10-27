import React, { useState, useRef } from 'react';
import { ArrowLeft, Loader2, UploadCloud, FileText, CheckCircle, AlertTriangle, Lightbulb, ThumbsUp, Trash2 } from 'lucide-react';
import { useRouter } from 'expo-router';

export default function ResumeAnalyzer() {
    const router = useRouter();
    const fileInputRef = useRef(null); // Ref for the hidden file input

    const [selectedFile, setSelectedFile] = useState(null); // Holds the file object
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null); // { score, overallFeedback, positiveAspects, areasForImprovement }
    const [error, setError] = useState(null);

    // Handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Basic validation (can enhance)
            if (file.type === 'application/pdf' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                if (file.size <= 5 * 1024 * 1024) { // 5MB limit check on frontend too
                    setSelectedFile(file);
                    setError(null); // Clear previous errors
                    setAnalysisResult(null); // Clear previous results
                } else {
                    setError('File size exceeds 5MB limit.');
                    setSelectedFile(null);
                }
            } else {
                setError('Invalid file type. Please upload a PDF or DOCX file.');
                setSelectedFile(null);
            }
        }
    };

    // Trigger hidden file input click
    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    // Remove selected file
    const handleRemoveFile = () => {
        setSelectedFile(null);
        setAnalysisResult(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = ''; // Reset file input
        }
    };

    // Handle analysis request
    const handleAnalyze = async () => {
        if (!selectedFile) {
            setError('Please select a resume file first.');
            return;
        }

        setIsLoading(true);
        setError(null);
        setAnalysisResult(null);
        const token = localStorage.getItem("token");

        const formData = new FormData();
        formData.append('resumeFile', selectedFile); // Backend expects 'resumeFile'

        try {
            const res = await fetch("http://localhost:5000/api/resume/analyze", {
                method: "POST",
                headers: {
                    // Content-Type is set automatically by browser for FormData
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || `Analysis failed (${res.status})`);
            }

            setAnalysisResult(data); // Store the successful analysis

        } catch (err) {
            console.error("Analysis Error:", err);
            setError(err.message);
            setAnalysisResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Render results section
    const renderResults = () => {
        if (!analysisResult) return null;

        return (
            <div className="results-section">
                <h2 className="results-title">Analysis Results</h2>

                <div className="score-badge">Score: {analysisResult.score}/100</div>

                <div className="feedback-section">
                    <h3>Overall Feedback</h3>
                    <p>{analysisResult.overallFeedback}</p>
                </div>

                <div className="feedback-section positive">
                    <h3><ThumbsUp size={18} /> Positive Aspects</h3>
                    <ul>
                        {analysisResult.positiveAspects.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>

                <div className="feedback-section improvement">
                    <h3><Lightbulb size={18} /> Areas for Improvement</h3>
                    <ul>
                        {analysisResult.areasForImprovement.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <>
            <style>{`
                body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
                .page-container { display: flex; flex-direction: column; min-height: 100vh; overflow-y: auto; }
                .header-container { display: flex; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
                .header-left { display: flex; align-items: center; gap: 1rem; }
                .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
                .main-content { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; text-align: center;}

                .upload-section { margin-bottom: 2rem; }
                .upload-box {
                    border: 2px dashed #a5b4fc; background-color: #eef2ff; border-radius: 8px;
                    padding: 2.5rem 1rem; cursor: pointer; transition: background-color 0.2s;
                    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem;
                }
                .upload-box:hover { background-color: #e0e7ff; }
                .upload-icon { color: #4f46e5; }
                .upload-text { color: #4338ca; font-weight: 600; font-size: 1.1rem; }
                .upload-hint { color: #6b7280; font-size: 0.9rem; margin-top: 0.25rem;}

                .file-display {
                    margin-top: 1rem; padding: 0.75rem 1rem; background-color: #f3f4f6;
                    border-radius: 6px; display: inline-flex; align-items: center; gap: 0.75rem;
                    border: 1px solid #e5e7eb; max-width: 90%;
                }
                .file-icon { color: #4b5563; }
                .file-name { color: #1f2937; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
                .remove-file-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.25rem; display: flex; margin-left: 0.5rem;}

                .analyze-button {
                    background-color: #4f46e5; color: white; border: none; padding: 0.8rem 2rem;
                    border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;
                    display: inline-flex; align-items: center; gap: 0.5rem; transition: background-color 0.2s;
                    margin-top: 1rem;
                }
                .analyze-button:hover { background-color: #4338ca; }
                .analyze-button:disabled { background-color: #a5b4fc; cursor: not-allowed; }

                .error-text { color: #ef4444; font-weight: 500; margin-top: 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem;}
                .spinner { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                .results-section {
                    margin-top: 3rem; background-color: #fff; border: 1px solid #e5e7eb;
                    border-radius: 8px; padding: 2rem; text-align: left;
                    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                .results-title { text-align: center; font-size: 1.5rem; font-weight: 600; color: #1f2937; margin: 0 0 1.5rem 0; }
                .score-badge {
                    display: inline-block; background-color: #4f46e5; color: white;
                    padding: 0.5rem 1rem; border-radius: 99px; font-weight: bold;
                    font-size: 1.2rem; margin: 0 auto 2rem auto; display: block; width: fit-content;
                 }
                .feedback-section { margin-bottom: 2rem; }
                .feedback-section h3 { font-size: 1.15rem; font-weight: 600; color: #111827; margin: 0 0 0.75rem 0; display: flex; align-items: center; gap: 0.5rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem;}
                .feedback-section p { color: #4b5563; line-height: 1.6; margin: 0; }
                .feedback-section ul { list-style: none; padding: 0; margin: 0; }
                .feedback-section li { color: #4b5563; line-height: 1.6; margin-bottom: 0.5rem; padding-left: 1.5rem; position: relative; }
                .feedback-section li::before {
                     content: '•'; position: absolute; left: 0; top: 0; font-size: 1.2em; line-height: inherit;
                }
                .feedback-section.positive h3 { color: #059669; } /* Green */
                .feedback-section.positive li::before { color: #10b981; }
                .feedback-section.improvement h3 { color: #d97706; } /* Amber */
                .feedback-section.improvement li::before { color: #f59e0b; }

            `}</style>

            <div className="page-container">
                <header className="header-container">
                    <div className="header-left">
                        <button onClick={() => router.back()} className="back-button" title="Back">
                            <ArrowLeft size={24} color="#4f46e5" />
                        </button>
                        <h1 className="header-title">AI Resume Analyzer</h1>
                    </div>
                </header>

                <main className="main-content">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".pdf,.docx" // Specify accepted types
                        style={{ display: 'none' }} // Hide the actual input
                    />

                    <div className="upload-section">
                        {!selectedFile ? (
                            <button className="upload-box" onClick={handleUploadClick}>
                                <UploadCloud size={40} className="upload-icon" />
                                <span className="upload-text">Upload Your Resume</span>
                                <span className="upload-hint">PDF or DOCX, Max 5MB</span>
                            </button>
                        ) : (
                            <div className="file-display">
                                <FileText size={20} className="file-icon" />
                                <span className="file-name">{selectedFile.name}</span>
                                <button onClick={handleRemoveFile} className="remove-file-btn" title="Remove file">
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        )}
                    </div>

                    {error && (
                        <p className="error-text">
                            <AlertTriangle size={18}/> {error}
                        </p>
                    )}

                    <button
                        className="analyze-button"
                        onClick={handleAnalyze}
                        disabled={!selectedFile || isLoading}
                    >
                        {isLoading ? <Loader2 size={18} className="spinner" /> : <CheckCircle size={18} />}
                        {isLoading ? 'Analyzing...' : 'Analyze Resume'}
                    </button>

                    {/* Results Area */}
                    {renderResults()}

                </main>
            </div>
        </>
    );
}