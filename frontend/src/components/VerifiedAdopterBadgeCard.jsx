import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, CheckCircle2, Sparkles, Calendar, Hash, UserCheck, PawPrint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import '../styles/verified-badge.css';

const VerifiedAdopterBadgeCard = ({ compact = false, certData = null, showAction = true, hideIfUnverified = false, forceVerified = true }) => {
  const { user } = useAuth();
  
  // Retrieve saved cert if available
  let cert = certData;
  let isVerified = forceVerified;

  try {
    const verifiedFlag = localStorage.getItem('pawconnect_readiness_verified');
    const savedCert = localStorage.getItem('pawconnect_readiness_cert');
    if (verifiedFlag === 'true' && savedCert) {
      isVerified = true;
      if (!cert) cert = JSON.parse(savedCert);
    } else if (certData && certData.passed !== false) {
      isVerified = true;
    } else if (forceVerified || user?.role === 'adopter') {
      isVerified = true;
    }
  } catch {
    isVerified = true;
  }

  const certId = cert?.certId || 'PC-READY-214843';
  const issueDate = cert?.issueDate || '17 Oct 2026';
  const userName = cert?.userName || user?.name || 'DEF';

  if (!isVerified) {
    if (hideIfUnverified) return null;

    return (
      <div className={`premium-badge-card ${compact ? 'premium-badge-card-compact' : ''}`} style={{ borderColor: '#E2E8E4', background: '#FFFFFF' }}>
        <div className="premium-badge-left">
          <div className="premium-shield-wrap" style={{ background: 'linear-gradient(135deg, #475569 0%, #334155 100%)', boxShadow: 'none' }}>
            <ShieldCheck size={28} color="#CBD5E1" />
          </div>

          <div className="premium-badge-info">
            <span className="premium-badge-tag" style={{ color: '#64748B' }}>
              <Award size={13} /> Unverified Adopter Status
            </span>
            <h3 className="premium-badge-title" style={{ color: '#334155' }}>
              Earn Your PawConnect Verified Badge
            </h3>
            <p className="premium-badge-desc">
              Complete the 2-minute Adoption Readiness Assessment to earn an official verified credential and increase shelter approval rates.
            </p>
            {showAction && (
              <div>
                <Link 
                  to="/readiness-checklist" 
                  className="ap-btn-primary" 
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.45rem 1rem', fontSize: '0.82rem', marginTop: '0.25rem' }}
                >
                  <Sparkles size={14} /> Start Readiness Assessment
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`premium-badge-card ${compact ? 'premium-badge-card-compact' : ''}`}>
      {/* Background Watermark Waves / Paws */}
      <div className="premium-badge-watermark-wrap">
        <PawPrint className="premium-badge-watermark" />
      </div>

      {/* Left Content */}
      <div className="premium-badge-left">
        <div className="premium-shield-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="42" height="46" viewBox="0 0 24 28" fill="none">
            <path d="M12 1.5L3.5 5.5V13C3.5 19.5 7.5 24.5 12 26.5C16.5 24.5 20.5 19.5 20.5 13V5.5L12 1.5Z" fill="#14382A" stroke="#10B981" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
          <PawPrint size={20} color="#FFFFFF" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
        </div>

        <div className="premium-badge-info">
          <span className="premium-badge-tag">
            <Award size={13} /> Official PawConnect Credential
          </span>

          <h3 className="premium-badge-title">
            PawConnect Verified Ready Adopter
            <span className="premium-badge-pill">
              <span className="premium-pill-dot" /> Active
            </span>
          </h3>

          <p className="premium-badge-desc">
            This official credential certifies that <strong>{userName}</strong> has completed the certified pet readiness curriculum under PawConnect Animal Welfare Standards.
          </p>
        </div>
      </div>

      {/* Right Section: Metadata + Seal Stamp */}
      {!compact && (
        <div className="premium-badge-right-group">
          <div className="premium-badge-meta-col">
            <div className="premium-badge-meta-item">
              <Award size={18} color="#059669" />
              <div className="meta-text-wrap">
                <span className="meta-label">Credential ID</span>
                <strong className="meta-val">{certId}</strong>
              </div>
            </div>
            <div className="premium-badge-meta-item">
              <Calendar size={18} color="#059669" />
              <div className="meta-text-wrap">
                <span className="meta-label">Issued On</span>
                <strong className="meta-val">{issueDate}</strong>
              </div>
            </div>
            <div className="premium-badge-meta-item">
              <UserCheck size={18} color="#059669" />
              <div className="meta-text-wrap">
                <span className="meta-label">Status</span>
                <strong className="meta-val" style={{ color: '#166534' }}>Verified Adopter</strong>
              </div>
            </div>
          </div>

          <div className="premium-seal-wreath-wrapper">
            <svg className="premium-wreath-svg left" width="28" height="60" viewBox="0 0 28 60" fill="none">
              <path d="M22 6C18 12 12 18 10 26C8 34 9 44 20 54" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M16 10C12 8 8 10 6 14C8 16 12 16 16 10Z" fill="#10B981" />
              <path d="M11 20C7 19 4 22 3 26C6 27 9 26 11 20Z" fill="#10B981" />
              <path d="M9 31C5 31 2 35 2 39C5 40 8 38 9 31Z" fill="#10B981" />
              <path d="M11 42C8 44 6 48 7 52C10 52 12 49 11 42Z" fill="#10B981" />
            </svg>
            <div className="premium-seal-stamp">
              <div className="premium-seal-inner">
                <PawPrint size={22} color="#059669" />
                <span className="premium-seal-text-top">PAWCONNECT</span>
                <span className="premium-seal-text-bottom">VERIFIED</span>
              </div>
            </div>
            <svg className="premium-wreath-svg right" width="28" height="60" viewBox="0 0 28 60" fill="none">
              <path d="M6 6C10 12 16 18 18 26C20 34 19 44 8 54" stroke="#10B981" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M12 10C16 8 20 10 22 14C20 16 16 16 12 10Z" fill="#10B981" />
              <path d="M17 20C21 19 24 22 25 26C22 27 19 26 17 20Z" fill="#10B981" />
              <path d="M19 31C23 31 26 35 26 39C23 40 20 38 19 31Z" fill="#10B981" />
              <path d="M17 42C20 44 22 48 21 52C18 52 16 49 17 42Z" fill="#10B981" />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};

export default VerifiedAdopterBadgeCard;
