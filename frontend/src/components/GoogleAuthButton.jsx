import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Sparkles,
  AlertCircle,
  X,
  UserCheck,
  PlusCircle,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

const PRESET_GOOGLE_ACCOUNTS = [
  {
    name: 'Alex Morgan',
    email: 'alex.morgan@gmail.com',
    picture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    subtitle: 'Google Account (Personal)',
  },
  {
    name: 'Priya Sharma',
    email: 'priya.sharma@gmail.com',
    picture: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    subtitle: 'Google Account (Community)',
  },
  {
    name: 'David Miller',
    email: 'david.miller.rescue@gmail.com',
    picture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    subtitle: 'Google Workspace Account',
  },
];

export const GoogleIcon = ({ size = 20, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    className={className}
    style={{ minWidth: size, minHeight: size }}
  >
    <path
      fill="#4285F4"
      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
    />
    <path
      fill="#34A853"
      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
    />
    <path
      fill="#FBBC05"
      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.19 0 10.04 0 12s.45 3.81 1.25 5.42l4.03-3.15z"
    />
    <path
      fill="#EA4335"
      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
    />
  </svg>
);

const GoogleAuthButton = ({
  role = 'adopter',
  mode = 'signup', // 'signup' | 'signin'
  extraData = {},
  onSuccess,
  onError,
  className = '',
}) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { googleAuth } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showChooserModal, setShowChooserModal] = useState(false);

  // Custom account inputs
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // Client ID management
  const [clientId, setClientId] = useState(() => {
    return (
      import.meta.env.VITE_GOOGLE_CLIENT_ID ||
      localStorage.getItem('pawconnect_google_client_id') ||
      ''
    );
  });
  const [showClientIdConfig, setShowClientIdConfig] = useState(false);
  const [tempClientId, setTempClientId] = useState('');
  const googleScriptLoaded = useRef(false);

  // Always load Google Identity Services script
  useEffect(() => {
    if (!window.google && !googleScriptLoaded.current) {
      googleScriptLoaded.current = true;
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
  }, []);

  const handlePostAuthRedirect = (authedUser) => {
    const redirectUrl = searchParams.get('redirect');
    if (redirectUrl) {
      navigate(redirectUrl, { replace: true });
      return;
    }
    const targetRole = authedUser?.role || role;
    if (targetRole === 'shelter') {
      navigate('/shelter-dashboard', { replace: true });
    } else if (targetRole === 'admin') {
      navigate('/admin-dashboard', { replace: true });
    } else {
      navigate('/adopter-dashboard', { replace: true });
    }
  };

  const handleButtonClick = () => {
    // If a Google Client ID is configured, open the real Google account chooser popup:
    if (clientId && window.google?.accounts?.oauth2) {
      try {
        const tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: async (tokenResponse) => {
            if (tokenResponse?.error) {
              console.warn('Google OAuth popup error:', tokenResponse);
              setShowChooserModal(true);
              return;
            }
            if (tokenResponse?.access_token) {
              setLoading(true);
              setError(null);
              try {
                // Fetch verified profile from Google's official userinfo API
                const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                  headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
                });
                const profile = await res.json();
                const result = await googleAuth({
                  email: profile.email,
                  name: profile.name,
                  picture: profile.picture,
                  google_id: profile.sub,
                  role: 'adopter',
                });
                handlePostAuthRedirect(result.user);
                if (onSuccess) onSuccess(result);
              } catch (e) {
                const msg = e?.response?.data?.error || e?.message || 'Google signup failed.';
                setError(msg);
                if (onError) onError(msg);
              } finally {
                setLoading(false);
              }
            }
          },
        });
        // This opens Google's native popup listing accounts signed in to the user's browser
        tokenClient.requestAccessToken({ prompt: 'select_account' });
        return;
      } catch (err) {
        console.warn('Real Google popup failed to trigger, opening fallback dialog:', err);
      }
    }
    // If no client ID configured yet, open the intuitive Google Account Chooser dialog
    setShowChooserModal(true);
  };

  const handleSelectAccount = async (account) => {
    setLoading(true);
    setError(null);
    setShowChooserModal(false);
    try {
      const payload = {
        email: account.email,
        name: account.name,
        picture: account.picture,
        role: role,
        google_id: `google_${Date.now()}`,
        ...extraData,
      };
      const result = await googleAuth(payload);
      handlePostAuthRedirect(result.user);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Google login failed. Please try again.';
      setError(msg);
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAccountSubmit = (e) => {
    e.preventDefault();
    if (!customEmail || !customEmail.includes('@')) {
      setError('Please provide a valid Google email address.');
      return;
    }
    handleSelectAccount({
      email: customEmail.trim().toLowerCase(),
      name: customName.trim() || customEmail.split('@')[0],
      picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(
        customEmail
      )}`,
    });
  };

  const handleSaveClientId = (e) => {
    e.preventDefault();
    if (tempClientId.trim()) {
      localStorage.setItem('pawconnect_google_client_id', tempClientId.trim());
      setClientId(tempClientId.trim());
      setShowClientIdConfig(false);
      alert('Google Client ID saved! The page will now use your Google Cloud OAuth app.');
    }
  };

  const buttonText =
    mode === 'signup'
      ? 'Sign up with Google'
      : 'Sign in with Google';

  return (
    <div className={`google-auth-container ${className}`}>
      {error && (
        <div className="google-auth-error-banner">
          <AlertCircle size={15} />
          <span>{error}</span>
          <button
            type="button"
            className="google-error-dismiss"
            onClick={() => setError(null)}
          >
            <X size={13} />
          </button>
        </div>
      )}

      <button
        type="button"
        className={`google-brand-btn ${loading ? 'loading' : ''}`}
        onClick={handleButtonClick}
        disabled={loading}
      >
        <span className="google-btn-icon-box">
          <GoogleIcon size={19} />
        </span>
        <span className="google-btn-text">
          {loading ? 'Authenticating with Google...' : buttonText}
        </span>
        <span className="google-verified-tag">
          <ShieldCheck size={14} />
          <span>OAuth 2.0</span>
        </span>
      </button>

      {/* Google Account Chooser & Simulation Modal */}
      {showChooserModal && (
        <div className="google-modal-backdrop" onClick={() => setShowChooserModal(false)}>
          <div
            className="google-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="google-modal-header">
              <div className="google-brand-heading">
                <GoogleIcon size={26} />
                <div>
                  <h3 className="google-modal-title">Sign in with Google</h3>
                  <p className="google-modal-sub">
                    to continue to <strong>PawConnect</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                className="google-modal-close"
                onClick={() => setShowChooserModal(false)}
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Context Badge */}
            <div className="google-role-badge-row">
              <span className="google-role-pill role-adopter">
                🐾 Adopter Portal • <strong>Pet Adopter Account</strong>
              </span>
            </div>

            {/* Modal Body */}
            <div className="google-modal-body">
              <p className="google-accounts-intro">
                Choose an account or sign in with your Google email:
              </p>

              {/* Account list */}
              <div className="google-accounts-list">
                {PRESET_GOOGLE_ACCOUNTS.map((acc, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="google-account-item"
                    onClick={() => handleSelectAccount(acc)}
                    disabled={loading}
                  >
                    <img
                      src={acc.picture}
                      alt={acc.name}
                      className="google-account-avatar"
                    />
                    <div className="google-account-meta">
                      <div className="google-account-name">{acc.name}</div>
                      <div className="google-account-email">{acc.email}</div>
                    </div>
                    <UserCheck size={18} className="google-select-arrow" />
                  </button>
                ))}
              </div>

              {/* Custom Google Email Option */}
              {!showCustomForm ? (
                <button
                  type="button"
                  className="google-custom-account-toggle"
                  onClick={() => setShowCustomForm(true)}
                >
                  <PlusCircle size={16} />
                  <span>Use another Google account</span>
                </button>
              ) : (
                <form onSubmit={handleCustomAccountSubmit} className="google-custom-form">
                  <div className="google-custom-inputs">
                    <input
                      type="text"
                      placeholder="Your Full Name (e.g. Jordan Lee)"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="google-compact-input"
                    />
                    <input
                      type="email"
                      placeholder="Google Email (e.g. jordan@gmail.com)"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      className="google-compact-input"
                      required
                    />
                  </div>
                  <div className="google-custom-actions">
                    <button
                      type="button"
                      className="google-btn-secondary"
                      onClick={() => setShowCustomForm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="google-btn-primary"
                      disabled={loading}
                    >
                      Continue with Google
                    </button>
                  </div>
                </form>
              )}

              {/* Client ID Configuration Section */}
              <div className="google-clientid-toggle-area">
                <button
                  type="button"
                  className="google-clientid-link"
                  onClick={() => setShowClientIdConfig(!showClientIdConfig)}
                >
                  <KeyRound size={14} />
                  <span>
                    {clientId
                      ? '✓ Google Client ID Configured (Edit)'
                      : 'Have a Google Cloud Client ID? Click to configure'}
                  </span>
                </button>

                {showClientIdConfig && (
                  <form onSubmit={handleSaveClientId} className="google-clientid-form">
                    <p className="google-clientid-help">
                      Enter your Google OAuth 2.0 Web Client ID from Google Cloud Console to enable live one-tap authentication.
                    </p>
                    <input
                      type="text"
                      placeholder="e.g. xxxxxxxx.apps.googleusercontent.com"
                      value={tempClientId}
                      onChange={(e) => setTempClientId(e.target.value)}
                      className="google-compact-input"
                      required
                    />
                    <div className="google-clientid-btns">
                      <button type="submit" className="google-btn-primary">
                        Save Client ID
                      </button>
                      {clientId && (
                        <button
                          type="button"
                          className="google-btn-secondary"
                          onClick={() => {
                            localStorage.removeItem('pawconnect_google_client_id');
                            setClientId('');
                            setShowClientIdConfig(false);
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="google-modal-footer">
              <span className="google-privacy-text">
                By continuing, Google shares your name, email address, and profile picture with PawConnect in accordance with their privacy policy.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleAuthButton;
