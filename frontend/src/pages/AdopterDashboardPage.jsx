import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { 
  Heart, FileText, Sparkles, CheckSquare, Clock, ArrowRight, 
  Calendar, MapPin, PawPrint, X, CheckCircle2, User, Bell, Award,
  Search, ChevronRight, ChevronLeft, Info, Save, Phone, Mail, Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adoptionsApi } from '../api/adoptionsApi';
import { commonApi } from '../api/commonApi';
import { petsApi } from '../api/petsApi';
import AdopterHeader from '../components/AdopterHeader';
import AdoptionCertificateModal from '../components/AdoptionCertificateModal';
import VerifiedAdopterBadgeCard from '../components/VerifiedAdopterBadgeCard';
import '../styles/adopter-portal.css';

const FALLBACK_PET_IMG = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80';
const FALLBACK_PET_IMG2 = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

// High-resolution rescue pet images for the animated dashboard hero background slider
const DASHBOARD_HERO_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1400&auto=format&fit=crop&q=85',
    alt: 'Adorable rescue guinea pigs on green grass',
  },
  {
    image: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1400&auto=format&fit=crop&q=85',
    alt: 'Happy golden retriever smiling companion',
  },
  {
    image: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=1400&auto=format&fit=crop&q=85',
    alt: 'Cute tabby rescue kitten',
  },
  {
    image: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=1400&auto=format&fit=crop&q=85',
    alt: 'Playful companion rescue pup outdoors',
  },
  {
    image: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=1400&auto=format&fit=crop&q=85',
    alt: 'Gentle rescue bunny rabbit',
  },
];

const AdopterDashboardPage = () => {
  const { user, favoriteIds, toggleFavorite, refreshFavorites } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [visits, setVisits] = useState([]);
  const [visitFilter, setVisitFilter] = useState('upcoming');
  const [selectedVisit, setSelectedVisit] = useState(null);
  const [selectedCertAppId, setSelectedCertAppId] = useState(null);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    city: user?.city || '',
  });
  const [profileSaved, setProfileSaved] = useState(false);

  // Background pet image slider state for the Dashboard Hero Banner
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);

  // Auto-advance dashboard hero slider at a regular, noticeable interval (every 2.2 seconds)
  useEffect(() => {
    if (heroPaused) return;
    const interval = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % DASHBOARD_HERO_SLIDES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, [heroPaused]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        city: user.city || '',
      });
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [appsRes, favsRes, petsRes, visitsRes] = await Promise.all([
        adoptionsApi.getMyApplications().catch(() => ({ applications: [] })),
        commonApi.getFavorites().catch(() => ({ pets: [] })),
        petsApi.list({ limit: 6 }).catch(() => ({ pets: [] })),
        adoptionsApi.getMyVisits().catch(() => ({ visits: [] })),
      ]);
      setApplications(appsRes.applications || []);
      setFavorites(favsRes.pets || []);
      setRecommended((petsRes.pets || []).slice(0, 3));
      setVisits(visitsRes.visits || []);
    } catch (err) {
      console.error('Failed to load adopter data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCancelVisit = async (visitId) => {
    if (!window.confirm('Cancel this meet & greet visit?')) return;
    try {
      await adoptionsApi.cancelVisit(visitId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel visit.');
    }
  };

  const handleFavoriteClick = async (e, petId) => {
    e.preventDefault(); e.stopPropagation();
    try {
      await toggleFavorite(petId);
      await refreshFavorites();
      const favRes = await commonApi.getFavorites();
      setFavorites(favRes.pets || []);
    } catch (err) { console.error('Toggle favorite failed:', err); }
  };

  const activeAppsCount = applications.filter(a => ['submitted','under_review'].includes(a.status?.toLowerCase())).length;
  const pendingReviewsCount = applications.filter(a => a.status?.toLowerCase() === 'under_review').length;
  const upcomingVisitsCount = visits.filter(v => !['cancelled','completed'].includes(v.status?.toLowerCase())).length;
  const totalFavoritesCount = favorites.length;
  const firstName = user?.name ? user.name.split(' ')[0] : 'Adopter';

  const filteredVisits = visits.filter(v => {
    if (visitFilter === 'upcoming') return !['cancelled','completed'].includes(v.status?.toLowerCase());
    if (visitFilter === 'past') return v.status?.toLowerCase() === 'completed';
    if (visitFilter === 'cancelled') return v.status?.toLowerCase() === 'cancelled';
    return true;
  });

  // Pet card render helper
  const PetCard = ({ pet, isFav }) => (
    <div className="ap-pet-card">
      <div className="ap-pet-img-wrap">
        <img
          src={pet.photo_url || pet.image_url || FALLBACK_PET_IMG2}
          alt={pet.name}
          className="ap-pet-img"
          onError={e => { e.target.src = FALLBACK_PET_IMG2; }}
        />
        <span className="ap-pet-avail-badge">Available</span>
        <button
          type="button"
          className={`ap-pet-fav-btn${isFav ? ' active' : ''}`}
          onClick={(e) => handleFavoriteClick(e, pet.id)}
          title="Save to favorites"
        >
          <Heart size={15} fill={isFav ? '#DC2626' : 'none'} color={isFav ? '#DC2626' : '#94A3B8'} />
        </button>
      </div>
      <div className="ap-pet-body">
        <div className="ap-pet-name">{pet.name}</div>
        <div className="ap-pet-breed">{pet.breed || pet.species}</div>
        <div className="ap-pet-meta">{pet.age ? `${pet.age} years` : 'Adult'} • {pet.gender || 'Unknown'}</div>
        <div className="ap-pet-location"><MapPin size={12} /><span>{pet.shelter?.city || pet.city || pet.location || 'Portland, OR'}</span></div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', color: '#174C38', fontWeight: 600, marginTop: '0.2rem' }}>
          <Building size={12} color="#174C38" />
          <span>{pet.shelter_name || pet.shelter?.name || 'Hope & Paws Sanctuary'}</span>
        </div>
        <Link to={`/pets/${pet.id}`} className="ap-pet-view-btn" style={{ marginTop: '0.5rem' }}>View Details</Link>
      </div>
    </div>
  );

  return (
    <div className="ap-page">
      <AdopterHeader />
      <div className="ap-wrap">

        {/* ── OVERVIEW ──────────────────────────────────────── */}
        {currentTab === 'overview' && (
          <>

            {/* Modern Hero Banner with Animated Background Pet Image Slider */}
            <div className="ap-hero-banner">
              {/* Background Sliding Images Carousel */}
              <div className="ap-hero-slider-wrap">
                <div
                  className="ap-hero-slider-track"
                  style={{
                    width: `${DASHBOARD_HERO_SLIDES.length * 100}%`,
                    transform: `translateX(-${heroSlide * (100 / DASHBOARD_HERO_SLIDES.length)}%)`,
                  }}
                >
                  {DASHBOARD_HERO_SLIDES.map((slide, idx) => (
                    <div
                      key={idx}
                      className="ap-hero-slider-slide"
                      style={{ width: `${100 / DASHBOARD_HERO_SLIDES.length}%` }}
                    >
                      <img
                        src={slide.image}
                        alt={slide.alt}
                        className="ap-hero-banner-img"
                        onError={(e) => {
                          e.target.src = FALLBACK_PET_IMG;
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Smooth Gradient Overlay ensuring complete readability of left-side text */}
                <div className="ap-hero-banner-overlay" />

                {/* Handwritten Script Badge matching Reference Screenshot */}
                <div className="ap-hero-handwritten-badge">
                  <div className="ap-badge-script">Good Things Happen with Adoption</div>
                  <div className="ap-badge-stars">🐾 🐾</div>
                </div>

                {/* Slider Navigation Controls (Prev, Next & Indicator Dots) */}
                <div 
                  className="ap-hero-slider-controls"
                  onMouseEnter={() => setHeroPaused(true)}
                  onMouseLeave={() => setHeroPaused(false)}
                >
                  <button
                    type="button"
                    className="ap-hero-nav-btn prev"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHeroSlide((prev) => (prev - 1 + DASHBOARD_HERO_SLIDES.length) % DASHBOARD_HERO_SLIDES.length);
                    }}
                    aria-label="Previous pet slide"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <div className="ap-hero-slider-dots">
                    {DASHBOARD_HERO_SLIDES.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`ap-hero-dot ${idx === heroSlide ? 'active' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setHeroSlide(idx);
                        }}
                        aria-label={`Go to slide ${idx + 1}`}
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    className="ap-hero-nav-btn next"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHeroSlide((prev) => (prev + 1) % DASHBOARD_HERO_SLIDES.length);
                    }}
                    aria-label="Next pet slide"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
              </div>

              {/* Foreground Banner Content (Greetings, Tagline & Action Buttons) */}
              <div className="ap-hero-banner-content">
                <span className="ap-hero-welcome-tag">WELCOME BACK,</span>
                <h1 className="ap-hero-title-greeting">
                  {user?.name ? `${user.name}!` : 'Adopter!'} <span className="ap-wave">👋</span>
                </h1>
                <h2 className="ap-hero-question">Ready to find your new best friend?</h2>
                <p className="ap-hero-tagline">
                  Every pet deserves a loving home. Let's make a difference together.
                </p>

                <div className="ap-hero-btn-row">
                  <Link to="/pets" className="ap-hero-action-btn primary">
                    <Search size={16} /> Find Your Perfect Pet
                  </Link>
                  <Link to="/my-applications" className="ap-hero-action-btn secondary">
                    <FileText size={16} /> Track My Applications
                  </Link>
                </div>
              </div>
            </div>

            {/* 4 Metric Stat Cards matching Reference UI */}
            <div className="ap-metric-cards-grid">
              <Link to="/my-applications" className="ap-metric-card">
                <div className="ap-metric-icon-wrap" style={{ background: '#E8F5E9', color: '#1B5E20' }}>
                  <FileText size={22} />
                </div>
                <div className="ap-metric-info">
                  <div className="ap-metric-number">{activeAppsCount}</div>
                  <div className="ap-metric-title">Active Applications</div>
                  <div className="ap-metric-desc">Keep track of your progress</div>
                </div>
                <div className="ap-metric-arrow">
                  <ChevronRight size={18} />
                </div>
              </Link>

              <Link to="/my-applications" className="ap-metric-card">
                <div className="ap-metric-icon-wrap" style={{ background: '#FFF8E1', color: '#B76E00' }}>
                  <Clock size={22} />
                </div>
                <div className="ap-metric-info">
                  <div className="ap-metric-number">{pendingReviewsCount}</div>
                  <div className="ap-metric-title">Pending Review</div>
                  <div className="ap-metric-desc">Awaiting shelter response</div>
                </div>
                <div className="ap-metric-arrow">
                  <ChevronRight size={18} />
                </div>
              </Link>

              <Link to="/adopter-dashboard?tab=visits" className="ap-metric-card">
                <div className="ap-metric-icon-wrap" style={{ background: '#E0F2FE', color: '#0369A1' }}>
                  <Calendar size={22} />
                </div>
                <div className="ap-metric-info">
                  <div className="ap-metric-number">{upcomingVisitsCount}</div>
                  <div className="ap-metric-title">Upcoming Visits</div>
                  <div className="ap-metric-desc">Scheduled meet &amp; greets</div>
                </div>
                <div className="ap-metric-arrow">
                  <ChevronRight size={18} />
                </div>
              </Link>

              <Link to="/adopter-dashboard?tab=favorites" className="ap-metric-card">
                <div className="ap-metric-icon-wrap" style={{ background: '#FEE2E2', color: '#B91C1C' }}>
                  <Heart size={22} />
                </div>
                <div className="ap-metric-info">
                  <div className="ap-metric-number">{totalFavoritesCount}</div>
                  <div className="ap-metric-title">Favorite Pets</div>
                  <div className="ap-metric-desc">Pets you saved</div>
                </div>
                <div className="ap-metric-arrow">
                  <ChevronRight size={18} />
                </div>
              </Link>
            </div>

            {/* Official PawConnect Credential Card (Verified Ready Adopter) */}
            <div style={{ marginBottom: '1.75rem' }}>
              <VerifiedAdopterBadgeCard />
            </div>

            {/* Featured Pets from Hope & Paws Animal Sanctuary */}
            {recommended.length > 0 && (
              <div style={{ marginBottom: '2.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                  <div>
                    <h2 className="ap-section-title" style={{ margin: 0 }}>Available Pets from Hope &amp; Paws Sanctuary</h2>
                    <p style={{ margin: '3px 0 0', fontSize: '0.86rem', color: '#7A9187' }}>Verified rescue companions ready for adoption</p>
                  </div>
                  <Link to="/pets?shelter=Hope%20%26%20Paws%20Animal%20Sanctuary" className="ap-btn-secondary" style={{ fontSize: '0.84rem', padding: '0.42rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem', textDecoration: 'none' }}>
                    View All 10 Shelter Pets <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="ap-pets-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                  {recommended.map(pet => (
                    <PetCard key={pet.id} pet={pet} isFav={favoriteIds.includes(pet.id)} />
                  ))}
                </div>
              </div>
            )}

            {/* Journey Cards */}
            <div style={{marginBottom:'2rem'}}>
              <h2 className="ap-section-title" style={{marginBottom:'1rem'}}>Continue Your Adoption Journey</h2>
              <div className="ap-journey-grid">
                <Link to="/pets" className="ap-journey-card">
                  <div className="ap-journey-left">
                    <div className="ap-journey-icon" style={{background:'#FEF2E8',color:'#D97706'}}><PawPrint size={20}/></div>
                    <div>
                      <div className="ap-journey-title">Browse Pets</div>
                      <div className="ap-journey-desc">Explore available pets near you</div>
                    </div>
                  </div>
                  <ArrowRight size={17} color="#9BA7A3"/>
                </Link>
                <Link to="/pawmatch" className="ap-journey-card">
                  <div className="ap-journey-left">
                    <div className="ap-journey-icon" style={{background:'#E7F5ED',color:'#174C38'}}><Sparkles size={20}/></div>
                    <div>
                      <div className="ap-journey-title">PawMatch Quiz</div>
                      <div className="ap-journey-desc">Get personalized pet recommendations</div>
                    </div>
                  </div>
                  <ArrowRight size={17} color="#9BA7A3"/>
                </Link>
                <Link to="/readiness-checklist" className="ap-journey-card">
                  <div className="ap-journey-left">
                    <div className="ap-journey-icon" style={{background:'#FEF6EC',color:'#B47814'}}><CheckSquare size={20}/></div>
                    <div>
                      <div className="ap-journey-title">Readiness Checklist</div>
                      <div className="ap-journey-desc">Prepare for a happy pet life</div>
                    </div>
                  </div>
                  <ArrowRight size={17} color="#9BA7A3"/>
                </Link>
              </div>
            </div>
          </>
        )}

        {/* ── VISITS ──────────────────────────────────────── */}
        {currentTab === 'visits' && (
          <>
            <div className="ap-page-header">
              <h1 className="ap-page-title"><Calendar size={26}/>Meet &amp; Greet Visits</h1>
              <p className="ap-page-subtitle">Schedule and manage your meet &amp; greet visits with pets.</p>
            </div>
            <div className="ap-pills-bar">
              {['upcoming','past','cancelled'].map(f => (
                <button key={f} className={`ap-pill${visitFilter===f?' active':''}`} onClick={() => setVisitFilter(f)}>
                  {f==='upcoming' ? `Upcoming (${visits.filter(v=>!['cancelled','completed'].includes(v.status?.toLowerCase())).length})` :
                   f==='past' ? `Past Visits (${visits.filter(v=>v.status?.toLowerCase()==='completed').length})` :
                   `Cancelled (${visits.filter(v=>v.status?.toLowerCase()==='cancelled').length})`}
                </button>
              ))}
            </div>

            {filteredVisits.length === 0 ? (
              <div className="ap-empty">
                <Calendar size={52} color="#174C38"/>
                <div className="ap-empty-title">No visits in this category</div>
                <div className="ap-empty-desc">When you request a meet &amp; greet, it will appear here.</div>
                <Link to="/pets" className="ap-btn-primary" style={{marginTop:'0.5rem'}}>Browse Pets to Meet</Link>
              </div>
            ) : (
              <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                {filteredVisits.map(visit => {
                  const pet = visit.pet || {};
                  const petName = pet.name || visit.pet_name || 'Rescue Pet';
                  const petBreed = pet.breed || visit.pet_breed || 'Companion Animal';
                  const petPhoto = pet.photo_url || pet.image_url || visit.pet_image || FALLBACK_PET_IMG;
                  const shelterTitle = visit.shelter_name || pet.shelter?.shelter_name || 'Rescue Shelter';
                  const visitTime = visit.visit_time || visit.time_slot || '10:00 AM – 11:30 AM';
                  const isCancelled = visit.status?.toLowerCase() === 'cancelled';
                  const isConfirmed = visit.status?.toLowerCase() === 'confirmed';
                  const isCompleted = visit.status?.toLowerCase() === 'completed';

                  return (
                    <div key={visit.id} className="ap-visit-card">
                      <img
                        src={petPhoto}
                        alt={petName}
                        className="ap-visit-img"
                        onError={e => { e.target.src = FALLBACK_PET_IMG; }}
                      />
                      <div className="ap-visit-info">
                        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'0.2rem'}}>
                          <div className="ap-visit-pet-name">{petName}</div>
                          <span className={`ap-badge ${isCancelled ? 'ap-badge-rejected' : isConfirmed ? 'ap-badge-confirmed' : isCompleted ? 'ap-badge-approved' : 'ap-badge-review'}`}>
                            {isConfirmed ? 'Confirmed' : isCancelled ? 'Cancelled' : isCompleted ? 'Completed' : 'Requested'}
                          </span>
                        </div>
                        <div className="ap-visit-breed">{petBreed} {visit.visit_type === 'virtual' ? '• 📹 Virtual Intro' : '• 🏢 Shelter Visit'}</div>
                        <div className="ap-visit-meta-row">
                          <span className="ap-visit-meta-item"><Calendar size={14} color="#174C38"/>{visit.visit_date}</span>
                          <span className="ap-visit-meta-item"><Clock size={14} color="#174C38"/>{visitTime}</span>
                          <span className="ap-visit-meta-item"><MapPin size={14} color="#174C38"/>{shelterTitle}</span>
                        </div>
                      </div>
                      <div className="ap-visit-actions">
                        <button className="ap-btn-secondary" style={{fontSize:'0.82rem',padding:'0.45rem 0.85rem'}} onClick={() => setSelectedVisit(visit)}>View Details</button>
                        {!isCancelled && !isCompleted && (
                          <button className="ap-btn-danger" onClick={() => handleCancelVisit(visit.id)}>Cancel Visit</button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── FAVORITES ──────────────────────────────────────── */}
        {currentTab === 'favorites' && (
          <>
            <div className="ap-page-header">
              <h1 className="ap-page-title"><Heart size={26} color="#DC2626"/>My Favorite Pets</h1>
              <p className="ap-page-subtitle">Pets you've saved to your favorites list.</p>
            </div>
            {loading ? (
              <div style={{padding:'3rem', textAlign:'center', color:'#7A9187'}}>Loading favorites...</div>
            ) : favorites.length === 0 ? (
              <div className="ap-empty">
                <Heart size={52} color="#DC2626"/>
                <div className="ap-empty-title">No favorite pets yet</div>
                <div className="ap-empty-desc">Browse pets and click the heart icon to save them here.</div>
                <Link to="/pets" className="ap-btn-primary" style={{marginTop:'0.5rem'}}>Explore Pets</Link>
              </div>
            ) : (
              <div className="ap-pets-grid">
                {favorites.map(pet => <PetCard key={pet.id} pet={pet} isFav={true}/>)}
              </div>
            )}
          </>
        )}

        {/* ── PROFILE (Matching Reference UI) ──────────────────────────────────────── */}
        {currentTab === 'profile' && (
          <div style={{ paddingTop: '0.25rem' }}>
            {/* Breadcrumb Navigation */}
            <div className="ap-profile-breadcrumb">
              <Link to="/adopter-dashboard?tab=overview">Home</Link>
              <span>&gt;</span>
              <span>My Profile</span>
            </div>

            {/* Profile Header Row with Pets Artwork & Quote */}
            <div className="ap-profile-header-wrap">
              <div className="ap-profile-header-left">
                <h1 className="ap-profile-title">My Profile</h1>
                <p className="ap-profile-subtitle">Manage your adopter contact details and preferences.</p>
              </div>

              <div className="ap-profile-header-visual">
                <div className="ap-profile-pets-artwork">
                  <img
                    src="https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=600&auto=format&fit=crop&q=85"
                    alt="Dog and Cat companion friends"
                    className="ap-profile-pets-img"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=600&auto=format&fit=crop';
                    }}
                  />
                </div>
                <div className="ap-profile-speech-bubble">
                  <div className="ap-profile-quote-text">
                    "Same love, a brighter tomorrow for every paw" 🐾
                  </div>
                </div>
              </div>
            </div>

            {/* Official Verified Adopter Credential Card */}
            <div style={{ marginBottom: '1.75rem' }}>
              <VerifiedAdopterBadgeCard />
            </div>

            {/* Contact Information Form Card */}
            <div className="ap-contact-info-card">
              <div className="ap-contact-card-header">
                <div className="ap-contact-header-left">
                  <div className="ap-contact-avatar-box">
                    <User size={22} />
                  </div>
                  <div>
                    <div className="ap-contact-header-title">Contact Information</div>
                    <div className="ap-contact-header-sub">Keep your contact details up to date for a smooth adoption experience.</div>
                  </div>
                </div>

                <div className="ap-contact-notice-pill">
                  <Info size={16} /> This information will be used for your adoption applications and communication with shelters.
                </div>
              </div>

              {profileSaved && (
                <div className="ap-alert-success" style={{ marginBottom: '1.25rem' }}>
                  <CheckCircle2 size={17} /> Profile updated successfully!
                </div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault();
                setProfileSaved(true);
                setTimeout(() => setProfileSaved(false), 3500);
              }}>
                <div className="ap-contact-form-grid">
                  <div className="ap-field-group">
                    <label className="ap-field-label">Full Name</label>
                    <div className="ap-input-icon-wrapper">
                      <User size={18} className="ap-field-icon" />
                      <input
                        type="text"
                        className="ap-field-input"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Full name"
                      />
                    </div>
                  </div>

                  <div className="ap-field-group">
                    <label className="ap-field-label">Email Address</label>
                    <div className="ap-input-icon-wrapper">
                      <Mail size={18} className="ap-field-icon" />
                      <input
                        type="email"
                        className="ap-field-input"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="Email address"
                      />
                    </div>
                  </div>

                  <div className="ap-field-group">
                    <label className="ap-field-label">
                      <Heart size={13} color="#EF4444" fill="#EF4444" style={{ display: 'inline' }} /> Phone Number
                    </label>
                    <div className="ap-input-icon-wrapper">
                      <Phone size={18} className="ap-field-icon" />
                      <input
                        type="tel"
                        className="ap-field-input"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  <div className="ap-field-group">
                    <label className="ap-field-label">City</label>
                    <div className="ap-input-icon-wrapper">
                      <MapPin size={18} className="ap-field-icon" />
                      <input
                        type="text"
                        className="ap-field-input"
                        value={profileData.city}
                        onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                        placeholder="City"
                      />
                    </div>
                  </div>
                </div>

                <div className="ap-contact-form-actions">
                  <button
                    type="button"
                    className="ap-btn-cancel-profile"
                    onClick={() => {
                      setProfileData({
                        name: user?.name || '',
                        email: user?.email || '',
                        phone: user?.phone || '',
                        city: user?.city || '',
                      });
                    }}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="ap-btn-save-profile">
                    <Save size={18} /> Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ──────────────────────────────────────── */}
        {currentTab === 'notifications' && (
          <div style={{paddingTop:'1rem', maxWidth:'700px'}}>
            <div className="ap-page-header">
              <h1 className="ap-page-title"><Bell size={26}/>Notifications</h1>
              <p className="ap-page-subtitle">Updates on your applications, interviews, and visits.</p>
            </div>
            <div style={{display:'flex', flexDirection:'column', gap:'0.85rem'}}>
              {[
                {title:'Application Updated: Buddy', body:'Your application has moved to Under Review. Shelter staff will contact you soon.', time:'Yesterday', unread:true},
                {title:'Meet & Greet Reminder', body:'You have an upcoming visit at Green Haven Animal Sanctuary.', time:'3 days ago', unread:false},
              ].map((n,i)=>(
                <div key={i} className="ap-form-card" style={{padding:'1rem',marginBottom:0,borderLeft:`4px solid ${n.unread?'#174C38':'#E5E0D8'}`}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.3rem'}}>
                    <strong style={{fontSize:'0.9rem',color:'#162620'}}>{n.title}</strong>
                    <span style={{fontSize:'0.78rem',color:'#7A9187'}}>{n.time}</span>
                  </div>
                  <p style={{margin:0,fontSize:'0.85rem',color:'#4A6359'}}>{n.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Visit Details Modal */}
        {selectedVisit && (
          <div className="ap-modal-backdrop" onClick={()=>setSelectedVisit(null)}>
            <div className="ap-modal" onClick={e=>e.stopPropagation()}>
              <div className="ap-modal-header">
                <h3 className="ap-modal-title">Meet &amp; Greet Details</h3>
                <button className="ap-modal-close" onClick={()=>setSelectedVisit(null)}><X size={18}/></button>
              </div>
              <div style={{display:'flex',gap:'1rem',marginBottom:'1.25rem',alignItems:'center'}}>
                <img src={selectedVisit.pet?.photo_url || selectedVisit.pet_image || FALLBACK_PET_IMG} alt="Pet" style={{width:60,height:60,borderRadius:10,objectFit:'cover'}} onError={e=>{e.target.src=FALLBACK_PET_IMG;}}/>
                <div>
                  <div style={{fontWeight:700,fontSize:'1rem',color:'#162620'}}>{selectedVisit.pet?.name || selectedVisit.pet_name || 'Rescue Pet'}</div>
                  <div style={{fontSize:'0.83rem',color:'#4A6359'}}>{selectedVisit.pet?.breed || selectedVisit.pet_breed || 'Companion Animal'}</div>
                </div>
              </div>
              <div style={{background:'#F8F5EF',borderRadius:10,padding:'1rem',fontSize:'0.87rem',display:'flex',flexDirection:'column',gap:'0.55rem'}}>
                <div><strong>Scheduled Date:</strong> {selectedVisit.visit_date}</div>
                <div><strong>Time Window:</strong> {selectedVisit.visit_time || selectedVisit.time_slot}</div>
                <div><strong>Meeting Format:</strong> {selectedVisit.visit_type === 'virtual' ? '📹 Virtual Video Call' : '🏢 In-Person at Shelter'}</div>
                <div><strong>Shelter:</strong> {selectedVisit.shelter_name || selectedVisit.pet?.shelter?.shelter_name || 'Rescue Shelter'}</div>
                <div><strong>Status:</strong> <span style={{fontWeight:700,textTransform:'capitalize',color:selectedVisit.status==='confirmed'?'#047857':selectedVisit.status==='cancelled'?'#991B1B':'#B45309'}}>{selectedVisit.status}</span></div>
                {selectedVisit.notes && (
                  <div style={{marginTop:'0.25rem',paddingTop:'0.45rem',borderTop:'1px dashed #E5E0D8'}}>
                    <strong>Special Notes:</strong> {selectedVisit.notes}
                  </div>
                )}
                {selectedVisit.shelter_note && (
                  <div style={{marginTop:'0.25rem',paddingTop:'0.45rem',borderTop:'1px dashed #E5E0D8',color:'#064E3B'}}>
                    <strong>Shelter Instructions:</strong> {selectedVisit.shelter_note}
                  </div>
                )}
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',marginTop:'1.5rem',gap:'0.75rem'}}>
                <button className="ap-btn-secondary" onClick={()=>setSelectedVisit(null)}>Close</button>
                <Link to={`/pets/${selectedVisit.pet_id || selectedVisit.pet?.id}`} className="ap-btn-primary">View Pet Page</Link>
              </div>
            </div>
          </div>
        )}

        {/* Adoption Certificate Modal */}
        <AdoptionCertificateModal
          isOpen={!!selectedCertAppId}
          applicationId={selectedCertAppId}
          onClose={() => setSelectedCertAppId(null)}
        />
      </div>
    </div>
  );
};

export default AdopterDashboardPage;
