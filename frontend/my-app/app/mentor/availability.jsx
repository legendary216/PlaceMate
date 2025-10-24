import React, { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Plus, Trash2, Clock } from 'lucide-react';
import { useRouter } from 'expo-router';

// These helpers are used to create the <select> dropdowns
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => { // 30-min intervals
  const totalMinutes = i * 30;
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});

export default function SetAvailability() {
  const router = useRouter();
  const [slots, setSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);

  // 1. Fetch the mentor's currently saved slots
  useEffect(() => {
    const fetchSlots = async () => {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      try {
        const res = await fetch("http://localhost:5000/api/mentors/my-availability", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Could not load availability.");
        const data = await res.json();
        setSlots(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSlots();
  }, []);

  // 2. Functions to manage the 'slots' array state
  const addSlot = () => {
    setSlots([...slots, { day: 'Monday', startTime: '09:00', endTime: '10:00' }]);
  };

  const removeSlot = (index) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  };

  // 3. Send the updated array to the backend
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/mentors/my-availability", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ availabilitySlots: slots })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Failed to save.");
      }
      alert("Availability saved!");
      router.back(); // Go back to the mentor dashboard
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Render the UI
  const renderContent = () => {
    if (isLoading) {
      return <p className="info-text"><Loader2 size={24} className="spinner" /> Loading...</p>;
    }
    return (
      <div className="slots-list">
        {slots.map((slot, index) => (
          <div key={index} className="slot-card">
            <div className="slot-inputs">
              <div className="input-group">
                <label>Day</label>
                <select 
                  value={slot.day} 
                  onChange={(e) => updateSlot(index, 'day', e.target.value)}
                  className="form-select"
                >
                  {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>From</label>
                <select 
                  value={slot.startTime} 
                  onChange={(e) => updateSlot(index, 'startTime', e.target.value)}
                  className="form-select"
                >
                  {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                </select>
              </div>
              <div className="input-group">
                <label>To</label>
                <select 
                  value={slot.endTime} 
                  onChange={(e) => updateSlot(index, 'endTime', e.target.value)}
                  className="form-select"
                >
                  {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => removeSlot(index)} className="delete-btn" title="Remove slot">
              <Trash2 size={18} />
            </button>
          </div>
        ))}
        {slots.length === 0 && !isLoading && (
          <p className="info-text" style={{backgroundColor: '#fff', padding: '2rem', borderRadius: '8px'}}>
            <Clock size={30} color="#6b7280" /><br/>
            You have no availability slots. <br/>Add one to get started.
          </p>
        )}
        <button onClick={addSlot} className="add-btn">
          <Plus size={18} /> Add Time Slot
        </button>
      </div>
    );
  };

  return (
    <>
      <style>{`
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .page-container { display: flex; flex-direction: column; min-height: 100vh; }
        .header-container { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
        .header-left { display: flex; align-items: center; gap: 1rem; }
        .back-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; margin: 0; }
        .main-content { padding: 2rem 1.5rem; max-width: 800px; margin: 0 auto; width: 100%; box-sizing: border-box; }
        
        .slots-list { display: flex; flex-direction: column; gap: 1rem; }
        .slot-card {
          display: flex; align-items: center; gap: 1rem;
          background-color: #fff; border: 1px solid #e5e7eb;
          border-radius: 0.75rem; padding: 1.5rem;
        }
        .slot-inputs { display: grid; grid-template-columns: 1fr; gap: 1rem; flex-grow: 1; }
        @media (min-width: 640px) { .slot-inputs { grid-template-columns: repeat(3, 1fr); } }
        
        .input-group { display: flex; flex-direction: column; gap: 0.5rem; }
        .input-group label { font-weight: 500; font-size: 0.9rem; color: #374151; }
        .form-select {
          width: 100%; box-sizing: border-box; border: 1px solid #d1d5db;
          border-radius: 8px; padding: 0.75rem; font-size: 1rem;
          background-color: #fff;
        }
        
        .delete-btn {
          background-color: #fee2e2; color: #991b1b; border: none;
          width: 40px; height: 40px; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .add-btn, .save-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          background-color: #eef2ff; color: #4f46e5; border: none;
          padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 600;
          cursor: pointer; font-size: 1rem; margin-top: 1rem;
        }
        .save-btn {
          background-color: #4f46e5; color: #fff;
        }
        .save-btn:disabled { background-color: #a5b4fc; cursor: not-allowed; }
        
        .error-text { color: #ef4444; font-weight: 500; text-align: center; }
        .info-text { text-align: center; color: #6b7280; font-size: 1rem; padding: 2rem 1rem; }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
      
      <div className="page-container">
        <header className="header-container">
          <div className="header-left">
            <button onClick={() => router.back()} className="back-button" title="Back to Dashboard">
              <ArrowLeft size={24} color="#4f46e5" />
            </button>
            <h1 className="header-title">Set Your Availability</h1>
          </div>
          <button onClick={handleSave} className="save-btn" disabled={isSaving}>
            {isSaving ? <Loader2 size={20} className="spinner" /> : 'Save Changes'}
          </button>
        </header>

        <main className="main-content">
          {error && <p className="error-text">{error}</p>}
          {renderContent()}
        </main>
      </div>
    </>
  );
}