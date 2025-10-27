import React, { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown, Code, User, BrainCircuit, Plus, Sparkles, Trash2 } from 'lucide-react';

// This is the complete Interview Questions page.
// It includes role-based features: Admins can add, delete, and generate answers with AI.
// Regular users have read-only access. Difficulty is now included.

export default function InterviewPage() {
  const [activeTab, setActiveTab] = useState('technical');
  const [questions, setQuestions] = useState([]);
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  // --- State for Admin & AI Features ---
  const [userRole, setUserRole] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("technical");
  const [newDifficulty, setNewDifficulty] = useState("Medium"); // New state for difficulty
  const [isGenerating, setIsGenerating] = useState(false);
  
  // --- State for Data Fetching ---
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    // As requested, setting default role to 'admin' for testing
    //setUserRole('admin');
    
    // In a real application, you would use this logic:
    
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setUserRole(userData.role);
    }
    
    fetchQuestions(activeTab);
  }, []);

  const fetchQuestions = async (category) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await fetch(`http://localhost:5000/api/questions/${category}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      setFetchError("Could not load questions. Please ensure the server is running.");
      setQuestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    fetchQuestions(tab);
    setExpandedQuestionId(null);
  };

  const handleQuestionClick = (id) => {
    setExpandedQuestionId(expandedQuestionId === id ? null : id);
  };

  const handleAddQuestionSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      const res = await fetch("http://localhost:5000/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        // Add difficulty to the request body
        body: JSON.stringify({ question: newQuestion, answer: newAnswer, category: newCategory, difficulty: newDifficulty }),
      });
      if (res.ok) {
        alert("Question added successfully!");
        setShowAddForm(false);
        setNewQuestion("");
        setNewAnswer("");
        setNewDifficulty("Medium"); // Reset difficulty
        if (newCategory === activeTab) {
          fetchQuestions(activeTab);
        }
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || "Failed to add question."}`);
      }
    } catch (err) {
      alert("A server error occurred.");
      console.error(err);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/api/questions/${questionId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        alert("Question deleted successfully!");
        fetchQuestions(activeTab);
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || "Failed to delete question."}`);
      }
    } catch (err) {
      alert("A server error occurred during deletion.");
      console.error(err);
    }
  };
const handleGenerateAnswer = async () => {
    if (!newQuestion.trim()) {
      alert("Please enter a question first.");
      return;
    }
    
    setIsGenerating(true);
    setNewAnswer("✨ Generating a high-quality answer with Gemini...");
    
    // ⚠️ WARNING: INSECURE KEY EXPOSURE FOR TESTING 
    // Replace "YOUR_HARDCODED_GEMINI_API_KEY_HERE" with your actual key.
    const apiKey = "AIzaSyDd9V4VDVxmU0zvRlFFzNM0d_Xe1PvYnUA"; 
    const modelName = "gemini-2.5-flash-lite"; // Use a stable, fast model
    
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
           throw new Error(`API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
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

  const renderContent = () => {
    if (isLoading) return <p className="info-text">Loading questions...</p>;
    if (fetchError) return <p className="error-text">{fetchError}</p>;
    if (questions.length === 0) return <p className="info-text">No questions found for this category.</p>;
    
  return questions.map((q) => (
      <div key={q._id} className="question-card">
        <div className="question-header">
          <div className="question-toggle" onClick={() => handleQuestionClick(q._id)}>
            <p className="question-text">{q.question}</p>
            {/* <ChevronDown className={`chevron-icon ${expandedQuestionId === q._id ? 'expanded' : ''}`} size={20} color="#6b7280" /> */}
          </div>
          <div className="question-controls">
            <span className={`difficulty-badge difficulty-${q.difficulty?.toLowerCase()}`}>{q.difficulty}</span>
            {userRole === 'admin' && (
              <button className="delete-button" title="Delete Question" onClick={(e) => { e.stopPropagation(); handleDeleteQuestion(q._id); }}>
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
        <div className={`question-answer ${expandedQuestionId === q._id ? 'expanded' : ''}`}>
          {q.answer}
        </div>
      </div>
    ));
  };

  return (
    <>
      <style>{`
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh; padding-bottom: 80px; box-sizing: border-box; overflow-y: auto;}
        .header-container { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
        .header-left { display: flex; align-items: center; }
        .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none; margin-right: 1rem; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; }
        .main-content { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        .accordion-container { display: flex; flex-direction: column; gap: 1rem; }
        .question-card { background-color: #fff; border-radius: 0.75rem; border: 1px solid #e5e7eb; overflow: hidden; }
        .question-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; }
        .question-toggle { display: flex; justify-content: space-between; align-items: center; cursor: pointer; flex-grow: 1; }
        .question-main { display: flex; flex-direction: column; gap: 0.5rem; }
        .question-text { font-weight: 600; color: #1f2937; margin: 0; padding-right: 1rem; }
        .question-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out, padding 0.3s ease-out; background-color: #f9fafb; color: #4b5563; font-size: 0.95rem; line-height: 1.6; white-space: pre-wrap; }
        .question-answer.expanded { max-height: 500px; padding: 1.25rem; border-top: 1px solid #e5e7eb; }
        .chevron-icon { transition: transform 0.3s ease-out; flex-shrink: 0; }
        .chevron-icon.expanded { transform: rotate(180deg); }
        .bottom-tab-bar { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; justify-content: space-around; background-color: #ffffff; border-top: 1px solid #e5e7eb; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); padding: 0.5rem 0; z-index: 100; }
        .tab-button { display: flex; flex-direction: column; align-items: center; gap: 4px; background: transparent; border: none; cursor: pointer; color: #6b7280; padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 600; border-radius: 8px; transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out; }
        .tab-button.active { color: #4f46e5; }
        .add-question-btn { display: flex; align-items: center; gap: 0.5rem; background-color: #4f46e5; color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
        .add-question-btn:hover { background-color: #4338ca; }
        .delete-button { background: transparent; border: none; cursor: pointer; color: #ef4444; padding: 0.5rem; border-radius: 50%; margin-left: 0.5rem; flex-shrink: 0; }
        .delete-button:hover { background-color: #fee2e2; }
        .modal-overlay { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 200; }
        .modal-box { background-color: #fff; border-radius: 0.75rem; padding: 2rem; width: 100%; max-width: 32rem; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-title { font-size: 1.25rem; font-weight: 600; }
        .form-group { margin-bottom: 1rem; }
        .form-label { display: block; font-weight: 500; margin-bottom: 0.5rem; }
        .form-input, .form-textarea, .form-select { width: 100%; box-sizing: border-box; border: 1px solid #d1d5db; border-radius: 8px; padding: 0.75rem; font-size: 1rem; }
        .form-textarea { min-height: 120px; resize: vertical; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
        .button-cancel { background-color: #f3f4f6; border: 1px solid #d1d5db; color: #1f2937; }
        .ai-button { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.5rem 0.75rem; border: none; background-color: #eef2ff; color: #4f46e5; border-radius: 6px; font-weight: 600; cursor: pointer; margin-top: 0.5rem; }
        .ai-button:hover { background-color: #e0e7ff; }
        .ai-button:disabled { background-color: #f3f4f6; color: #9ca3af; cursor: not-allowed; }
        .label-container { display: flex; justify-content: space-between; align-items: center; }
        .info-text { text-align: center; color: #6b7280; font-size: 1rem; padding: 2rem; }
        .error-text { text-align: center; color: #ef4444; font-size: 1rem; padding: 2rem; font-weight: 500; }
        
        /* New Styles for Difficulty Badge */
        .difficulty-badge { font-size: 0.75rem; font-weight: 600; padding: 0.2rem 0.6rem; border-radius: 99px; width: fit-content; }
        .difficulty-easy { background-color: #dcfce7; color: #166534; }
        .difficulty-medium { background-color: #fef3c7; color: #92400e; }
        .difficulty-hard { background-color: #fee2e2; color: #991b1b; }
      `}</style>
      
      <div className="page-container">
        <header className="header-container">
          <div className="header-left">
            <a href="/home" className="back-button" title="Back to Home"><ArrowLeft size={24} color="#4f46e5" /></a>
            <h1 className="header-title">Interview Questions</h1>
          </div>
          {userRole === 'admin' && (
            <button className="add-question-btn" onClick={() => setShowAddForm(true)}>
              <Plus size={20} /> Add New Question
            </button>
          )}
        </header>

        <main className="main-content">
          <section className="accordion-container">
            {renderContent()}
          </section>
        </main>

        <nav className="bottom-tab-bar">
            <button className={`tab-button ${activeTab === 'technical' ? 'active' : ''}`} onClick={() => handleTabClick('technical')}><Code size={24} />Technical</button>
            <button className={`tab-button ${activeTab === 'hr' ? 'active' : ''}`} onClick={() => handleTabClick('hr')}><User size={24} />HR</button>
            <button className={`tab-button ${activeTab === 'aptitude' ? 'active' : ''}`} onClick={() => handleTabClick('aptitude')}><BrainCircuit size={24} />Aptitude</button>
        </nav>
      </div>

      {showAddForm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <div className="modal-header">
              <h2 className="modal-title">Add a New Interview Question</h2>
            </div>
            <form onSubmit={handleAddQuestionSubmit}>
               <div className="form-group">
                <label className="form-label" htmlFor="category">Category</label>
                <select id="category" className="form-select" value={newCategory} onChange={(e) => setNewCategory(e.target.value)}>
                  <option value="technical">Technical</option>
                  <option value="hr">HR</option>
                  <option value="aptitude">Aptitude</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="difficulty">Difficulty</label>
                <select id="difficulty" className="form-select" value={newDifficulty} onChange={(e) => setNewDifficulty(e.target.value)}>
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="question">Question</label>
                <textarea id="question" className="form-textarea" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} required />
              </div>
              <div className="form-group">
                <div className="label-container">
                    <label className="form-label" htmlFor="answer">Answer</label>
                    <button type="button" className="ai-button" onClick={handleGenerateAnswer} disabled={isGenerating}>
                        <Sparkles size={16} />
                        {isGenerating ? 'Generating...' : 'Generate Answer'}
                    </button>
                </div>
                <textarea id="answer" className="form-textarea" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} required />
              </div>
              <div className="modal-actions">
                <button type="button" className="add-question-btn button-cancel" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="add-question-btn">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

