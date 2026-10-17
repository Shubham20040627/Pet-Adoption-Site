import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart, MapPin, Calendar, Clock, PawPrint,
  Phone, Mail, Building, Check, AlertCircle, Layers, Coins,
  ShieldCheck, Sparkles, ChevronLeft, ChevronRight, Info,
  FileText, CheckCircle2, User, MessageSquare
} from 'lucide-react';
import { petsApi } from '../api/petsApi';
import { useAuth } from '../context/AuthContext';
import AdopterHeader from '../components/AdopterHeader';
import ScheduleMeetAndGreetModal from '../components/ScheduleMeetAndGreetModal';
import DigitalCareProfileCard from '../components/DigitalCareProfileCard';
import DigitalCareProfileModal from '../components/DigitalCareProfileModal';
import AdoptionApplicationModal from '../components/AdoptionApplicationModal';
import PetCard from '../components/PetCard';
import '../styles/pet-detail.css';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80';

const DEFAULT_TRAITS_BY_SPECIES = {
  cat: ['Friendly', 'Indoor', 'Playful', 'Good with Toys'],
  dog: ['Friendly', 'Active', 'Loyal', 'House Trained'],
  rabbit: ['Gentle', 'Quiet', 'Social', 'Indoor'],
  bird: ['Vocal', 'Playful', 'Social', 'Curious'],
};

const getTraitStyle = (trait = '') => {
  const t = trait.toLowerCase();
  if (t.includes('friend') || t.includes('lov') || t.includes('cuddl')) {
    return { bg: '#FEE2E2', color: '#B91C1C', icon: '❤️' };
  }
  if (t.includes('indoor') || t.includes('calm') || t.includes('gentl') || t.includes('quiet')) {
    return { bg: '#E0F2FE', color: '#0369A1', icon: '🏠' };
  }
  if (t.includes('play') || t.includes('energ') || t.includes('activ')) {
    return { bg: '#FEF3C7', color: '#D97706', icon: '⭐' };
  }
  if (t.includes('toy') || t.includes('smart') || t.includes('train')) {
    return { bg: '#F3E8FF', color: '#7E22CE', icon: '✨' };
  }
  return { bg: '#DCFCE7', color: '#166534', icon: '🐾' };
};

const PetDetailPage = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdopter, isFavorite, toggleFavorite } = useAuth();

  const [pet, setPet] = useState(null);
  const [similarPets, setSimilarPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  // Modals state
  const [isCareModalOpen, setIsCareModalOpen] = useState(false);
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [isVisitOpen, setIsVisitOpen] = useState(false);

  useEffect(() => {
    const loadPet = async () => {
      setLoading(true);
      try {
        const data = await petsApi.getById(petId);
        setPet(data);
        const simRes = await petsApi.list({ species: data.species, limit: 6 });
        setSimilarPets((simRes.pets || []).filter(p => p.id !== data.id).slice(0, 4));
      } catch (err) {
        setError(err.response?.data?.error || 'Pet details could not be loaded.');
      } finally {
        setLoading(false);
      }
    };
    loadPet();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSelectedPhoto(0);
  }, [petId]);

  if (loading) {
    return (
      <div className="pdp-container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 1.5rem' }} />
        <p style={{ color: '#4B5563', fontWeight: 600 }}>Loading pet details...</p>
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="pdp-container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <AlertCircle size={48} color="#EF4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#111827' }}>Pet Not Found</h2>
        <p style={{ color: '#4B5563', marginBottom: '1.5rem' }}>{error || 'This pet profile could not be found or has been adopted.'}</p>
        <Link to="/pets" className="pdp-apply-cta-btn" style={{ display: 'inline-flex', width: 'auto', padding: '0.75rem 1.5rem' }}>
          Browse All Available Pets
        </Link>
      </div>
    );
  }

  const isFav = isFavorite ? isFavorite(pet.id) : false;

  const handleFav = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!isAuthenticated) {
      navigate(`/login?redirect=/pets/${pet.id}`);
      return;
    }
    try {
      await toggleFavorite(pet.id);
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleCompareClick = () => {
    try {
      const stored = localStorage.getItem('pawconnect_compare_ids');
      let ids = stored ? JSON.parse(stored) : [];
      if (!ids.includes(pet.id)) {
        if (ids.length >= 3) ids.shift();
        ids.push(pet.id);
        localStorage.setItem('pawconnect_compare_ids', JSON.stringify(ids));
      }
      navigate(`/compare-pets?pets=${ids.join(',')}`);
    } catch {
      navigate(`/compare-pets?pets=${pet.id}`);
    }
  };

  const photos = (pet.photos && pet.photos.length > 0)
    ? pet.photos
    : [pet.image_url || FALLBACK_IMG];

  const handlePrevPhoto = (e) => {
    e.stopPropagation();
    setSelectedPhoto((prev) => (prev - 1 + photos.length) % photos.length);
  };

  const handleNextPhoto = (e) => {
    e.stopPropagation();
    setSelectedPhoto((prev) => (prev + 1) % photos.length);
  };

  // Trait badges
  const rawTraits = (pet.personality_traits && pet.personality_traits.length > 0)
    ? pet.personality_traits
    : (DEFAULT_TRAITS_BY_SPECIES[pet.species?.toLowerCase()] || ['Friendly', 'Social', 'Playful']);

  const displayTraits = rawTraits.slice(0, 4);

  return (
    <>
      <AdopterHeader backLink="/pets" backText="Back to Pets" hideSearch={true} />

      <div className="pdp-container">
        {/* ================================================================
            1. TOP SHOWCASE CARD: GALLERY | INFO SUMMARY | ACTIONS
            ================================================================ */}
        <div className="pdp-showcase-card">
          
          {/* LEFT: MEDIA CAROUSEL */}
          <div className="pdp-gallery-col">
            <div className="pdp-carousel-wrapper">
              <span className="pdp-status-badge">
                <span className="pdp-status-dot" />
                {pet.status ? (pet.status.charAt(0).toUpperCase() + pet.status.slice(1)) : 'Available'}
              </span>

              <img
                src={photos[selectedPhoto] || FALLBACK_IMG}
                alt={pet.name}
                className="pdp-carousel-img"
                onError={(e) => { e.target.src = FALLBACK_IMG; }}
              />

              {photos.length > 1 && (
                <>
                  <button
                    type="button"
                    className="pdp-arrow-btn pdp-arrow-prev"
                    onClick={handlePrevPhoto}
                    aria-label="Previous Photo"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    className="pdp-arrow-btn pdp-arrow-next"
                    onClick={handleNextPhoto}
                    aria-label="Next Photo"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
          </div>

          {/* MIDDLE: PET SUMMARY INFORMATION */}
          <div className="pdp-info-col">
            {/* Name + Heart + Verified Passport Badge */}
            <div className="pdp-name-row">
              <h1 className="pdp-pet-name">{pet.name}</h1>
              <button
                type="button"
                className={`pdp-heart-toggle ${isFav ? 'favorited' : ''}`}
                onClick={handleFav}
                aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
                title={isFav ? 'Remove from favorites' : 'Save to favorites'}
              >
                <Heart
                  size={24}
                  fill={isFav ? '#EF4444' : 'none'}
                  color={isFav ? '#EF4444' : '#9CA3AF'}
                  strokeWidth={2}
                />
              </button>

              <button
                type="button"
                className="pdp-passport-pill-btn"
                onClick={() => setIsCareModalOpen(true)}
                title="Click to view digital clinical health passport"
              >
                <ShieldCheck size={16} /> Verified Care Passport
              </button>
            </div>

            {/* Breed / Species Subtitle */}
            <div className="pdp-pet-breed">
              {pet.breed || (pet.species ? (pet.species.charAt(0).toUpperCase() + pet.species.slice(1)) : 'Rescue Companion')}
            </div>

            {/* Meta Row (Age, Gender, Location) */}
            <div className="pdp-meta-stats-row">
              <div className="pdp-meta-stat">
                <div className="pdp-stat-icon-wrap">🎂</div>
                <div className="pdp-stat-text-box">
                  <span className="pdp-stat-value">{pet.age ? `${pet.age} years` : '1.5 years'}</span>
                  <span className="pdp-stat-label">Age</span>
                </div>
              </div>

              <div className="pdp-meta-stat">
                <div className="pdp-stat-icon-wrap" style={{ color: '#2563EB' }}>⚥</div>
                <div className="pdp-stat-text-box">
                  <span className="pdp-stat-value">{pet.gender || 'Male'}</span>
                  <span className="pdp-stat-label">Gender</span>
                </div>
              </div>

              <div className="pdp-meta-stat">
                <div className="pdp-stat-icon-wrap" style={{ color: '#059669' }}>
                  <MapPin size={17} />
                </div>
                <div className="pdp-stat-text-box">
                  <span className="pdp-stat-value">{pet.shelter?.city || pet.location || 'Chandigarh'}</span>
                  <span className="pdp-stat-label">Location</span>
                </div>
              </div>
            </div>

            {/* Short Bio Teaser */}
            <p className="pdp-short-bio">
              {pet.short_description || pet.description?.split('\n')[0] || (
                `${pet.name} is a calm, affectionate companion who loves sunbathing on window sills and chasing feather toys in the evening. He is curious, gentle and enjoys human company, making him a wonderful addition to a loving home.`
              )}
            </p>

            {/* Trait Badges */}
            <div className="pdp-traits-row">
              {displayTraits.map((trait, idx) => {
                const style = getTraitStyle(trait);
                return (
                  <span
                    key={idx}
                    className="pdp-trait-badge"
                    style={{ backgroundColor: style.bg, color: style.color }}
                  >
                    <span>{style.icon}</span> {trait}
                  </span>
                );
              })}
            </div>
          </div>

          {/* RIGHT: ACTIONS & QUICK TOOLS */}
          <div className="pdp-actions-col">
            {/* Primary Action Button */}
            {isAdopter ? (
              <button
                type="button"
                className="pdp-apply-cta-btn"
                onClick={() => setIsApplyOpen(true)}
              >
                <span className="pdp-apply-btn-left">
                  <PawPrint size={18} /> Apply for Adoption
                </span>
                <ChevronRight size={18} />
              </button>
            ) : isAuthenticated ? (
              <button
                type="button"
                className="pdp-apply-cta-btn"
                onClick={() => setIsApplyOpen(true)}
              >
                <span className="pdp-apply-btn-left">
                  <PawPrint size={18} /> Apply for Adoption
                </span>
                <ChevronRight size={18} />
              </button>
            ) : (
              <Link
                to={`/login?redirect=/pets/${pet.id}`}
                className="pdp-apply-cta-btn"
              >
                <span className="pdp-apply-btn-left">
                  <PawPrint size={18} /> Apply for Adoption
                </span>
                <ChevronRight size={18} />
              </Link>
            )}

            {/* Favorites Button */}
            <button
              type="button"
              className={`pdp-fav-cta-btn ${isFav ? 'favorited' : ''}`}
              onClick={handleFav}
            >
              <Heart
                size={18}
                fill={isFav ? '#DC2626' : 'none'}
                color={isFav ? '#DC2626' : 'currentColor'}
              />
              {isFav ? 'Saved to Favorites' : 'Add to Favorites'}
            </button>

            {/* Direct Contextual Live Chat with Shelter */}
            <Link
              to={`/messages?pet_id=${pet.id || pet._id}`}
              className="pdp-message-shelter-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.55rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                border: '1.5px solid #14382A',
                background: '#FFFFFF',
                color: '#14382A',
                fontWeight: 700,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.15s ease'
              }}
              title="Chat directly with shelter regarding adoption questions"
            >
              <MessageSquare size={17} color="#14382A" />
              <span>Message Shelter About {pet.name}</span>
            </Link>

            {/* Quick Tools Box */}
            <div className="pdp-quick-tools-card">
              <div className="pdp-quick-tools-header">
                <Sparkles size={16} /> Quick Tools
              </div>

              <div className="pdp-tools-grid">
                <button
                  type="button"
                  className="pdp-tool-box"
                  onClick={() => setIsVisitOpen(true)}
                >
                  <div className="pdp-tool-icon-wrap">
                    <Calendar size={18} />
                  </div>
                  <span className="pdp-tool-title">
                    Schedule<br />Meet &amp; Greet
                  </span>
                </button>

                <button
                  type="button"
                  className="pdp-tool-box"
                  onClick={handleCompareClick}
                >
                  <div className="pdp-tool-icon-wrap">
                    <Layers size={18} />
                  </div>
                  <span className="pdp-tool-title">
                    Compare<br />with Other Pets
                  </span>
                </button>

                <Link
                  to={`/cost-calculator?pet=${pet.id}`}
                  className="pdp-tool-box"
                >
                  <div className="pdp-tool-icon-wrap">
                    <Coins size={18} />
                  </div>
                  <span className="pdp-tool-title">
                    Estimate<br />Adoption &amp; Care Budget
                  </span>
                </Link>
              </div>
            </div>
          </div>

        </div>

        {/* ================================================================
            2. BOTTOM CARD: TABS (ABOUT | DIGITAL CARE PROFILE | SHELTER INFO)
            ================================================================ */}
        <div className="pdp-tabs-card">
          {/* Tab Navigation */}
          <div className="pdp-tabs-nav">
            <button
              type="button"
              className={`pdp-tab-btn ${activeTab === 'about' ? 'active' : ''}`}
              onClick={() => setActiveTab('about')}
            >
              <FileText size={18} /> About
            </button>
            <button
              type="button"
              className={`pdp-tab-btn ${activeTab === 'health' ? 'active' : ''}`}
              onClick={() => setActiveTab('health')}
            >
              <Calendar size={18} /> Digital Care Profile
            </button>
            <button
              type="button"
              className={`pdp-tab-btn ${activeTab === 'shelter' ? 'active' : ''}`}
              onClick={() => setActiveTab('shelter')}
            >
              <Building size={18} /> Shelter Info
            </button>
          </div>

          {/* TAB 1: ABOUT CONTENT */}
          {activeTab === 'about' && (
            <div className="pdp-about-grid">
              <div>
                <h2 className="pdp-about-title">About {pet.name}</h2>
                <p className="pdp-about-text">
                  {pet.description || (
                    `${pet.name} is a sweet and affectionate companion who enjoys spending time in sunny spots and watching the world go by from the window. They love gentle play sessions, especially with feather toys, and are curious but calm.`
                  )}
                </p>
                <p className="pdp-about-text">
                  {pet.ideal_home || (
                    `${pet.name} would do best in a loving home where they get daily attention, a safe indoor environment, and plenty of cozy places to rest.`
                  )}
                </p>
              </div>

              {/* Quick Facts Card on the Right */}
              <div className="pdp-quick-facts-card">
                <div className="pdp-quick-facts-header">
                  <Info size={18} color="#166534" /> Quick Facts
                </div>

                <div className="pdp-facts-list">
                  <div className="pdp-fact-row">
                    <div className="pdp-fact-left">
                      <Calendar size={15} /> Age
                    </div>
                    <div className="pdp-fact-right">
                      {pet.age ? `${pet.age} years` : '1.5 years'}
                    </div>
                  </div>

                  <div className="pdp-fact-row">
                    <div className="pdp-fact-left">
                      <span>⚥</span> Gender
                    </div>
                    <div className="pdp-fact-right">
                      {pet.gender || 'Male'}
                    </div>
                  </div>

                  <div className="pdp-fact-row">
                    <div className="pdp-fact-left">
                      <PawPrint size={15} /> Breed
                    </div>
                    <div className="pdp-fact-right">
                      {pet.breed || pet.species || 'Domestic Shorthair'}
                    </div>
                  </div>

                  <div className="pdp-fact-row">
                    <div className="pdp-fact-left">
                      <MapPin size={15} /> Location
                    </div>
                    <div className="pdp-fact-right">
                      {pet.shelter?.city || pet.location || 'Chandigarh'}
                    </div>
                  </div>

                  <div className="pdp-fact-row">
                    <div className="pdp-fact-left">
                      <ShieldCheck size={15} /> Care Passport
                    </div>
                    <div className="pdp-fact-right">
                      <span className="pdp-pill-verified">
                        <Check size={13} strokeWidth={3} /> Verified
                      </span>
                    </div>
                  </div>

                  <div className="pdp-fact-row">
                    <div className="pdp-fact-left">
                      <PawPrint size={15} /> Status
                    </div>
                    <div className="pdp-fact-right">
                      <span className="pdp-pill-available">
                        <span className="pdp-status-dot" style={{ width: 6, height: 6 }} /> Available
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DIGITAL CARE PROFILE */}
          {activeTab === 'health' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsCareModalOpen(true)}
                  style={{
                    border: '1px solid #A7F3D0',
                    background: '#ECFDF5',
                    color: '#065F46',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    padding: '0.45rem 0.95rem',
                    borderRadius: 8,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ShieldCheck size={16} /> ⛶ Open in Interactive Dialog Box
                </button>
              </div>
              <DigitalCareProfileCard pet={pet} />
            </div>
          )}

          {/* TAB 3: SHELTER INFO */}
          {activeTab === 'shelter' && (
            <div style={{ fontSize: '0.92rem', color: '#4B5563', lineHeight: '1.75' }}>
              <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#111827', marginBottom: '0.5rem' }}>
                {pet.shelter?.shelter_name || pet.shelter?.name || 'Green Haven Animal Sanctuary'}
              </div>
              <p style={{ marginBottom: '1.25rem', maxWidth: '750px' }}>
                {pet.shelter?.bio || 'Dedicated non-profit animal rescue and adoption sanctuary committed to rescuing, rehabilitating, and placing pets into loving forever homes.'}
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', background: '#F8FAF8', padding: '1.25rem', borderRadius: 12, border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <MapPin size={18} color="#059669" />
                  <span>{pet.shelter?.address || '104 Meadowlane Way, Chandigarh'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Phone size={18} color="#059669" />
                  <span>{pet.shelter?.phone || '+91 98765 43210'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <Mail size={18} color="#059669" />
                  <span>{pet.shelter?.contact_email || pet.shelter?.email || 'shelter@pawconnect.org'}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ================================================================
            3. SIMILAR PETS SECTION
            ================================================================ */}
        {similarPets.length > 0 && (
          <div className="pdp-similar-section">
            <h2 className="pdp-similar-header">Similar Companions Looking for a Home</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
              {similarPets.map((simPet) => (
                <PetCard key={simPet.id} pet={simPet} />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================================================================
          INTERACTIVE MODALS
          ================================================================ */}
      {/* 1. Adoption Application Modal */}
      <AdoptionApplicationModal
        pet={pet}
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
        onSuccess={() => {
          setIsApplyOpen(false);
          navigate('/my-applications');
        }}
      />

      {/* 2. Meet & Greet Modal */}
      <ScheduleMeetAndGreetModal
        isOpen={isVisitOpen}
        onClose={() => setIsVisitOpen(false)}
        pet={pet}
        onSuccess={() => {
          setIsVisitOpen(false);
          navigate('/adopter-dashboard?tab=visits');
        }}
      />

      {/* 3. Clinical Digital Care Profile Modal */}
      <DigitalCareProfileModal
        isOpen={isCareModalOpen}
        onClose={() => setIsCareModalOpen(false)}
        pet={pet}
        isAdopter={isAdopter}
      />
    </>
  );
};

export default PetDetailPage;
