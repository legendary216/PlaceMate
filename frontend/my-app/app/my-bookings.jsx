import React, { useState, useEffect } from 'react';
// Import Trash2 instead of XCircle
import { ArrowLeft, Loader2, Calendar, Clock, RefreshCw, Link2, Hourglass, Trash2 } from 'lucide-react';
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';

export default function MyBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    // ... (fetchBookings function remains the same) ...
        setIsLoading(true);
        setFetchError(null);
        const token = localStorage.getItem("token");
        try {
          const res = await fetch("http://localhost:5000/api/bookings/my-schedule-student", {
            headers: { "Authorization": `Bearer ${token}` }
          });
          if (!res.ok) {
            const errData = await res.json();
            throw new Error(errData.message || "Could not fetch bookings.");
          }
          const data = await res.json();
          setBookings(data);
        } catch (err) {
          setFetchError(err.message);
        } finally {
          setIsLoading(false);
        }
  };

  const handleCancelByStudent = async (bookingId, status) => {
    // ... (handleCancelByStudent function remains the same) ...
       const confirmMessage = status === 'pending_mentor_approval'
           ? "Are you sure you want to cancel this booking request?"
           : "Are you sure you want to cancel this confirmed session?";
       if (!window.confirm(confirmMessage)) return;

       setCancelLoading(bookingId);
       const token = localStorage.getItem("token");
       try {
           const res = await fetch(`http://localhost:5000/api/bookings/cancel/student/${bookingId}`, {
               method: "PATCH",
               headers: { "Authorization": `Bearer ${token}` }
           });
           if (!res.ok) throw new Error("Failed to cancel booking.");
           alert("Booking cancelled successfully.");
           fetchBookings(); // Refresh the booking list
       } catch (err) {
           alert(err.message);
       } finally {
           setCancelLoading(null);
       }
  };

  const renderContent = () => {
    if (isLoading) { /* ... loading ... */ }
    if (fetchError) { /* ... error ... */ }
    if (bookings.length === 0) { /* ... empty state ... */ }
    return (
      <div className="item-list">
        {bookings.map(booking => (
          <div key={booking._id} className={`list-item booking-item status-${booking.status}`}>
            <img /* ... avatar ... */
                src={booking.mentor.profilePic || 'https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg'}
                alt={`${booking.mentor.fullName} profile`}
                className="item-avatar"
             />
            <div className="item-info">
              {/* ... name, detail, date, time ... */}
               <p className="item-name">{booking.mentor.fullName}</p>
               <p className="item-detail">{booking.mentor.jobTitle} at {booking.mentor.company}</p>
               <p className="item-date">{dayjs(booking.startTime).format('dddd, MMMM D, YYYY')}</p>
               <p className="item-time">
                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {dayjs(booking.startTime).format('h:mm A')} - {dayjs(booking.endTime).format('h:mm A')}
              </p>

              {/* Status and Link rendering (unchanged) */}
              {booking.status === 'pending_mentor_approval' && ( /* ... pending status ... */
                    <p className="item-status pending">
                      <Hourglass size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>
                      Pending Mentor Approval
                  </p>
              )}
              {booking.status === 'confirmed' && ( /* ... confirmed status and link ... */
                    <div className="item-status confirmed">
                     <p style={{ margin: '0.5rem 0 0.25rem 0', fontWeight: 500 }}>Status: Confirmed</p>
                     {booking.meetingLink ? (
                         <a href={booking.meetingLink} target="_blank" rel="noopener noreferrer" className="meeting-link">
                             <Link2 size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>
                             Join Meeting
                         </a>
                     ) : (
                         <p className="no-link-text">Mentor will provide meeting link.</p>
                     )}
                  </div>
              )}
            </div>
            {(booking.status === 'pending_mentor_approval' || booking.status === 'confirmed') && (
              <div className="item-actions">
                <button
                  className="button-cancel-booking"
                  onClick={() => handleCancelByStudent(booking._id, booking.status)}
                  disabled={cancelLoading === booking._id}
                  title="Cancel Booking"
                >
                  {/* --- CHANGE ICON HERE --- */}
                  {cancelLoading === booking._id ? <Loader2 size={18} className="spinner" /> : <Trash2 size={18} />}
                  {/* --- END ICON CHANGE --- */}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };


  return (
    <>
      <style>{`
        /* --- Styles (No changes needed here if .button-cancel-booking styles are okay) --- */
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh; overflow-y: auto; }
        .header-container { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
        .header-left { display: flex; align-items: center; gap: 1rem; }
        .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .icon-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .main-content { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        .item-list { display: flex; flex-direction: column; gap: 1rem; }
        .list-item { display: flex; align-items: flex-start; gap: 1rem; background-color: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem; }
        .item-avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .item-info { flex-grow: 1; }
        .item-name { font-weight: 600; font-size: 1.15rem; color: #1f2937; margin: 0 0 0.25rem 0; }
        .item-detail { color: #4b5563; margin: 0 0 0.5rem 0; font-size: 0.9rem; }
        .item-date { font-weight: 500; color: #374151; margin: 0.5rem 0 0.25rem 0; font-size: 0.95rem; }
        .item-time { color: #4f46e5; margin: 0; font-size: 0.95rem; font-weight: 500; }
        .item-status { font-size: 0.9rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f3f4f6; }
        .item-status.pending { color: #d97706; font-weight: 500; }
        .item-status.confirmed { color: #059669; }
        .meeting-link { color: #4f46e5; text-decoration: none; font-weight: 500; display: inline-block; margin-top: 0.25rem;}
        .meeting-link:hover { text-decoration: underline; }
        .no-link-text { font-size: 0.85rem; color: #6b7280; font-style: italic; margin: 0.25rem 0 0 0; }
        .item-actions { margin-left: auto; padding-left: 1rem; flex-shrink: 0; }
        .button-cancel-booking { display: flex; align-items: center; justify-content: center; background-color: #fee2e2; color: #991b1b; border: none; width: 36px; height: 36px; border-radius: 50%; cursor: pointer; transition: background-color 0.2s; }
        .button-cancel-booking:hover { background-color: #fecaca; }
        .button-cancel-booking:disabled { opacity: 0.7; cursor: not-allowed; }
        .info-text, .error-text { text-align: center; color: #6b7280; font-size: 1rem; padding: 2rem 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 0.5rem; }
        .error-text { color: #ef4444; font-weight: 500; }
        .empty-state { padding: 3rem; background-color: #fff; border-radius: 8px; border: 1px dashed #d1d5db;}
        .empty-title { margin: 1rem 0 0.5rem 0; font-weight: 600; color: #374151;}
        .empty-subtitle { margin: 0 0 1.5rem 0; max-width: 300px; color: #6b7280; font-size: 0.9rem;}
        .find-mentor-btn { background-color: #4f46e5; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="page-container">
        <header className="header-container">
          {/* ... header ... */}
           <div className="header-left">
            <button onClick={() => router.back()} className="back-button" title="Back">
              <ArrowLeft size={24} color="#4f46e5" />
            </button>
            <h1 className="header-title">My Upcoming Sessions</h1>
          </div>
           <button onClick={fetchBookings} className="icon-button" title="Refresh Bookings">
             <RefreshCw size={20} color="#4f46e5" />
           </button>
        </header>

        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </>
  );
}