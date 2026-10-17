import React, { useState } from 'react';
import { Search, ArrowLeft } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import '../styles/adopter-portal.css';

const AdopterHeader = ({ 
  searchValue = '', 
  onSearchChange, 
  searchPlaceholder = 'Search pets, breeds...',
  backLink,
  backText = 'Back to Pets',
  hideSearch = false,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [localSearch, setLocalSearch] = useState(searchValue);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (onSearchChange) {
      onSearchChange(localSearch);
    } else {
      navigate(`/pets?search=${encodeURIComponent(localSearch)}`);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setLocalSearch(val);
    if (onSearchChange) {
      onSearchChange(val);
    }
  };

  const userName = user?.name || 'Alex Morgan';
  const initial = userName ? userName.charAt(0).toUpperCase() : 'A';

  return (
    <header className="ap-header">
      <div className="ap-header-left">
        {backLink ? (
          <Link to={backLink} className="ap-btn-secondary" style={{ padding: '0.42rem 0.95rem', fontSize: '0.84rem' }}>
            <ArrowLeft size={16} /> {backText}
          </Link>
        ) : !hideSearch ? (
          <form onSubmit={handleSearchSubmit} className="ap-search-wrap">
            <Search size={16} color="#7A9187" style={{ flexShrink: 0 }} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={onSearchChange ? searchValue : localSearch}
              onChange={handleInputChange}
              aria-label="Search pets by name, breed"
            />
          </form>
        ) : <div />}
      </div>

      <div className="ap-header-right">
        {/* Notifications with real badge */}
        <NotificationDropdown placement="bottom" />

        {/* User Profile Pill matching reference image */}
        <Link 
          to="/adopter-dashboard?tab=profile" 
          className="ap-user-pill"
          title="View profile settings"
        >
          <div className="ap-user-avatar">
            {initial}
          </div>
          <span className="ap-user-name">{userName}</span>
        </Link>
      </div>
    </header>
  );
};

export default AdopterHeader;
