import React, { useState, useEffect } from "react";
import { LogOut, Loader2, Check, X, Users, RefreshCw, Calendar, Clock } from 'lucide-react'; // Added Clock
import { useRouter } from "expo-router";
import dayjs from 'dayjs'; // Import dayjs

export default function MentorHome() {
  const [requests, setRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [fetchRequestsError, setFetchRequestsError] = useState(null);
  const [user, setUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const router = useRouter();

  // --- NEW STATE FOR SCHEDULE ---
  const [schedule, setSchedule] = useState([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [fetchScheduleError, setFetchScheduleError] = useState(null);
  // ---

  // Fetch user data and initial data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchRequests();
    fetchSchedule(); // <-- Fetch schedule on load
  }, []);

  // Fetches pending student requests
  const fetchRequests = async () => {
    // ... (existing fetchRequests function - no changes needed)
    setIsLoadingRequests(true);
    setFetchRequestsError(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/connections/my-requests", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Could not fetch requests.");
      const data = await res.json();
      setRequests(data);
    } catch (err) {
      setFetchRequestsError(err.message);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  // --- NEW FUNCTION TO FETCH SCHEDULE ---
  const fetchSchedule = async () => {
      setIsLoadingSchedule(true);
      setFetchScheduleError(null);
      const token = localStorage.getItem("token");
      try {
          const res = await fetch("http://localhost:5000/api/bookings/my-schedule", {
              headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) throw new Error("Could not fetch schedule.");
          const data = await res.json();
          setSchedule(data);
      } catch (err) {
          setFetchScheduleError(err.message);
      } finally {
          setIsLoadingSchedule(false);
      }
  };
  // ---

  // Handles Accept/Reject for requests
  const handleResponse = async (requestId, newStatus) => {
     // ... (existing handleResponse function - no changes needed)
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
        if(newStatus === 'accepted') fetchSchedule(); // Refresh schedule if accepted
      } catch (err) {
        alert(err.message);
      } finally {
        setActionLoading(null);
      }
  };

  const handleLogout = () => {
     // ... (existing handleLogout function - no changes needed)
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/"; 
  };

  // Renders the list of pending student requests
  const renderRequests = () => {
     // ... (existing renderRequests function - no changes needed)
      if (isLoadingRequests) {
        return <p className="info-text"><Loader2 size={24} className="spinner" /> Loading requests...</p>;
      }
      if (fetchRequestsError) {
        return <p className="error-text">{fetchRequestsError}</p>;
      }
      if (requests.length === 0) {
        return (
          <div className="info-text empty-state">
            <Users size={40} color="#6b7280" />
            <h3 className="empty-title">All Caught Up!</h3>
            <p className="empty-subtitle">You have no new connection requests.</p>
          </div>
        );
      }
      return (
        <div className="item-list">
          {requests.map(req => (
            <div key={req._id} className="list-item request-item">
              <div className="item-info">
                <p className="item-name">{req.student.name}</p>
                <p className="item-email">{req.student.email}</p>
              </div>
              <div className="item-actions">
                <button className="button-reject" onClick={() => handleResponse(req._id, 'rejected')} disabled={actionLoading === req._id}>{actionLoading === req._id ? <Loader2 size={18} className="spinner" /> : <X size={18} />}</button>
                <button className="button-approve" onClick={() => handleResponse(req._id, 'accepted')} disabled={actionLoading === req._id}>{actionLoading === req._id ? <Loader2 size={18} className="spinner" /> : <Check size={18} />}</button>
              </div>
            </div>
          ))}
        </div>
      );
  };

  // --- NEW FUNCTION TO RENDER SCHEDULE ---
    const renderSchedule = () => {
        if (isLoadingSchedule) {
            return <p className="info-text"><Loader2 size={24} className="spinner" /> Loading schedule...</p>;
        }
        if (fetchScheduleError) {
            return <p className="error-text">{fetchScheduleError}</p>;
        }
        if (schedule.length === 0) {
            return (
                <div className="info-text empty-state">
                    <Calendar size={40} color="#6b7280" />
                     <h3 className="empty-title">No Upcoming Sessions</h3>
                    <p className="empty-subtitle">Your schedule is clear for now.</p>
                </div>
            );
        }
        return (
            <div className="item-list">
                {schedule.map(booking => (
                    <div key={booking._id} className="list-item schedule-item">
                        <div className="item-info">
                            <p className="item-name">{booking.student.name}</p>
                            <p className="item-email">{dayjs(booking.startTime).format('ddd, MMM D, YYYY')}</p>
                            <p className="item-time">
                                <Clock size={14} style={{verticalAlign: 'middle', marginRight: '4px'}}/>
                                {dayjs(booking.startTime).format('h:mm A')} - {dayjs(booking.endTime).format('h:mm A')}
                            </p>
                        </div>
                        {/* Optional: Add a button to view details or cancel */}
                    </div>
                ))}
            </div>
        );
    };
  // ---

  return (
    <>
      <style>{`
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh; overflow-y: auto}
        .header-container { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
        .header-left { display: flex; flex-direction: column; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .header-subtitle { font-size: 1rem; color: #4b5563; margin: 0; }
        .header-right { display: flex; gap: 1rem; }
        .icon-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .main-content { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; display: grid; grid-template-columns: 1fr; gap: 2rem;}
         @media (min-width: 768px) { .main-content { grid-template-columns: repeat(2, 1fr); } } /* Side-by-side on larger screens */

        .section { display: flex; flex-direction: column; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .section-title { font-size: 1.25rem; font-weight: 600; color: #1f2937; margin: 0; }

        .item-list { display: flex; flex-direction: column; gap: 1rem; }
        .list-item {
          display: flex; justify-content: space-between; align-items: center;
          background-color: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem;
          padding: 1rem 1.5rem; flex-wrap: wrap; gap: 1rem;
        }
        .item-info { flex-grow: 1; }
        .item-name { font-weight: 600; color: #1f2937; margin: 0; }
        .item-email { color: #4b5563; margin: 0.25rem 0 0 0; font-size: 0.9rem; }
        .item-time { color: #4f46e5; margin: 0.25rem 0 0 0; font-size: 0.9rem; font-weight: 500; }
        .item-actions { display: flex; gap: 0.75rem; }

        .button-approve, .button-reject { display: flex; align-items: center; justify-content: center; padding: 0.5rem; width: 40px; height: 40px; border: none; border-radius: 50%; cursor: pointer; font-weight: 600; transition: background-color 0.2s; }
        .button-approve { background-color: #dcfce7; color: #166534; }
        .button-approve:hover { background-color: #bbf7d0; }
        .button-reject { background-color: #fee2e2; color: #991b1b; }
        .button-reject:hover { background-color: #fecaca; }
        .button-approve:disabled, .button-reject:disabled { opacity: 0.7; cursor: not-allowed; }

        .info-text, .error-text { text-align: center; color: #6b7280; font-size: 1rem; padding: 2rem 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; }
        .error-text { color: #ef4444; font-weight: 500; }
        .empty-state { padding: 3rem; background-color: #fff; border-radius: 8px; border: 1px dashed #d1d5db;}
        .empty-title { margin: 1rem 0 0.5rem 0; font-weight: 600; color: #374151;}
        .empty-subtitle { margin: 0; max-width: 300px; color: #6b7280; font-size: 0.9rem;}

        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="page-container">
        <header className="header-container">
            {/* ... (header content - unchanged) ... */}
             <div className="header-left">
                <h1 className="header-title">Mentor Dashboard</h1>
                {user && <p className="header-subtitle">Welcome back, {user.name}!</p>}
            </div>
            <div className="header-right">
                <button onClick={() => router.push('/mentor/availability')} className="icon-button" title="Set Availability"><Calendar size={20} color="#4f46e5" /></button>
                <button onClick={() => { fetchRequests(); fetchSchedule(); }} className="icon-button" title="Refresh Data"><RefreshCw size={20} color="#4f46e5" /></button> {/* Refresh both */}
                <button onClick={handleLogout} className="icon-button" title="Logout"><LogOut size={20} color="#4f46e5" /></button>
            </div>
        </header>

        <main className="main-content">
          {/* Column 1: Pending Requests */}
          <section className="section">
            <div className="section-header">
              <h2 className="section-title">Pending Requests</h2>
            </div>
            {renderRequests()}
          </section>

          {/* Column 2: Upcoming Schedule */}
          <section className="section">
            <div className="section-header">
               <h2 className="section-title">Upcoming Sessions</h2>
            </div>
            {renderSchedule()}
          </section>
        </main>
      </div>
    </>
  );
}