import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, CheckCircle2, Sparkles, ExternalLink, Calendar, Hash, UserCheck } from 'lucide-react';
import '../styles/verified-badge.css';

const VerifiedAdopterBadgeCard = ({ compact = false, certData = null, showAction = true, hideIfUnverified = false }) => {
  // Retrieve saved cert if not passed explicitly
  let cert = certData;
  let isVerified = false;

  try {
    const verifiedFlag = localStorage.getItem('pawconnect_readiness_verified');
    const savedCert = localStorage.getItem('pawconnect_readiness_cert');
    if (verifiedFlag === 'true' && savedCert) {
      isVerified = true;
      if (!cert) cert = JSON.parse(savedCert);
    } else if (certData && certData.passed !== false) {
      isVerified = true;
    }
  } catch {
    // fallback
  }

  if (!isVerified) {
    if (hideIfUnverified) return null;

    // Encouraging unverified state
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

  const certId = cert?.certId || 'PC-READY-214843';
  const issueDate = cert?.issueDate || '17 Oct 2026';
  const userName = cert?.userName || 'Alex Morgan';

  return (
    <div className={`premium-badge-card ${compact ? 'premium-badge-card-compact' : ''}`}>
      {/* Background Watermark */}
      <ShieldCheck className="premium-badge-watermark" />

      {/* Left Content */}
      <div className="premium-badge-left">
        <div className="premium-shield-wrap">
          <ShieldCheck size={32} />
          <div className="premium-shield-star">
            <Sparkles size={12} />
          </div>
        </div>

        <div className="premium-badge-info">
          <span className="premium-badge-tag">
            <Award size={13} /> Official PawConnect Credential
          </span>

          <h3 className="premium-badge-title">
            PawConnect Verified Ready Adopter
            <span className="premium-badge-pill">
              <CheckCircle2 size={12} style={{ verticalAlign: 'middle', marginRight: 2 }} /> Active
            </span>
          </h3>

          <p className="premium-badge-desc">
            This official credential certifies that <strong>{userName}</strong> has completed the certified pet readiness curriculum under PawConnect Animal Welfare Standards.
          </p>

          <div className="premium-badge-meta-row">
            <div className="premium-badge-meta-item">
              <Hash size={13} color="#059669" />
              <span>Credential ID: <strong>{certId}</strong></span>
            </div>
            <div className="premium-badge-meta-item">
              <Calendar size={13} color="#059669" />
              <span>Issued: <strong>{issueDate}</strong></span>
            </div>
            <div className="premium-badge-meta-item">
              <UserCheck size={13} color="#059669" />
              <span>Status: <strong style={{ color: '#047857' }}>Verified Adopter</strong></span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Gold/Emerald Seal Stamp */}
      {!compact && (
        <div className="premium-seal-stamp">
          <span className="premium-seal-text-top">PawConnect</span>
          <CheckCircle2 size={24} className="premium-seal-check" />
          <span className="premium-seal-text-bottom">Verified</span>
        </div>
      )}
    </div>
  );
};

export default VerifiedAdopterBadgeCard;
