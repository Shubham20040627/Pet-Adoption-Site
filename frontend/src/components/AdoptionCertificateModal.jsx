import React, { useState, useEffect } from 'react';
import { Award, Printer, X, Check, ShieldCheck, Copy, AlertCircle, Sparkles, CheckCircle2 } from 'lucide-react';
import { adoptionsApi } from '../api/adoptionsApi';
import AdoptionCertificateDocument from './AdoptionCertificateDocument';
import '../styles/adoption-certificate.css';

const FALLBACK_PET_IMG = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80';

// Ornate Corner Filigree SVG Component
const CornerFiligree = ({ className }) => (
  <svg className={className} viewBox="0 0 50 50" fill="currentColor">
    <path d="M2,2 L18,2 C10,2 2,10 2,18 Z" opacity="0.6" />
    <path d="M4,4 L28,4 C16,4 4,16 4,28 L4,4 Z" fill="none" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6,6 L38,6 C22,6 6,22 6,38" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" />
    <circle cx="12" cy="12" r="2.5" fill="currentColor" />
    <circle cx="20" cy="8" r="1.5" fill="currentColor" />
    <circle cx="8" cy="20" r="1.5" fill="currentColor" />
  </svg>
);

const AdoptionCertificateModal = ({ isOpen, onClose, applicationId }) => {
  const [loading, setLoading] = useState(true);
  const [certData, setCertData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !applicationId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchCert = async () => {
      try {
        const data = await adoptionsApi.getCertificate(applicationId);
        if (isMounted) {
          setCertData(data);
        }
      } catch (err) {
        if (isMounted) {
          console.error('Failed to load certificate:', err);
          setError(err.response?.data?.error || 'Unable to load certificate. Ensure the application is approved.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCert();

    return () => {
      isMounted = false;
    };
  }, [isOpen, applicationId]);

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (!certData?.certificate_number) return;
    const url = `${window.location.origin}/verify-certificate/${certData.certificate_number}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const pet = certData?.pet || {};
  const adopter = certData?.adopter || {};
  const shelter = certData?.shelter || {};

  const issuedFormatted = certData?.issued_at
    ? new Date(certData.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'October 16, 2026';

  const verificationUrl = certData?.certificate_number
    ? `${window.location.origin}/verify-certificate/${certData.certificate_number}`
    : window.location.href;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  return (
    <div className="cert-modal-backdrop" onClick={onClose}>
      <div className="cert-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Top Dark Emerald & Gold Toolbar */}
        <div className="cert-modal-toolbar">
          <div className="cert-toolbar-title">
            <Award size={18} color="#D4AF37" />
            <span>Official Adoption Certificate</span>
          </div>

          <div className="cert-toolbar-actions">
            {!loading && !error && (
              <>
                <button
                  type="button"
                  className="cert-btn-action outline"
                  onClick={handleCopyLink}
                  title="Copy verification link"
                >
                  {copied ? <Check size={14} color="#6EE7B7" /> : <Copy size={14} />}
                  <span>{copied ? 'Link Copied!' : 'Share Record'}</span>
                </button>

                <button
                  type="button"
                  className="cert-btn-action gold"
                  onClick={handlePrint}
                  title="Download as PDF or Print"
                >
                  <Printer size={15} />
                  <span>Download / Print PDF</span>
                </button>
              </>
            )}

            <button
              type="button"
              className="cert-btn-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Canvas */}
        <div className="cert-modal-body">
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#F7E9B8' }}>
              <div style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem', fontFamily: 'Cinzel, serif' }}>
                Generating Official Certificate...
              </div>
              <p style={{ color: '#8BA99B', fontSize: '0.88rem' }}>
                Compiling cryptographic verification records, microchip identity, and shelter authorization.
              </p>
            </div>
          ) : error ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', maxWidth: 450, background: '#ffffff', borderRadius: 12 }}>
              <AlertCircle size={44} color="#DC2626" style={{ margin: '0 auto 0.8rem auto' }} />
              <h3 style={{ color: '#1F2937', marginBottom: '0.4rem', fontSize: '1.2rem' }}>Certificate Unavailable</h3>
              <p style={{ color: '#4B5563', fontSize: '0.9rem', marginBottom: '1.4rem' }}>{error}</p>
              <button
                type="button"
                className="cert-btn-action gold"
                onClick={onClose}
                style={{ margin: '0 auto' }}
              >
                Close Window
              </button>
            </div>
          ) : (
            <AdoptionCertificateDocument certData={certData} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AdoptionCertificateModal;
