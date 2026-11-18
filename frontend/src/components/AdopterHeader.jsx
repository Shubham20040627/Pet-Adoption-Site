import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import '../styles/adopter-portal.css';

/**
 * AdopterHeader is now superseded by AdopterNavbar at the top of the viewport.
 * If a backLink is passed (e.g. on PetDetail or CostCalculator), it renders
 * a clean back navigation link, otherwise renders null to avoid duplicate headers.
 */
const AdopterHeader = ({ 
  backLink,
  backText = 'Back to Pets',
}) => {
  if (backLink) {
    return (
      <div className="ap-back-nav-bar" style={{ maxWidth: '1240px', margin: '1.25rem auto 0', padding: '0 1.5rem' }}>
        <Link 
          to={backLink} 
          className="ap-btn-secondary" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.4rem', 
            padding: '0.42rem 0.95rem', 
            fontSize: '0.84rem',
            textDecoration: 'none',
            borderRadius: '9999px',
            border: '1px solid #E5E0D8',
            background: '#FFFFFF',
            color: '#174C38',
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={16} /> {backText}
        </Link>
      </div>
    );
  }

  return null;
};

export default AdopterHeader;
