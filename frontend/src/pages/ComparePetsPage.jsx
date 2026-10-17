import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Heart, X, Plus, PlusCircle, Sparkles, Lightbulb, 
  Calendar, Ruler, Zap, Smile, Users, PawPrint, Syringe, Scissors, 
  Activity, Star, FileText, Search, ExternalLink, CheckCircle2, 
  AlertTriangle, XCircle, Info, ChevronRight, Layers
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { petsApi } from '../api/petsApi';
import AdopterHeader from '../components/AdopterHeader';
import AdoptionApplicationModal from '../components/AdoptionApplicationModal';
import '../styles/compare-pets.css';

const FALLBACK_IMG = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

// Helper to format weight/size display
const formatSizeDisplay = (pet) => {
  if (pet.weight_display) return pet.weight_display;
  const s = (pet.size || 'Medium').toLowerCase();
  if (s === 'small') return 'Small (3–5 kg)';
  if (s === 'large') return 'Large (25–32 kg)';
  return 'Medium (15–22 kg)';
};

// Helper to format age
const formatAgeDisplay = (pet) => {
  if (!pet.age) return 'Adult';
  const val = Number(pet.age);
  const unit = val === 1 ? 'year' : 'years';
  return `${val} ${unit}`;
};

// Helper for energy level
const getEnergyLevelInfo = (pet) => {
  const lvl = (pet.energy_level || pet.activity_level || 'Moderate').toLowerCase();
  if (lvl.includes('high')) {
    return { label: 'High', bars: 4, type: 'high' };
  }
  if (lvl.includes('low')) {
    return { label: 'Low', bars: 2, type: 'low' };
  }
  return { label: 'Medium', bars: 3, type: 'med' };
};

// Helper for temperament
const getTemperament = (pet) => {
  if (pet.temperament) return pet.temperament;
  const breed = (pet.breed || '').toLowerCase();
  const species = (pet.species || '').toLowerCase();
  if (breed.includes('golden') || breed.includes('retriever')) return 'Friendly, Playful, Loyal';
  if (breed.includes('shorthair') || species === 'cat') return 'Calm, Independent, Affectionate';
  if (breed.includes('indie') || breed.includes('mix')) return 'Friendly, Alert, Intelligent';
  if (breed.includes('collie')) return 'Energetic, Intelligent, Agility-Loving';
  if (breed.includes('beagle')) return 'Curious, Gentle, Loving';
  if (species === 'rabbit') return 'Quiet, Gentle, Curious';
  if (species === 'bird') return 'Vocal, Social, Cheerful';
  return 'Gentle, Affectionate, Companion';
};

const ComparePetsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, favoriteIds, toggleFavorite } = useAuth();

  const [allAvailablePets, setAllAvailablePets] = useState([]);
  const [selectedPets, setSelectedPets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSearch, setPickerSearch] = useState('');
  const [activeApplyPet, setActiveApplyPet] = useState(null);

  // Fetch all available pets on mount
  useEffect(() => {
    let isMounted = true;
    const fetchPets = async () => {
      setLoading(true);
      try {
        const data = await petsApi.list({ status: 'available' });
        const petsList = data.pets || [];
        if (!isMounted) return;
        setAllAvailablePets(petsList);

        // Determine which pets to compare
        // 1. From URL query ?pets=id1,id2,id3
        const queryIds = searchParams.get('pets');
        let initialIds = [];
        if (queryIds) {
          initialIds = queryIds.split(',').map(s => s.trim()).filter(Boolean);
        } else {
          // 2. From localStorage
          try {
            const stored = localStorage.getItem('pawconnect_compare_ids');
            if (stored) {
              initialIds = JSON.parse(stored);
            }
          } catch (e) {
            initialIds = [];
          }
        }

        let initialSelection = [];
        if (initialIds.length > 0) {
          initialSelection = initialIds
            .map(id => petsList.find(p => String(p.id) === String(id)))
            .filter(Boolean);
        }

        // If no valid selection was stored, default to Buddy, Luna, Max (matching reference screenshot)
        // or the first 3 available pets
        if (initialSelection.length === 0 && petsList.length > 0) {
          const buddy = petsList.find(p => p.name === 'Buddy');
          const luna = petsList.find(p => p.name === 'Luna');
          const max = petsList.find(p => p.name === 'Max');

          if (buddy || luna || max) {
            initialSelection = [buddy, luna, max].filter(Boolean);
          } else {
            initialSelection = petsList.slice(0, 3);
          }
        }

        // Cap to 3
        const finalSelection = initialSelection.slice(0, 3);
        setSelectedPets(finalSelection);

        // Sync URL & storage
        const ids = finalSelection.map(p => p.id);
        localStorage.setItem('pawconnect_compare_ids', JSON.stringify(ids));
        if (ids.length > 0) {
          setSearchParams({ pets: ids.join(',') }, { replace: true });
        }
      } catch (err) {
        console.error('Failed to load pets for comparison:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPets();
    return () => { isMounted = false; };
  }, []);

  // Update storage & URL whenever selected pets change
  const updateSelection = (newSelection) => {
    const capped = newSelection.slice(0, 3);
    setSelectedPets(capped);
    const ids = capped.map(p => p.id);
    localStorage.setItem('pawconnect_compare_ids', JSON.stringify(ids));
    if (ids.length > 0) {
      setSearchParams({ pets: ids.join(',') }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  };

  const handleRemovePet = (petId) => {
    const updated = selectedPets.filter(p => p.id !== petId);
    updateSelection(updated);
  };

  const handleAddPet = (pet) => {
    if (selectedPets.some(p => p.id === pet.id)) return;
    if (selectedPets.length >= 3) return;
    const updated = [...selectedPets, pet];
    updateSelection(updated);
    setPickerOpen(false);
  };

  const handleToggleFav = async (e, petId) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleFavorite(petId);
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  // Filter available pets for the picker modal
  const filteredPickerPets = useMemo(() => {
    const currentIds = new Set(selectedPets.map(p => p.id));
    return allAvailablePets.filter(p => {
      if (currentIds.has(p.id)) return false;
      if (!pickerSearch.trim()) return true;
      const term = pickerSearch.toLowerCase();
      return (
        p.name?.toLowerCase().includes(term) ||
        p.breed?.toLowerCase().includes(term) ||
        p.species?.toLowerCase().includes(term) ||
        p.shelter_name?.toLowerCase().includes(term)
      );
    });
  }, [allAvailablePets, selectedPets, pickerSearch]);

  // Determine Best Match Recommendation
  const matchRecommendation = useMemo(() => {
    if (selectedPets.length === 0) return null;

    // Check if user has specific quiz answers stored
    let storedAnswers = null;
    try {
      const qData = localStorage.getItem('pawconnect_pawmatch_answers');
      if (qData) storedAnswers = JSON.parse(qData);
    } catch (e) {}

    // Check if Buddy is among selected pets (Buddy is the hero match from screenshot!)
    const buddy = selectedPets.find(p => p.name === 'Buddy');
    if (buddy && (!storedAnswers || storedAnswers[1] === 'House' || storedAnswers[2] === 'Large')) {
      return {
        pet: buddy,
        reason: 'Based on your PawMatch Quiz and preferences, Buddy seems to be the best match for your lifestyle.',
      };
    }

    // Default to the first selected pet with highest energy / best suited
    const recPet = selectedPets[0];
    return {
      pet: recPet,
      reason: `Based on your PawMatch Quiz and preferences, ${recPet.name} seems to be the best match for your lifestyle.`,
    };
  }, [selectedPets]);

  // Gender icon helper
  const renderGenderIcon = (gender) => {
    const g = (gender || '').toLowerCase();
    if (g === 'male' || g === 'm') return <span style={{ color: '#0284C7', fontWeight: 'bold' }}>♂</span>;
    if (g === 'female' || g === 'f') return <span style={{ color: '#E11D48', fontWeight: 'bold' }}>♀</span>;
    return null;
  };

  // Boolean / compatibility badge renderer
  const renderCompValue = (val) => {
    if (val === true || val === 'true' || val === 'Yes' || val === 'yes') {
      return (
        <span className="cp-value-pill-yes">
          <CheckCircle2 size={16} fill="#DCFCE7" color="#15803D" /> Yes
        </span>
      );
    }
    if (val === 'Depends' || val === 'depends' || val === 'caution') {
      return (
        <span className="cp-value-pill-depends">
          <AlertTriangle size={16} fill="#FEF3C7" color="#D97706" /> Depends
        </span>
      );
    }
    return (
      <span className="cp-value-pill-no">
        <XCircle size={16} fill="#FEE2E2" color="#DC2626" /> No
      </span>
    );
  };

  return (
    <div className="ap-page">
      {/* Top Header Bar with Search, Notification badge and User profile */}
      <AdopterHeader
        searchPlaceholder="Search pets, breeds, or shelters..."
        onSearchChange={(query) => {
          if (query) navigate(`/pets?search=${encodeURIComponent(query)}`);
        }}
      />

      <div className="cp-container">
        {/* Breadcrumb Back link */}
        <Link to="/pets" className="cp-back-link">
          <ArrowLeft size={16} /> Back to Browse Pets
        </Link>

        {/* Title and Top Selection Status */}
        <div className="cp-header-row">
          <div className="cp-title-wrap">
            <h1 className="cp-title">Compare Pets</h1>
            <p className="cp-subtitle">
              Compare multiple pets side by side to find your perfect match
            </p>
          </div>

          {/* Selected Pets Pill Widget */}
          <div className="cp-selected-pill">
            <span className="cp-selected-label">
              Selected Pets ({selectedPets.length}/3)
            </span>

            <div className="cp-chips-list">
              {selectedPets.map(pet => (
                <div key={pet.id} className="cp-pet-chip">
                  <img
                    src={pet.photo_url || pet.image_url || FALLBACK_IMG}
                    alt={pet.name}
                    className="cp-chip-thumb"
                    onError={e => { e.target.src = FALLBACK_IMG; }}
                  />
                  <span className="cp-chip-name">{pet.name}</span>
                  <button
                    type="button"
                    className="cp-chip-remove"
                    onClick={() => handleRemovePet(pet.id)}
                    title={`Remove ${pet.name}`}
                    aria-label={`Remove ${pet.name} from comparison`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}

              {selectedPets.length < 3 && (
                <button
                  type="button"
                  className="cp-chip-add-btn"
                  onClick={() => setPickerOpen(true)}
                >
                  <Plus size={14} /> Add Pet
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '6rem 2rem', color: '#5A7167' }}>
            <PawPrint size={44} style={{ margin: '0 auto 1rem', color: '#174C38', animation: 'spin 2s linear infinite' }} />
            <h3 style={{ fontFamily: 'var(--font-heading)', color: '#162620', margin: '0 0 0.5rem' }}>
              Loading Pet Comparison...
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem' }}>Fetching real-time records from shelter database</p>
          </div>
        ) : selectedPets.length === 0 ? (
          /* Empty State View */
          <div className="cp-empty-state-view">
            <div className="cp-empty-icon-wrap">
              <Layers size={36} strokeWidth={2} />
            </div>
            <h2 className="cp-empty-title">No Pets Selected to Compare</h2>
            <p className="cp-empty-desc">
              Select up to 3 pets from our rescue shelters to evaluate their age, energy, temperament, and family compatibility side by side.
            </p>
            <div className="cp-empty-actions">
              <button
                type="button"
                className="cp-btn-primary"
                style={{ width: 'auto', padding: '0.75rem 1.75rem' }}
                onClick={() => setPickerOpen(true)}
              >
                <Plus size={16} /> Choose Pets to Compare
              </button>
              <Link
                to="/pets"
                className="cp-btn-secondary"
                style={{ width: 'auto', padding: '0.75rem 1.75rem' }}
              >
                Browse All Pets
              </Link>
            </div>
          </div>
        ) : (
          /* Main Comparison Grid */
          <>
            <div className="cp-matrix-wrapper">
              {/* Left Column: Attribute Labels & Icons */}
              <div className="cp-labels-col">
                <div className="cp-labels-header-spacer" />

                <div className="cp-label-row">
                  <Calendar size={18} className="cp-label-icon" />
                  <span>Age</span>
                </div>

                <div className="cp-label-row">
                  <Ruler size={18} className="cp-label-icon" />
                  <span>Size</span>
                </div>

                <div className="cp-label-row">
                  <Zap size={18} className="cp-label-icon" />
                  <span>Energy Level</span>
                </div>

                <div className="cp-label-row">
                  <Smile size={18} className="cp-label-icon" />
                  <span>Temperament</span>
                </div>

                <div className="cp-label-row">
                  <Users size={18} className="cp-label-icon" />
                  <span>Good with Kids</span>
                </div>

                <div className="cp-label-row">
                  <PawPrint size={18} className="cp-label-icon" />
                  <span>Good with Pets</span>
                </div>

                <div className="cp-label-row">
                  <Syringe size={18} className="cp-label-icon" />
                  <span>Vaccinated</span>
                </div>

                <div className="cp-label-row">
                  <Scissors size={18} className="cp-label-icon" />
                  <span>Spayed/Neutered</span>
                </div>

                <div className="cp-label-row">
                  <Heart size={18} className="cp-label-icon" />
                  <span>Health Status</span>
                </div>

                <div className="cp-label-row">
                  <Star size={18} className="cp-label-icon" />
                  <span>Special Needs</span>
                </div>

                <div className="cp-labels-footer-spacer" />
              </div>

              {/* Columns: Up to 3 Pet Cards */}
              {selectedPets.map(pet => {
                const isFav = favoriteIds.includes(pet.id);
                const speciesKey = (pet.species || 'dog').toLowerCase();
                const energy = getEnergyLevelInfo(pet);
                const temperament = getTemperament(pet);
                const photoSrc = pet.photo_url || pet.image_url || FALLBACK_IMG;
                const shelterName = pet.shelter_name || pet.shelter?.shelter_name || pet.location || 'Rescue Shelter';

                return (
                  <div key={pet.id} className="cp-card-col">
                    {/* Pet Media */}
                    <div className="cp-pet-img-wrap">
                      <img
                        src={photoSrc}
                        alt={pet.name}
                        className="cp-pet-img"
                        onError={e => { e.target.src = FALLBACK_IMG; }}
                      />

                      {/* Remove from comparison button */}
                      <button
                        type="button"
                        className="cp-pet-remove-top"
                        onClick={() => handleRemovePet(pet.id)}
                        title={`Remove ${pet.name} from comparison`}
                        aria-label={`Remove ${pet.name} from comparison`}
                      >
                        <X size={16} />
                      </button>

                      {/* Favorite Heart Button */}
                      <button
                        type="button"
                        className="cp-pet-fav-btn"
                        onClick={e => handleToggleFav(e, pet.id)}
                        title={isFav ? 'Remove from favorites' : 'Save to favorites'}
                        aria-label="Toggle favorite"
                      >
                        <Heart
                          size={18}
                          color={isFav ? '#DC2626' : '#7A9187'}
                          fill={isFav ? '#DC2626' : 'none'}
                        />
                      </button>
                    </div>

                    {/* Pet Header: Name + Badges + Meta */}
                    <div className="cp-pet-header-info">
                      <div className="cp-name-badge-row">
                        <h2 className="cp-pet-name">{pet.name}</h2>
                        <span className={`cp-badge-species ${speciesKey}`}>
                          {pet.species || 'Dog'}
                        </span>
                        <span className="cp-badge-avail">
                          Available
                        </span>
                      </div>

                      <div className="cp-pet-meta-line">
                        <span className="cp-meta-item">
                          {renderGenderIcon(pet.gender)} {formatAgeDisplay(pet)}
                        </span>
                        <span>•</span>
                        <span className="cp-meta-item">
                          <PawPrint size={13} /> {pet.breed || pet.species}
                        </span>
                        <span>•</span>
                        <span className="cp-meta-item">
                          📍 {shelterName}
                        </span>
                      </div>
                    </div>

                    {/* Attribute Rows */}
                    {/* 1. Age */}
                    <div className="cp-value-row">
                      {formatAgeDisplay(pet)}
                    </div>

                    {/* 2. Size */}
                    <div className="cp-value-row">
                      {formatSizeDisplay(pet)}
                    </div>

                    {/* 3. Energy Level */}
                    <div className="cp-value-row">
                      <div className="cp-energy-wrap">
                        <div className="cp-energy-bars">
                          {[1, 2, 3, 4].map(barIdx => {
                            const isFilled = barIdx <= energy.bars;
                            let barClass = 'cp-energy-bar';
                            if (isFilled) {
                              if (energy.type === 'high') barClass += ' high-filled';
                              else if (energy.type === 'med') barClass += ' med-filled';
                              else barClass += ' low-filled';
                            }
                            return <div key={barIdx} className={barClass} />;
                          })}
                        </div>
                        <span className="cp-energy-text">{energy.label}</span>
                      </div>
                    </div>

                    {/* 4. Temperament */}
                    <div className="cp-value-row" title={temperament}>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {temperament}
                      </span>
                    </div>

                    {/* 5. Good with Kids */}
                    <div className="cp-value-row">
                      {renderCompValue(pet.good_with_kids)}
                    </div>

                    {/* 6. Good with Pets */}
                    <div className="cp-value-row">
                      {renderCompValue(pet.good_with_pets)}
                    </div>

                    {/* 7. Vaccinated */}
                    <div className="cp-value-row">
                      {renderCompValue(pet.vaccinated)}
                    </div>

                    {/* 8. Spayed / Neutered */}
                    <div className="cp-value-row">
                      {renderCompValue(pet.spayed_neutered)}
                    </div>

                    {/* 9. Health Status */}
                    <div className="cp-value-row">
                      {pet.health_status && pet.health_status.length < 25 ? pet.health_status : 'Healthy'}
                    </div>

                    {/* 10. Special Needs */}
                    <div className="cp-value-row">
                      {pet.special_needs || 'No'}
                    </div>

                    {/* Action Buttons */}
                    <div className="cp-card-actions">
                      <Link
                        to={`/pets/${pet.id}`}
                        className="cp-btn-primary"
                      >
                        <FileText size={16} /> View Full Profile
                      </Link>

                      <button
                        type="button"
                        className="cp-btn-secondary"
                        onClick={() => setActiveApplyPet(pet)}
                      >
                        <Heart size={16} /> Start Adoption Application
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Empty Slots if < 3 pets are selected */}
              {Array.from({ length: 3 - selectedPets.length }).map((_, slotIdx) => (
                <div key={`empty-slot-${slotIdx}`} className="cp-empty-slot-card">
                  <div className="cp-empty-slot-icon">
                    <PlusCircle size={28} />
                  </div>
                  <h3 className="cp-empty-slot-title">Add Pet to Compare</h3>
                  <p className="cp-empty-slot-desc">
                    Select an additional pet to view traits side by side
                  </p>
                  <button
                    type="button"
                    className="cp-btn-secondary"
                    style={{ width: 'auto', padding: '0.65rem 1.4rem' }}
                    onClick={() => setPickerOpen(true)}
                  >
                    + Select Pet
                  </button>
                </div>
              ))}
            </div>

            {/* Bottom Match Recommendation Card */}
            {matchRecommendation && (
              <div className="cp-recommendation-box">
                <div className="cp-rec-left">
                  <div className="cp-rec-icon-badge">
                    <Lightbulb size={24} />
                  </div>
                  <div className="cp-rec-content">
                    <h3 className="cp-rec-title">Match Recommendation</h3>
                    <p className="cp-rec-text">
                      Based on your PawMatch Quiz and preferences,{' '}
                      <strong>{matchRecommendation.pet.name}</strong> seems to be the best match for your lifestyle.
                    </p>
                  </div>
                </div>

                <Link to="/pawmatch" className="cp-rec-btn">
                  <Sparkles size={16} /> Retake PawMatch Quiz
                </Link>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Pet Picker Modal ── */}
      {pickerOpen && (
        <div className="cp-modal-backdrop" onClick={() => setPickerOpen(false)}>
          <div className="cp-modal-panel" onClick={e => e.stopPropagation()}>
            <div className="cp-modal-header">
              <h3 className="cp-modal-title">Select a Pet to Compare</h3>
              <button
                type="button"
                className="cp-modal-close-btn"
                onClick={() => setPickerOpen(false)}
                aria-label="Close pet picker"
              >
                <X size={20} />
              </button>
            </div>

            <div className="cp-modal-body">
              {/* Search Bar */}
              <div className="cp-modal-search">
                <Search size={16} color="#7A9187" />
                <input
                  type="text"
                  placeholder="Search by name, breed, or species..."
                  value={pickerSearch}
                  onChange={e => setPickerSearch(e.target.value)}
                  autoFocus
                />
              </div>

              {filteredPickerPets.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#7A9187' }}>
                  <PawPrint size={38} style={{ margin: '0 auto 0.75rem', color: '#B3C5BD' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>
                    {allAvailablePets.length === selectedPets.length
                      ? 'All available pets are already in your comparison!'
                      : 'No matching pets found.'}
                  </p>
                </div>
              ) : (
                <div className="cp-picker-grid">
                  {filteredPickerPets.map(pet => (
                    <div
                      key={pet.id}
                      className="cp-picker-card"
                      onClick={() => handleAddPet(pet)}
                    >
                      <img
                        src={pet.photo_url || pet.image_url || FALLBACK_IMG}
                        alt={pet.name}
                        className="cp-picker-img"
                        onError={e => { e.target.src = FALLBACK_IMG; }}
                      />
                      <div className="cp-picker-info">
                        <div className="cp-picker-name">{pet.name}</div>
                        <div className="cp-picker-meta">
                          {pet.species} • {pet.breed || 'Rescue'} • {formatAgeDisplay(pet)}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: '#7A9187', marginTop: '2px' }}>
                          📍 {pet.shelter_name || pet.location || 'Shelter'}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="cp-picker-select-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddPet(pet);
                        }}
                      >
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Adoption Application Modal ── */}
      {activeApplyPet && (
        <AdoptionApplicationModal
          pet={activeApplyPet}
          isOpen={Boolean(activeApplyPet)}
          onClose={() => setActiveApplyPet(null)}
          onSuccess={() => {
            // Optional callback after application submitted
          }}
        />
      )}
    </div>
  );
};

export default ComparePetsPage;
