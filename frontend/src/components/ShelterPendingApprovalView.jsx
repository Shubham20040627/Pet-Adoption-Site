import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  PawPrint, ShieldCheck, Clock, CheckCircle2, Building, 
  Mail, Phone, FileText, RefreshCw, LogOut, ExternalLink,
  AlertCircle, Sparkles, HelpCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/authApi';
import '../styles/shelter-pending.css';

const ShelterPendingApprovalView = ({ shelterProfile }) => {
  const { user, logout, updateUserProfile } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  const shelterData = shelterProfile || user?.shelter || {};
  const shelterName = shelterData.shelter_name || user?.name || 'Shelter Partner';
  const email = shelterData.contact_email || user?.email || '';
  const phone = shelterData.phone || user?.phone || 'Not provided';
  const regNumber = shelterData.registration_number || user?.registration_number || user?.shelter?.registration_number || 'AWBI-2026-REG';
  const facilityType = shelterData.facility_type || user?.facility_type || 'Registered Non-Profit (NGO)';

  const handleRefreshStatus = async () => {
    setChecking(true);
    setStatusFeedback(null);
    try {
      const me = await authApi.getMe();
      updateUserProfile(me);
      const isNowApproved = me.status === 'approved' || me.verified || me.shelter?.status === 'approved' || me.shelter?.verified;
      if (isNowApproved) {
        setStatusFeedback({
          type: 'success',
          text: '🎉 Congratulations! Your shelter account has been APPROVED by the administrator. Loading your portal...'
        });
        setTimeout(() => {
          window.location.reload();
        }, 1200);
      } else {
        setStatusFeedback({
          type: 'info',
          text: 'Status checked: Your shelter application is still currently under review by our administrators. Please check back soon!'
        });
      }
    } catch (err) {
      setStatusFeedback({
        type: 'info',
        text: 'Your registration is actively in the review queue. Our team is working on your application.'
      });
    } finally {
      setChecking(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="shelter-pending-screen">
      {/* Top Bar Navigation */}
      <header className="shelter-pending-topbar">
        <Link to="/" className="shelter-pending-brand">
          <div className="shelter-pending-paw-box">
            <PawPrint size={22} strokeWidth={2.4} />
          </div>
          <div className="shelter-pending-brand-title">
            Paw<span>Connect</span>
          </div>
        </Link>

        <div className="shelter-pending-topbar-actions">
          <button 
            type="button" 
            onClick={handleLogout} 
            className="shelter-pending-logout-btn"
            title="Sign out of current account"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </header>

      {/* Main Approval Pending Card */}
      <main className="shelter-pending-main">
        <div className="shelter-pending-card">
          {/* Header Banner */}
          <div className="shelter-pending-header-banner">
            <div className="shelter-pending-status-chip">
              <span className="status-pulse-dot" />
              <span>Application Under Review</span>
            </div>

            <div className="shelter-pending-icon-wrap">
              <Clock size={38} strokeWidth={2.2} />
            </div>

            <h1 className="shelter-pending-headline">
              Your Request Has Been Sent!
            </h1>

            <p className="shelter-pending-subtext">
              Thank you for registering <strong>{shelterName}</strong>. Your partner application and credentials have been successfully delivered to the PawConnect Administration team for official compliance verification.
            </p>
          </div>

          {/* Feedback message if refresh clicked */}
          {statusFeedback && (
            <div style={{
              margin: '1.5rem 2.5rem 0 2.5rem',
              padding: '0.9rem 1.25rem',
              borderRadius: '12px',
              fontSize: '0.9rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              background: statusFeedback.type === 'success' ? '#DCFCE7' : '#FEF3C7',
              color: statusFeedback.type === 'success' ? '#065F46' : '#92400E',
              border: `1px solid ${statusFeedback.type === 'success' ? '#86EFAC' : '#FDE68A'}`
            }}>
              {statusFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <Clock size={18} />}
              <span>{statusFeedback.text}</span>
            </div>
          )}

          {/* Card Body */}
          <div className="shelter-pending-body">
            {/* 4-Box Summary Grid */}
            <div className="shelter-pending-info-grid">
              <div className="shelter-pending-info-box">
                <div className="shelter-pending-info-icon">
                  <Building size={18} />
                </div>
                <div>
                  <div className="shelter-pending-info-label">Organization Name</div>
                  <div className="shelter-pending-info-value">{shelterName}</div>
                </div>
              </div>

              <div className="shelter-pending-info-box">
                <div className="shelter-pending-info-icon">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="shelter-pending-info-label">License / Registration Code</div>
                  <div className="shelter-pending-info-value">{regNumber}</div>
                </div>
              </div>

              <div className="shelter-pending-info-box">
                <div className="shelter-pending-info-icon">
                  <Mail size={18} />
                </div>
                <div>
                  <div className="shelter-pending-info-label">Registered Contact Email</div>
                  <div className="shelter-pending-info-value">{email}</div>
                </div>
              </div>

              <div className="shelter-pending-info-box">
                <div className="shelter-pending-info-icon">
                  <ShieldCheck size={18} />
                </div>
                <div>
                  <div className="shelter-pending-info-label">Organization Type</div>
                  <div className="shelter-pending-info-value">{facilityType}</div>
                </div>
              </div>
            </div>

            {/* 3-Step Verification Timeline */}
            <div className="shelter-pending-timeline-title">
              <Sparkles size={16} color="#059669" /> Approval Progress
            </div>

            <div className="shelter-pending-timeline">
              {/* Step 1 */}
              <div className="shelter-timeline-item completed">
                <div className="shelter-timeline-badge completed">
                  <CheckCircle2 size={18} />
                </div>
                <div className="shelter-timeline-content">
                  <div className="shelter-timeline-header">
                    <span className="shelter-timeline-name">1. Registration Submitted</span>
                    <span className="shelter-timeline-tag done">Completed</span>
                  </div>
                  <div className="shelter-timeline-desc">
                    Shelter credentials and NGO facility information have been logged in the system.
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="shelter-timeline-item">
                <div className="shelter-timeline-badge current">
                  <Clock size={18} />
                </div>
                <div className="shelter-timeline-content">
                  <div className="shelter-timeline-header">
                    <span className="shelter-timeline-name">2. Administrator Review</span>
                    <span className="shelter-timeline-tag in-progress">In Progress</span>
                  </div>
                  <div className="shelter-timeline-desc">
                    Our platform administrators are reviewing your documentation to verify non-profit and shelter status.
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="shelter-timeline-item">
                <div className="shelter-timeline-badge upcoming">
                  <ShieldCheck size={18} />
                </div>
                <div className="shelter-timeline-content">
                  <div className="shelter-timeline-header">
                    <span className="shelter-timeline-name">3. Portal Access &amp; Listings Activation</span>
                  </div>
                  <div className="shelter-timeline-desc">
                    Once verified, you will be granted access to the shelter dashboard, pet listings management, and adoption requests.
                  </div>
                </div>
              </div>
            </div>

            {/* Information Notice */}
            <div className="shelter-pending-notice">
              <AlertCircle size={22} color="#D97706" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div className="shelter-pending-notice-text">
                <strong>Why is my account under review?</strong> To protect adopters and ensure animal welfare standards, every shelter on PawConnect is verified by platform administrators. Portal access will unlock automatically as soon as the review is complete.
              </div>
            </div>

            {/* Footer Actions */}
            <div className="shelter-pending-actions">
              <button 
                type="button" 
                onClick={handleRefreshStatus} 
                className="shelter-pending-btn-refresh"
                disabled={checking}
              >
                <RefreshCw size={17} className={checking ? 'spin' : ''} />
                {checking ? 'Checking Status...' : 'Check Approval Status'}
              </button>

              <a 
                href="mailto:admin@pawconnect.org?subject=Shelter%20Approval%20Inquiry%20-%20"
                className="shelter-pending-btn-support"
              >
                <HelpCircle size={17} /> Contact Admin Support
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ShelterPendingApprovalView;
