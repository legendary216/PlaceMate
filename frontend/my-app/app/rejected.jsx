import React from "react";
import { XCircle } from 'lucide-react';

export default function RejectedPage() {

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.location.href = "/"; // Redirect to login
  };

  return (
    <>
      <style>{`
        body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafe; }
        .container { display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 2rem; }
        .box {
          background-color: #fff;
          border-radius: 0.75rem;
          padding: 2.5rem;
          width: 100%;
          max-width: 28rem;
          text-align: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06);
          border: 1px solid #fee2e2;
        }
        .icon-wrapper {
          width: 4rem;
          height: 4rem;
          border-radius: 50%;
          background-color: #fee2e2;
          color: #ef4444;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 1.5rem auto;
        }
        .title { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
        .subtitle { color: #4b5563; margin-bottom: 1.5rem; line-height: 1.6; }
        .button-logout {
          width: 100%;
          background-color: #ef4444;
          color: #fff;
          padding: 0.875rem 0;
          border-radius: 0.75rem;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 1rem;
        }
      `}</style>
      <div className="container">
        <div className="box">
          <div className="icon-wrapper">
            <XCircle size={32} />
          </div>
          <h1 className="title">Application Not Approved</h1>
          <p className="subtitle">
            We appreciate your interest in becoming a mentor. After careful review,
            we are unable to approve your application at this time.
            Please contact support for more details.
          </p>
          <button onClick={handleLogout} className="button-logout">
            Back to Login
          </button>
        </div>
      </div>
    </>
  );
}