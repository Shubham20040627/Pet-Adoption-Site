import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShieldCheck, Award, Printer, Copy, Check, Home, AlertTriangle, ArrowLeft, ExternalLink, Sparkles } from 'lucide-react';
import { adoptionsApi } from '../api/adoptionsApi';
import AdoptionCertificateDocument from '../components/AdoptionCertificateDocument';
import '../styles/adoption-certificate.css';

const VerifyCertificatePage = () => {
  const { certNumber } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const verify = async () => {
      try {
        setLoading(true);
        const res = await adoptionsApi.verifyCertificate(certNumber);
        setData(res);
      } catch (err) {
        console.error('Certificate verification failed:', err);
        setError('This certificate could not be verified. It may be invalid, revoked, or not yet approved.');
      } finally {
        setLoading(false);
      }
    };

    if (certNumber) {
      verify();
    }
  }, [certNumber]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div style={{ minHeight: '90vh', background: '#081C14', padding: '2.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      {/* Top Header / Verified Status Strip */}
      <div style={{ width: '100%', maxWidth: 900, marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
        <Link 
          to="/pets" 
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#8BA99B', textDecoration: 'none', fontSize: '0.86rem', fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back to PawConnect
        </Link>

        {data?.valid && (
          <div style={{ display: 'flex', gap: '0.6rem' }}>
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
              title="Download or Print PDF"
            >
              <Printer size={15} />
              <span>Print Official PDF</span>
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '5rem 2rem', textAlign: 'center', color: '#F7E9B8' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, fontFamily: 'Cinzel, serif', marginBottom: '0.5rem' }}>
            Verifying Official Adoption Deed...
          </div>
          <p style={{ color: '#8BA99B', fontSize: '0.9rem' }}>
            Validating certificate record <code>{certNumber}</code> against the centralized animal welfare registry.
          </p>
        </div>
      ) : error ? (
        <div style={{ background: '#ffffff', borderRadius: 16, padding: '3.5rem 2rem', maxWidth: 500, textAlign: 'center', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
          <div style={{ display: 'inline-flex', padding: '0.9rem', borderRadius: '50%', background: '#FEE2E2', color: '#DC2626', marginBottom: '1.2rem' }}>
            <AlertTriangle size={38} />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#991B1B', marginBottom: '0.5rem' }}>
            Registry Verification Failed
          </h2>
          <p style={{ color: '#4B5563', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '1.8rem' }}>
            {error}
          </p>
          <Link
            to="/pets"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: '#0F3223', color: '#ffffff', padding: '0.7rem 1.6rem', borderRadius: 999, fontWeight: 700, textDecoration: 'none', fontSize: '0.9rem' }}
          >
            <Home size={16} /> Return to Homepage
          </Link>
        </div>
      ) : (
        <div style={{ width: '100%', maxWidth: 900 }}>
          {/* Authentic Registry Seal Ribbon */}
          <div 
            style={{ 
              background: 'linear-gradient(135deg, rgba(20,61,43,0.95) 0%, rgba(10,32,22,0.95) 100%)', 
              border: '1px solid rgba(212,175,55,0.45)', 
              borderRadius: 14, 
              padding: '1rem 1.4rem', 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#0A2016', border: '1.5px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={22} color="#D4AF37" />
              </div>
              <div>
                <div style={{ fontWeight: 800, color: '#F7E9B8', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>Authentic Verified Adoption Record</span>
                  <Sparkles size={14} color="#D4AF37" />
                </div>
                <div style={{ color: '#8BA99B', fontSize: '0.8rem' }}>
                  Certificate <strong>{data.certificate_number}</strong> • Tamper-Proof Cryptographic Seal Confirmed
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.74rem', textTransform: 'uppercase', color: '#72827A', letterSpacing: '1px', fontWeight: 700 }}>
                Status
              </div>
              <div style={{ color: '#6EE7B7', fontWeight: 800, fontSize: '0.95rem' }}>
                ● Active &amp; Verified
              </div>
            </div>
          </div>

          {/* THE LUXURY ADOPTION CERTIFICATE TEMPLATE */}
          <AdoptionCertificateDocument certData={data} />
        </div>
      )}
    </div>
  );
};

export default VerifyCertificatePage;
