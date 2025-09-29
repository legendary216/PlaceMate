import React, { useState } from "react";

// This is the complete, self-contained login component for your web application.
// It handles authentication for all user roles (User, Mentor, Admin).

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");

  // State for error messages and the success modal
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  const validateInputs = () => {
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return false;
    }
    setError("");
    return true;
  };

  const handleLogin = async (e) => {
    e.preventDefault(); // Prevent the form from causing a page refresh

    try {
      if (!email.trim() || !password.trim()) {
        setError("All fields are required");
        return;
      }

      if (!validateInputs()) return;

      // Note: Ensure this endpoint matches your single, unified login route in the backend.
      const res = await fetch("http://192.168.0.147:5000/api/auth/login/handlelogin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data = await res.json();

      if (res.ok) {
        // Save the token to localStorage
        localStorage.setItem("token", data.token);
        
        // **Crucially, save the user object AND the selected role to localStorage**
        // This is how other parts of your app will know who is logged in.
        localStorage.setItem("user", JSON.stringify({ ...data.user, role: role }));
        
        setShowSuccess(true); // Show the success modal
      } else {
        setError(data.message || "Invalid credentials");
      }
    } catch (err) {
      setError("Could not connect to the server. Please check your connection.");
      console.error(err);
    }
  };
  
  const handleSuccessRedirect = () => {
      setShowSuccess(false);
      // Navigate to different dashboards based on the role
      if (role === 'admin') {
          window.location.href = "/home";
      } else if (role === 'mentor') {
          // As per your request, mentor also goes to home. This can be changed to /mentor/dashboard if needed.
          window.location.href = "/home";
      } else {
          window.location.href = "/home";
      }
  };

  return (
    <>
      <style>{`
        body {
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          background-color: #f9fafe;
        }
        .container {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 100vh;
          padding: 2.5rem;
          box-sizing: border-box;
        }
        .login-wrapper {
          width: 100%;
          max-width: 28rem;
        }
        .title {
          font-size: 2rem;
          font-weight: 700;
          color: #222;
          text-align: center;
          margin-bottom: 0.5rem;
        }
        .subtitle {
          font-size: 1rem;
          color: #555;
          text-align: center;
          margin-bottom: 1.25rem;
        }
        .role-selector-container {
          display: flex;
          justify-content: center;
          margin-bottom: 1.25rem;
          background-color: #eef2ff;
          border-radius: 0.75rem;
          padding: 0.25rem;
        }
        .role-button {
          flex: 1;
          padding: 0.625rem 0;
          border-radius: 0.625rem;
          text-align: center;
          border: none;
          background-color: transparent;
          cursor: pointer;
        }
        .role-button-selected {
          background-color: #4f46e5;
          box-shadow: 0 2px 4px 0 rgba(79, 70, 229, 0.3);
        }
        .role-button-text {
          color: #4f46e5;
          font-weight: 600;
          font-size: 0.9375rem;
        }
        .role-button-text-selected {
          color: #fff;
        }
        .input-field {
          width: 100%;
          box-sizing: border-box;
          background-color: #fff;
          border: 1px solid #ddd;
          padding: 0.9375rem;
          margin-bottom: 0.75rem;
          border-radius: 0.75rem;
          font-size: 1rem;
          box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
        }
        .input-field:focus {
            outline: none;
            border-color: #4f46e5;
            box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.5);
        }
        .button-primary {
          width: 100%;
          background-color: #4f46e5;
          color: #fff;
          padding: 1rem 0;
          border-radius: 0.75rem;
          margin-top: 0.625rem;
          border: none;
          cursor: pointer;
          text-align: center;
          font-weight: 700;
          font-size: 1.125rem;
          box-shadow: 0 4px 6px 0 rgba(79, 70, 229, 0.3);
          transition: background-color 0.2s;
        }
        .button-primary:hover {
            background-color: #4338ca;
        }
        .link {
          display: block;
          text-align: center;
          color: #4f46e5;
          margin-top: 1.25rem;
          font-weight: 500;
          font-size: 0.9375rem;
          text-decoration: none;
        }
        .link:hover {
            text-decoration: underline;
        }
        .error {
          color: #ef4444;
          font-size: 0.875rem;
          margin-bottom: 0.75rem;
          text-align: center;
        }
        .modal-overlay {
          position: fixed; inset: 0; background-color: rgba(0, 0, 0, 0.5);
          display: flex; justify-content: center; align-items: center; padding: 1rem; z-index: 100;
        }
        .modal-box {
          background-color: #fff; border-radius: 0.75rem; padding: 2rem;
          width: 100%; max-width: 24rem; text-align: center;
        }
        .modal-icon { font-size: 4rem; margin-bottom: 1rem; line-height: 1; }
        .modal-title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .modal-subtitle { color: #4b5563; margin-bottom: 1.5rem; }
      `}</style>
      <div className="container">
        <form className="login-wrapper" onSubmit={handleLogin}>
          <h1 className="title">Welcome Back!</h1>
          <p className="subtitle">Log in to continue to PlaceMate</p>

          <div className="role-selector-container">
            <button type="button" className={`role-button ${role === 'user' ? 'role-button-selected' : ''}`} onClick={() => setRole('user')}>
              <span className={`role-button-text ${role === 'user' ? 'role-button-text-selected' : ''}`}>User</span>
            </button>
            <button type="button" className={`role-button ${role === 'mentor' ? 'role-button-selected' : ''}`} onClick={() => setRole('mentor')}>
              <span className={`role-button-text ${role === 'mentor' ? 'role-button-text-selected' : ''}`}>Mentor</span>
            </button>
            <button type="button" className={`role-button ${role === 'admin' ? 'role-button-selected' : ''}`} onClick={() => setRole('admin')}>
              <span className={`role-button-text ${role === 'admin' ? 'role-button-text-selected' : ''}`}>Admin</span>
            </button>
          </div>

          {error && <p className="error">{error}</p>}
          
          <input
            className="input-field"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <input
            className="input-field"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button type="submit" className="button-primary">
            Log In
          </button>

          {role !== 'admin' && (
            <a href={role === 'mentor' ? '/mentor' : '/register'} className="link">
              Don’t have an account? Register
            </a>
          )}
        </form>

        {showSuccess && (
          <div className="modal-overlay">
            <div className="modal-box">
              <p className="modal-icon">🎉</p>
              <h2 className="modal-title">Login Successful!</h2>
              <p className="modal-subtitle">Welcome back! Redirecting you now...</p>
              <button onClick={handleSuccessRedirect} className="button-primary">
                Ok
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

