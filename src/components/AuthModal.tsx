import React, { useState } from 'react';
import { User } from 'firebase/auth';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  auth,
  saveUserProfile,
} from '../services/firebase';
import { imgbbUpload, AVPH } from '../services/api';
import { SITE_CONFIG } from '../config/siteConfig';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  isAdmin: boolean;
  isDragEnabled: boolean;
  onToggleDrag: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  isAdmin,
  isDragEnabled,
  onToggleDrag,
}) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [msg, setMsg] = useState<{ text: string; type: 'ok' | 'err' | '' }>({ text: '', type: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  if (!isOpen) return null;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setMsg({ text: 'Please enter both email and password.', type: 'err' });
      return;
    }

    setIsLoading(true);
    setMsg({ text: 'Please wait...', type: '' });

    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email, password);
        let photoUrl = '';
        if (selectedFile) {
          try {
            photoUrl = await imgbbUpload(selectedFile);
          } catch {}
        }
        await updateProfile(cred.user, {
          displayName: name.trim() || undefined,
          photoURL: photoUrl || undefined,
        });
        await saveUserProfile(cred.user.uid, {
          email,
          displayName: name.trim(),
          photoUrl,
          bio: '',
        });
        setMsg({ text: '✓ Account created! Welcome!', type: 'ok' });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        setMsg({ text: '✓ Signed in successfully!', type: 'ok' });
      }
      setTimeout(() => {
        setMsg({ text: '', type: '' });
        onClose();
      }, 700);
    } catch (err: any) {
      const errMap: Record<string, string> = {
        'auth/email-already-in-use': 'Email is already registered.',
        'auth/invalid-email': 'Invalid email address.',
        'auth/wrong-password': 'Incorrect password.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/invalid-credential': 'Incorrect email or password.',
        'auth/weak-password': 'Password is too weak (min 6 characters).',
      };
      setMsg({ text: errMap[err.code] || err.message || 'Authentication error', type: 'err' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => setAvatarPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setMsg({ text: 'Saving profile...', type: '' });

    try {
      let photoUrl = currentUser.photoURL || '';
      if (selectedFile) {
        photoUrl = await imgbbUpload(selectedFile);
      }
      if (name.trim()) {
        await updateProfile(currentUser, { displayName: name.trim(), photoURL: photoUrl });
      }
      await saveUserProfile(currentUser.uid, {
        displayName: name.trim() || currentUser.displayName || '',
        bio: bio.trim(),
        photoUrl,
      });
      setMsg({ text: '✓ Profile updated!', type: 'ok' });
    } catch (e: any) {
      setMsg({ text: `Failed: ${e.message}`, type: 'err' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-box" onClick={e => e.stopPropagation()}>
        <button className="auth-close-btn" onClick={onClose} title="Close">
          ✕
        </button>

        <div className="drag-setting-row">
          <button className="drag-setting-btn" onClick={onToggleDrag}>
            ⠿ BUTTON DRAG &amp; DROP
            <span className={`drag-state-badge ${isDragEnabled ? '' : 'off'}`}>
              {isDragEnabled ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        <div className="auth-title">
          <span>{SITE_CONFIG.siteName}</span>
        </div>
        <div className="auth-sub">
          {currentUser ? 'Manage your personal account' : 'Welcome to movie theater'}
        </div>

        {!currentUser ? (
          <form onSubmit={handleAuthSubmit}>
            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
                onClick={() => { setMode('login'); setMsg({ text: '', type: '' }); }}
              >
                Sign In
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
                onClick={() => { setMode('signup'); setMsg({ text: '', type: '' }); }}
              >
                Sign Up
              </button>
            </div>

            {mode === 'signup' && (
              <>
                <input
                  type="text"
                  className="auth-input"
                  placeholder="Full name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
                <div style={{ textAlign: 'center', marginBottom: 12 }}>
                  <label style={{ cursor: 'pointer', display: 'inline-block' }}>
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        margin: '0 auto 6px',
                        border: '2px solid rgba(255,255,255,0.2)',
                        background: '#1e293b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt=""
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <span style={{ fontSize: 24 }}>📷</span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8' }}>
                      Add avatar (optional)
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </>
            )}

            <input
              type="email"
              className="auth-input"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              className="auth-input"
              placeholder={mode === 'signup' ? 'Password (min 6 chars)' : 'Password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />

            <button type="submit" className="auth-submit" disabled={isLoading}>
              {mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>

            {msg.text && <div className={`auth-msg ${msg.type}`}>{msg.text}</div>}
          </form>
        ) : (
          <div>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div
                style={{
                  width: 68,
                  height: 68,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  margin: '0 auto 8px',
                  border: '2px solid rgba(255,0,0,0.4)',
                  background: '#1e293b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {currentUser.photoURL || avatarPreview ? (
                  <img
                    src={avatarPreview || currentUser.photoURL!}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <span style={{ fontSize: 28, fontWeight: 700 }}>
                    {(currentUser.displayName || currentUser.email || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: isAdmin ? '#22c55e' : '#60a5fa' }}>
                {isAdmin ? '✓ Administrator' : '● Member'}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginTop: 2 }}>
                {currentUser.displayName || currentUser.email?.split('@')[0]}
              </div>
              <div style={{ fontSize: 11, color: '#64748b' }}>{currentUser.email}</div>
            </div>

            <div style={{ borderTop: '1px solid #1e293b', paddingTop: 12 }}>
              <div style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
                Edit Profile
              </div>
              <input
                type="text"
                className="auth-input"
                placeholder="Display Name"
                defaultValue={currentUser.displayName || ''}
                onChange={e => setName(e.target.value)}
              />
              <textarea
                className="auth-input"
                placeholder="Short bio..."
                rows={2}
                value={bio}
                onChange={e => setBio(e.target.value)}
                style={{ resize: 'none' }}
              />
              <button
                type="button"
                className="auth-submit"
                onClick={handleUpdateProfile}
                disabled={isLoading}
              >
                Save Profile
              </button>
            </div>

            {msg.text && <div className={`auth-msg ${msg.type}`}>{msg.text}</div>}

            <button
              type="button"
              className="auth-logout-btn"
              onClick={async () => {
                await signOut(auth);
                onClose();
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
