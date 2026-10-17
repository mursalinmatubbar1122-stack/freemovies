import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';

interface FloatingControlsProps {
  currentUser: User | null;
  isAdmin: boolean;
  onOpenAuth: () => void;
  onOpenAdmin: () => void;
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  currentUser,
  isAdmin,
  onOpenAuth,
  onOpenAdmin,
}) => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClickUser = () => {
    if (isAdmin) {
      onOpenAdmin();
    } else {
      onOpenAuth();
    }
  };

  const userInitial = currentUser
    ? (currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()
    : null;

  return (
    <>
      {/* Scroll to Top */}
      {showScrollTop && (
        <button
          className="scroll-top-btn"
          onClick={scrollToTop}
          title="Scroll to Top"
        >
          ↑
        </button>
      )}

      {/* Admin / User Login Button */}
      <button
        className={`admin-login-btn ${isAdmin ? 'admin-on' : ''}`}
        onClick={handleClickUser}
        title={isAdmin ? 'Admin Panel' : currentUser ? 'Account Profile' : 'Sign In / Sign Up'}
      >
        {currentUser?.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : userInitial ? (
          <span style={{ fontWeight: 800, fontSize: 15 }}>{userInitial}</span>
        ) : (
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </button>
    </>
  );
};
