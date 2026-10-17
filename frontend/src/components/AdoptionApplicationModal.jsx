import React, { useState } from 'react';
import { X, Check, AlertCircle, Heart, PawPrint } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adoptionsApi } from '../api/adoptionsApi';
import '../styles/forms.css';

const STEPS = [
  { n: 1, label: 'Applicant' },
  { n: 2, label: 'Living Space' },
  { n: 3, label: 'Experience' },
  { n: 4, label: 'Review' },
];

const FALLBACK = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

const AdoptionApplicationModal = ({ pet, isOpen, onClose, onSuccess }) => {
  const { user, isAdopter } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    adopter_name: user?.name || 'Alex Morgan',
    adopter_email: user?.email || 'adopter@pawconnect.org',
    adopter_phone: user?.phone || '+1 (555) 345-6789',
    living_type: 'House with fenced yard',
    has_yard: true,
    household_members: '2 adults',
    has_other_pets: false,
    other_pets_details: '',
    previous_experience: 'Experienced pet owner',
    reason_for_adoption: '',
    time_alone_hours: '1-2 hours',
    readiness_acknowledged: true,
  });

  if (!isOpen || !pet) return null;

  const handleInputChange = (field, val) => {
    setFormData(prev => ({ ...prev, [field]: val }));
  };

  const handleNext = () => {
    if (step === 1 && !formData.reason_for_adoption.trim()) {
      setError('Please share why you wish to adopt this pet.');
      return;
    }
    setError(null);
    setStep(s => s + 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAdopter && !user) {
      setError('Please log in as an adopter to submit an adoption application.');
      return;
    }
    setSubmitting(true);
    setError(null);

    try {
      const isVerified = localStorage.getItem('pawconnect_readiness_verified') === 'true';
      await adoptionsApi.submitApplication({
        pet_id: pet.id,
        is_readiness_verified: isVerified,
        ...formData,
      });
      setSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to submit application. Please verify details and try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const petPhoto = pet.photo_url || pet.image_url || FALLBACK;

  return (
    <div className="ap-modal-backdrop" onClick={() => !submitting && onClose()}>
      <div className="ap-modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="ap-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#E8F5EC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#174C38' }}>
              <Heart size={18} fill="#174C38" />
            </div>
            <div>
              <h3 className="ap-modal-title" style={{ margin: 0, fontSize: '1.15rem' }}>
                Adoption Application
              </h3>
              <div style={{ fontSize: '0.8rem', color: '#5A7167' }}>
                Applying for {pet.name} ({pet.breed || pet.species})
              </div>
            </div>
          </div>
          <button className="ap-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '2.5rem 1.5rem', textAlign: 'center' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DCFCE7', color: '#15803D', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
              <Check size={32} strokeWidth={2.5} />
            </div>
            <h3 style={{ fontFamily: 'var(--font-heading)', color: '#162620', fontSize: '1.4rem', margin: '0 0 0.5rem' }}>
              Application Submitted!
            </h3>
            <p style={{ color: '#5A7167', fontSize: '0.92rem', lineHeight: 1.5, margin: '0 0 1.75rem' }}>
              Your application for <strong>{pet.name}</strong> has been received by {pet.shelter_name || 'the rescue shelter'}. You can track its live progress anytime in your Applications dashboard.
            </p>
            <button className="ap-btn-primary" onClick={onClose} style={{ width: '100%' }}>
              Done
            </button>
          </div>
        ) : (
          <div style={{ padding: '1.25rem 1.5rem' }}>
            {/* Step Stepper */}
            <div className="ap-steps-row" style={{ marginBottom: '1.25rem' }}>
              {STEPS.map(({ n, label }, idx) => {
                const isDone = step > n;
                const isCurrent = step === n;
                return (
                  <React.Fragment key={n}>
                    <div className={`ap-step ${isDone ? 'done' : isCurrent ? 'active' : ''}`}>
                      <div className="ap-step-dot">{isDone ? <Check size={11} /> : n}</div>
                      <span className="ap-step-label">{label}</span>
                    </div>
                    {idx < STEPS.length - 1 && <div className="ap-step-line" />}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Pet Mini Card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', background: '#F8F5EF', padding: '0.65rem 0.85rem', borderRadius: 12, marginBottom: '1.25rem' }}>
              <img src={petPhoto} alt={pet.name} style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} onError={e => { e.target.src = FALLBACK; }} />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#162620' }}>{pet.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#688075' }}>
                  {pet.species} • {pet.breed} • {pet.age} {pet.age === 1 ? 'yr' : 'yrs'}
                </div>
              </div>
            </div>

            {error && (
              <div style={{ background: '#FDE8E8', border: '1px solid #FECACA', color: '#B91C1C', padding: '0.65rem 0.85rem', borderRadius: 8, fontSize: '0.84rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div>
                <div className="ap-form-group">
                  <label className="ap-label">Full Name *</label>
                  <input className="ap-input" value={formData.adopter_name} onChange={e => handleInputChange('adopter_name', e.target.value)} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="ap-form-group">
                    <label className="ap-label">Email Address *</label>
                    <input type="email" className="ap-input" value={formData.adopter_email} onChange={e => handleInputChange('adopter_email', e.target.value)} />
                  </div>
                  <div className="ap-form-group">
                    <label className="ap-label">Phone *</label>
                    <input className="ap-input" value={formData.adopter_phone} onChange={e => handleInputChange('adopter_phone', e.target.value)} />
                  </div>
                </div>
                <div className="ap-form-group">
                  <label className="ap-label">Why are you interested in adopting {pet.name}? *</label>
                  <textarea
                    className="ap-textarea"
                    rows={3}
                    placeholder={`Tell the shelter about your home and why you would love to adopt ${pet.name}...`}
                    value={formData.reason_for_adoption}
                    onChange={e => handleInputChange('reason_for_adoption', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Step 2: Living Situation */}
            {step === 2 && (
              <div>
                <div className="ap-form-group">
                  <label className="ap-label">Living Environment</label>
                  <select className="ap-select" style={{ width: '100%' }} value={formData.living_type} onChange={e => handleInputChange('living_type', e.target.value)}>
                    <option value="Apartment">Apartment</option>
                    <option value="House with fenced yard">House with fenced yard</option>
                    <option value="House without yard">House without yard</option>
                    <option value="Farm / Rural acreage">Farm / Rural acreage</option>
                  </select>
                </div>
                <div className="ap-form-group">
                  <label className="ap-label">Household Members</label>
                  <input className="ap-input" placeholder="e.g. 2 adults, 1 teenager" value={formData.household_members} onChange={e => handleInputChange('household_members', e.target.value)} />
                </div>
                <div className="ap-form-group">
                  <label className="ap-label">Estimated Hours Pet Will Be Alone Daily</label>
                  <select className="ap-select" style={{ width: '100%' }} value={formData.time_alone_hours} onChange={e => handleInputChange('time_alone_hours', e.target.value)}>
                    <option value="0-2 hours">0–2 hours (someone home)</option>
                    <option value="2-4 hours">2–4 hours</option>
                    <option value="4-6 hours">4–6 hours</option>
                    <option value="6+ hours">6+ hours</option>
                  </select>
                </div>
              </div>
            )}

            {/* Step 3: Experience & Other Pets */}
            {step === 3 && (
              <div>
                <div className="ap-form-group">
                  <label className="ap-label">Previous Pet Experience</label>
                  <select className="ap-select" style={{ width: '100%' }} value={formData.previous_experience} onChange={e => handleInputChange('previous_experience', e.target.value)}>
                    <option value="First-time pet parent">First-time pet parent</option>
                    <option value="Moderate experience">Moderate experience</option>
                    <option value="Experienced pet owner">Experienced pet owner</option>
                  </select>
                </div>
                <div className="ap-form-group">
                  <label className="ap-label">Are there other pets at home?</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                      <input type="radio" checked={!formData.has_other_pets} onChange={() => handleInputChange('has_other_pets', false)} />
                      No other pets
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', fontSize: '0.88rem' }}>
                      <input type="radio" checked={formData.has_other_pets} onChange={() => handleInputChange('has_other_pets', true)} />
                      Yes, have other pets
                    </label>
                  </div>
                </div>
                {formData.has_other_pets && (
                  <div className="ap-form-group">
                    <label className="ap-label">Please describe existing pets (species, age, breed)</label>
                    <input className="ap-input" placeholder="e.g. 1 senior dog, vaccinated" value={formData.other_pets_details} onChange={e => handleInputChange('other_pets_details', e.target.value)} />
                  </div>
                )}
                <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    id="readiness"
                    checked={formData.readiness_acknowledged}
                    onChange={e => handleInputChange('readiness_acknowledged', e.target.checked)}
                    style={{ marginTop: '3px' }}
                  />
                  <label htmlFor="readiness" style={{ fontSize: '0.82rem', color: '#4A6359', cursor: 'pointer' }}>
                    I acknowledge that adoption is a 10–15 year commitment and agree to provide food, shelter, and medical care.
                  </label>
                </div>
              </div>
            )}

            {/* Step 4: Summary & Submit */}
            {step === 4 && (
              <div>
                <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.95rem', fontWeight: 700, color: '#162620' }}>
                  Confirm Application Details
                </h4>
                <div style={{ background: '#F8F5EF', borderRadius: 10, padding: '0.85rem', fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <div><strong>Applicant:</strong> {formData.adopter_name} ({formData.adopter_email})</div>
                  <div><strong>Phone:</strong> {formData.adopter_phone}</div>
                  <div><strong>Living Environment:</strong> {formData.living_type}</div>
                  <div><strong>Household:</strong> {formData.household_members}</div>
                  <div><strong>Experience:</strong> {formData.previous_experience}</div>
                  <div><strong>Reason:</strong> {formData.reason_for_adoption}</div>
                  {localStorage.getItem('pawconnect_readiness_verified') === 'true' && (
                    <div style={{ marginTop: '0.5rem', background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 8, padding: '0.45rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: '#065F46', fontWeight: 700 }}>
                      <span>🛡️ PawConnect Verified Ready Adopter credential attached</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #EDEBE6' }}>
              <button
                type="button"
                className="ap-btn-secondary"
                onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
                disabled={submitting}
              >
                {step > 1 ? '← Back' : 'Cancel'}
              </button>

              {step < 4 ? (
                <button type="button" className="ap-btn-primary" onClick={handleNext}>
                  Continue →
                </button>
              ) : (
                <button type="button" className="ap-btn-primary" disabled={submitting} onClick={handleSubmit}>
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdoptionApplicationModal;
