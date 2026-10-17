import React from 'react';
import { Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
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

const getDirectorSignature = (shelterName) => {
  if (!shelterName) return 'Dr. Eleanor Vance';
  const cleanWords = shelterName
    .replace(/&/g, '')
    .split(/\s+/)
    .filter((w) => w && !['Animal', 'Sanctuary', 'Shelter', 'Rescue', 'NGO', 'Foundation', 'Society'].includes(w));
  if (cleanWords.length >= 2) {
    return `Dr. ${cleanWords[0][0]}. ${cleanWords[1]}`;
  }
  if (cleanWords.length === 1) {
    return `Dr. H. ${cleanWords[0]}`;
  }
  return 'Dr. Eleanor Vance';
};

const AdoptionCertificateDocument = ({ certData }) => {
  if (!certData) return null;

  const pet = certData.pet || {
    name: certData.pet_name,
    breed: certData.breed,
    species: certData.species,
    age: certData.age,
    age_unit: certData.age_unit,
    gender: certData.gender,
    photo_url: certData.photo_url,
    microchip_id: certData.microchip_id,
    vaccinated: certData.vaccinated,
    spayed_neutered: certData.spayed_neutered,
  };

  const adopter = certData.adopter || {
    name: certData.adopter_name,
  };

  const shelter = certData.shelter || {
    name: certData.shelter_name,
    registry_code: certData.shelter_registry_code,
  };

  const issuedFormatted = certData.issued_at
    ? new Date(certData.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'October 16, 2026';

  const verificationUrl = certData.certificate_number
    ? `${window.location.origin}/verify-certificate/${certData.certificate_number}`
    : window.location.href;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(verificationUrl)}`;

  const directorSig = getDirectorSignature(shelter.name);

  return (
    <div className="cert-frame-wrapper" id="printable-adoption-certificate">
      <div className="cert-document">
        {/* 4 Corner Filigree Ornaments */}
        <CornerFiligree className="cert-corner top-left" />
        <CornerFiligree className="cert-corner top-right" />
        <CornerFiligree className="cert-corner bottom-left" />
        <CornerFiligree className="cert-corner bottom-right" />

        {/* Inner Border Lines */}
        <div className="cert-inner-border" />

        {/* Header with Crest */}
        <div className="cert-head">
          <div className="cert-crest-row">
            <div className="cert-crest-line" />
            <div className="cert-crest-badge">
              <Award size={20} />
            </div>
            <div className="cert-crest-line" />
          </div>
          <div className="cert-network-name">PawConnect Central Welfare Network</div>
          <h1 className="cert-title-main">Certificate of Adoption</h1>
          <div className="cert-deed-subtitle">Official Deed of Transfer &amp; Lifelong Ethical Guardianship</div>
        </div>

        {/* Proclamation Statement */}
        <div className="cert-proclamation">
          <div className="cert-p-intro">This is to proudly certify that</div>
          <div className="cert-adopter-name">
            {adopter.name || 'Adoptive Guardian'}
            <div className="cert-name-underline" />
          </div>
          <p className="cert-proclamation-text">
            has officially satisfied all ethical adoption prerequisites and has been granted legal guardianship of{' '}
            <span className="cert-pet-emp">{pet.name || 'Pet'}</span>, pledging a safe forever home,
            regular veterinary care, and lifelong compassion.
          </p>
        </div>

        {/* 2-Column Content: Pet Biometrics (Left) + Official Registry (Right) */}
        <div className="cert-body-grid">
          {/* Left Column: Pet Profile */}
          <div className="cert-pet-panel">
            <div className="cert-pet-avatar-frame">
              <img
                src={pet.photo_url || pet.image_url || FALLBACK_PET_IMG}
                alt={pet.name || 'Pet'}
                className="cert-pet-avatar-img"
                onError={(e) => {
                  e.target.src = FALLBACK_PET_IMG;
                }}
              />
            </div>

            <div className="cert-pet-name-title">{pet.name || 'Pet Name'}</div>
            <div className="cert-pet-meta-desc">
              {pet.breed || pet.species || 'Companion Animal'} • {pet.gender || 'Unknown'} • {pet.age || 1}{' '}
              {pet.age_unit || 'years'}
            </div>

            {/* Verified Health Badges */}
            <div className="cert-health-badges">
              {pet.vaccinated && (
                <div className="cert-health-chip">
                  <CheckCircle2 size={11} strokeWidth={2.5} /> Vaccinated &amp; Immunized
                </div>
              )}
              {pet.spayed_neutered && (
                <div className="cert-health-chip">
                  <CheckCircle2 size={11} strokeWidth={2.5} /> Spayed / Neutered
                </div>
              )}
              <div className="cert-health-chip">
                <ShieldCheck size={11} /> Vet Health Certified
              </div>
            </div>

            {/* Microchip Badge */}
            <div className="cert-chip-id-badge">
              Microchip ID: <strong>{pet.microchip_id || '985141006D43'}</strong>
            </div>
          </div>

          {/* Right Column: Registry Verification */}
          <div className="cert-registry-panel">
            <div className="cert-meta-table">
              <div className="cert-meta-item">
                <span className="cert-meta-lbl">Certificate No.</span>
                <span className="cert-meta-val code">{certData.certificate_number}</span>
              </div>

              <div className="cert-meta-item">
                <span className="cert-meta-lbl">Date of Adoption</span>
                <span className="cert-meta-val">{issuedFormatted}</span>
              </div>

              <div className="cert-meta-item">
                <span className="cert-meta-lbl">Issuing Shelter</span>
                <span className="cert-meta-val">{shelter.name || 'Hope & Paws Sanctuary'}</span>
              </div>

              <div className="cert-meta-item">
                <span className="cert-meta-lbl">Shelter License Code</span>
                <span className="cert-meta-val code">{shelter.registry_code || 'SHL-REG-C572'}</span>
              </div>

              <div className="cert-meta-item">
                <span className="cert-meta-lbl">Registry Security</span>
                <span className="cert-meta-val verified">
                  <ShieldCheck size={13} /> Authenticated &amp; Sealed
                </span>
              </div>
            </div>

            {/* QR Code Verification Strip */}
            <div className="cert-qr-strip">
              <div className="cert-qr-box">
                <img
                  src={qrImageUrl}
                  alt="Verification QR Code"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
              <div className="cert-qr-info">
                <strong>Live QR Authenticity Verification</strong>
                Scan to verify tamper-proof adoption credentials 24/7 on the official PawConnect registry.
              </div>
            </div>
          </div>
        </div>

        {/* Footer with Realistic Signatures & Embossed Wax Ribbon Seal */}
        <div className="cert-auth-footer">
          {/* Left: Shelter Authorized Signature */}
          <div className="cert-sign-block">
            <div className="cert-cursive-sig">{directorSig}</div>
            <div className="cert-sign-rule" />
            <div className="cert-sign-title">{shelter.name || 'Hope & Paws Sanctuary'}</div>
            <div className="cert-sign-sub">Authorized Shelter Director</div>
          </div>

          {/* Center: Gold Wax Seal with Ribbons */}
          <div className="cert-seal-center">
            <div className="cert-wax-seal">
              <div className="cert-wax-ring">
                <span className="cert-wax-text-1">PawConnect</span>
                <span className="cert-wax-star">★ ★ ★</span>
                <span className="cert-wax-text-2">Official Seal</span>
              </div>
            </div>
            <div className="cert-ribbon-tails">
              <div className="cert-ribbon-tail left" />
              <div className="cert-ribbon-tail right" />
            </div>
          </div>

          {/* Right: Central Registry Signature */}
          <div className="cert-sign-block right">
            <div className="cert-cursive-sig">A. Kensington</div>
            <div className="cert-sign-rule" />
            <div className="cert-sign-title">PawConnect Foundation</div>
            <div className="cert-sign-sub">Central Registry Officer</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdoptionCertificateDocument;
