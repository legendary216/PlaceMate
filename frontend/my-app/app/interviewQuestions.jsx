import React, { useState } from "react";
import { ArrowLeft, ChevronDown, Code, User, BrainCircuit } from 'lucide-react';

// This is the Interview Questions page component.
// It now features a mobile-style tab bar at the bottom of the screen.

export default function InterviewPage() {
  const [activeTab, setActiveTab] = useState('technical');
  const [expandedQuestionId, setExpandedQuestionId] = useState(null);

  // --- Sample Data ---
  const questionsData = {
    technical: [
      {
        id: 't1',
        question: "What is the difference between 'let', 'const', and 'var' in JavaScript?",
        answer: "'var' is function-scoped and can be re-declared and updated. 'let' is block-scoped, can be updated but not re-declared. 'const' is block-scoped and cannot be updated or re-declared."
      },
      {
        id: 't2',
        question: "Explain the box model in CSS.",
        answer: "The CSS box model is a box that wraps around every HTML element. It consists of: margins, borders, padding, and the actual content. It allows us to add a border around elements, and to space elements in relation to other elements."
      },
      {
        id: 't3',
        question: "What is a REST API?",
        answer: "REST (Representational State Transfer) is an architectural style for designing networked applications. A REST API is a web service that uses HTTP requests to GET, PUT, POST, and DELETE data, following the principles of REST."
      },
    ],
    hr: [
      {
        id: 'h1',
        question: "Tell me about yourself.",
        answer: "This is an opportunity to provide a brief, professional summary of your background, skills, and why you're a great fit for the role. Structure your answer around your past experience, present skills, and future goals that align with the company."
      },
      {
        id: 'h2',
        question: "What are your greatest strengths and weaknesses?",
        answer: "For strengths, choose qualities that are relevant to the job description. For weaknesses, be honest but choose a real weakness you are actively working to improve. Frame it positively by mentioning the steps you're taking."
      },
    ],
    aptitude: [
      {
        id: 'a1',
        question: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?",
        answer: "Speed = 60 km/hr = (60 * 5/18) m/sec = 50/3 m/sec. Length of the train = (Speed * Time) = (50/3 * 9) m = 150 m."
      },
      {
        id: 'a2',
        question: "If 30% of a number is 12.6, find the number.",
        answer: "Let the number be x. Then, 30% of x = 12.6. => (30/100) * x = 12.6. => x = (12.6 * 100) / 30 = 42. The number is 42."
      },
    ]
  };

  const handleQuestionClick = (id) => {
    // If the same question is clicked again, collapse it. Otherwise, expand the new one.
    setExpandedQuestionId(expandedQuestionId === id ? null : id);
  };

  return (
    <>
      <style>{`
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh; padding-bottom: 80px; /* Add padding to prevent content from being hidden by the tab bar */ box-sizing: border-box; }
        .header-container { display: flex; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; flex-shrink: 0; }
        .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none; margin-right: 1rem; }
        .back-button:hover { background-color: #e0e7ff; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; }
        
        .main-content { 
            padding: 2rem 1.5rem; 
            max-width: 800px; 
            margin: 0 auto; 
            width: 100%; 
            box-sizing: border-box;
        }

        /* Accordion Styling (remains the same) */
        .accordion-container { display: flex; flex-direction: column; gap: 1rem; }
        .question-card { background-color: #fff; border-radius: 0.75rem; border: 1px solid #e5e7eb; overflow: hidden; }
        .question-header { display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.25rem; cursor: pointer; }
        .question-text { font-weight: 600; color: #1f2937; margin: 0; }
        .question-answer { max-height: 0; overflow: hidden; transition: max-height 0.3s ease-out, padding 0.3s ease-out; background-color: #f9fafb; color: #4b5563; font-size: 0.95rem; line-height: 1.6; }
        .question-answer.expanded { max-height: 500px; padding: 1.25rem; border-top: 1px solid #e5e7eb; }
        .chevron-icon { transition: transform 0.3s ease-out; }
        .chevron-icon.expanded { transform: rotate(180deg); }

        /* Bottom Tab Bar Styling */
        .bottom-tab-bar {
            position: fixed;
            bottom: 0;
            left: 0;
            width: 100%;
            display: flex;
            justify-content: space-around;
            background-color: #ffffff;
            border-top: 1px solid #e5e7eb;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
            padding: 0.5rem 0;
            z-index: 100;
        }
        .tab-button {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            background: transparent;
            border: none;
            cursor: pointer;
            color: #6b7280;
            padding: 0.5rem 1rem;
            font-size: 0.75rem;
            font-weight: 600;
            border-radius: 8px;
            transition: color 0.2s ease-in-out, background-color 0.2s ease-in-out;
        }
        .tab-button:hover {
            background-color: #f3f4f6;
        }
        .tab-button.active {
            color: #4f46e5;
        }
      `}</style>
      
      <div className="page-container">
        <header className="header-container">
          <a href="/home" className="back-button" title="Back to Home">
            <ArrowLeft size={24} color="#4f46e5" />
          </a>
          <h1 className="header-title">Interview Questions</h1>
        </header>

        <main className="main-content">
          <section className="accordion-container">
            {questionsData[activeTab].map((q) => (
              <div key={q.id} className="question-card">
                <div className="question-header" onClick={() => handleQuestionClick(q.id)}>
                  <p className="question-text">{q.question}</p>
                  <ChevronDown className={`chevron-icon ${expandedQuestionId === q.id ? 'expanded' : ''}`} size={20} color="#6b7280" />
                </div>
                <div className={`question-answer ${expandedQuestionId === q.id ? 'expanded' : ''}`}>
                  {q.answer}
                </div>
              </div>
            ))}
          </section>
        </main>

        <nav className="bottom-tab-bar">
            <button className={`tab-button ${activeTab === 'technical' ? 'active' : ''}`} onClick={() => setActiveTab('technical')}>
                <Code size={24} />
                Technical
            </button>
            <button className={`tab-button ${activeTab === 'hr' ? 'active' : ''}`} onClick={() => setActiveTab('hr')}>
                <User size={24} />
                HR
            </button>
            <button className={`tab-button ${activeTab === 'aptitude' ? 'active' : ''}`} onClick={() => setActiveTab('aptitude')}>
                <BrainCircuit size={24} />
                Aptitude
            </button>
        </nav>
      </div>
    </>
  );
}

