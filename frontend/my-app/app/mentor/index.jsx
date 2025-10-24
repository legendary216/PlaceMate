import React, { useState, useEffect } from "react";
import { LogOut, Loader2, Check, X, Users, RefreshCw, Calendar } from 'lucide-react';
import { useRouter } from "expo-router";

// This IS the Mentor's Home Page / Dashboard
export default function MentorHome() {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [user, setUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // Tracks which button is loading
  const router = useRouter();

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchRequests();
  }, []);

  // Fetches pending student requests
  const fetchRequests = async () => {
    setIsLoading(true);
    setFetchError(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/connections/my-requests", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch requests.");
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setFetchError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Handles Accept/Reject
  const handleResponse = async (requestId, newStatus) => {
    setActionLoading(requestId);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/connections/respond/${requestId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Action failed.");
      
      setRequests(prev => prev.filter(req => req._id !== requestId));
      alert(`Request ${newStatus}!`);
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/"; // Redirect to login
  };

  // This renders the list of pending student requests
  const renderRequests = () => {
    if (isLoading) {
      return <p className="info-text"><Loader2 size={24} className="spinner" /> Loading requests...</p>;
    }
    if (fetchError) {
      return <p className="error-text">{fetchError}</p>;
    }
    if (requests.length === 0) {
      return (
        <div className="info-text" style={{ padding: '3rem', backgroundColor: '#fff', borderRadius: '8px' }}>
          <Users size={40} color="#6b7280" />
          <h3 style={{ margin: '1rem 0 0.5rem 0' }}>All Caught Up!</h3>
          <p style={{ margin: 0, maxWidth: '300px' }}>You have no new connection requests.</p>
        </div>
      );
    }
    return (
      <div className="request-list">
        {requests.map(req => (
          <div key={req._id} className="request-item">
            <div className="request-info">
              <p className="item-name">{req.student.name}</p>
              <p className="item-email">{req.student.email}</p>
            </div>
            <div className="item-actions">
              <button 
                className="button-reject"
                onClick={() => handleResponse(req._id, 'rejected')}
                disabled={actionLoading === req._id}
              >
                {actionLoading === req._id ? <Loader2 size={18} className="spinner" /> : <X size={18} />}
              </button>
              <button 
                className="button-approve"
                onClick={() => handleResponse(req._id, 'accepted')}
                disabled={actionLoading === req._id}
              >
                {actionLoading === req._id ? <Loader2 size={18} className="spinner" /> : <Check size={18} />}
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <style>{`
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh; }
        .header-container { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
        .header-left { display: flex; flex-direction: column; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .header-subtitle { font-size: 1rem; color: #4b5563; margin: 0; }
        .header-right { display: flex; gap: 1rem; }
        .icon-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .main-content { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .section-title { font-size: 1.25rem; font-weight: 600; color: #1f2937; margin: 0; }
        
        .request-list { display: flex; flex-direction: column; gap: 1rem; }
        .request-item {
          display: flex; justify-content: space-between; align-items: center;
          background-color: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem;
          padding: 1rem 1.5rem; flex-wrap: wrap; gap: 1rem;
        }
        .request-info { flex-grow: 1; }
        .item-name { font-weight: 600; color: #1f2937; margin: 0; }
        .item-email { color: #4b5563; margin: 0.25rem 0 0 0; font-size: 0.9rem; }
        .item-actions { display: flex; gap: 0.75rem; }
        
        .button-approve, .button-reject {
          display: flex; align-items: center; justify-content: center;
          padding: 0.5rem; width: 40px; height: 40px; border: none;
          border-radius: 50%; cursor: pointer; font-weight: 600; transition: background-color 0.2s;
        }
        .button-approve { background-color: #dcfce7; color: #166534; }
        .button-approve:hover { background-color: #bbf7d0; }
        .button-reject { background-color: #fee2e2; color: #991b1b; }
        .button-reject:hover { background-color: #fecaca; }
        .button-approve:disabled, .button-reject:disabled { opacity: 0.7; cursor: not-allowed; }

        .info-text, .error-text {
          text-align: center; color: #6b7280; font-size: 1rem;
          padding: 2rem 1rem; display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 0.5rem;
        }
        .error-text { color: #ef4444; font-weight: 500; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      
      <div className="page-container">
        <header className="header-container">
          <div className="header-left">
            <h1 className="header-title">Mentor Dashboard</h1>
            {user && <p className="header-subtitle">Welcome back, {user.name}!</p>}
          </div>
          <div className="header-right">
            {/* This is the button to update profile/availability */}
            <button 
              onClick={() => router.push('/mentor/availability')} 
              className="icon-button" 
              title="Set Availability"
            >
              <Calendar size={20} color="#4f46e5" />
            </button>
            {/* This button refreshes the student list */}
            <button onClick={fetchRequests} className="icon-button" title="Refresh Requests">
              <RefreshCw size={20} color="#4f46e5" />
            </button>
            <button onClick={handleLogout} className="icon-button" title="Logout">
              <LogOut size={20} color="#4f46e5" />
            </button>
          </div>
        </header>

        <main className="main-content">
          <div className="section-header">
            <h2 className="section-title">Pending Connection Requests</h2>
          </div>
          {/* This is where the student request list is rendered */}
          {renderRequests()}
        </main>
      </div>
    </>
  );
}