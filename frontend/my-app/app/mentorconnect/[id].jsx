import React, { useState, useEffect } from 'react';
// --- Added Star and MessageSquare icons ---
import { ArrowLeft, Loader2, Briefcase, Brain, Clock, Award, Calendar, Send, CheckCircle, Hourglass, DollarSign, Star, MessageSquare } from 'lucide-react';
import { useRouter, useLocalSearchParams } from 'expo-router'; // Keeping expo-router

export default function MentorProfile() {
  const router = useRouter();
  const { id } = useLocalSearchParams(); // Use expo-router's hook

  const [mentor, setMentor] = useState(null);
  // --- Renamed to indicate profile loading ---
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // --- Separate loading state for connection/review status ---
  const [isStatusLoading, setIsStatusLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('loading'); // Keep this as 'loading' initially
  const [isRequesting, setIsRequesting] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [currentUser, setCurrentUser] = useState(null); // Store current user info

  // --- REVIEW STATE ---
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // --- MY REVIEW STATE ---
  const [hasUserReviewed, setHasUserReviewed] = useState(null); // null, true, or false
  const [showReviewBox, setShowReviewBox] = useState(false);
  const [myRating, setMyRating] = useState(0);
  const [myFeedback, setMyFeedback] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false); // For submitting review
  // --- END REVIEW STATE ---

  // --- Function to fetch secondary data (status + reviews) ---
  const fetchSecondaryData = async (mentorId, user, authToken) => {
    setIsStatusLoading(true); // Loading connection/myreview status
    setReviewsLoading(true);  // Loading all reviews

    // --- Fetch All Reviews ---
    const fetchAllReviewsPromise = (async () => {
      try {
        console.log(`Fetching reviews for ID: ${mentorId}`);
        const reviewsRes = await fetch(`https://placemate-ru7v.onrender.com/api/reviews/${mentorId}`);
        console.log(`Reviews fetch status: ${reviewsRes.status}`);
        if (reviewsRes.ok) {
            const reviewsData = await reviewsRes.json();
            setReviews(reviewsData.data);
        } else {
            console.error("Failed to fetch reviews");
            setReviews([]);
        }
      } catch (err) {
        console.error("Reviews fetch error:", err);
      } finally {
        setReviewsLoading(false);
      }
    })(); // Immediately invoke the async function

    // --- Fetch Student-Specific Data ---
    const fetchStudentDataPromise = (async () => {
      if (authToken && user?.role === 'user') {
        try {
          // Fetch Connection Status & My Review Status Concurrently
          const [statusRes, myReviewRes] = await Promise.all([
            fetch(`https://placemate-ru7v.onrender.com/api/connections/status/${mentorId}`, {
              headers: { "Authorization": `Bearer ${authToken}` }
            }),
            fetch(`https://placemate-ru7v.onrender.com/api/reviews/my-review/${mentorId}`, {
              headers: { "Authorization": `Bearer ${authToken}` }
            })
          ]);

          // Process Connection Status
          console.log(`Connection status fetch status: ${statusRes.status}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setConnectionStatus(statusData.status);
          } else {
            console.error("Failed to fetch connection status:", statusRes.statusText);
            setConnectionStatus('none');
          }

          // Process My Review Status
          console.log(`'My review' fetch status: ${myReviewRes.status}`);
          if (myReviewRes.ok) {
            const myReviewData = await myReviewRes.json();
            setHasUserReviewed(myReviewData.hasReviewed);
            if(myReviewData.hasReviewed) {
              setMyRating(myReviewData.review.rating);
              setMyFeedback(myReviewData.review.feedback);
            }
          } else {
             setHasUserReviewed(false); // Assume false on error
          }
        } catch (err) {
          console.error("Student-specific data fetch error:", err);
          setConnectionStatus('none');
          setHasUserReviewed(false);
        } finally {
          setIsStatusLoading(false);
        }
      } else {
        // Not a student or no token
        setConnectionStatus('none');
        setHasUserReviewed(null);
        setIsStatusLoading(false);
      }
    })(); // Immediately invoke the async function

    // Wait for both secondary fetches to complete (optional, but good practice)
    await Promise.all([fetchAllReviewsPromise, fetchStudentDataPromise]);
    console.log("Secondary data fetching complete.");
  };


  useEffect(() => {
    // Get user info once on mount
    const storedUser = localStorage.getItem('user');
    let user = null;
    if (storedUser) {
      try {
        user = JSON.parse(storedUser);
        setCurrentUser(user); // Store user info in state
        setUserRole(user.role);
      } catch (e) {
        console.error("Failed to parse user data:", e);
        setCurrentUser(null);
        setUserRole(null);
      }
    }

    const token = localStorage.getItem("token");

    // --- ID HANDLING ---
    if (id) {
      console.log("MentorProfile useEffect: ID is", id, "- proceeding to fetch primary data.");

      const fetchPrimaryData = async () => {
        setIsProfileLoading(true); // Start loading profile
        setFetchError(null);
        setMentor(null); // Clear previous mentor data

        try {
          // --- 1. Fetch Mentor Profile (Critical) ---
          console.log(`Fetching profile for ID: ${id}`);
          const profileRes = await fetch(`https://placemate-ru7v.onrender.com/api/mentors/${id}`);
          console.log(`Profile fetch status: ${profileRes.status}`);
          if (profileRes.status === 404) throw new Error('Mentor not found.');
          if (!profileRes.ok) throw new Error('Could not load mentor profile.');
          const profileData = await profileRes.json();
          setMentor(profileData);
          setIsProfileLoading(false); // <<<--- Profile loaded, stop main spinner

          // --- Trigger secondary data fetch ---
          fetchSecondaryData(id, user, token);

        } catch (error) {
          console.error("Failed to fetch profile data:", error);
          setFetchError(error.message);
          setIsProfileLoading(false); // Stop loading on error
        }
      };

      fetchPrimaryData();

    } else {
      // If id is not yet available from the hook (or is invalid),
      console.log("MentorProfile useEffect: ID is not available yet or invalid.");
      setIsProfileLoading(false); // Stop loading
      setFetchError("No Mentor ID provided in URL.");
    }
    // --- End ID handling ---

  }, [id]); // Effect depends on 'id' from useLocalSearchParams


  // --- (handleRequestConnection function remains the same) ---
  const handleRequestConnection = async () => { /* ... no changes ... */ };

  // --- (handleBookSession function remains the same) ---
  const handleBookSession = () => { /* ... no changes ... */ };

  // --- (handleReviewSubmit function remains the same) ---
  const handleReviewSubmit = async (e) => {
      e.preventDefault();
      if (myRating === 0) {
        alert("Please select a star rating.");
        return;
      }
      setReviewLoading(true);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch(`https://placemate-ru7v.onrender.com/api/reviews/${id}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ rating: myRating, feedback: myFeedback })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || "Failed to submit review.");
        }

        alert("Review submitted successfully!");
        setHasUserReviewed(true);
        setShowReviewBox(false);
        // Refresh only reviews and potentially mentor average rating after submission
        fetchAllReviews(id); // Refresh the review list, passing the id

        // Manually update mentor's average rating on frontend
        if (mentor) {
          const currentAvg = mentor.averageRating || 0;
          const currentCount = mentor.numReviews || 0;
          const newTotalRating = (currentAvg * currentCount) + myRating;
          const newNumReviews = currentCount + 1;
          setMentor(prevMentor => ({ // Use functional update
            ...prevMentor,
            averageRating: (newTotalRating / newNumReviews).toFixed(1),
            numReviews: newNumReviews
          }));
        }

      } catch (err) {
        alert(`Error: ${err.message}`);
      } finally {
        setReviewLoading(false);
      }
    };


  const renderContent = () => {
    // --- Use isProfileLoading for the main loading state ---
    if (isProfileLoading) {
      return <p className="info-text"><Loader2 size={24} className="spinner" /> Loading profile...</p>;
    }
    // --- Show fetchError if it occurred during profile fetch ---
    if (fetchError) {
      return <p className="error-text">{fetchError}</p>;
    }
    // --- This case should now only happen if fetch succeeded but returned no data ---
    if (!mentor) {
      return <p className="info-text">Could not load mentor data. Please check the ID or try again.</p>;
    }

    // --- Determine Connection Button State ---
    let actionButton = null;
    if (userRole === 'user') {
        // Show loading spinner while connection/review status is loading
        if (isStatusLoading) {
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

    return (
      <div className="profile-content">
        <img
          src={mentor.profilePic || 'https://via.placeholder.com/150'}
          alt={`${mentor.fullName} profile`}
          className="profile-avatar"
        />
        <h1 className="profile-name">{mentor.fullName}</h1>
        <p className="profile-title">{mentor.jobTitle} at {mentor.company}</p>

        {/* --- Average Rating Display (Unchanged) --- */}
        {mentor.numReviews > 0 ? (
            <div className="average-rating-display">
                <Star size={20} color="#f59e0b" fill="#f59e0b" />
                <span className="rating-value">{mentor.averageRating}</span>
                <span className="rating-count">({mentor.numReviews} reviews)</span>
            </div>
        ) : (
            // Only show "No reviews yet" if reviews are done loading
            !reviewsLoading && <div className="average-rating-display">
                <span className="rating-count">No reviews yet</span>
            </div>
        )}

        {actionButton}

        {/* --- Availability Section (Unchanged) --- */}
        <div className="profile-divider"></div>
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

        {/* --- Details Grid (Unchanged) --- */}
         <div className="profile-divider"></div>
        <h2 className="section-title">Details</h2>
        <div className="details-grid">
          <DetailCard Icon={Briefcase} title="Experience" value={`${mentor.experience || 'N/A'} years`} />
          <DetailCard Icon={Award} title="Qualification" value={mentor.qualification || 'N/A'} />
          <DetailCard Icon={Brain} title="Areas of Expertise" value={mentor.expertise || 'N/A'} />
          <DetailCard
            Icon={DollarSign}
            title="Session Fee"
            value={mentor.fees > 0 ? `₹${mentor.fees}` : 'Free'}
          />
        </div>

        {/* --- REVIEWS SECTION --- */}
        <div className="profile-divider"></div>
        <h2 className="section-title">Reviews</h2>

        {/* --- Review Submission Box --- */}
        {/* Show only if user role determined and status is loaded */}
        {userRole === 'user' && !isStatusLoading && (
          <div className="review-submission-wrapper">
            {hasUserReviewed === false && showReviewBox === false && (
              <button className="connect-button" style={{marginTop: 0}} onClick={() => setShowReviewBox(true)}>
                <MessageSquare size={18} /> Write a Review
              </button>
            )}
            {hasUserReviewed === true && (
              <div className="review-item my-review">
                 {/* ... (display user's review - same as before) ... */}
                 <h3 className="my-review-title">Your Review</h3>
                <div className="review-stars">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={16}
                            color={i < myRating ? "#f59e0b" : "#e5e7eb"}
                            fill={i < myRating ? "#f59e0b" : "none"}
                        />
                    ))}
                </div>
                {myFeedback && (
                  <p className="review-feedback" style={{borderTop: 'none', paddingTop: '0.75rem'}}>{myFeedback}</p>
                )}
              </div>
            )}
            {showReviewBox && hasUserReviewed === false && (
              <form className="review-form" onSubmit={handleReviewSubmit}>
                {/* ... (review form - same as before) ... */}
                <h3>Write Your Review</h3>
                <div className="star-rating">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button type="button" key={star} className="star-btn" onClick={() => setMyRating(star)}>
                      <Star color={star <= myRating ? "#f59e0b" : "#d1d5db"} fill={star <= myRating ? "#f59e0b" : "none"}/>
                    </button>
                  ))}
                </div>
                <textarea className="feedback-textarea" placeholder="Share your feedback (optional)..." value={myFeedback} onChange={(e) => setMyFeedback(e.target.value)} maxLength={500}/>
                <div className="form-actions">
                  <button type="button" className="button-cancel" onClick={() => setShowReviewBox(false)}>Cancel</button>
                  <button type="submit" className="modal-submit-btn" disabled={reviewLoading}>
                    {reviewLoading ? <Loader2 size={20} className="spinner" /> : "Submit Review"}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
        {/* --- END: Review Submission Box --- */}


        <div className="reviews-list">
            {/* --- Use reviewsLoading state for this section --- */}
            {reviewsLoading ? (
                <p className="info-text" style={{padding: '1rem 0'}}><Loader2 size={20} className="spinner" /> Loading reviews...</p>
            ) : reviews.length > 0 ? (
                reviews.map(review => {
                    let currentUserId = currentUser ? currentUser.id : null;
                    // --- Hide own review from this list more reliably ---
                    if (currentUserId && review.student?._id === currentUserId) {
                      return null;
                    }
                    return (
                      <div key={review._id} className="review-item">
                          {/* ... (display other reviews - same as before) ... */}
                          <div className="review-header">
                              <img
                                  src={review.student?.profilePic || 'https://t4.ftcdn.net/jpg/02/15/84/43/360_F_215844325_ttX9YiIIyeaR7Ne6EaLLjMAmy4GvPC69.jpg'}
                                  alt={review.student?.fullName ? `${review.student.fullName} profile` : 'Student profile'}
                                  className="review-avatar"
                              />
                              <div className="review-info">
                                  <span className="review-student-name">{review.student?.fullName || 'Student'}</span>
                                  <div className="review-stars">
                                      {[...Array(5)].map((_, i) => (
                                          <Star key={i} size={16}
                                              color={i < review.rating ? "#f59e0b" : "#e5e7eb"}
                                              fill={i < review.rating ? "#f59e0b" : "none"}
                                          />
                                      ))}
                                  </div>
                              </div>
                          </div>
                          {review.feedback && (
                              <p className="review-feedback">{review.feedback}</p>
                          )}
                      </div>
                    )
                })
            ) : (
                <p className='no-reviews-text'>No reviews for this mentor yet.</p>
            )}
        </div>
        {/* --- END REVIEWS SECTION --- */}

      </div>
    );
  };

  return (
    <>
      <style>{`
        /* --- (All existing styles + review form styles) --- */
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
        .connect-button { display: inline-flex; align-items: center; gap: 0.5rem; background-color: #4f46e5; color: white; border: none; padding: 0.75rem 1.5rem; border-radius: 8px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; margin-top: 1.5rem; font-size: 1rem; }
        .connect-button:hover { background-color: #4338ca; }
        .connect-button .spinner { margin-right: 0.5rem; }
        .disabled-button { background-color: #a5b4fc; color: #eef2ff; cursor: not-allowed; }
        .disabled-button:hover { background-color: #a5b4fc; }
        .book-button { background-color: #10b981; }
        .book-button:hover { background-color: #059669; }
        .details-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; width: 100%; }
        @media (min-width: 640px) { .details-grid { grid-template-columns: repeat(2, 1fr); } }
        .detail-card { background-color: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem; display: flex; align-items: flex-start; gap: 1rem; }
        .detail-icon { flex-shrink: 0; width: 40px; height: 40px; border-radius: 50%; background-color: #eef2ff; color: #4f46e5; display: flex; align-items: center; justify-content: center; }
        .detail-text-content { display: flex; flex-direction: column; }
        .detail-title { font-size: 0.85rem; color: #6b7280; font-weight: 600; text-transform: uppercase; margin: 0 0 0.25rem 0; }
        .detail-value { font-size: 1rem; color: #1f2937; font-weight: 500; margin: 0; line-height: 1.5; word-break: break-word; }
        .section-title { font-size: 1.25rem; font-weight: 600; color: #1f2937; margin-bottom: 1rem; width: 100%; text-align: left; }
        .availability-list { display: flex; flex-direction: column; gap: 0.75rem; width: 100%; background-color: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem; }
        .availability-slot { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid #f3f4f6; }
        .availability-slot:last-child { border-bottom: none; }
        .slot-day { font-weight: 600; color: #1f2937; flex-basis: 120px; }
        .slot-time { font-weight: 500; color: #4b5563; }
        .no-slots-text { color: #6b7280; font-style: italic; text-align: center; padding: 1rem 0;}
        .info-text, .error-text { text-align: center; color: #6b7280; font-size: 1rem; padding: 4rem 1rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
        .error-text { color: #ef4444; font-weight: 500; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* --- REVIEW STYLES --- */
        .average-rating-display { display: flex; align-items: center; gap: 0.5rem; margin-top: 0.75rem; }
        .rating-value { font-size: 1.1rem; font-weight: 700; color: #111827; }
        .rating-count { font-size: 0.9rem; color: #6b7280; }
        .reviews-list { display: flex; flex-direction: column; gap: 1.5rem; width: 100%; margin-top: 1.5rem; }
        .review-item { background-color: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1.5rem; }
        .review-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
        .review-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; }
        .review-info { display: flex; flex-direction: column; }
        .review-student-name { font-weight: 600; color: #1f2937; }
        .review-stars { display: flex; gap: 0.1rem; margin-top: 0.25rem; }
        .review-feedback { font-size: 0.95rem; color: #374151; line-height: 1.6; margin: 0; padding-top: 1rem; border-top: 1px solid #f3f4f6; }
        .no-reviews-text { color: #6b7280; font-style: italic; text-align: center; padding: 1rem 0; background-color: #fff; border: 1px dashed #e5e7eb; border-radius: 0.75rem; }

        /* --- REVIEW FORM STYLES --- */
        .review-submission-wrapper {
          width: 100%;
          background-color: #f9fafe;
          border: 1px solid #e5e7eb;
          border-radius: 0.75rem;
          padding: 1.5rem;
          box-sizing: border-box;
          margin-bottom: 1.5rem;
        }
        .review-item.my-review {
          background-color: #fff;
          border: 1px solid #d1d5db;
        }
        .my-review-title {
          font-size: 1rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 0.5rem 0;
        }
        .review-form h3 {
          font-size: 1.1rem;
          font-weight: 600;
          margin: 0 0 1rem 0;
        }
        .star-rating { display: flex; gap: 0.25rem; margin-bottom: 1rem; }
        .star-btn { background: none; border: none; padding: 0; cursor: pointer; }
        .star-btn svg { width: 32px; height: 32px; transition: color 0.2s; }
        .feedback-textarea {
          width: 100%;
          min-height: 100px;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          padding: 0.75rem;
          font-family: inherit;
          font-size: 1rem;
          margin-bottom: 1.5rem;
          box-sizing: border-box;
          background-color: #fff;
        }
        .form-actions {
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
        .modal-submit-btn {
          background-color: #4f46e5; color: white; border: none;
          padding: 0.6rem 1.25rem; border-radius: 0.5rem;
          font-weight: 600; cursor: pointer; font-size: 0.95rem;
          display: flex; align-items: center; justify-content: center; gap: 0.5rem;
        }
        .modal-submit-btn:disabled { background-color: #a5b4fc; cursor: not-allowed; }
        .button-cancel {
          background-color: #f3f4f6; color: #374151; border: 1px solid #d1d5db;
          padding: 0.6rem 1.25rem; border-radius: 0.5rem;
          font-weight: 600; cursor: pointer; font-size: 0.95rem;
        }
        .button-cancel:hover { background-color: #e5e7eb; }
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