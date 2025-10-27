import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Briefcase, Brain, Clock, Award, Calendar, Send, CheckCircle, Hourglass,DollarSign } from 'lucide-react'; // Added icons
import { useRouter, useLocalSearchParams } from 'expo-router';

export default function MentorProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); 

  const [mentor, setMentor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // --- NEW STATE ---
  const [connectionStatus, setConnectionStatus] = useState('loading'); // 'loading', 'none', 'pending', 'accepted', 'rejected'
  const [isRequesting, setIsRequesting] = useState(false); // Loading state for the button
  const [userRole, setUserRole] = useState(null); // To show/hide button based on role

  useEffect(() => {
    // Check user role
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUserRole(JSON.parse(storedUser).role);
    }

    if (!id) return; 

    // Fetch both mentor profile and connection status
    const fetchData = async () => {
      setIsLoading(true);
      setFetchError(null);
      setConnectionStatus('loading');
      const token = localStorage.getItem("token");

      try {
        // Fetch profile (Promise 1)
        const profilePromise = fetch(`https://placemate-ru7v.onrender.com/api/mentors/${id}`);
        
        // Fetch connection status (Promise 2) - only if logged in as user
        let statusPromise = Promise.resolve(null); // Default for non-users
        if (token && JSON.parse(storedUser)?.role === 'user') { 
          statusPromise = fetch(`https://placemate-ru7v.onrender.com/api/connections/status/${id}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
        }

        // Wait for both fetches
        const [profileRes, statusRes] = await Promise.all([profilePromise, statusPromise]);

        // Process profile response
        if (profileRes.status === 404) throw new Error('Mentor not found.');
        if (!profileRes.ok) throw new Error('Could not load mentor profile.');
        const profileData = await profileRes.json();
        setMentor(profileData);

        // Process status response (if applicable)
        if (statusRes) {
          if (!statusRes.ok) { 
            // Handle errors like invalid token, but don't block profile view
            console.error("Failed to fetch connection status:", statusRes.statusText);
            setConnectionStatus('none'); // Assume no connection on error
          } else {
            const statusData = await statusRes.json();
            setConnectionStatus(statusData.status);
          }
        } else {
             setConnectionStatus('none'); // Not logged in as user or no token
        }

      } catch (error) {
        console.error("Failed to fetch data:", error);
        setFetchError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // --- UPDATED: Makes the actual API call ---
  const handleRequestConnection = async () => {
    const token = localStorage.getItem("token");
    if (!token || userRole !== 'user') {
      alert("Please log in as a student to connect.");
      router.push('/');
      return;
    }

    setIsRequesting(true);
    try {
      const res = await fetch("https://placemate-ru7v.onrender.com/api/connections/request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ mentorId: id }) 
      });

      const data = await res.json();
      if (!res.ok && res.status !== 400) { // Allow 400 for "already sent"
        throw new Error(data.message || "Failed to send request.");
      }
      
      alert(data.message || "Request sent!"); 
      setConnectionStatus('pending'); // Update button state immediately
      
    } catch (err) {
      alert(`Error: ${err.message}`);
      console.error(err);
    } finally {
       setIsRequesting(false);
    }
  };
  
  // --- NEW: Placeholder for booking ---
  const handleBookSession = () => {
      // This would navigate to a new booking page:
      router.push(`/mentorconnect/book/${id}`); 
     // alert(`Navigating to booking page for ${mentor.fullName}... (Not implemented yet)`);
  };

  // --- UPDATED: Renders availability slots and conditional button ---
  const renderContent = () => {
    if (isLoading) {
      return <p className="info-text"><Loader2 size={24} className="spinner" /> Loading profile...</p>;
    }
    if (fetchError) {
      return <p className="error-text">{fetchError}</p>;
    }
    if (!mentor) {
      return <p className="info-text">No mentor data available.</p>;
    }

    // --- Conditional Button Logic ---
    let actionButton = null;
    if (userRole === 'user') { // Only show button for logged-in students
        if (connectionStatus === 'loading') {
            actionButton = <button className="connect-button disabled-button" disabled><Loader2 size={18} className="spinner"/> Checking Status...</button>;
        } else if (connectionStatus === 'none') {
            actionButton = <button className="connect-button" onClick={handleRequestConnection} disabled={isRequesting}>{isRequesting ? <Loader2 size={18} className="spinner"/> : <Send size={18}/>} Request Connection</button>;
        } else if (connectionStatus === 'pending') {
            actionButton = <button className="connect-button disabled-button" disabled><Hourglass size={18}/> Request Sent</button>;
        } else if (connectionStatus === 'accepted') {
            actionButton = <button className="connect-button book-button" onClick={handleBookSession}><Calendar size={18}/> Book a Session</button>;
        } else if (connectionStatus === 'rejected') {
            actionButton = <button className="connect-button disabled-button" disabled>Request Not Accepted</button>;
        }
    }

    console.log('Mentor data received:', mentor);


    return (
      <div className="profile-content">
        <img 
          src={mentor.profilePic || 'https://via.placeholder.com/150'} 
          alt={`${mentor.fullName} profile`} 
          className="profile-avatar"
        />
        <h1 className="profile-name">{mentor.fullName}</h1>
        <p className="profile-title">{mentor.jobTitle} at {mentor.company}</p>
        
        {/* Render the conditional button */}
        {actionButton}
        
        <div className="profile-divider"></div>
        
        {/* --- Availability Section --- */}
        <h2 className="section-title">Availability</h2>
        <div className="availability-list">
            {mentor.availabilitySlots && mentor.availabilitySlots.length > 0 ? (
                mentor.availabilitySlots.map((slot, index) => (
                    <div key={index} className="availability-slot">
                        <span className="slot-day">{slot.day}</span>
                        <span className="slot-time">{slot.startTime} - {slot.endTime}</span>
                    </div>
                ))
            ) : (
                <p className='no-slots-text'>Availability not set by mentor.</p>
            )}
        </div>

         <div className="profile-divider"></div>

        <h2 className="section-title">Details</h2>
        <div className="details-grid">
          <DetailCard Icon={Briefcase} title="Experience" value={`${mentor.experience || 'N/A'} years`} />
          <DetailCard Icon={Award} title="Qualification" value={mentor.qualification || 'N/A'} />
          <DetailCard Icon={Brain} title="Areas of Expertise" value={mentor.expertise || 'N/A'} />
          {/* Removed old Availability/Hours cards */}
          {/* --- ADD FEES CARD --- */}
          <DetailCard
            Icon={DollarSign}
            title="Session Fee"
            // Display 'Free' if fees are 0 or not set, otherwise format (e.g., INR)
            value={mentor.fees > 0 ? `₹${mentor.fees}` : 'Free'}
          />
          {/* --- END FEES CARD --- */}
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        /* --- Base Styles (mostly unchanged) --- */
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh;overflow-y: auto; }
        .header-container { display: flex; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
        .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none; margin-right: 1rem; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; }
        .main-content { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        .profile-content { display: flex; flex-direction: column; align-items: center; }
        .profile-avatar { width: 120px; height: 120px; border-radius: 50%; object-fit: cover; border: 4px solid #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 1rem; }
        .profile-name { font-size: 2rem; font-weight: 700; color: #111827; margin: 0; }
        .profile-title { font-size: 1.1rem; color: #4f46e5; margin: 0.25rem 0; font-weight: 500; }
        .profile-divider { height: 1px; background-color: #e5e7eb; margin: 2rem 0; width: 100%; }
        
        /* --- Button Styles --- */
        .connect-button { display: inline-flex; align-items: center; gap: 0.5rem; background-color: #4f46e5; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; margin-top: 1.5rem; font-size: 1rem; }
        .connect-button:hover { background-color: #4338ca; }
        .connect-button .spinner { margin-right: 0.5rem; }
        .disabled-button { background-color: #a5b4fc; color: #eef2ff; cursor: not-allowed; }
        .disabled-button:hover { background-color: #a5b4fc; }
        .book-button { background-color: #10b981; } /* Green for booking */
        .book-button:hover { background-color: #059669; }

        /* --- Details Grid Styles (unchanged) --- */
        .details-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; width: 100%; }
        @media (min-width: 640px) { .details-grid { grid-template-columns: repeat(2, 1fr); } }
        .detail-card { background-color: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem; display: flex; align-items: flex-start; gap: 1rem; }
        .detail-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; background-color: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; }
        .detail-text-content { display: flex; flex-direction: column; }
        .detail-title { font-size: 0.85rem; color: #6b7280; font-weight: 600; text-transform: uppercase; margin: 0 0 0.25rem 0; }
        .detail-value { font-size: 1rem; color: #1f2937; font-weight: 500; margin: 0; line-height: 1.5; word-break: break-word; }

        /* --- NEW Availability Styles --- */
        .section-title { font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem; width: 100%; text-align: left; }
        .availability-list { 
            display: flex; flex-direction: column; gap: 0.75rem; 
            width: 100%; background-color: #fff; border: 1px solid #e5e7eb; 
            border-radius: 0.75rem; padding: 1.5rem;
        }
        .availability-slot { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6; }
        .availability-slot:last-child { border-bottom: none; }
        .slot-day { font-weight: 600; color: #1f2937; flex-basis: 120px; }
        .slot-time { font-weight: 500; color: #4b5563; }
        .no-slots-text { color: #6b7280; font-style: italic; text-align: center; padding: 1rem 0;}

        /* --- Utility Styles --- */
        .info-text, .error-text { text-align: center; color: #6b7280; font-size: 1rem; padding: 4rem 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .error-text { color: #ef4444; font-weight: 500; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="page-container">
        <header className="header-container">
          <button onClick={() => router.back()} className="back-button" title="Back to list">
            <ArrowLeft size={24} color="#4f46e5" />
          </button>
          <h1 className="header-title">Mentor Profile</h1>
        </header>

        <main className="main-content">
          {renderContent()}
        </main>
      </div>
    </>
  );
}

// Helper component (unchanged)
// Helper component for rendering detail cards
function DetailCard({ Icon, title, value }) {
  return (
    <div className="detail-card">
      <div className="detail-icon">
        <Icon size={20} />
      </div>
      <div className="detail-text-content">
        <h3 className="detail-title">{title}</h3>
        {/* It uses the 'value' prop here */}
        <p className="detail-value">{value}</p> 
      </div>
    </div>
  );
}