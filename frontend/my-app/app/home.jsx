import React, { useState, useEffect } from "react";
import { MessageSquare, Users, Building, FileText, LogOut, Calendar } from 'lucide-react'; // Added Calendar
import { Link } from 'expo-router'; // <-- 1. Import Link

export default function Home() {
  const [user, setUser] = useState(null);
  const [notification, setNotification] = useState({ show: false, message: '', type: '' });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse user data from localStorage", e);
    }
  }, []);

  // Base features
  let features = [
    { id: 1, title: "Interview Qs", Icon: MessageSquare, nav: "/interviewQuestions" },
    { id: 2, title: "Mentor Connect", Icon: Users, nav: "/mentorconnect" },
    { id: 3, title: "Company Analysis", Icon: Building, nav: "/company" }, // Assuming you have these pages
    { id: 4, title: "AI Resume", Icon: FileText, nav: "/resume" },       // Assuming you have these pages
  ];


  // Handle conditional navigation for admins
  features = features.map(feature => {
      if (feature.title === "Mentor Connect" && user && user.role === 'admin') {
          return { ...feature, nav: "/adminMentors" }; // Admins go to admin page
      }
      return feature;
  });

  const showNotification = (message, type = 'danger') => { /* ... (no changes) ... */
        setNotification({ show: true, message, type });
      setTimeout(() => {
          setNotification({ show: false, message: '', type: '' });
      }, 3000);
  };

  const handleLogout = async () => { /* ... (no changes) ... */
    try {
      const res = await fetch("http://localhost:5000/api/auth/login/logoutUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (res.ok) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        showNotification("You have been logged out successfully.", "success");
        setTimeout(() => {
             window.location.href = "/"; // Redirect to login/landing page
        }, 1000); // Shortened timeout
      } else {
        const errorData = await res.json();
        showNotification(errorData.message || "Could not log out.");
      }
    } catch (err) {
      console.error(err);
      showNotification("Could not connect to the server.");
    }
  };

  return (
    <>
      <style>{`
        /* ... (styles remain the same) ... */
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .container { display: flex; flex-direction: column; min-height: 100vh; overflow-y: auto; }
        .header-container { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; background-color: #fff; border-bottom: 1px solid #e5e7eb; }
        .header-title { font-size: 1.75rem; font-weight: 700; color: #111827; }
        .logout-button { padding: 0.5rem; background-color: #eef2ff; border-radius: 50%; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; }
        .logout-button:hover { background-color: #e0e7ff; }
        .main-content { flex: 1; padding: 2rem 1rem; }
        .welcome-text { font-size: 1.5rem; text-align: center; color: #374151; margin-bottom: 2rem; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1.25rem; max-width: 450px; margin: 0 auto; }
        .card { text-decoration: none; background-color: #fff; border-radius: 1rem; padding: 2rem 1rem; display: flex; flex-direction: column; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); border: 1px solid #eef2ff; transition: transform 0.2s, box-shadow 0.2s; }
        .card:hover { transform: translateY(-5px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); }
        .card-text { margin-top: 0.75rem; font-size: 1rem; font-weight: 600; color: #1f2937; text-align: center; }
        .notification { position: fixed; top: 1.5rem; left: 50%; transform: translateX(-50%); padding: 1rem 1.5rem; border-radius: 0.5rem; color: #fff; font-weight: 500; z-index: 1000; }
        .notification.success { background-color: #10b981; }
        .notification.danger { background-color: #ef4444; }
        @media (max-width: 480px) { .grid { grid-template-columns: 1fr; } }
      `}</style>
      
      {notification.show && ( /* ... (notification JSX) ... */
            <div className={`notification ${notification.type}`}>
              {notification.message}
          </div>
      )}

      <div className="container">
        <header className="header-container">
          <h1 className="header-title">PlaceMate</h1>
          <button onClick={handleLogout} className="logout-button" title="Logout">
            <LogOut size={24} color="#4f46e5" />
          </button>
        </header>

        <main className="main-content">
          {user && <h2 className="welcome-text">Welcome, {user.name || 'User'}!</h2>}
          <div className="grid">
            
            {/* --- USE LINK COMPONENT --- */}
            {features.map(({ id, title, Icon, nav }) => (
              <Link key={id} href={nav} className="card"> {/* <-- 2. Replace <a> with <Link> */}
                <Icon size={40} color="#4f46e5" />
                <span className="card-text">{title}</span>
              </Link>
            ))}
            {/* --- END LINK COMPONENT --- */}
            
          </div>
        </main>
      </div>
    </>
  );
}