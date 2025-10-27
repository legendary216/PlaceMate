import React, { useState, useRef } from "react";
// Added Plus and Trash2 for the new UI
import { Camera, CloudUpload, Check, FileText, Loader2, Plus, Trash2 } from 'lucide-react';
import { useRouter } from "expo-router"; 
import { /*...,*/ DollarSign } from 'lucide-react';

// --- Helper constants for the new Step 3 ---
const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => { // 30-min intervals
  const totalMinutes = i * 30;
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
});
// ---

export default function App() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const profilePicRef = useRef(null);
  const idProofRef = useRef(null);

  // Form States
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [experience, setExperience] = useState("");
  const [qualification, setQualification] = useState("");
  const [expertise, setExpertise] = useState("");
  const [fees, setFees] = useState("");
  
  // --- UPDATED STATE ---
  // Removed availability and hours, added availabilitySlots
  const [availabilitySlots, setAvailabilitySlots] = useState([]);
  // ---
  
  const [profilePic, setProfilePic] = useState(null);
  const [idProof, setIdProof] = useState(null);
  const [agree, setAgree] = useState(false);

  const [generalError, setGeneralError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const emailRegex = /\S+@\S+\.\S+/;

  const handleProfilePicChange = (event) => {
    const file = event.target.files[0];
    if (file) setProfilePic(file);
  };

  const handleIdProofChange = (event) => {
    const file = event.target.files[0];
    if (file) setIdProof(file);
  };

  // --- Helper functions for new Step 3 ---
  const addSlot = () => {
    setAvailabilitySlots([
      ...availabilitySlots, 
      { day: 'Monday', startTime: '09:00', endTime: '10:00' }
    ]);
  };

  const removeSlot = (index) => {
    setAvailabilitySlots(availabilitySlots.filter((_, i) => i !== index));
  };

  const updateSlot = (index, field, value) => {
    const newSlots = [...availabilitySlots];
    newSlots[index][field] = value;
    setAvailabilitySlots(newSlots);
  };
  // ---

  const validateStep = () => {
    setGeneralError("");
    if (step === 1) {
      if (!fullName.trim() || !email.trim() || !phone.trim() || !password.trim()) {
        setGeneralError("All fields on this page are required");
        return false;
      }
      if (!emailRegex.test(email)) {
        setGeneralError("Please enter a valid email address");
        return false;
      }
      if (password.length < 6) {
        setGeneralError("Password must be at least 6 characters");
        return false;
      }
    }
    // You could add validation for step 3 here if needed
    if (step === 4) {
      if (!idProof) {
          setGeneralError("Please upload your ID for verification.");
          return false;
      }
      if (!agree) {
          setGeneralError("You must agree to the Terms & Conditions.");
          return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep()) {
      if (step < 4) setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // --- UPDATED SUBMIT HANDLER ---
  const handleRegister = async () => {
    if (!validateStep()) return;

    setIsLoading(true);
    setGeneralError("");

    const formData = new FormData();
    formData.append('fullName', fullName);
    formData.append('email', email);
    formData.append('phone', phone);
    formData.append('password', password);
    formData.append('jobTitle', jobTitle);
    formData.append('company', company);
    formData.append('experience', experience);
    formData.append('qualification', qualification);
    formData.append('expertise', expertise);
    formData.append('fees', fees);
    
    // Updated: Send the slots array as a JSON string
    formData.append('availabilitySlots', JSON.stringify(availabilitySlots));
    
    if (profilePic) formData.append('profilePic', profilePic);
    if (idProof) formData.append('idProof', idProof);
    console.log("FormData content before fetch:");
for (let [key, value] of formData.entries()) {
    console.log(key, value); // Check if files are listed correctly here
}
    try {
      const res = await fetch("http://localhost:5000/api/auth/register/registerMentor", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok) {
        setShowSuccess(true);
      } else {
        setGeneralError(data.message || "Registration failed. Please try again.");
      }
    } catch (err) {
      setGeneralError("Could not connect to the server. Please check your connection.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  // --- UPDATED STEP 3 RENDER ---
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div>
            <h1 className="title">Mentor Registration</h1>
            {/* ... (rest of step 1 is unchanged) ... */}
            <p className="subtitle">Let's start with the basics.</p>
            <input 
              type="file" 
              ref={profilePicRef} 
              onChange={handleProfilePicChange} 
              style={{ display: 'none' }} 
              accept="image/png, image/jpeg"
            />
            <button className="upload-circle" onClick={() => profilePicRef.current.click()}>
              {profilePic ? (
                  <img src={URL.createObjectURL(profilePic)} alt="Profile Preview" className="profile-preview" />
              ) : (
                <Camera className="icon-large" />
              )}
            </button>
            <p className="hint-text">Upload Profile Picture</p>
            <input className="input-field" placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            <input className="input-field" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
            <input className="input-field" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
            <input className="input-field" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} type="password" />
          </div>
        );
      case 2:
        return (
            <div>
                <h1 className="title">Professional Details</h1>
                {/* ... (rest of step 2 is unchanged) ... */}
                <p className="subtitle">Tell us about your experience.</p>
                <input className="input-field" placeholder="Current Job Title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} />
                <input className="input-field" placeholder="Company" value={company} onChange={(e) => setCompany(e.target.value)} />
                <input className="input-field" placeholder="Years of Experience" value={experience} onChange={(e) => setExperience(e.target.value)} type="number" />
                <input className="input-field" placeholder="Highest Qualification" value={qualification} onChange={(e) => setQualification(e.target.value)} />
            </div>
        );
      case 3:
        return (
            <div>
                <h1 className="title">Mentorship Preferences</h1>
                <p className="subtitle">Set your expertise, availability, and fees.</p>

                <input
                  className="input-field"
                  placeholder="Areas of Expertise (e.g., React, UI/UX)"
                  value={expertise}
                  onChange={(e) => setExpertise(e.target.value)}
                />

                {/* --- ADD FEES INPUT --- */}
                <div className="input-with-icon">
                    <DollarSign size={18} className="input-icon"/>
                    <input
                      type="number"
                      className="input-field"
                      placeholder="Session Fee (e.g., 500)" // Adjust placeholder as needed
                      value={fees}
                      onChange={(e) => setFees(e.target.value)}
                      min="0" // Prevent negative numbers
                    />
                 </div>
                 <p className="hint-text fee-hint">Enter your fee per session/hour (optional, leave 0 if free).</p>
                {/* --- END FEES INPUT --- */}


                {/* --- Availability Slot Picker (unchanged) --- */}
                 <p className="subtitle" style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>Set Your Weekly Availability</p>
                <div className="slots-list">
                  {availabilitySlots.map((slot, index) => (
                    <div key={index} className="slot-card">
                       {/* ... selects for day, start, end ... */}
                        <div className="slot-inputs">
                          <select value={slot.day} onChange={(e) => updateSlot(index, 'day', e.target.value)} className="form-select"> {daysOfWeek.map(day => <option key={day} value={day}>{day}</option>)} </select>
                          <select value={slot.startTime} onChange={(e) => updateSlot(index, 'startTime', e.target.value)} className="form-select"> {timeSlots.map(time => <option key={time} value={time}>{time}</option>)} </select>
                          <select value={slot.endTime} onChange={(e) => updateSlot(index, 'endTime', e.target.value)} className="form-select"> {timeSlots.map(time => <option key={time} value={time}>{time}</option>)} </select>
                        </div>
                        <button type="button" onClick={() => removeSlot(index)} className="delete-btn" title="Remove slot"> <Trash2 size={18} /> </button>
                    </div>
                  ))}
                  <button type="button" onClick={addSlot} className="add-btn">
                    <Plus size={18} /> Add Time Slot
                  </button>
                </div>
            </div>
        );
      case 4:
          return (
            <div>
                <h1 className="title">Verification & Submission</h1>
                {/* ... (rest of step 4 is unchanged) ... */}
                <p className="subtitle">One last step to complete your profile.</p>
                 <input 
                  type="file" 
                  ref={idProofRef} 
                  onChange={handleIdProofChange} 
                  style={{ display: 'none' }} 
                  accept="image/*,application/pdf"
                />
                <button type="button" onClick={() => idProofRef.current.click()} className="upload-box">
                    <CloudUpload className="icon-xlarge" />
                    <p className="upload-box-text">
                      {idProof ? 'ID Selected!' : 'Upload Your ID'}
                    </p>
                </button>
                {idProof && (
                    <div className="file-display">
                        <FileText size={16} /> 
                        <span>{idProof.name}</span>
                    </div>
                )}
                <div onClick={() => setAgree(!agree)} className="checkbox-container">
                    <div className={`checkbox ${agree ? 'checked' : ''}`}>
                        {agree && <Check className="checkbox-icon" />}
                    </div>
                    <p className="terms-text">I agree to the Terms & Conditions.</p>
                </div>
            </div>
          );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{`
        /* --- General Styles --- */
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
        .container { display: flex; flex-direction: column; justify-content: center; padding: 1.5rem; background-color: #f8fafc; min-height: 100vh; }
        .form-wrapper { max-width: 28rem; width: 100%; margin: 0 auto; }
        .progress-bar-container { height: 0.5rem; background-color: #e5e7eb; border-radius: 9999px; overflow: hidden; margin-bottom: 1.25rem; }
        .progress-bar { height: 100%; background-color: #4f46e5; border-radius: 9999px; transition: width 500ms ease-in-out; }
        .step-container { min-height: 450px; }

        /* --- Typography --- */
        .title { font-size: 1.875rem; font-weight: 700; color: #1f2937; text-align: center; margin-bottom: 0.5rem; }
        .subtitle { font-size: 1rem; color: #6b7280; text-align: center; margin-bottom: 1.5rem; }
        .hint-text { color: #6b7280; text-align: center; margin-bottom: 1.5rem; font-size: 0.875rem; }
        .error-message { color: #ef4444; font-size: 0.875rem; text-align: center; margin-bottom: 1rem; font-weight: 500; }
        .login-link { display: block; text-align: center; color: #4f46e5; margin-top: 1.25rem; font-weight: 500; font-size: 0.875rem; text-decoration: none; }
        .login-link:hover { text-decoration: underline; }

        /* --- Form Elements --- */
        .input-field {
          width: 100%; background-color: #fff; border: 1px solid #d1d5db;
          padding: 0.875rem; margin-bottom: 0.75rem; border-radius: 0.75rem;
          font-size: 1rem; color: #111827; box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05);
          outline: none; box-sizing: border-box;
        }
        .input-field:focus { border-color: #4f46e5; box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.5); }
        
        /* --- Buttons --- */
        .navigation-buttons { display: flex; align-items: center; margin-top: 1.25rem; margin-bottom: 1rem; }
        .button-primary {
          flex-grow: 1; background-color: #4f46e5; color: #fff; padding: 1rem;
          border-radius: 0.75rem; font-weight: 700; font-size: 1.125rem;
          border: none; cursor: pointer; display: flex; justify-content: center; align-items: center;
          box-shadow: 0 10px 15px -3px rgb(79 70 229 / 0.3), 0 4px 6px -4px rgb(79 70 229 / 0.3);
          transition: background-color 150ms ease-in-out;
        }
        .button-primary:hover { background-color: #4338ca; }
        .button-primary:disabled { background-color: #a5b4fc; cursor: not-allowed; }
        .button-secondary {
          background-color: transparent; border: 1px solid #d1d5db; color: #374151;
          padding: 0.875rem 1.5rem; border-radius: 0.75rem; font-weight: 700;
          font-size: 1.125rem; margin-right: 0.75rem; cursor: pointer; transition: background-color 150ms ease-in-out;
        }
        .button-secondary:hover { background-color: #f9fafb; }
        .loading-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* --- Step 1 & 4 Specifics --- */
        .upload-circle { width: 6rem; height: 6rem; border-radius: 50%; background-color: #e0e7ff; margin: 0 auto 0.5rem auto; display: flex; justify-content: center; align-items: center; border: 2px solid #c7d2fe; cursor: pointer; overflow: hidden; }
        .profile-preview { width: 100%; height: 100%; object-fit: cover; }
        .icon-large { width: 2rem; height: 2rem; color: #4f46e5; }
        .icon-xlarge { width: 2.5rem; height: 2.5rem; color: #4f46e5; }
        .upload-box { width: 100%; border: 2px dashed #c7d2fe; border-radius: 0.75rem; padding: 2rem 0; display: flex; flex-direction: column; justify-content: center; align-items: center; background-color: #eef2ff; transition: background-color 150ms ease-in-out; cursor: pointer; }
        .upload-box:hover { background-color: #e0e7ff; }
        .file-display { display: flex; align-items: center; justify-content: center; gap: 0.5rem; color: #4b5563; margin-top: -0.5rem; margin-bottom: 1.25rem; font-size: 0.875rem; }
        .upload-box-text { color: #4f46e5; margin-top: 0.5rem; font-weight: 700; }
        .checkbox-container { display: flex; align-items: center; justify-content: center; margin-bottom: 1.25rem; cursor: pointer; }
        .checkbox { width: 1.25rem; height: 1.25rem; border: 1px solid #d1d5db; border-radius: 0.375rem; margin-right: 0.75rem; display: flex; align-items: center; justify-content: center; }
        .checkbox.checked { background-color: #4f46e5; border-color: #4f46e5; }
        .checkbox-icon { width: 0.75rem; height: 0.75rem; color: white; }
        .terms-text { font-size: 0.875rem; color: #4b5563; }

        /* --- NEW STYLES FOR STEP 3 --- */
        .slots-list { display: flex; flex-direction: column; gap: 1rem; margin-top: 0; }
        .slot-card { display: flex; align-items: center; gap: 0.5rem; background-color: #fff; border: 1px solid #e5e7eb; border-radius: 0.75rem; padding: 1rem; }
        .slot-inputs { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; flex-grow: 1; }
        .form-select {
          width: 100%; box-sizing: border-box; border: 1px solid #d1d5db;
          border-radius: 8px; padding: 0.5rem; font-size: 0.9rem;
          background-color: #fff;
        }
        .delete-btn {
          background-color: #fee2e2; color: #991b1b; border: none;
          width: 32px; height: 32px; border-radius: 50%; cursor: pointer;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .add-btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 0.5rem;
          background-color: #eef2ff; color: #4f46e5; border: none;
          padding: 0.75rem 1.25rem; border-radius: 8px; font-weight: 600;
          cursor: pointer; font-size: 1rem; margin-top: 1rem; width: 100%;
        }
        /* --- End of Step 3 Styles --- */

        /* --- Modal Styles --- */
        .modal-overlay { position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; padding: 1rem; z-index: 100; }
        .modal-box { background-color: #fff; border-radius: 0.75rem; padding: 2rem; width: 100%; max-width: 24rem; text-align: center; }
        .modal-icon { font-size: 4rem; margin-bottom: 1rem; line-height: 1; }
        .modal-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .modal-subtitle { color: #4b5563; margin-bottom: 1.5rem; }
        .modal-button { width: 100%; background-color: #4f46e5; color: #fff; padding: 0.75rem; border-radius: 0.5rem; font-weight: 700; font-size: 1rem; border: none; cursor: pointer; transition: background-color 150ms ease-in-out; }
        .modal-button:hover { background-color: #4338ca; }
        .input-with-icon { 
            position: relative; 
            margin-bottom: 0.25rem; /* Reduced margin */
        }
            .input-icon { 
            position: absolute; 
            left: 0.875rem; /* Adjust as needed */
            top: 50%; 
            transform: translateY(-50%); 
            color: #9ca3af; 
        }
        .input-with-icon .input-field { 
            padding-left: 2.5rem; /* Make space for icon */
        }
            .fee-hint {
            margin-top: -0.5rem; /* Pull hint closer to input */
            margin-bottom: 1.5rem;
            text-align: left; /* Align hint left */
            padding-left: 0.25rem;
        }
      `}</style>

      {/* --- FORM JSX (Unchanged) --- */}
      <div className="container">
        <div className="form-wrapper">
            <div className="progress-bar-container">
              <div className="progress-bar" style={{ width: `${(step / 4) * 100}%` }} />
            </div>

            <div className="step-container">
              {generalError && <p className="error-message">{generalError}</p>}
              {renderStep()}
            </div>

            <div className="navigation-buttons">
              {step > 1 && (
                  <button onClick={prevStep} className="button-secondary" disabled={isLoading}>
                      Back
                  </button>
              )}
              {step < 4 ? (
                  <button onClick={nextStep} className="button-primary" disabled={isLoading}>
                      Next
                  </button>
              ) : (
                  <button onClick={handleRegister} className="button-primary" disabled={isLoading}>
                      {isLoading ? (
                        <>
                          <Loader2 className="loading-spinner" size={20} />
                          <span className="ml-2">Submitting...</span>
                        </>
                      ) : (
                        'Submit Registration'
                      )}
                  </button>
              )}
            </div>
            
            <a href="/" className="login-link">
              Already have an account? Login
            </a>
        </div>

        {/* --- MODAL (Redirects to / on success) --- */}
        {showSuccess && (
          <div className="modal-overlay">
            <div className="modal-box">
              <p className="modal-icon">✅</p>
              <h2 className="modal-title">Registration Successful!</h2>
              <p className="modal-subtitle">
                Your mentor application has been submitted for review.
              </p>
              <button
                onClick={() =>{setShowSuccess(false); router.replace('/');}}
                className="modal-button"
              >
                Ok
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}