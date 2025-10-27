import React, { useState, useEffect } from "react";
import { ArrowLeft, Check, X, Loader2, FileText } from 'lucide-react';
import { useRouter } from "expo-router"; // Assuming this is available from your layout

// This is the Admin-only page for managing mentor applications.
// It fetches pending mentors and allows approval or rejection.

export default function AdminMentors() {
  const [pendingMentors, setPendingMentors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [user, setUser] = useState(null);
  const router = useRouter();
  
  // State to show mentor details in a modal
  const [selectedMentor, setSelectedMentor] = useState(null);
  
  // State for loading specific buttons
  const [actionLoading, setActionLoading] = useState(null); // Will store the ID

useEffect(() => {
    // 1. Check user role from localStorage
    const userDataString = localStorage.getItem('user');
    if (userDataString) {
      const userData = JSON.parse(userDataString);
      
      if (userData.role === 'admin') {
        setUser(userData);
        fetchPendingMentors();
      } else {
        // If not admin, deny access
        setIsLoading(false);
        setFetchError("Access Denied. You must be an admin to view this page.");
      }
    } else {
      // --- THIS IS THE FIX ---
      // If not logged in, DO NOT navigate. Just set the error state.
      // The redirect call (router.replace) was causing the error.
      setIsLoading(false);
      setFetchError("Access Denied. Please log in as an admin.");
    }
  }, []); // You can also remove 'router' from the dependency array
  
  const fetchPendingMentors = async () => {
    setIsLoading(true);
    setFetchError(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch("https://placemate-ru7v.onrender.com/api/admin/mentors/pending", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (response.status === 403) throw new Error('Access Denied. Admins only.');
      if (!response.ok) throw new Error('Network response was not ok');
      
      const data = await response.json();
      setPendingMentors(data);
    } catch (error) {
      console.error("Failed to fetch pending mentors:", error);
      setFetchError(error.message || "Could not load mentors.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (mentorId, action) => {
    if (!window.confirm(`Are you sure you want to ${action} this mentor?`)) return;

    setActionLoading(mentorId); 
    const token = localStorage.getItem('token');
    
    // This URL matches the backend routes we just defined
    const url = `https://placemate-ru7v.onrender.com/api/admin/mentors/${action}/${mentorId}`;
    
    try {
      const res = await fetch(url, {
        method: 'PATCH', // Use PATCH for both
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (res.ok) {
        alert(`Mentor ${action}ed successfully!`);
        // Refresh the list
        setPendingMentors(prevMentors => prevMentors.filter(m => m._id !== mentorId));
        if (selectedMentor && selectedMentor._id === mentorId) {
          setSelectedMentor(null); // Close modal if actioned from there
        }
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.message || `Failed to ${action} mentor.`}`);
      }
    } catch (err) {
      alert("A server error occurred.");
      console.error(err);
    } finally {
      setActionLoading(null); // Clear loading state
    }
  };

  const renderMentorList = () => {
    if (pendingMentors.length === 0) {
      return <p className="info-text">No pending mentor applications.</p>;
    }

    return (
      <div className="mentor-list">
        {pendingMentors.map(mentor => (
          <div key={mentor._id} className="mentor-item">
            <div className="mentor-info">
              <img 
                src={mentor.profilePic || 'https://via.placeholder.com/150'} // Use profilePic field
                alt="Profile" 
                className="item-avatar" 
              />
              <div>
                <p className="item-name">{mentor.fullName}</p>
                <p className="item-detail">{mentor.jobTitle} at {mentor.company}</p>
                <p className="item-detail-email">{mentor.email}</p>
              </div>
            </div>
            <div className="item-actions">
              <button 
                className="button-view" 
                onClick={() => setSelectedMentor(mentor)}
                disabled={actionLoading === mentor._id}
              >
                Details
              </button>
              <button 
                className="button-reject"
                onClick={() => handleAction(mentor._id, 'reject')}
                disabled={actionLoading === mentor._id}
              >
                {actionLoading === mentor._id ? <Loader2 size={18} className="spinner" /> : <X size={18} />}
              </button>
              <button 
                className="button-approve"
                onClick={() => handleAction(mentor._id, 'approve')}
                disabled={actionLoading === mentor._id}
              >
                {actionLoading === mentor._id ? <Loader2 size={18} className="spinner" /> : <Check size={18} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };
  
  const renderContent = () => {
    if (isLoading) return <p className="info-text"><Loader2 size={24} className="spinner" /> Loading applications...</p>;
    if (fetchError) return <p className="error-text">{fetchError}</p>;
    if (!user) return <p className="error-text">Access Denied.</p>; // Should be covered by useEffect redirect
    
    return renderMentorList();
  };

  return (
    <>
      <style>{`
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh; overflow-y: auto;}
        .header-container { display: flex; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
        .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none; margin-right: 1rem; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; }
        .main-content { padding: 2rem 1.5rem; max-width: 900px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        .mentor-list { display: flex; flex-direction: column; gap: 1rem; }
        
        .mentor-item {
          display: flex; justify-content: space-between; align-items: center;
          background-color: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem;
          padding: 1rem 1.5rem; flex-wrap: wrap; gap: 1rem;
        }
        
        .mentor-info { display: flex; align-items: center; gap: 1rem; }
        .item-avatar { width: 50px; height: 50px; border-radius: 50%; object-fit: cover; }
        .item-name { font-weight: 600; color: #1f2937; margin: 0; }
        .item-detail { color: #4b5563; margin: 0; font-size: 0.9rem; }
        .item-detail-email { color: #4f46e5; margin: 0; font-size: 0.9rem; font-weight: 500; }
        
        .item-actions { display: flex; gap: 0.75rem; margin-left: auto; }
        .button-approve, .button-reject, .button-view {
          display: flex; align-items: center; justify-content: center;
          padding: 0.5rem 0.75rem; border: none; border-radius: 0.5rem;
          cursor: pointer; font-weight: 600; transition: background-color 0.2s;
        }
        .button-view { background-color: #eef2ff; color: #4f46e5; }
        .button-view:hover { background-color: #e0e7ff; }
        .button-approve { background-color: #dcfce7; color: #166534; }
        .button-approve:hover { background-color: #bbf7d0; }
        .button-reject { background-color: #fee2e2; color: #991b1b; }
        .button-reject:hover { background-color: #fecaca; }
        
        .button-approve:disabled, .button-reject:disabled, .button-view:disabled {
            opacity: 0.7; cursor: not-allowed;
        }

        .info-text, .error-text { text-align: center; color: #6b7280; font-size: 1.1rem; padding: 4rem 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .error-text { color: #ef4444; font-weight: 500; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        /* Modal Styles */
        .modal-overlay { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 200; padding: 1rem; }
        .modal-box { background-color: #fff; border-radius: 0.75rem; padding: 2rem; width: 100%; max-width: 32rem; max-height: 90vh; overflow-y: auto; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .modal-title { font-size: 1.25rem; font-weight: 600; }
        .modal-close-btn { background: #f3f4f6; border: none; border-radius: 50%; padding: 0.5rem; display: flex; cursor: pointer; }
        
        .detail-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
        .detail-item { background-color: #f9fafb; padding: 0.75rem 1rem; border-radius: 0.5rem; }
        .detail-label { font-size: 0.8rem; font-weight: 600; color: #6b7280; text-transform: uppercase; margin-bottom: 0.25rem; }
        .detail-value { font-size: 1rem; color: #1f2937; word-break: break-word; }
        .id-proof-link {
            display: inline-flex; align-items: center; gap: 0.5rem;
            color: #4f46e5; text-decoration: none; font-weight: 500;
        }
        .id-proof-link:hover { text-decoration: underline; }
      `}</style>
      
      <div className="page-container">
        <header className="header-container">
          <a href="/home" className="back-button" title="Back to Home">
            <ArrowLeft size={24} color="#4f46e5" />
          </a>
          <h1 className="header-title">Mentor Applications</h1>
        </header>

        <main className="main-content">
          {renderContent()}
        </main>
      </div>

      {/* Details Modal */}
      {selectedMentor && (
        <div className="modal-overlay" onClick={() => setSelectedMentor(null)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Mentor Details</h2>
              <button className="modal-close-btn" onClick={() => setSelectedMentor(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="detail-grid">
              {/* All fields from mentor.jsx */}
              <div className="detail-item">
                <p className="detail-label">Full Name</p>
                <p className="detail-value">{selectedMentor.fullName}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Email</p>
                <p className="detail-value">{selectedMentor.email}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Phone</p>
                <p className="detail-value">{selectedMentor.phone}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Job Title</p>
                <p className="detail-value">{selectedMentor.jobTitle}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Company</p>
                <p className="detail-value">{selectedMentor.company}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Experience</p>
                <p className="detail-value">{selectedMentor.experience} years</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Qualification</p>
                <p className="detail-value">{selectedMentor.qualification}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Expertise</p>
                <p className="detail-value">{selectedMentor.expertise}</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">Availability</p>
                <p className="detail-value">{selectedMentor.availability} ({selectedMentor.hours} hrs/week)</p>
              </div>
              <div className="detail-item">
                <p className="detail-label">ID Proof</p>
                {/* Assuming 'idProof' is a URL to the file */}
                <a href={selectedMentor.idProof} target="_blank" rel="noopener noreferrer" className="id-proof-link">
                  <FileText size={16} /> View Uploaded ID
                </a>
              </div>
            </div>
            
            <div className="item-actions" style={{ marginTop: '1.5rem', display: 'flex' }}>
              <button 
                className="button-reject"
                style={{ flex: 1, padding: '0.75rem', justifyContent: 'center' }}
                onClick={() => handleAction(selectedMentor._id, 'reject')}
                disabled={actionLoading === selectedMentor._id}
              >
                {actionLoading === selectedMentor._id ? <Loader2 size={18} className="spinner" /> : <><X size={18} /> Reject</>}
              </button>
              <button 
                className="button-approve"
                style={{ flex: 1, padding: '0.75rem', justifyContent: 'center' }}
                onClick={() => handleAction(selectedMentor._id, 'approve')}
                disabled={actionLoading === selectedMentor._id}
              >
                {actionLoading === selectedMentor._id ? <Loader2 size={18} className="spinner" /> : <><Check size={18} /> Approve</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}