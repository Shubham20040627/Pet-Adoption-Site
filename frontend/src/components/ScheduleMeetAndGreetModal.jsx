import React, { useState } from 'react';
import {
  Calendar, Clock, MapPin, Video, Building, X,
  CheckCircle2, Sparkles, AlertCircle, Info, ChevronRight, User
} from 'lucide-react';
import { adoptionsApi } from '../api/adoptionsApi';
import { useAuth } from '../context/AuthContext';
import '../styles/meet-and-greet.css';

const FALLBACK_PET_IMG = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=300&q=80';

const TIME_SLOTS = [
  '10:00 AM – 11:30 AM',
  '1:00 PM – 2:30 PM',
  '3:30 PM – 5:00 PM',
  '5:30 PM – 6:30 PM (Evening)',
];

export const ScheduleMeetAndGreetModal = ({
  isOpen,
  onClose,
  pet,
  applicationId = null,
  adopterId = null,
  adopterName = null,
  onSuccess = null
}) => {
  const { user, isShelter } = useAuth();

  // Helper date generators
  const getTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getDayOffset = (days) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };

  const [visitType, setVisitType] = useState('in_person'); // 'in_person' | 'virtual'
  const [visitDate, setVisitDate] = useState(getTomorrow());
  const [timeSlot, setTimeSlot] = useState(TIME_SLOTS[0]);
  const [notes, setNotes] = useState('');
  const [attendees, setAttendees] = useState({
    bringingPet: false,
    bringingFamily: true,
    firstTimeAdopter: false,
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  if (!isOpen || !pet) return null;

  const petPhoto = pet.photo_url || pet.image_url || FALLBACK_PET_IMG;
  const shelterName = pet.shelter?.shelter_name || pet.shelter_name || 'Rescue Shelter';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Build notes summary
      const prepNotes = [];
      if (attendees.bringingPet) prepNotes.push('Bringing current pet for socialization check');
      if (attendees.bringingFamily) prepNotes.push('Attending with family/household members');
      if (attendees.firstTimeAdopter) prepNotes.push('First-time adopter (requested orientation)');

      const combinedNotes = [
        notes.trim(),
        prepNotes.length ? `[Attendance Notes: ${prepNotes.join(', ')}]` : ''
      ].filter(Boolean).join('\n');

      const payload = {
        pet_id: pet.id || pet._id,
        pet: pet.id || pet._id,
        visit_date: visitDate,
        time_slot: timeSlot,
        visit_time: timeSlot,
        visit_type: visitType,
        notes: combinedNotes,
        application_id: applicationId || undefined,
        adopter_id: adopterId || undefined,
      };

      const res = await adoptionsApi.bookVisit(payload);
      setSuccessData(res.visit || res);
      if (onSuccess) {
        onSuccess(res.visit || res);
      }
    } catch (err) {
      console.error('Failed to schedule visit:', err);
      setError(err.response?.data?.error || err.message || 'Could not schedule visit. Please verify details.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccessData(null);
    onClose();
  };

  return (
    <div className="mg-modal-backdrop" onClick={handleClose}>
      <div className="mg-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="mg-modal-header">
          <div className="mg-header-left">
            <img
              src={petPhoto}
              alt={pet.name || 'Pet'}
              className="mg-header-pet-avatar"
              onError={(e) => { e.target.src = FALLBACK_PET_IMG; }}
            />
            <div className="mg-header-titles">
              <h2 className="mg-modal-title">Schedule Meet &amp; Greet</h2>
              <div className="mg-modal-subtitle">
                Meeting {pet.name || 'Pet'} • {shelterName}
              </div>
            </div>
          </div>
          <button type="button" className="mg-btn-close" onClick={handleClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        {successData ? (
          <div className="mg-success-view">
            <div className="mg-success-icon-wrap">
              <CheckCircle2 size={38} />
            </div>
            <h3 className="mg-success-title">
              {isShelter ? 'Meet & Greet Scheduled!' : 'Visit Request Sent!'}
            </h3>
            <p className="mg-success-desc">
              {isShelter
                ? `You have officially scheduled a Meet & Greet with ${adopterName || 'the adopter'} for ${pet.name}.`
                : `Your appointment request to meet ${pet.name} has been sent to ${shelterName}. They will confirm your slot.`}
            </p>

            <div className="mg-summary-badge-box">
              <div className="mg-summary-row">
                <span className="mg-summary-lbl">Pet</span>
                <span className="mg-summary-val">{pet.name} ({pet.breed || pet.species})</span>
              </div>
              <div className="mg-summary-row">
                <span className="mg-summary-lbl">Scheduled Date</span>
                <span className="mg-summary-val">{visitDate}</span>
              </div>
              <div className="mg-summary-row">
                <span className="mg-summary-lbl">Time Slot</span>
                <span className="mg-summary-val">{timeSlot}</span>
              </div>
              <div className="mg-summary-row">
                <span className="mg-summary-lbl">Type</span>
                <span className="mg-summary-val" style={{ textTransform: 'capitalize' }}>
                  {visitType === 'virtual' ? '📹 Virtual Video Intro' : '🏢 In-Person at Shelter'}
                </span>
              </div>
              {applicationId && (
                <div className="mg-summary-row">
                  <span className="mg-summary-lbl">Application Status</span>
                  <span className="mg-summary-val" style={{ color: '#047857' }}>● Connected to Application</span>
                </div>
              )}
            </div>

            <button type="button" className="mg-btn-submit" style={{ margin: '0 auto' }} onClick={handleClose}>
              Done &amp; View Visits
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'contents' }}>
            <div className="mg-modal-body">
              {error && (
                <div style={{ background: '#FEE2E2', border: '1px solid #FCA5A5', padding: '0.75rem 1rem', borderRadius: 10, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#991B1B', fontSize: '0.84rem' }}>
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Shelter scheduling for applicant banner */}
              {isShelter && adopterName && (
                <div style={{ background: '#EAF4EE', border: '1px solid #6EE7B7', padding: '0.7rem 0.95rem', borderRadius: 10, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#064E3B', fontSize: '0.84rem', fontWeight: 600 }}>
                  <User size={16} color="#047857" />
                  <span>Scheduling Meet &amp; Greet with applicant: <strong>{adopterName}</strong></span>
                </div>
              )}

              {/* Visit Type Toggle */}
              <div className="mg-form-group">
                <label className="mg-label">Meeting Format</label>
                <div className="mg-type-toggle">
                  <button
                    type="button"
                    className={`mg-type-btn ${visitType === 'in_person' ? 'active' : ''}`}
                    onClick={() => setVisitType('in_person')}
                  >
                    <div className="mg-type-icon">
                      <Building size={18} />
                    </div>
                    <div className="mg-type-text">
                      <strong>In-Person Shelter Visit</strong>
                      <span>Playpen meet &amp; greet at shelter</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`mg-type-btn ${visitType === 'virtual' ? 'active' : ''}`}
                    onClick={() => setVisitType('virtual')}
                  >
                    <div className="mg-type-icon">
                      <Video size={18} />
                    </div>
                    <div className="mg-type-text">
                      <strong>Virtual Video Intro</strong>
                      <span>Live 15-min webcam session</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Date Selection */}
              <div className="mg-form-group">
                <label className="mg-label">
                  <Calendar size={14} color="#174C38" /> Select Date
                </label>
                <input
                  type="date"
                  className="mg-input"
                  min={new Date().toISOString().split('T')[0]}
                  value={visitDate}
                  onChange={(e) => setVisitDate(e.target.value)}
                  required
                />
                <div className="mg-date-chips">
                  <button type="button" className="mg-date-chip" onClick={() => setVisitDate(getTomorrow())}>
                    Tomorrow
                  </button>
                  <button type="button" className="mg-date-chip" onClick={() => setVisitDate(getDayOffset(2))}>
                    In 2 Days
                  </button>
                  <button type="button" className="mg-date-chip" onClick={() => setVisitDate(getDayOffset(4))}>
                    This Weekend
                  </button>
                </div>
              </div>

              {/* Time Slots */}
              <div className="mg-form-group">
                <label className="mg-label">
                  <Clock size={14} color="#174C38" /> Select Time Slot
                </label>
                <div className="mg-slots-grid">
                  {TIME_SLOTS.map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`mg-slot-card ${timeSlot === slot ? 'active' : ''}`}
                      onClick={() => setTimeSlot(slot)}
                    >
                      <span>{slot}</span>
                      {timeSlot === slot && <CheckCircle2 size={15} color="#174C38" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preparation / Attendees Checklist */}
              {!isShelter && (
                <div className="mg-prep-box">
                  <div className="mg-prep-title">
                    <Info size={14} /> Pre-Visit Considerations
                  </div>
                  <label className="mg-check-item">
                    <input
                      type="checkbox"
                      checked={attendees.bringingFamily}
                      onChange={(e) => setAttendees({ ...attendees, bringingFamily: e.target.checked })}
                    />
                    <span>Bringing partner, children, or family members to meet {pet.name}</span>
                  </label>
                  <label className="mg-check-item">
                    <input
                      type="checkbox"
                      checked={attendees.bringingPet}
                      onChange={(e) => setAttendees({ ...attendees, bringingPet: e.target.checked })}
                    />
                    <span>Bringing our current dog for a monitored socialization check</span>
                  </label>
                  <label className="mg-check-item">
                    <input
                      type="checkbox"
                      checked={attendees.firstTimeAdopter}
                      onChange={(e) => setAttendees({ ...attendees, firstTimeAdopter: e.target.checked })}
                    />
                    <span>First-time pet parent (request extra advice on leash &amp; feeding)</span>
                  </label>
                </div>
              )}

              {/* Notes */}
              <div className="mg-form-group">
                <label className="mg-label">
                  {isShelter ? 'Instructions for Adopter (Optional)' : 'Special Requests or Notes for Shelter'}
                </label>
                <textarea
                  className="mg-input"
                  rows={2}
                  placeholder={
                    isShelter
                      ? 'e.g. Please bring a valid photo ID and proof of residence to Reception Room 2.'
                      : 'e.g. Excited to see how Buddy behaves around kids; any favorite toys we should know of?'
                  }
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mg-modal-footer">
              <button type="button" className="mg-btn-cancel" onClick={handleClose}>
                Cancel
              </button>
              <button type="submit" className="mg-btn-submit" disabled={submitting}>
                <Sparkles size={16} />
                <span>{submitting ? 'Scheduling…' : isShelter ? 'Confirm & Schedule Visit' : 'Submit Visit Request'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ScheduleMeetAndGreetModal;
