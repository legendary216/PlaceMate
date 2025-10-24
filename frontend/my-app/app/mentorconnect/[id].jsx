import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Briefcase, Brain, Clock, Award, Calendar, Send } from 'lucide-react';
import { useRouter, useLocalSearchParams } from 'expo-router';

// This is the dynamic mentor detail page.
// It fetches one mentor's public data using the [id] from the URL.

export default function MentorProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Gets the [id] from the URL

  const [mentor, setMentor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    if (!id) return; // Don't fetch if the id isn't available yet

    const fetchMentorProfile = async () => {
      setIsLoading(true);
      setFetchError(null);
      try {
        // This calls the new backend endpoint for a single mentor
        const response = await fetch(`http://localhost:5000/api/mentors/${id}`);
        
        if (response.status === 404) {
          throw new Error('Mentor not found.');
        }
        if (!response.ok) {
          throw new Error('Could not load mentor profile.');
        }
        
        const data = await response.json();
        setMentor(data);
      } catch (error) {
        console.error("Failed to fetch mentor:", error);
        setFetchError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMentorProfile();
  }, [id]);

  // This function would handle the logic for a user requesting to connect.
  // For now, it's a placeholder.
  const handleRequestConnection = () => {
    alert(`Connection request sent to ${mentor.fullName}!`);
    // In a real app, this would call a POST API:
    // POST /api/connections/request
    // Body: { mentorId: id, userId: ... }
  };

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

    return (
      <div className="profile-content">
        <img 
          src={mentor.profilePic || 'https://via.placeholder.com/150'} 
          alt={`${mentor.fullName} profile`} 
          className="profile-avatar"
        />
        <h1 className="profile-name">{mentor.fullName}</h1>
        <p className="profile-title">{mentor.jobTitle} at {mentor.company}</p>
        
        <button className="connect-button" onClick={handleRequestConnection}>
          <Send size={18} />
          Request Connection
        </button>
        
        <div className="profile-divider"></div>
        
        <div className="details-grid">
          <DetailCard 
            Icon={Briefcase} 
            title="Experience" 
            value={`${mentor.experience || 'N/A'} years`} 
          />
          <DetailCard 
            Icon={Award} 
            title="Qualification" 
            value={mentor.qualification || 'N/A'} 
          />
          <DetailCard 
            Icon={Brain} 
            title="Areas of Expertise" 
            value={mentor.expertise || 'N/A'} 
          />
          <DetailCard 
            Icon={Calendar} 
            title="Availability" 
            value={mentor.availability || 'N/A'} 
          />
          <DetailCard 
            Icon={Clock} 
            title="Hours per Week" 
            value={mentor.hours ? `${mentor.hours} hrs/week` : 'N/A'} 
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <style>{`
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh; }
        .header-container { display: flex; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
        .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none; margin-right: 1rem; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; }
        
        .main-content { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        .profile-content { display: flex; flex-direction: column; align-items: center; }

        .profile-avatar {
          width: 120px; height: 120px; border-radius: 50%;
          object-fit: cover; border: 4px solid #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          margin-bottom: 1rem;
        }
        .profile-name { font-size: 2rem; font-weight: 700; color: #111827; margin: 0; }
        .profile-title { font-size: 1.1rem; color: #4f46e5; margin: 0.25rem 0; font-weight: 500; }
        
        .connect-button {
          display: inline-flex; align-items: center; gap: 0.5rem;
          background-color: #4f46e5; color: white; border: none;
          padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600;
          cursor: pointer; transition: background-color 0.2s;
          margin-top: 1.5rem; font-size: 1rem;
        }
        .connect-button:hover { background-color: #4338ca; }
        
        .profile-divider { height: 1px; background-color: #e5e7eb; margin: 2rem 0; width: 100%; }
        
        .details-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          width: 100%;
        }
        @media (min-width: 640px) {
          .details-grid { grid-template-columns: repeat(2, 1fr); }
        }
        
        .detail-card {
          background-color: #fff;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          display: flex;
          align-items: flex-start;
          gap: 1rem;
        }
        .detail-icon {
          flex-shrink: 0; width: 40px; height: 40px;
          border-radius: 50%; background-color: #eef2ff;
          color: #4f46e5; display: flex;
          align-items: center; justify-content: center;
        }
        .detail-text-content { display: flex; flex-direction: column; }
        .detail-title {
          font-size: 0.85rem; color: #6b7280; font-weight: 600;
          text-transform: uppercase; margin: 0 0 0.25rem 0;
        }
        .detail-value {
          font-size: 1rem; color: #1f2937; font-weight: 500;
          margin: 0; line-height: 1.5;
        }

        .info-text, .error-text {
          text-align: center; color: #6b7280; font-size: 1rem;
          padding: 4rem 1rem; display: flex; align-items: center;
          justify-content: center; gap: 0.5rem;
        }
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

// Helper component for rendering detail cards
function DetailCard({ Icon, title, value }) {
  return (
    <div className="detail-card">
      <div className="detail-icon">
        <Icon size={20} />
      </div>
      <div className="detail-text-content">
        <h3 className="detail-title">{title}</h3>
        <p className="detail-value">{value}</p>
      </div>
    </div>
  );
}