import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Calendar, Clock, Check, CheckCircle } from 'lucide-react'; // <-- Added CheckCircle
import { useRouter, useLocalSearchParams } from 'expo-router';
import dayjs from 'dayjs'; // Import dayjs for formatting

export default function BookSession() {
  const router = useRouter();
  const { id: mentorId } = useLocalSearchParams(); // Get mentor ID from URL

  const [availableSlots, setAvailableSlots] = useState([]);
  const [groupedSlots, setGroupedSlots] = useState({}); // Slots grouped by date
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null); // { startTime, endTime }
  const [isBooking, setIsBooking] = useState(false);
  const [bookingError, setBookingError] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Fetch available slots
  useEffect(() => {
    if (!mentorId) return;

    const fetchAvailableSlots = async () => {
      setIsLoading(true);
      setFetchError(null);
      const token = localStorage.getItem("token");

      try {
        const res = await fetch(`http://localhost:5000/api/bookings/available/${mentorId}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Could not load available slots.");
        }
        const data = await res.json();
        setAvailableSlots(data);
        // Group slots by date after fetching
        groupSlotsByDate(data);
      } catch (err) {
        setFetchError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableSlots();
  }, [mentorId]);

  // Function to group slots by date string (e.g., "Monday, October 27")
  const groupSlotsByDate = (slots) => {
    const groups = {};
    slots.forEach(slot => {
      const dateStr = dayjs(slot.startTime).format('dddd, MMMM D');
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(slot);
    });
    setGroupedSlots(groups);
  };

  // Handle selecting a slot
  const handleSelectSlot = (slot) => {
    setSelectedSlot(slot);
    setBookingError(null); // Clear previous errors when selecting a new slot
  };

  // Handle confirming the booking
  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;

    setIsBooking(true);
    setBookingError(null);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch(`http://localhost:5000/api/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          mentorId: mentorId,
          startTime: selectedSlot.startTime, // Send ISO string or Date object
          endTime: selectedSlot.endTime,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to book session.");
      }
      // Booking successful!
      setShowSuccessModal(true);
      // Optionally refetch slots or just remove the booked one locally if needed
    } catch (err) {
      setBookingError(err.message);
    } finally {
      setIsBooking(false);
    }
  };

  // Render the available slots
  const renderSlots = () => {
    if (isLoading) {
      return <p className="info-text"><Loader2 size={20} className="spinner" /> Loading available times...</p>;
    }
    if (fetchError) {
      return <p className="error-text">{fetchError}</p>;
    }
    if (Object.keys(groupedSlots).length === 0) {
      return <p className="info-text">No available slots found for the next 7 days.</p>;
    }

    return Object.entries(groupedSlots).map(([date, slotsOnDate]) => (
      <div key={date} className="date-group">
        <h3 className="date-header">{date}</h3>
        <div className="slots-grid">
          {slotsOnDate.map((slot, index) => (
            <button
              key={index}
              className={`slot-button ${selectedSlot?.startTime === slot.startTime ? 'selected' : ''}`}
              onClick={() => handleSelectSlot(slot)}
            >
              {dayjs(slot.startTime).format('h:mm A')}
            </button>
          ))}
        </div>
      </div>
    ));
  };

  return (
    <>
      <style>{`
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh; }
        .header-container { display: flex; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
        .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; margin-right: 1rem; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; }
        
        .main-content { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        
        .date-group { margin-bottom: 2rem; background-color: #fff; border-radius: 8px; border: 1px solid #e5e7eb; overflow: hidden;}
        .date-header { background-color: #f9fafb; padding: 0.75rem 1.25rem; font-size: 1rem; font-weight: 600; color: #374151; border-bottom: 1px solid #e5e7eb; margin: 0; }
        .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.75rem; padding: 1.25rem; }
        
        .slot-button {
          background-color: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe;
          padding: 0.75rem; border-radius: 6px; font-weight: 600; cursor: pointer;
          text-align: center; font-size: 0.9rem; transition: background-color 0.2s, border-color 0.2s, color 0.2s;
        }
        .slot-button:hover { background-color: #e0e7ff; border-color: #a5b4fc; }
        .slot-button.selected { background-color: #4f46e5; color: white; border-color: #4f46e5; }
        
        .confirmation-section {
          margin-top: 2rem; padding: 1.5rem; background-color: #fff;
          border-radius: 8px; border: 1px solid #e5e7eb; text-align: center;
        }
        .confirm-title { font-size: 1.1rem; font-weight: 600; margin: 0 0 1rem 0; }
        .confirm-details { color: #4f46e5; font-weight: 500; margin-bottom: 1.5rem; }
        .confirm-button {
          background-color: #10b981; color: white; border: none; padding: 0.75rem 2rem;
          border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 1rem;
          display: inline-flex; align-items: center; gap: 0.5rem; transition: background-color 0.2s;
        }
        .confirm-button:hover { background-color: #059669; }
        .confirm-button:disabled { background-color: #a7f3d0; cursor: not-allowed; }
        
        .info-text, .error-text { text-align: center; color: #6b7280; font-size: 1rem; padding: 2rem 1rem; }
        .error-text { color: #ef4444; font-weight: 500; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        
        /* Modal Styles */
        .modal-overlay { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; padding: 1rem; z-index: 100; }
        .modal-box { background-color: #fff; border-radius: 0.75rem; padding: 2rem; width: 100%; max-width: 24rem; text-align: center; }
        .modal-icon { font-size: 3rem; margin-bottom: 1rem; line-height: 1; color: #10b981;}
        .modal-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .modal-subtitle { color: #4b5563; margin-bottom: 1.5rem; }
        .modal-button { width: 100%; background-color: #4f46e5; color: #fff; padding: 0.75rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; border: none; cursor: pointer; }

      `}</style>
      <div className="page-container">
        <header className="header-container">
          <button onClick={() => router.back()} className="back-button" title="Back to Profile">
            <ArrowLeft size={24} color="#4f46e5" />
          </button>
          <h1 className="header-title">Book Session</h1>
        </header>

        <main className="main-content">
          {renderSlots()}

          {selectedSlot && (
            <div className="confirmation-section">
              <h2 className="confirm-title">Confirm Booking</h2>
              <p className="confirm-details">
                {dayjs(selectedSlot.startTime).format('dddd, MMMM D')} <br />
                {dayjs(selectedSlot.startTime).format('h:mm A')} - {dayjs(selectedSlot.endTime).format('h:mm A')}
              </p>
              {bookingError && <p className="error-text" style={{padding: '0 0 1rem 0'}}>{bookingError}</p>}
              <button 
                className="confirm-button" 
                onClick={handleConfirmBooking} 
                disabled={isBooking}
              >
                {isBooking ? <Loader2 size={18} className="spinner" /> : <Check size={18} />}
                {isBooking ? 'Booking...' : 'Confirm Session'}
              </button>
            </div>
          )}
        </main>
      </div>
      
      {/* Success Modal */}
        {showSuccessModal && (
          <div className="modal-overlay">
            <div className="modal-box">
              <p className="modal-icon"><CheckCircle /></p>
              <h2 className="modal-title">Booking Confirmed!</h2>
              <p className="modal-subtitle">
                Your session has been booked successfully. The mentor has been notified.
              </p>
              <button
                onClick={() => router.push('/home')} // Or maybe back to mentor profile?
                className="modal-button"
              >
                Go to Home
              </button>
            </div>
          </div>
        )}
    </>
  );
}