import React, { useState, useEffect } from "react";
import { ArrowLeft, ChevronDown, Code, User, BrainCircuit, Plus } from 'lucide-react';

// This is the updated Interview Questions page.
// It now conditionally displays an "Add Question" feature for admin users.

export default function InterviewPage() {
  const [activeTab, setActiveTab] = useState('technical');
  const [questions, setQuestions] = useState([]); // State to hold questions from the backend
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  // --- New State for Admin Features ---
  const [userRole, setUserRole] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("technical");

  // --- New State for Data Fetching ---
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);


  // --- Step 1: Check user role and fetch initial questions on component load ---
  useEffect(() => {
    // FOR NOW: Default role is set to 'admin' to always show the 'Add' button
   // setUserRole('admin');
     const userDataString = localStorage.getItem('user');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      setUserRole(userData.role);
    }

    // Fetch questions for the initially active tab
    fetchQuestions(activeTab);
  }, []); // Empty array ensures this runs only once on mount

  // Function to fetch questions from the backend
  const fetchQuestions = async (category) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      // This assumes your backend is running and has the question routes configured
      const response = await fetch(`http://localhost:5000/api/questions/${category}`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      setQuestions(data);
    } catch (error) {
      console.error("Failed to fetch questions:", error);
      setFetchError("Could not load questions. Please ensure the backend server is running and accessible.");
      setQuestions([]); // Clear questions on error to avoid showing stale data
    } finally {
      setIsLoading(false);
    }
  };

  // Handle tab switching
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    fetchQuestions(tab); // Fetch questions for the new tab
    setExpandedQuestionId(null); // Collapse any open questions
  };

  const handleQuestionClick = (id) => {
    setExpandedQuestionId(expandedQuestionId === id ? null : id);
  };
  
  // --- Step 3: Logic to handle submitting the new question form ---
  const handleAddQuestionSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    try {
      const res = await fetch("http://localhost:5000/api/questions", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` // Assuming you use Bearer token auth for protected routes
        },
        body: JSON.stringify({ question: newQuestion, answer: newAnswer, category: newCategory }),
      });

      if (res.ok) {
        alert("Question added successfully!"); // Simple feedback
        setShowAddForm(false); // Close the modal
        setNewQuestion("");   // Reset form fields
        setNewAnswer("");
        // If the new question was added to the currently active tab, refresh the list
        if(newCategory === activeTab) {
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

  // --- New Render Function for Main Content ---
  const renderContent = () => {
    if (isLoading) {
      return <p className="info-text">Loading questions...</p>;
    }
    if (fetchError) {
      return <p className="error-text">{fetchError}</p>;
    }
    if (questions.length === 0) {
      return <p className="info-text">No questions found for this category.</p>;
    }
    return questions.map((q) => (
      <div key={q._id} className="question-card">
        <div className="question-header" onClick={() => handleQuestionClick(q._id)}>
          <p className="question-text">{q.question}</p>
          <ChevronDown className={`chevron-icon ${expandedQuestionId === q._id ? 'expanded' : ''}`} size={20} color="#6b7280" />
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
        .page-container { display: flex; flex-direction: column; min-height: 100vh; padding-bottom: 80px; box-sizing: border-box; }
        .header-container { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
        .header-left { display: flex; align-items: center; }
        .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none; margin-right: 1rem; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; }
        
        .main-content { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        .accordion-container { display: flex; flex-direction: column; gap: 1rem; }
        .question-card { background-color: #fff; border-radius: 0.75rem; border: 1px solid #e5e7eb; overflow: hidden; }
        .question-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; cursor: pointer; }
        .question-text { font-weight: 600; color: #1f2937; margin: 0; }
        .question-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out, padding 0.3s ease-out; background-color: #f9fafb; color: #4b5563; font-size: 0.95rem; line-height: 1.6; }
        .question-answer.expanded { max-height: 500px; padding: 1.25rem; border-top: 1px solid #e5e7eb; }
        .chevron-icon { transition: transform 0.3s ease-out; }
        .chevron-icon.expanded { transform: rotate(180deg); }

        .bottom-tab-bar { position: fixed; bottom: 0; left: 0; width: 100%; display: flex; justify-content: space-around; background-color: #ffffff; border-top: 1px solid #e5e7eb; box-shadow: 0 -2px 10px rgba(0,0,0,0.05); padding: 0.5rem 0; z-index: 100; }
        .tab-button { display: flex; flex-direction: column; align-items: center; gap: 4px; background: transparent; border: none; cursor: pointer; color: #6b7280; padding: 0.5rem 1rem; font-size: 0.75rem; font-weight: 600; border-radius: 8px; transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out; }
        .tab-button.active { color: #4f46e5; }
        
        /* Admin "Add" Button */
        .add-question-btn { display: flex; align-items: center; gap: 0.5rem; background-color: #4f46e5; color: white; border: none; padding: 0.6rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
        .add-question-btn:hover { background-color: #4338ca; }

        /* Modal for Add Question Form */
        .modal-overlay { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 200; }
        .modal-box { background-color: #fff; border-radius: 0.75rem; padding: 2rem; width: 100%; max-width: 32rem; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-title { font-size: 1.25rem; font-weight: 600; }
        .form-group { margin-bottom: 1rem; }
        .form-label { display: block; font-weight: 500; margin-bottom: 0.5rem; }
        .form-input, .form-textarea, .form-select { width: 100%; box-sizing: border-box; border: 1px solid #d1d5db; border-radius: 8px; padding: 0.75rem; font-size: 1rem; }
        .form-textarea { min-height: 100px; resize: vertical; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
        .button-cancel { background-color: #f3f4f6; border: 1px solid #d1d5db; color: #1f2937; }

        /* Styles for info and error messages */
        .info-text { text-align: center; color: #6b7280; font-size: 1rem; padding: 2rem; }
        .error-text { text-align: center; color: #ef4444; font-size: 1rem; padding: 2rem; font-weight: 500; }

      `}</style>
      
      <div className="page-container">
        <header className="header-container">
          <div className="header-left">
            <a href="/home" className="back-button" title="Back to Home"><ArrowLeft size={24} color="#4f46e5" /></a>
            <h1 className="header-title">Interview Questions</h1>
          </div>
          {/* --- Step 2: Conditionally render the "Add" button for admins --- */}
          {userRole === 'admin' && (
            <button className="add-question-btn" onClick={() => setShowAddForm(true)}>
              <Plus size={20} />
              Add New Question
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

      {/* --- Step 3: The "Add Question" Modal Form --- */}
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
                <label className="form-label" htmlFor="question">Question</label>
                <textarea id="question" className="form-textarea" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="answer">Answer</label>
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

