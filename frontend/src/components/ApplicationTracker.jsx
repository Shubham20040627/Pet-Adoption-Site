import React from 'react';
import { Check, Clock, FileText, XCircle, HeartHandshake, History, AlertCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';
import '../styles/tracker.css';

const ApplicationTracker = ({ application, onWithdraw = null, isAdopterView = true }) => {
  if (!application) return null;

  const currentStatus = (application.status || 'submitted').toLowerCase();
  const isRejected = currentStatus === 'rejected';
  const isWithdrawn = currentStatus === 'withdrawn';

  // Step definitions
  // 1: Submitted
  // 2: Under Review
  // 3: Decision (Approved / Rejected)
  // 4: Completed
  let activeStep = 1;
  let progressPct = '0%';

  if (currentStatus === 'submitted') {
    activeStep = 1;
    progressPct = '0%';
  } else if (currentStatus === 'under_review') {
    activeStep = 2;
    progressPct = '33.33%';
  } else if (currentStatus === 'meet_greet' || currentStatus === 'approved') {
    activeStep = 3;
    progressPct = '66.66%';
  } else if (currentStatus === 'completed' || currentStatus === 'decision') {
    activeStep = 4;
    progressPct = '100%';
  }

  const steps = [
    {
      num: 1,
      title: 'Application Submitted',
      icon: <Check size={18} />,
    },
    {
      num: 2,
      title: 'Under Review',
      icon: <Clock size={18} />,
    },
    {
      num: 3,
      title: 'Meet & Greet',
      icon: <Check size={18} />,
    },
    {
      num: 4,
      title: isRejected ? 'Decision: Declined' : 'Adoption Decision',
      icon: isRejected ? <XCircle size={18} /> : <HeartHandshake size={18} />,
    },
  ];

  return (
    <div className="tracker-container">
      <div className="tracker-header">
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Application ID: #{application.id?.slice(-6) || '---'}
          </span>
          <h4 style={{ margin: '0.2rem 0', color: 'var(--color-primary)' }}>
            Application for {application.pet?.name || 'Pet'}
          </h4>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            Submitted on {application.created_at ? new Date(application.created_at).toLocaleDateString() : 'Recent'}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <StatusBadge status={application.status} />

          {isAdopterView && (currentStatus === 'submitted' || currentStatus === 'under_review') && onWithdraw && (
            <button
              onClick={() => onWithdraw(application.id)}
              className="adopter-withdraw-btn"
            >
              Withdraw
            </button>
          )}
        </div>
      </div>

      {/* Stepper Bar */}
      {!isWithdrawn ? (
        <div className="tracker-stepper">
          <div className="tracker-progress-line" style={{ width: progressPct }} />
          {steps.map((s) => {
            const isCompleted = activeStep > s.num || (activeStep === s.num && s.num === 4);
            const isActive = activeStep === s.num;
            const stepRejected = isRejected && s.num === 3;

            return (
              <div
                key={s.num}
                className={`tracker-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''} ${stepRejected ? 'rejected' : ''}`}
              >
                <div className="tracker-step-circle">
                  {isCompleted ? <Check size={18} /> : s.icon}
                </div>
                <div className="tracker-step-label">{s.title}</div>
                <div className="tracker-step-sub">{s.desc}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="alert alert-info" style={{ backgroundColor: '#F3F4F6', color: '#4B5563', borderColor: '#D1D5DB' }}>
          <AlertCircle size={18} />
          <div>This application was withdrawn by the applicant.</div>
        </div>
      )}

      {/* Rejection Note if Rejected */}
      {isRejected && application.rejection_reason && (
        <div className="alert alert-error" style={{ marginTop: '1rem' }}>
          <XCircle size={18} />
          <div>
            <strong>Shelter Feedback:</strong> {application.rejection_reason}
          </div>
        </div>
      )}

      {/* Status History Timeline */}
      {application.status_history && application.status_history.length > 0 && (
        <div className="tracker-history-box">
          <div className="tracker-history-title">
            <History size={16} /> Status Timeline
          </div>
          {application.status_history.map((hist, idx) => (
            <div key={idx} className="tracker-history-item">
              <div className="tracker-history-bullet" />
              <div>
                <strong>{hist.status?.replace('_', ' ').toUpperCase()}:</strong> {hist.note}
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                  ({hist.timestamp ? new Date(hist.timestamp).toLocaleString() : ''})
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationTracker;
