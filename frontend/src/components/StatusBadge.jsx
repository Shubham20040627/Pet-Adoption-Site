import React from 'react';
import { CheckCircle2, Clock, Check, XCircle, HeartHandshake, FileText, Ban } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toLowerCase();

  switch (normalized) {
    case 'available':
      return (
        <span className="badge badge-available">
          <CheckCircle2 size={13} /> Available
        </span>
      );
    case 'pending':
      return (
        <span className="badge badge-pending">
          <Clock size={13} /> Adoption Pending
        </span>
      );
    case 'adopted':
    case 'completed':
      return (
        <span className="badge badge-adopted">
          <HeartHandshake size={13} /> {normalized === 'completed' ? 'Completed' : 'Adopted'}
        </span>
      );
    case 'submitted':
      return (
        <span className="badge badge-review" style={{ backgroundColor: '#E0F2FE', color: '#0369A1' }}>
          <FileText size={13} /> Submitted
        </span>
      );
    case 'under_review':
      return (
        <span className="badge badge-pending">
          <Clock size={13} /> Under Review
        </span>
      );
    case 'approved':
      return (
        <span className="badge badge-approved">
          <Check size={13} /> Approved
        </span>
      );
    case 'rejected':
      return (
        <span className="badge badge-rejected">
          <XCircle size={13} /> Rejected
        </span>
      );
    case 'withdrawn':
      return (
        <span className="badge badge-withdrawn">
          <Ban size={13} /> Withdrawn
        </span>
      );
    case 'confirmed':
      return (
        <span className="badge badge-approved" style={{ backgroundColor: '#DCFCE7', color: '#15803D' }}>
          <CheckCircle2 size={13} /> Confirmed Visit
        </span>
      );
    case 'cancelled':
      return (
        <span className="badge badge-rejected" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C' }}>
          <XCircle size={13} /> Cancelled
        </span>
      );
    default:
      return (
        <span className="badge badge-available">
          {status}
        </span>
      );
  }
};

export default StatusBadge;
