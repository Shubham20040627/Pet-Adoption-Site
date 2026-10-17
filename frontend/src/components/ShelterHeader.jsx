import React, { useState } from 'react';
import { Search, ArrowLeft, Bell, ShieldCheck, Clock } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import '../styles/shelter-dashboard.css';

const ShelterHeader = ({ 
  searchValue = '', 
  onSearchChange, 
  searchPlaceholder = 'Search anything...',
  backLink,
  backText = 'Back to Listings',
  hideSearch = false,
  onAddPet,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearch);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const shelterName = user?.shelter?.shelter_name || user?.name || 'Shelter Partner';
  const logoUrl = user?.shelter?.logo_url || user?.logo_url || '';
  const regNo = user?.shelter?.registration_number || user?.registration_number || 'AWBI-2026-REG';
  const initial = shelterName ? shelterName.charAt(0).toUpperCase() : 'S';
  const isApproved = user?.status === 'approved' || user?.shelter?.status === 'approved' || user?.verified || user?.shelter?.verified;

  return (
    <header className="shelter-top-bar">
      <div className="shelter-top-bar-left">
        {backLink ? (
          <Link to={backLink} className="shelter-btn-secondary" style={{ padding: '0.45rem 1rem', fontSize: '0.84rem' }}>
            <ArrowLeft size={16} /> {backText}
          </Link>
        ) : !hideSearch ? (
          <form onSubmit={handleSearchSubmit} className="shelter-search-wrap">
            <Search size={16} color="#7A9187" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={onSearchChange ? searchValue : localSearch}
              onChange={handleInputChange}
              aria-label="Search shelter portal"
            />
          </form>
        ) : <div />}
      </div>

      <div className="shelter-top-bar-right">
        {/* Accreditation Status Badge */}
        <div 
          className={`shelter-header-badge ${isApproved ? 'badge-approved' : 'badge-pending'}`}
          title={isApproved ? "Approved Shelter Partner - Full access active" : "Account pending admin approval - Dashboard unlocked"}
        >
          {isApproved ? (
            <>
              <ShieldCheck size={14} color="#059669" />
              <span>Approved Partner</span>
            </>
          ) : (
            <>
              <Clock size={14} color="#D97706" />
              <span>Pending Approval</span>
            </>
          )}
        </div>

        {/* Notifications Dropdown */}
        <NotificationDropdown placement="bottom" />

        {/* Shelter Staff Profile Pill matching reference image */}
        <Link 
          to="/shelter-dashboard?tab=profile" 
          className="shelter-user-pill-top"
          title={`View shelter profile (License: ${regNo})`}
        >
          <div className="shelter-user-avatar-top" style={{ overflow: 'hidden' }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              initial
            )}
          </div>
          <div className="shelter-user-meta-top">
            <span className="shelter-user-name-top">{shelterName.split(' ')[0]} {shelterName.split(' ')[1] || 'Rescue'}</span>
            <span className="shelter-user-role-top" style={{ color: '#047857', fontWeight: 600 }}>
              {regNo}
            </span>
          </div>
        </Link>
      </div>
    </header>
  );
};

export default ShelterHeader;
