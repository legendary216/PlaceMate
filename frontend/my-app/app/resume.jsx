import React, { useState, useRef } from 'react';
import { ArrowLeft, Loader2, UploadCloud, FileText, CheckCircle, AlertTriangle, Lightbulb, ThumbsUp, Trash2 } from 'lucide-react';
import { useRouter } from 'expo-router';

export default function ResumeAnalyzer() {
    const router = useRouter();
    const fileInputRef = useRef(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [analysisResult, setAnalysisResult] = useState(null);
    const [error, setError] = useState(null);

    // Handle file selection
    const handleFileChange = (event) => {
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
    };

    // Trigger hidden file input click
    const handleUploadClick = () => { fileInputRef.current.click(); };

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
        formData.append('resumeFile', selectedFile);

        try {
            const res = await fetch("https://placemate-ru7v.onrender.com/api/resume/analyze", {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
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

    // Render results section (Improved UI)
    const renderResults = () => {
        if (!analysisResult) return null;

        // Determine score color dynamically (example)
        let scoreColor = '#4f46e5'; // Default blue/purple
        if (analysisResult.score >= 85) scoreColor = '#10b981'; // Green for high scores
        else if (analysisResult.score < 60) scoreColor = '#f59e0b'; // Amber for lower scores

        return (
            <div className="results-section">
                <h2 className="results-title">Analysis Results</h2>

                {/* Score Display */}
                <div className="score-display">
                    <div className="score-value" style={{ color: scoreColor }}>{analysisResult.score}</div>
                    <div className="score-label">/ 100</div>
                </div>

                {/* Overall Feedback Card */}
                <div className="feedback-card overall">
                    <h3>Overall Feedback</h3>
                    <p>{analysisResult.overallFeedback}</p>
                </div>

                {/* Positives Card */}
                <div className="feedback-card positive">
                    <h3><ThumbsUp size={20} /> Strengths</h3>
                    <ul>
                        {analysisResult.positiveAspects.map((item, index) => (
                            <li key={index}> <CheckCircle size={16} className="list-icon" /> <span>{item}</span> </li>
                        ))}
                         {analysisResult.positiveAspects.length === 0 && <li className="no-items">No specific strengths highlighted.</li>}
                    </ul>
                </div>

                {/* Improvements Card */}
                <div className="feedback-card improvement">
                    <h3><Lightbulb size={20} /> Areas for Improvement</h3>
                    <ul>
                        {analysisResult.areasForImprovement.map((item, index) => (
                           <li key={index}> <AlertTriangle size={16} className="list-icon" /> <span>{item}</span> </li>
                        ))}
                         {analysisResult.areasForImprovement.length === 0 && <li className="no-items">No specific areas for improvement suggested.</li>}
                    </ul>
                </div>
            </div>
        );
    };

    return (
        <>
            <style>{`
                /* --- Base & Layout Styles --- */
                /* --- NEW Intro Text Styles --- */
        .intro-text-container {
            text-align: center;
            margin-bottom: 2rem; /* Space below the text */
            max-width: 600px; /* Limit width */
        }
        .intro-title {
            font-size: 1.8rem; /* Adjust size */
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 0.75rem;
        }
        .intro-subtitle {
            font-size: 1rem;
            color: #6b7280;
            line-height: 1.6;
            margin: 0;
        }
        /* --- END NEW Styles --- */
                body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; color: #374151; }
                .page-container { display: flex; flex-direction: column; min-height: 100vh; overflow-y: auto; }
                .header-container { display: flex; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
                .header-left { display: flex; align-items: center; gap: 1rem; }
                .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
                .header-title { font-size: 1.75rem; font-weight: 700; color: #1f2937; margin: 0; }
                .main-content { padding: 2rem 1.5rem 3rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; }

                /* --- Upload Area --- */
                .upload-section { width: 100%; max-width: 500px; margin-bottom: 1.5rem; display: flex; flex-direction: column; align-items: center; }
                .upload-box { border: 2px dashed #a5b4fc; background-color: #eef2ff; border-radius: 8px; padding: 2.5rem 1.5rem; cursor: pointer; transition: background-color 0.2s; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.75rem; width: 100%; box-sizing: border-box; }
                .upload-box:hover { background-color: #e0e7ff; }
                .upload-icon { color: #4f46e5; }
                .upload-text { color: #4338ca; font-weight: 600; font-size: 1.1rem; text-align: center; }
                .upload-hint { color: #6b7280; font-size: 0.9rem; margin-top: 0.25rem; text-align: center;}
                .file-display-wrapper { width: 100%; max-width: 500px; display: flex; flex-direction: column; align-items: center; gap: 1.5rem; }
                .file-display { padding: 0.75rem 1rem; background-color: #fff; border-radius: 8px; display: inline-flex; align-items: center; gap: 0.75rem; border: 1px solid #d1d5db; box-shadow: 0 1px 2px rgba(0,0,0,0.05); width: 100%; justify-content: space-between; box-sizing: border-box; }
                .file-info { display: flex; align-items: center; gap: 0.75rem; overflow: hidden; }
                .file-icon { color: #4b5563; flex-shrink: 0; }
                .file-name { color: #1f2937; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;}
                .remove-file-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.25rem; display: flex; flex-shrink: 0;}
                .analyze-button { background-color: #4f46e5; color: white; border: none; padding: 0.8rem 2rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem; display: inline-flex; align-items: center; gap: 0.5rem; transition: background-color 0.2s; }
                .analyze-button:hover { background-color: #4338ca; }
                .analyze-button:disabled { background-color: #a5b4fc; cursor: not-allowed; }

                /* --- Status Messages --- */
                .status-message { width: 100%; max-width: 500px; margin-top: 1rem; text-align: center; }
                .error-text { color: #ef4444; font-weight: 500; display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.95rem; }
                .loading-indicator { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: #4f46e5; font-weight: 500; font-size: 1rem; padding: 2rem 0;}
                .spinner { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

                /* --- Results Section --- */
                .results-section { margin-top: 2.5rem; background-color: #fff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 1rem; /* Reduced padding */ width: 100%; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                .results-title { text-align: center; font-size: 1.5rem; font-weight: 600; color: #1f2937; margin: 0.5rem 0 1.5rem 0; }

                /* --- Score Display --- */
                .score-display { text-align: center; margin-bottom: 2rem; }
                .score-value { font-size: 3.5rem; font-weight: bold; line-height: 1; }
                .score-label { font-size: 1rem; color: #6b7280; font-weight: 500; }

                /* --- Feedback Card --- */
                .feedback-card { margin-bottom: 1.5rem; padding: 1.5rem; border-radius: 8px; border: 1px solid #e5e7eb; background-color: #f9fafb; }
                .feedback-card:last-child { margin-bottom: 0; }
                .feedback-card h3 { font-size: 1.2rem; font-weight: 600; color: #1f2937; margin: 0 0 1rem 0; display: flex; align-items: center; gap: 0.6rem; padding-bottom: 0.75rem; border-bottom: 1px solid #e5e7eb;}
                .feedback-card p { color: #374151; line-height: 1.7; margin: 0; font-size: 0.95rem; }
                .feedback-card ul { list-style: none; padding: 0; margin: 0.5rem 0 0 0; }
                .feedback-card li { color: #374151; line-height: 1.7; margin-bottom: 0.75rem; display: flex; align-items: flex-start; gap: 0.75rem; font-size: 0.95rem;}
                .feedback-card li .list-icon { margin-top: 0.25em; flex-shrink: 0; }
                 .no-items { font-style: italic; color: #6b7280; }

                /* Card Specific Colors */
                .feedback-card.overall { background-color: #fff; border-color: #e5e7eb; } /* Plain for overall */
                .feedback-card.positive { background-color: #f0fdf4; border-color: #bbf7d0; } /* Light Green */
                .feedback-card.positive h3 { color: #15803d; }
                .feedback-card.positive .list-icon { color: #22c55e; }
                .feedback-card.improvement { background-color: #fffbeb; border-color: #fde68a; } /* Light Amber */
                .feedback-card.improvement h3 { color: #b45309; }
                .feedback-card.improvement .list-icon { color: #f59e0b; }

            `}</style>

            <div className="page-container">
                <header className="header-container">
                    <div className="header-left">
                        <button onClick={() => {
                                // Check if router can go back
                                if (router.canGoBack()) {
                                    router.back(); // Go back if possible
                                } else {
                                    router.push('/home'); // Go to home if not
                                }
                            }} className="back-button" title="Back">
                            <ArrowLeft size={24} color="#4f46e5" />
                        </button>
                        <h1 className="header-title">AI Resume Analyzer</h1>
                    </div>
                </header>

                <main className="main-content">
                    {/* --- ADD THE TEXT HERE --- */}
          {/* --- Conditionally Render Upload Section --- */}
          {/* Show this section ONLY if there are no results yet */}
          {!analysisResult && (
            <>
              <div className="intro-text-container">
                <h2 className="intro-title">Get Instant Resume Feedback</h2>
                <p className="intro-subtitle">
                  Upload your resume (PDF or DOCX) below. Our AI will analyze it
                  based on clarity, impact, and common best practices to provide
                  a score and actionable feedback.
                </p>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.docx"
                style={{ display: 'none' }}
              />

              {!selectedFile ? (
                <div className="upload-section">
                  <button className="upload-box" onClick={handleUploadClick}>
                    <UploadCloud size={40} className="upload-icon" />
                    <span className="upload-text">Click to Upload Resume</span>
                    <span className="upload-hint">PDF or DOCX, Max 5MB</span>
                  </button>
                </div>
              ) : (
                <div className="file-display-wrapper">
                  <div className="file-display">
                    <div className="file-info">
                      <FileText size={20} className="file-icon" />
                      <span className="file-name">{selectedFile.name}</span>
                    </div>
                    <button onClick={handleRemoveFile} className="remove-file-btn" title="Remove file">
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <button
                    className="analyze-button"
                    onClick={handleAnalyze}
                    disabled={isLoading}
                  >
                    {isLoading ? <Loader2 size={18} className="spinner" /> : <CheckCircle size={18} />}
                    {isLoading ? 'Analyzing...' : 'Analyze Resume'}
                  </button>
                </div>
              )}

              {/* Keep error message within this conditional block if needed */}
              <div className="status-message">
                 {/* Show loading ONLY when analyzing, not when results are shown */}
                 {isLoading && ( <div className="loading-indicator">  </div> )}
                 {error && !isLoading && ( <p className="error-text"> <AlertTriangle size={18}/> {error} </p> )}
              </div>
            </>
          )}
          {/* --- End Conditional Upload Section --- */}


          {/* --- Results Area (Rendered when analysisResult is available) --- */}
          {/* Show results only when not loading AND results exist */}
          {!isLoading && analysisResult && renderResults(analysisResult)}

                </main>
            </div>
        </>
    );
}

// --- Render Results Function (Improved UI) ---
// Moved outside the main component for clarity, receives results as argument
const renderResults = (analysisResult) => {
    if (!analysisResult) return null;

    let scoreColor = '#4f46e5';
    if (analysisResult.score >= 85) scoreColor = '#10b981';
    else if (analysisResult.score < 60) scoreColor = '#f59e0b';

    return (
        <div className="results-section">
            <h2 className="results-title">Analysis Results</h2>
            <div className="score-display">
                <div className="score-value" style={{ color: scoreColor }}>{analysisResult.score}</div>
                <div className="score-label">/ 100</div>
            </div>
            <div className="feedback-card overall">
                <h3>Overall Feedback</h3>
                <p>{analysisResult.overallFeedback}</p>
            </div>
            <div className="feedback-card positive">
                <h3><ThumbsUp size={20} /> Strengths</h3>
                <ul>
                    {analysisResult.positiveAspects.length > 0 ?
                      analysisResult.positiveAspects.map((item, index) => ( <li key={index}> <CheckCircle size={16} className="list-icon" /> <span>{item}</span> </li> ))
                      : <li className="no-items">No specific strengths highlighted.</li>
                    }
                </ul>
            </div>
            <div className="feedback-card improvement">
                <h3><Lightbulb size={20} /> Areas for Improvement</h3>
                <ul>
                     {analysisResult.areasForImprovement.length > 0 ?
                       analysisResult.areasForImprovement.map((item, index) => ( <li key={index}> <AlertTriangle size={16} className="list-icon" /> <span>{item}</span> </li> ))
                       : <li className="no-items">No specific areas for improvement suggested.</li>
                     }
                </ul>
            </div>
        </div>
    );
};