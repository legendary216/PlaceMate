import React, { useState, useEffect } from "react";
import { LogOut, Loader2, Check, X, Users, RefreshCw, Calendar, Clock, Link2 ,XCircle} from 'lucide-react'; // Added Link2
import { useRouter } from "expo-router";
import dayjs from 'dayjs';

export default function MentorHome() {
  // State for Connection Requests
  const [requests, setRequests] = useState([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(true);
  const [fetchRequestsError, setFetchRequestsError] = useState(null);

  // State for Schedule
  const [schedule, setSchedule] = useState([]);
  const [isLoadingSchedule, setIsLoadingSchedule] = useState(true);
  const [fetchScheduleError, setFetchScheduleError] = useState(null);

  // --- NEW STATE FOR PENDING BOOKINGS ---
  const [pendingBookings, setPendingBookings] = useState([]);
  const [isLoadingPendingBookings, setIsLoadingPendingBookings] = useState(true);
  const [fetchPendingBookingsError, setFetchPendingBookingsError] = useState(null);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [currentBookingToAccept, setCurrentBookingToAccept] = useState(null); // Stores { _id, studentName, time }
  const [meetingLink, setMeetingLink] = useState('');
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(null);
  // ---

  const [user, setUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(null); // For connection requests accept/reject
  const router = useRouter();

  // Fetch all initial data
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    fetchAllData();
  }, []);

  const fetchAllData = () => {
    fetchRequests();
    fetchSchedule();
    fetchPendingBookings(); // Fetch pending bookings as well
  };

  // --- Fetch Connection Requests ---
  const fetchRequests = async () => {
    setIsLoadingRequests(true);
    setFetchRequestsError(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/connections/my-requests", { headers: { "Authorization": `Bearer ${token}` } });
      if (!res.ok) throw new Error("Could not fetch connection requests.");
      const data = await res.json();
      setRequests(data);
    } catch (err) { setFetchRequestsError(err.message); } finally { setIsLoadingRequests(false); }
  };

  // --- Fetch Confirmed Schedule ---
  const fetchSchedule = async () => {
    setIsLoadingSchedule(true);
    setFetchScheduleError(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/bookings/my-schedule", { headers: { "Authorization": `Bearer ${token}` } });
      if (!res.ok) throw new Error("Could not fetch schedule.");
      const data = await res.json();
      setSchedule(data);
    } catch (err) { setFetchScheduleError(err.message); } finally { setIsLoadingSchedule(false); }
  };

  // --- NEW: Fetch Pending Booking Requests ---
  const fetchPendingBookings = async () => {
    setIsLoadingPendingBookings(true);
    setFetchPendingBookingsError(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/bookings/my-pending-requests", { headers: { "Authorization": `Bearer ${token}` } });
      if (!res.ok) throw new Error("Could not fetch pending booking requests.");
      const data = await res.json();
      setPendingBookings(data);
    } catch (err) { setFetchPendingBookingsError(err.message); } finally { setIsLoadingPendingBookings(false); }
  };

  // --- Handle Connection Request Response ---
  const handleConnectionResponse = async (requestId, newStatus) => {
    setActionLoading(requestId);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/connections/respond/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) throw new Error("Action failed.");
      setRequests(prev => prev.filter(req => req._id !== requestId));
      alert(`Connection request ${newStatus}!`);
      // No need to refresh schedule here, only connection status changed
    } catch (err) { alert(err.message); } finally { setActionLoading(null); }
  };

  // --- NEW: Open Accept Modal ---
  const handleAcceptBooking = (booking) => {
    setCurrentBookingToAccept({
      _id: booking._id,
      studentName: booking.student.name,
      time: dayjs(booking.startTime).format('ddd, MMM D, h:mm A')
    });
    setMeetingLink(''); // Clear previous link
    setShowAcceptModal(true);
  };

  // --- NEW: Submit Booking Confirmation ---
  const submitAcceptBooking = async () => {
    if (!meetingLink.trim() || !currentBookingToAccept) return;
    setIsConfirmingBooking(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/bookings/confirm/${currentBookingToAccept._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ meetingLink: meetingLink.trim() })
      });
       const data = await res.json(); // Read response body even on error
      if (!res.ok) {
           throw new Error(data.message || "Failed to confirm booking.");
      }
      setShowAcceptModal(false);
      setCurrentBookingToAccept(null);
      alert("Booking confirmed and student notified!");
      fetchAllData(); // Refresh all lists
    } catch (err) {
      alert(`Error: ${err.message}`); // Show specific error from backend
    } finally {
      setIsConfirmingBooking(false);
    }
  };

  // --- NEW: Handle Booking Rejection ---
   const handleRejectBooking = async (bookingId) => {
       if (!window.confirm("Are you sure you want to reject this booking request?")) return;
       // We can reuse actionLoading state here, maybe rename it if confusing
       setActionLoading(bookingId); // Show spinner on the specific item's button
       const token = localStorage.getItem("token");
       try {
           const res = await fetch(`http://localhost:5000/api/bookings/reject/${bookingId}`, {
               method: "PATCH",
               headers: { "Authorization": `Bearer ${token}` }
           });
           if (!res.ok) throw new Error("Failed to reject booking.");
           alert("Booking request rejected.");
           fetchPendingBookings(); // Only refresh pending list
       } catch (err) {
           alert(err.message);
       } finally {
           setActionLoading(null); // Clear spinner
       }
   };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/";
  };



  const handleCancelByMentor = async (bookingId) => {
       if (!window.confirm("Are you sure you want to cancel this scheduled session?")) return;
       setCancelLoading(bookingId); // Show spinner on cancel button
       const token = localStorage.getItem("token");
       try {
           const res = await fetch(`http://localhost:5000/api/bookings/cancel/mentor/${bookingId}`, {
               method: "PATCH",
               headers: { "Authorization": `Bearer ${token}` }
           });
           if (!res.ok) throw new Error("Failed to cancel booking.");
           alert("Booking cancelled successfully.");
           fetchSchedule(); // Refresh the schedule list
       } catch (err) {
           alert(err.message);
       } finally {
           setCancelLoading(null); // Clear spinner
       }
   };

  // --- Rendering Functions (requests, schedule) ---
  const renderRequests = () => { /* ... unchanged ... */
      if (isLoadingRequests) { return <p className="info-text"><Loader2 size={24} className="spinner" /> Loading requests...</p>; }
      if (fetchRequestsError) { return <p className="error-text">{fetchRequestsError}</p>; }
      if (requests.length === 0) { return (<div className="info-text empty-state"><Users size={40} color="#6b7280" /><h3 className="empty-title">All Caught Up!</h3><p className="empty-subtitle">You have no new connection requests.</p></div>); }
      return (<div className="item-list">{requests.map(req => (<div key={req._id} className="list-item request-item"><div className="item-info"><p className="item-name">{req.student.name}</p><p className="item-email">{req.student.email}</p></div><div className="item-actions"><button className="button-reject" onClick={() => handleConnectionResponse(req._id, 'rejected')} disabled={actionLoading === req._id}>{actionLoading === req._id ? <Loader2 size={18} className="spinner" /> : <X size={18} />}</button><button className="button-approve" onClick={() => handleConnectionResponse(req._id, 'accepted')} disabled={actionLoading === req._id}>{actionLoading === req._id ? <Loader2 size={18} className="spinner" /> : <Check size={18} />}</button></div></div>))}</div>);
  };
  const renderSchedule = () => { /* ... unchanged ... */
      if (isLoadingSchedule) { return <p className="info-text"><Loader2 size={24} className="spinner" /> Loading schedule...</p>; }
      if (fetchScheduleError) { return <p className="error-text">{fetchScheduleError}</p>; }
      if (schedule.length === 0) { return (<div className="info-text empty-state"><Calendar size={40} color="#6b7280" /><h3 className="empty-title">No Upcoming Sessions</h3><p className="empty-subtitle">Your schedule is clear for now.</p></div>); }
      return (<div className="item-list">{schedule.map(booking => (<div key={booking._id} className="list-item schedule-item"><div className="item-info"><p className="item-name">{booking.student.name}</p><p className="item-email">{dayjs(booking.startTime).format('ddd, MMM D, YYYY')}</p><p className="item-time"><Clock size={14} style={{verticalAlign: 'middle', marginRight: '4px'}}/>{dayjs(booking.startTime).format('h:mm A')} - {dayjs(booking.endTime).format('h:mm A')}</p></div>{/* --- ADD CANCEL BUTTON --- */}
                    <div className="item-actions">
                         <button
                            className="button-cancel-schedule"
                            onClick={() => handleCancelByMentor(booking._id)}
                            disabled={cancelLoading === booking._id}
                            title="Cancel Session"
                         >
                            {cancelLoading === booking._id ? <Loader2 size={18} className="spinner"/> : <XCircle size={18} />}
                         </button>
                    </div>
                    {/* --- END CANCEL BUTTON --- */}
                    </div>))}</div>);
  };

  // --- NEW: Render Pending Booking Requests ---
   const renderPendingBookings = () => {
       if (isLoadingPendingBookings) {
           return <p className="info-text"><Loader2 size={24} className="spinner" /> Loading booking requests...</p>;
       }
       if (fetchPendingBookingsError) {
           return <p className="error-text">{fetchPendingBookingsError}</p>;
       }
       if (pendingBookings.length === 0) {
           return (
               <div className="info-text empty-state">
                   <Clock size={40} color="#6b7280" />
                   <h3 className="empty-title">No Pending Bookings</h3>
                   <p className="empty-subtitle">You have no booking requests waiting for approval.</p>
               </div>
           );
       }
       return (
           <div className="item-list">
               {pendingBookings.map(booking => (
                   <div key={booking._id} className="list-item request-item"> {/* Can reuse request-item style */}
                       <div className="item-info">
                           <p className="item-name">{booking.student.name}</p>
                           <p className="item-email">{dayjs(booking.startTime).format('ddd, MMM D, h:mm A')}</p>
                       </div>
                       <div className="item-actions">
                           <button
                               className="button-reject"
                               onClick={() => handleRejectBooking(booking._id)}
                               disabled={actionLoading === booking._id} // Reuse actionLoading
                               title="Reject Booking"
                           >
                              {actionLoading === booking._id ? <Loader2 size={18} className="spinner" /> : <X size={18} />}
                           </button>
                           <button
                               className="button-approve"
                               onClick={() => handleAcceptBooking(booking)} // Pass full booking object
                               disabled={actionLoading === booking._id}
                               title="Accept Booking"
                           >
                               <Check size={18} /> {/* No spinner here, modal handles it */}
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
        /* --- Styles (Add Modal Styles) --- */
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh; overflow-y: auto; }
        .header-container { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
        .header-left { display: flex; flex-direction: column; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .header-subtitle { font-size: 1rem; color: #4b5563; margin: 0; }
        .header-right { display: flex; gap: 1rem; }
        .icon-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .main-content { padding: 2rem 1.5rem; max-width: 1200px; /* Wider for 3 columns potentially */ margin: 0 auto; width: 100%; box-sizing: border-box; display: grid; grid-template-columns: 1fr; gap: 2rem;}
        @media (min-width: 1024px) { .main-content { grid-template-columns: repeat(3, 1fr); } } /* 3 columns on large screens */
        @media (min-width: 640px) and (max-width: 1023px) { .main-content { grid-template-columns: repeat(2, 1fr); } } /* 2 columns on medium screens */

        .section { display: flex; flex-direction: column; }
        .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .section-title { font-size: 1.25rem; font-weight: 600; color: #1f2937; margin: 0; }
        .item-list { display: flex; flex-direction: column; gap: 1rem; }
        .list-item { display: flex; justify-content: space-between; align-items: center; background-color: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1rem 1.5rem; flex-wrap: wrap; gap: 1rem; }
        .item-info { flex-grow: 1; overflow: hidden; } /* Added overflow hidden */
        .item-name { font-weight: 600; color: #1f2937; margin: 0; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; /* Prevent long names breaking layout */}
        .item-email { color: #4b5563; margin: 0.25rem 0 0 0; font-size: 0.9rem; white-space: nowrap; text-overflow: ellipsis; overflow: hidden; /* Prevent long emails breaking layout */ }
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

        /* --- MODAL STYLES --- */
        .modal-overlay { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.6); display: flex; justify-content: center; align-items: center; z-index: 200; padding: 1rem; }
        .modal-box { background-color: #fff; border-radius: 0.75rem; padding: 2rem; width: 100%; max-width: 28rem; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .modal-title { font-size: 1.25rem; font-weight: 600; }
        .modal-close-btn { background: #f3f4f6; border: none; border-radius: 50%; padding: 0.5rem; display: flex; cursor: pointer; }
        .modal-body p { margin: 0 0 1rem 0; color: #4b5563; }
        .modal-body strong { color: #1f2937; }
        .form-group { margin-bottom: 1.5rem; }
        .form-label { display: block; font-weight: 500; margin-bottom: 0.5rem; font-size: 0.9rem;}
        .form-input { width: 100%; box-sizing: border-box; border: 1px solid #d1d5db; border-radius: 8px; padding: 0.75rem; font-size: 1rem; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 0.75rem; margin-top: 1.5rem; }
        .button-cancel { background-color: #f3f4f6; border: 1px solid #d1d5db; color: #1f2937; padding: 0.6rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer;}
        .button-confirm { background-color: #4f46e5; color: #fff; padding: 0.6rem 1rem; border-radius: 8px; font-weight: 600; cursor: pointer; border: none; display: inline-flex; align-items: center; gap: 0.5rem;}
        .button-confirm:disabled { background-color: #a5b4fc; cursor: not-allowed; }
        .button-cancel-schedule {
            display: flex; align-items: center; justify-content: center;
            background-color: #fee2e2; color: #991b1b; border: none;
             width: 36px; height: 36px; /* Slightly smaller */ border-radius: 50%; cursor: pointer;
            transition: background-color 0.2s;
        }
         .button-cancel-schedule:hover { background-color: #fecaca; }
         .button-cancel-schedule:disabled { opacity: 0.7; cursor: not-allowed; }

        /* Ensure item-actions in schedule has space */
         .schedule-item .item-actions { margin-left: auto; /* Push cancel button right */ }
      `}</style>

      <div className="page-container">
        <header className="header-container">
             <div className="header-left">
                <h1 className="header-title">Mentor Dashboard</h1>
                {user && <p className="header-subtitle">Welcome back, {user.name}!</p>}
            </div>
            <div className="header-right">
                <button onClick={() => router.push('/mentor/availability')} className="icon-button" title="Set Availability"><Calendar size={20} color="#4f46e5" /></button>
                <button onClick={fetchAllData} className="icon-button" title="Refresh Data"><RefreshCw size={20} color="#4f46e5" /></button>
                <button onClick={handleLogout} className="icon-button" title="Logout"><LogOut size={20} color="#4f46e5" /></button>
            </div>
        </header>

        <main className="main-content">
          {/* Column 1: Connection Requests */}
          <section className="section">
            <div className="section-header"> <h2 className="section-title">Connection Requests</h2> </div>
            {renderRequests()}
          </section>

          {/* Column 2: Pending Booking Requests */}
          <section className="section">
            <div className="section-header"> <h2 className="section-title">Pending Booking Requests</h2> </div>
            {renderPendingBookings()}
          </section>

          {/* Column 3: Upcoming Schedule */}
          <section className="section">
            <div className="section-header"> <h2 className="section-title">Upcoming Sessions</h2> </div>
            {renderSchedule()}
          </section>
        </main>
      </div>

       {/* --- ACCEPT BOOKING MODAL --- */}
        {showAcceptModal && currentBookingToAccept && (
            <div className="modal-overlay" onClick={() => setShowAcceptModal(false)}>
                <div className="modal-box" onClick={(e) => e.stopPropagation()}>
                    <div className="modal-header">
                        <h2 className="modal-title">Confirm Booking Request</h2>
                        <button className="modal-close-btn" onClick={() => setShowAcceptModal(false)}><X size={20} /></button>
                    </div>
                    <div className="modal-body">
                         <p>Accept request from <strong>{currentBookingToAccept.studentName}</strong> for <strong>{currentBookingToAccept.time}</strong>?</p>
                        <div className="form-group">
                            <label htmlFor="meetingLink" className="form-label">Meeting Link (e.g., Google Meet, Zoom)</label>
                            <input
                                type="url"
                                id="meetingLink"
                                className="form-input"
                                value={meetingLink}
                                onChange={(e) => setMeetingLink(e.target.value)}
                                placeholder="https://meet.google.com/..."
                                required
                            />
                        </div>
                    </div>
                    <div className="modal-actions">
                        <button type="button" className="button-cancel" onClick={() => setShowAcceptModal(false)}>Cancel</button>
                        <button
                            type="button"
                            className="button-confirm"
                            onClick={submitAcceptBooking}
                            disabled={isConfirmingBooking || !meetingLink.trim()}
                        >
                           {isConfirmingBooking ? <Loader2 size={18} className="spinner"/> : <Check size={18}/>}
                           {isConfirmingBooking ? 'Confirming...' : 'Confirm & Send Link'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </>
  );
}