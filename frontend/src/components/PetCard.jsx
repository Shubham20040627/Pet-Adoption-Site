import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import '../styles/pet-card.css';

const PetCard = ({ pet, matchBadge = null }) => {
  const { isAuthenticated, isFavorite, toggleFavorite } = useAuth();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);

  const favorited = isFavorite(pet.id);

  const handleFavoriteClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      navigate('/login?redirect=favorites');
      return;
    }
    await toggleFavorite(pet.id);
  };

  const defaultImg = pet.species?.toLowerCase() === 'cat'
    ? 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&auto=format&fit=crop'
    : 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&auto=format&fit=crop';

  return (
    <div className="pet-card">
      <div className="pet-card-image-box">
        <img
          src={imgError || !pet.image_url ? defaultImg : pet.image_url}
          alt={pet.name}
          className="pet-card-img"
          onError={() => setImgError(true)}
          loading="lazy"
        />

        <div className="pet-card-status-pill">
          <StatusBadge status={pet.status} />
        </div>

        <button
          className={`pet-card-fav-btn ${favorited ? 'is-favorite' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
          title={favorited ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart size={18} fill={favorited ? '#EF4444' : 'none'} />
        </button>
      </div>

      <div className="pet-card-body">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div className="pet-card-species">{pet.species}</div>
          {matchBadge && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                color: 'var(--color-primary)',
                backgroundColor: 'var(--color-accent-light)',
                padding: '0.15rem 0.45rem',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <Sparkles size={12} color="var(--color-accent)" /> {matchBadge}
            </span>
          )}
        </div>

        <h3 className="pet-card-title">{pet.name}</h3>
        <p className="pet-card-breed">{pet.breed}</p>

        <div className="pet-card-tags">
          <span className="pet-tag">
            {pet.age} {pet.age_unit || 'yrs'}
          </span>
          <span className="pet-tag">{pet.gender}</span>
          <span className="pet-tag">{pet.size}</span>
          {pet.vaccinated && <span className="pet-tag" style={{ color: 'var(--status-available-text)' }}>✓ Vaccinated</span>}
        </div>

        <div className="pet-card-location">
          <MapPin size={14} />
          <span>{pet.location || 'Local Shelter'}</span>
        </div>

        <div className="pet-card-footer">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            {pet.activity_level ? `${pet.activity_level} energy` : 'Friendly'}
          </span>
          <Link to={`/pets/${pet.id}`} className="btn btn-outline btn-sm">
            View Details <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PetCard;
