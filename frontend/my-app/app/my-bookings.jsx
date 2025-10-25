import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Calendar, Clock, RefreshCw, Link2, Hourglass } from 'lucide-react'; // Added Link2, Hourglass
import { useRouter } from 'expo-router';
import dayjs from 'dayjs';

export default function MyBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    // ... (fetchBookings function remains the same) ...
        setIsLoading(true);
        setFetchError(null);
        const token = localStorage.getItem("token");
        try {
          const res = await fetch("http://localhost:5000/api/bookings/my-schedule-student", { // Calls the updated endpoint
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

  // --- MODIFIED: Render Content ---
  const renderContent = () => {
    if (isLoading) {
      return <p className="info-text"><Loader2 size={24} className="spinner" /> Loading your bookings...</p>;
    }
    if (fetchError) {
      return <p className="error-text">{fetchError}</p>;
    }
    if (bookings.length === 0) {
      return (
        <div className="info-text empty-state">
           {/* ... empty state JSX ... */}
             <Calendar size={40} color="#6b7280" />
              <h3 className="empty-title">No Upcoming Sessions</h3>
              <p className="empty-subtitle">You haven't booked any sessions yet, or your requests are pending.</p>
              <button onClick={() => router.push('/mentorconnect')} className="find-mentor-btn">Find a Mentor</button>
        </div>
      );
    }
    return (
      <div className="item-list">
        {bookings.map(booking => (
          <div key={booking._id} className={`list-item booking-item status-${booking.status}`}> {/* Add status class */}
             <img
                src={booking.mentor.profilePic || 'https://via.placeholder.com/150'}
                alt={`${booking.mentor.fullName} profile`}
                className="item-avatar"
             />
            <div className="item-info">
              <p className="item-name">{booking.mentor.fullName}</p>
              <p className="item-detail">{booking.mentor.jobTitle} at {booking.mentor.company}</p>
              <p className="item-date">{dayjs(booking.startTime).format('dddd, MMMM D, YYYY')}</p>
              <p className="item-time">
                <Clock size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                {dayjs(booking.startTime).format('h:mm A')} - {dayjs(booking.endTime).format('h:mm A')}
              </p>
              
              {/* --- Show Status and Link --- */}
              {booking.status === 'pending_mentor_approval' && (
                  <p className="item-status pending">
                      <Hourglass size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }}/>
                      Pending Mentor Approval
                  </p>
              )}
               {booking.status === 'confirmed' && (
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
               {/* --- End Status and Link --- */}

            </div>
             {/* Optional: Add cancel button */}
          </div>
        ))}
      </div>
    );
  };


  return (
    <>
      <style>{`
        /* --- Styles (Add status/link styles) --- */
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh;  }
        .header-container { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
        .header-left { display: flex; align-items: center; gap: 1rem; }
        .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .icon-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .main-content { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        .item-list { display: flex; flex-direction: column; gap: 1rem; }
        .list-item { display: flex; align-items: flex-start; /* Align items top */ gap: 1rem; background-color: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem; }
        .item-avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .item-info { flex-grow: 1; }
        .item-name { font-weight: 600; font-size: 1.15rem; color: #1f2937; margin: 0 0 0.25rem 0; }
        .item-detail { color: #4b5563; margin: 0 0 0.5rem 0; font-size: 0.9rem; }
        .item-date { font-weight: 500; color: #374151; margin: 0.5rem 0 0.25rem 0; font-size: 0.95rem; }
        .item-time { color: #4f46e5; margin: 0; font-size: 0.95rem; font-weight: 500; }
        
        /* --- NEW Status/Link Styles --- */
        .item-status { font-size: 0.9rem; margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid #f3f4f6; }
        .item-status.pending { color: #d97706; /* Amber */ font-weight: 500; }
        .item-status.confirmed { color: #059669; /* Green */ }
        .meeting-link { color: #4f46e5; text-decoration: none; font-weight: 500; display: inline-block; margin-top: 0.25rem;}
        .meeting-link:hover { text-decoration: underline; }
        .no-link-text { font-size: 0.85rem; color: #6b7280; font-style: italic; margin: 0.25rem 0 0 0; }
        /* --- End Status/Link Styles --- */

        .info-text, .error-text { /* ... */ }
        .empty-state { /* ... */ }
        .empty-title { /* ... */ }
        .empty-subtitle { /* ... */ }
        .find-mentor-btn { /* ... */ }
        .spinner { /* ... */ }
        @keyframes spin { /* ... */ }
      `}</style>

      <div className="page-container">
          {/* ... (header remains the same) ... */}
           <header className="header-container">
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