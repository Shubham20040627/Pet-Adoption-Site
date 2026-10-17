import React, { useEffect } from 'react';
import { X, ShieldCheck, HeartHandshake, CheckCircle2, Award, ExternalLink } from 'lucide-react';
import DigitalCareProfileCard from './DigitalCareProfileCard';
import '../styles/care-profile.css';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80';

const DigitalCareProfileModal = ({ isOpen, onClose, pet, onApply, isAdopter = true }) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    // Lock body scroll
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !pet) return null;

  const photo = pet.photo_url || pet.image_url || FALLBACK_IMAGE;

  return (
    <div className="care-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div 
        className="care-modal-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Bar */}
        <div className="care-modal-header">
          <div className="care-modal-header-left">
            <img 
              src={photo} 
              alt={pet.name} 
              className="care-modal-pet-avatar"
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
            />
            <div>
              <h2 className="care-modal-header-title">
                {pet.name}’s Health &amp; Care Passport
              </h2>
              <div className="care-modal-header-sub">
                <span>{pet.breed || pet.species}</span>
                <span>•</span>
                <span style={{ color: '#059669', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                  <ShieldCheck size={13} /> Verified Pre-Adoption Records
                </span>
              </div>
            </div>
          </div>

          <button 
            type="button" 
            className="care-modal-close-btn" 
            onClick={onClose}
            aria-label="Close care profile modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Passport Content */}
        <div className="care-modal-scroll-body">
          <DigitalCareProfileCard pet={pet} />
        </div>

        {/* Modal Footer Actions */}
        <div className="care-modal-footer">
          <div className="care-modal-footer-notice">
            <Award size={16} color="#059669" />
            <span>Accredited clinical assessment under PawConnect Animal Welfare Standards.</span>
          </div>

          <div className="care-modal-footer-btns">
            <button 
              type="button" 
              className="care-modal-btn-close"
              onClick={onClose}
            >
              Close
            </button>

            {isAdopter && onApply && (
              <button 
                type="button" 
                className="care-modal-btn-apply"
                onClick={() => {
                  onClose();
                  onApply();
                }}
              >
                🐾 Apply to Adopt {pet.name}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DigitalCareProfileModal;
