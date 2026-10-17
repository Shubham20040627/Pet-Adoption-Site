import React, { useState, useEffect, useRef } from 'react';
import { 
  FileCheck2, Printer, X, Check, ShieldCheck, Copy, 
  AlertCircle, Sparkles, CheckCircle2, Feather, RotateCcw,
  Lock, Award, ShieldAlert
} from 'lucide-react';
import { adoptionsApi } from '../api/adoptionsApi';
import '../styles/adoption-contract.css';

const FALLBACK_PET_IMG = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80';

const AdoptionContractModal = ({ isOpen, onClose, applicationId, onSigned }) => {
  const [loading, setLoading] = useState(true);
  const [contractData, setContractData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  // Signing pad state
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [witnessName, setWitnessName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signSuccess, setSignSuccess] = useState(false);

  const canvasRef = useRef(null);

  // Fetch contract data when modal opens
  const fetchContract = async () => {
    if (!applicationId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await adoptionsApi.getContract(applicationId);
      setContractData(data);
      if (data.witness_name) setWitnessName(data.witness_name);
    } catch (err) {
      console.error('Failed to load adoption contract:', err);
      setError(err.response?.data?.error || 'Unable to load adoption contract. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && applicationId) {
      setSignSuccess(false);
      setHasDrawn(false);
      setAcknowledged(false);
      fetchContract();
    }
  }, [isOpen, applicationId]);

  // Setup canvas high-DPI scaling
  useEffect(() => {
    if (!isOpen || loading || contractData?.contract_signed) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.strokeStyle = '#0E3628';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, [isOpen, loading, contractData?.contract_signed]);

  if (!isOpen) return null;

  // Canvas drawing event handlers (mouse + touch)
  const getCoordinates = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
    if (e.touches) e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.touches) e.preventDefault();
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.closePath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  // Submit electronic signature
  const handleSubmitSignature = async () => {
    if (!hasDrawn) {
      alert('Please provide your signature on the signature pad before submitting.');
      return;
    }
    if (!acknowledged) {
      alert('Please accept the covenants acknowledgement checkbox to execute the agreement.');
      return;
    }

    const canvas = canvasRef.current;
    const signatureBase64 = canvas.toDataURL('image/png');

    setSubmitting(true);
    try {
      const res = await adoptionsApi.signContract(applicationId, {
        signature: signatureBase64,
        witness_name: witnessName.trim(),
      });

      setSignSuccess(true);
      await fetchContract();
      if (onSigned) onSigned(res);
    } catch (err) {
      console.error('Failed to sign contract:', err);
      alert(err.response?.data?.error || 'Failed to submit signature. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyHash = () => {
    if (!contractData?.security_hash) return;
    navigator.clipboard?.writeText(contractData.security_hash);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const pet = contractData?.pet || {};
  const adopter = contractData?.adopter || {};
  const shelter = contractData?.shelter || {};
  const isSigned = !!contractData?.contract_signed;

  const signedDateFormatted = contractData?.contract_signed_at
    ? new Date(contractData.contract_signed_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="contract-modal-backdrop" onClick={onClose}>
      <div className="contract-modal-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Toolbar */}
        <div className="contract-modal-toolbar">
          <div className="contract-toolbar-left">
            <div className="contract-toolbar-icon">
              <FileCheck2 size={20} />
            </div>
            <div>
              <div className="contract-toolbar-title">Adoption Agreement &amp; Covenants</div>
              <div className="contract-toolbar-subtitle">
                {contractData?.contract_number || 'Official Deed of Guardianship'}
              </div>
            </div>
          </div>

          <div className="contract-toolbar-actions">
            {!loading && !error && (
              <>
                {isSigned && (
                  <button
                    type="button"
                    className="contract-btn-tool outline"
                    onClick={handleCopyHash}
                    title="Copy Cryptographic Security Hash"
                  >
                    {copied ? <Check size={14} color="#6EE7B7" /> : <Copy size={14} />}
                    <span>{copied ? 'Hash Copied!' : 'Copy Security Hash'}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="contract-btn-tool gold"
                  onClick={handlePrint}
                  title="Print or Save Contract PDF"
                >
                  <Printer size={15} />
                  <span>Download / Print Deed</span>
                </button>
              </>
            )}

            <button
              type="button"
              className="contract-btn-close"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* Modal Body / Scrollable Paper Document */}
        <div className="contract-modal-body">
          {loading ? (
            <div style={{ padding: '4rem', textAlign: 'center', color: '#F7E9B8' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.4rem', fontFamily: 'Cinzel, serif' }}>
                Preparing Official Legal Agreement...
              </div>
              <p style={{ color: '#8BA99B', fontSize: '0.88rem' }}>
                Fetching covenants, pet biometrics, and cryptographic registry authentication.
              </p>
            </div>
          ) : error ? (
            <div style={{ padding: '3.5rem', textAlign: 'center', maxWidth: 460, background: '#FAF7F0', borderRadius: 12 }}>
              <AlertCircle size={44} color="#DC2626" style={{ margin: '0 auto 0.8rem auto' }} />
              <h3 style={{ color: '#1F2937', marginBottom: '0.4rem', fontSize: '1.2rem' }}>Agreement Notice</h3>
              <p style={{ color: '#4B5563', fontSize: '0.9rem', marginBottom: '1.4rem' }}>{error}</p>
              <button
                type="button"
                className="contract-btn-tool gold"
                onClick={onClose}
                style={{ margin: '0 auto' }}
              >
                Close Window
              </button>
            </div>
          ) : (
            <div className="contract-paper" id="printable-adoption-contract">
              
              {/* Header Crest */}
              <div className="contract-head">
                <div className="contract-crest-row">
                  <span className="contract-crest-line" />
                  <div className="contract-crest-icon">
                    <ShieldCheck size={26} color="#174C38" />
                  </div>
                  <span className="contract-crest-line" />
                </div>
                <div className="contract-org-label">PawConnect Animal Welfare Network</div>
                <h1 className="contract-title-main">DEED OF ADOPTION &amp; GUARDIANSHIP</h1>
                <div className="contract-subtitle-deed">
                  A Legally Binding Ethical Agreement for Companion Animal Custody &amp; Lifelong Care
                </div>
              </div>

              {/* Status and Serial Metadata Bar */}
              <div className="contract-meta-bar">
                <div className="contract-meta-id">
                  <span>AGREEMENT SERIAL: </span>
                  <strong>{contractData.contract_number}</strong>
                </div>
                <div className={`contract-meta-status ${isSigned ? 'signed' : 'pending'}`}>
                  {isSigned ? (
                    <>
                      <CheckCircle2 size={16} color="#047857" />
                      <span>OFFICIALLY EXECUTED &amp; RECORDED</span>
                    </>
                  ) : (
                    <>
                      <Feather size={15} color="#B45309" />
                      <span>PENDING ADOPTER E-SIGNATURE</span>
                    </>
                  )}
                </div>
              </div>

              {/* Success Banner if just signed */}
              {signSuccess && (
                <div style={{ background: '#DCFCE7', border: '1.5px solid #86EFAC', borderRadius: 8, padding: '0.9rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Sparkles size={22} color="#15803D" />
                  <div>
                    <div style={{ fontWeight: 800, color: '#14532D', fontSize: '0.95rem' }}>Agreement Electronically Executed!</div>
                    <div style={{ fontSize: '0.82rem', color: '#166534' }}>
                      Your digital signature and security hash have been officially registered on the PawConnect central ledger.
                    </div>
                  </div>
                </div>
              )}

              {/* Parties Section */}
              <div className="contract-parties-grid">
                {/* Party 1: Shelter */}
                <div className="contract-party-card">
                  <div className="contract-party-role">Transferor / Issuing Shelter</div>
                  <div className="contract-party-name">{shelter.name || 'PawConnect Partner Shelter'}</div>
                  <div className="contract-party-meta">
                    <div><strong>Registry Code:</strong> {shelter.license_code || 'SHL-REG-7741'}</div>
                    <div><strong>Authorized Agent:</strong> {shelter.director_name || 'Dr. Eleanor Vance'}</div>
                    <div><strong>Facility Location:</strong> {shelter.address || 'Portland, OR'}</div>
                  </div>
                </div>

                {/* Party 2: Adopter */}
                <div className="contract-party-card">
                  <div className="contract-party-role">Transferee / Adoptive Guardian</div>
                  <div className="contract-party-name">{adopter.name || 'Verified Adopter'}</div>
                  <div className="contract-party-meta">
                    <div><strong>Contact Email:</strong> {adopter.email || '—'}</div>
                    <div><strong>Phone:</strong> {adopter.phone || '—'}</div>
                    <div><strong>Primary Residence:</strong> {adopter.address || 'Registered Address'}</div>
                  </div>
                </div>
              </div>

              {/* Animal Biometrics Strip */}
              <div className="contract-pet-strip">
                <div className="contract-pet-thumb-wrap">
                  <img
                    src={pet.photo_url || FALLBACK_PET_IMG}
                    alt={pet.name || 'Pet'}
                    className="contract-pet-thumb"
                    onError={(e) => { e.target.src = FALLBACK_PET_IMG; }}
                  />
                  <div>
                    <div className="contract-pet-name">{pet.name || 'Companion Pet'}</div>
                    <div className="contract-pet-desc">
                      {pet.breed || 'Rescue Mix'} • {pet.age} {pet.age_unit || 'years'} old • {pet.gender}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <div className="contract-pet-chip-tag">
                    🏷️ Microchip: <strong>{pet.microchip_id}</strong>
                  </div>
                  {pet.vaccinated && (
                    <div className="contract-pet-chip-tag" style={{ color: '#047857', borderColor: '#86EFAC' }}>
                      ✓ Fully Vaccinated
                    </div>
                  )}
                  {pet.spayed_neutered && (
                    <div className="contract-pet-chip-tag" style={{ color: '#047857', borderColor: '#86EFAC' }}>
                      ✓ Spayed / Neutered
                    </div>
                  )}
                </div>
              </div>

              {/* Ethical Covenants List */}
              <div className="contract-covenants-section">
                <div className="contract-covenants-heading">Terms &amp; Ethical Guardianship Covenants</div>
                
                {(contractData.covenants || []).map((cov, index) => (
                  <div key={cov.id || index} className="contract-covenant-row">
                    <div className="contract-cov-num">{index + 1}</div>
                    <div className="contract-cov-body">
                      <div className="contract-cov-title">{cov.title}</div>
                      <div className="contract-cov-text">{cov.text}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Signatures Grid */}
              <div className="contract-signatures-grid">
                {/* Shelter Signature Column */}
                <div className="contract-sign-column">
                  <div className="contract-sign-label">Issuing Authority Signature</div>
                  <div className="contract-sign-box">
                    <span className="contract-shelter-cursive-sig">
                      {shelter.director_name || 'Eleanor Vance, DVM'}
                    </span>
                  </div>
                  <div className="contract-sign-rule" />
                  <div className="contract-signer-name">{shelter.director_name || 'Dr. Eleanor Vance, DVM'}</div>
                  <div className="contract-signer-sub">Shelter Medical &amp; Welfare Director</div>
                  <div className="contract-signer-sub">Authorized Transfer Officer</div>
                </div>

                {/* Adopter Signature Column */}
                <div className="contract-sign-column">
                  <div className="contract-sign-label">Adoptive Guardian E-Signature</div>
                  <div className="contract-sign-box">
                    {isSigned && contractData.adopter_signature ? (
                      <img
                        src={contractData.adopter_signature}
                        alt="Adopter E-Signature"
                        className="contract-sign-img"
                      />
                    ) : (
                      <div style={{ color: '#94A3B8', fontSize: '0.84rem', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Feather size={15} />
                        <span>Awaiting digital signature</span>
                      </div>
                    )}
                  </div>
                  <div className="contract-sign-rule" />
                  <div className="contract-signer-name">{adopter.name || 'Adopter Guardian'}</div>
                  <div className="contract-signer-sub">
                    {isSigned ? `Signed on ${signedDateFormatted}` : 'Transferee & Legal Guardian'}
                  </div>
                  {isSigned && contractData.security_hash && (
                    <div className="contract-signer-sub" style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#047857', marginTop: '2px' }}>
                      🔐 Hash: {contractData.security_hash}
                    </div>
                  )}
                </div>
              </div>

              {/* Official Seal and Legal Notice */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2.5rem', paddingTop: '1.25rem', borderTop: '1px solid #DFD7C7', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ flex: 1, minWidth: 260 }}>
                  <div style={{ fontSize: '0.76rem', color: '#64748B', lineHeight: 1.45 }}>
                    {contractData.legal_notice || 'This document constitutes a legally binding ethical deed of custody transfer executed under the PawConnect Central Animal Welfare Network governance rules.'}
                  </div>
                </div>
                <div className="contract-wax-seal">
                  <div>
                    <div>★ SEAL ★</div>
                    <div>PAWCONNECT</div>
                    <div style={{ fontSize: '0.55rem' }}>VERIFIED</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Interactive Signing Pad Drawer (Adopter can sign if not yet signed) */}
          {!loading && !error && !isSigned && (
            <div className="contract-signing-drawer" style={{ width: '100%', maxWidth: 760 }}>
              <div className="contract-signing-title">
                <Feather size={18} color="#174C38" />
                <span>Execute Adoption Agreement via Digital E-Signature</span>
              </div>
              <div className="contract-signing-desc">
                Draw your legal signature inside the designated pad below using your mouse, stylus, or fingertip.
              </div>

              {/* Canvas Pad */}
              <div className="contract-canvas-container">
                <canvas
                  ref={canvasRef}
                  className="contract-signature-canvas"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                <span className="contract-canvas-hint">Draw Signature Here</span>
              </div>

              {/* Canvas Controls */}
              <div className="contract-canvas-controls">
                <button
                  type="button"
                  className="contract-btn-clear"
                  onClick={clearCanvas}
                  title="Clear drawing pad"
                >
                  <RotateCcw size={12} style={{ marginRight: 4, verticalAlign: 'middle' }} />
                  Clear Pad
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={witnessName}
                    onChange={(e) => setWitnessName(e.target.value)}
                    placeholder="Optional Witness Name"
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: 6,
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.78rem',
                      color: '#1E293B',
                      outline: 'none',
                    }}
                  />
                </div>
              </div>

              {/* Affirmation Checkbox */}
              <label className="contract-ack-checkbox">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                />
                <span>
                  I solemnly affirm that I have read and agree to all five ethical guardianship covenants, 
                  including the lifelong medical care and mandatory shelter-return pledge.
                </span>
              </label>

              {/* Submit Execution Button */}
              <button
                type="button"
                className="contract-btn-execute"
                onClick={handleSubmitSignature}
                disabled={submitting || !hasDrawn || !acknowledged}
              >
                {submitting ? (
                  <>
                    <Lock size={16} className="animate-spin" />
                    <span>Cryptographically Signing Agreement...</span>
                  </>
                ) : (
                  <>
                    <FileCheck2 size={18} />
                    <span>Digitally Sign &amp; Execute Agreement</span>
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdoptionContractModal;
