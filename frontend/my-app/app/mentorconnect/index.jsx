import React, { useState, useEffect } from "react";
import { ArrowLeft, Search, Loader2, ChevronRight, Calendar } from 'lucide-react';
import { useRouter } from "expo-router";

export default function MentorConnectBrowse() {
  const [mentors, setMentors] = useState([]);
  const [filteredMentors, setFilteredMentors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check user role
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUserRole(JSON.parse(storedUser).role);
      } else {
        setUserRole(null);
      }
    } catch (e) {
      console.error("Failed to parse user data from localStorage", e);
      setUserRole(null);
    }

    // Fetch mentors
    const fetchApprovedMentors = async () => {
      // ... (fetch logic remains the same) ...
        setIsLoading(true);
        setFetchError(null);
        try {
          const response = await fetch("http://localhost:5000/api/mentors/approved");
          if (!response.ok) throw new Error('Network response was not ok');
          const data = await response.json();
          setMentors(data);
          setFilteredMentors(data);
        } catch (error) {
          console.error("Failed to fetch mentors:", error);
          setFetchError("Could not load mentors. Please check your connection.");
        } finally {
          setIsLoading(false);
        }
    };
    fetchApprovedMentors();
  }, []);

  // Handle search logic (remains the same)
  useEffect(() => {
     // ... (search logic remains the same) ...
      const results = mentors.filter(mentor =>
        (mentor.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.jobTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mentor.expertise || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredMentors(results);
  }, [searchTerm, mentors]);

  const viewProfile = (mentorId) => {
    router.push(`/mentorconnect/${mentorId}`);
  };

  // Render mentor list (remains the same)
  const renderContent = () => {
     // ... (render logic remains the same) ...
      if (isLoading) {
        return <p className="info-text"><Loader2 size={24} className="spinner" /> Loading mentors...</p>;
      }
      if (fetchError) {
        return <p className="error-text">{fetchError}</p>;
      }
      if (filteredMentors.length === 0 && !isLoading) {
          return <p className="info-text">No mentors found matching your criteria.</p>;
      }
      return (
        <div className="mentor-list">
          {filteredMentors.map((mentor) => (
            <div key={mentor._id} className="mentor-item" onClick={() => viewProfile(mentor._id)}>
              <img
                src={mentor.profilePic || 'https://via.placeholder.com/150'}
                alt={`${mentor.fullName} profile`}
                className="item-avatar"
              />
              <div className="item-content">
                <h3 className="item-name">{mentor.fullName}</h3>
                <p className="item-title">{mentor.jobTitle} at {mentor.company}</p>
                <p className="item-expertise">
                  Expertise: {mentor.expertise || "Not specified"}
                </p>
              </div>
              <ChevronRight size={20} className="item-chevron" />
            </div>
          ))}
        </div>
      );
  };

  return (
    <>
      <style>{`
        /* --- Styles --- */
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh;overflow-y: auto; }
        
        /* --- UPDATED HEADER STYLE --- */
        .header-container { 
            display: flex; 
            align-items: center; 
            justify-content: space-between; /* Positions items at ends */
            padding: 1.25rem 1.5rem; 
            background-color: #fff; 
            border-bottom: 1px solid #e5e7eb; 
        }
        .header-left { /* Group back button and title */
            display: flex;
            align-items: center;
            gap: 1rem;
        }
        /* --- END HEADER UPDATE --- */

        .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; text-decoration: none; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .main-content { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        .search-container { position: relative; margin-bottom: 2rem; max-width: 600px; margin-left: auto; margin-right: auto; }
        .search-icon { position: absolute; left: 0.875rem; top: 50%; transform: translateY(-50%); color: #9ca3af; }
        .search-input { width: 100%; box-sizing: border-box; background-color: #fff; border: 1px solid #ddd; padding: 0.875rem 0.875rem 0.875rem 2.75rem; border-radius: 0.75rem; font-size: 1rem; box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); }
        .search-input:focus { outline: none; border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.5); }

        /* --- UPDATED BUTTON STYLE --- */
        .my-bookings-button {
          display: flex; align-items: center; gap: 0.5rem;
          background-color: #eef2ff; color: #4338ca; border: none; /* Removed border */
          padding: 0.6rem 1rem; /* Slightly smaller padding */
          border-radius: 8px; font-weight: 600; cursor: pointer;
          text-align: center; font-size: 0.9rem; /* Slightly smaller font */
          transition: background-color 0.2s;
          /* Removed margin */
        }
        .my-bookings-button:hover { background-color: #e0e7ff; }
        /* --- END BUTTON UPDATE --- */

        .mentor-list { display: flex; flex-direction: column; gap: 1rem; }
        .mentor-item { display: flex; align-items: center; gap: 1rem; background-color: #fff; border-radius: 0.75rem; border: 1px solid #e5e7eb; padding: 1rem; transition: background-color 0.2s, box-shadow 0.2s; cursor: pointer; }
        .mentor-item:hover { background-color: #f9fafb; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .item-avatar { width: 60px; height: 60px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
        .item-content { flex-grow: 1; overflow: hidden; }
        .item-name { font-size: 1.15rem; font-weight: 600; color: #111827; margin: 0; }
        .item-title { font-size: 0.95rem; color: #4f46e5; margin: 0.25rem 0; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-expertise { font-size: 0.9rem; color: #6b7280; margin: 0.25rem 0 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .item-chevron { flex-shrink: 0; color: #9ca3af; margin-left: 1rem; }
        .info-text, .error-text { text-align: center; color: #6b7280; font-size: 1rem; padding: 4rem 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .error-text { color: #ef4444; font-weight: 500; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

      <div className="page-container">
        <header className="header-container">
          {/* Group back button and title */}
          <div className="header-left">
              <a href="/home" className="back-button" title="Back to Home">
                <ArrowLeft size={24} color="#4f46e5" />
              </a>
              <h1 className="header-title">Find a Mentor</h1>
          </div>

          {/* --- MOVE BUTTON HERE --- */}
          {userRole === 'user' && (
            <button
              onClick={() => router.push('/my-bookings')}
              className="my-bookings-button"
            >
              <Calendar size={18} />
              My Bookings
            </button>
          )}
          {/* --- END BUTTON MOVE --- */}
        </header>

        <main className="main-content">
          <div className="search-container">
            <span className="search-icon">
              <Search size={20} />
            </span>
            <input
              type="text"
              className="search-input"
              placeholder="Search by name, company, or expertise..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* --- BUTTON REMOVED FROM HERE --- */}

          <section className="mentor-list-container">
            {renderContent()}
          </section>
        </main>
      </div>
    </>
  );
}