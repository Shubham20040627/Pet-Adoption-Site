import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, MapPin, Heart, PawPrint, SlidersHorizontal, Layers, Coins, X } from 'lucide-react';
import { petsApi } from '../api/petsApi';
import { useAuth } from '../context/AuthContext';
import AdopterHeader from '../components/AdopterHeader';
import '../styles/adopter-portal.css';

const FALLBACK = 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80';

const BrowsePetsPage = () => {
  const [searchParams] = useSearchParams();
  const { favoriteIds, toggleFavorite } = useAuth();

  const [compareIds, setCompareIds] = useState(() => {
    try {
      const stored = localStorage.getItem('pawconnect_compare_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const [pets, setPets] = useState([]);
  const maxBudgetParam = searchParams.get('maxBudget');
  const [budgetLimit, setBudgetLimit] = useState(maxBudgetParam ? Number(maxBudgetParam) : null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const [species, setSpecies] = useState('all');
  const [breed, setBreed] = useState('all');
  const [age, setAge] = useState('all');
  const [gender, setGender] = useState('all');
  const [location, setLocation] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const estimatePetMonthlyCost = (pet) => {
    const sp = (pet.species || '').toLowerCase();
    const sz = (pet.size || '').toLowerCase();
    if (sp.includes('cat')) return 1600;
    if (sp.includes('rabbit') || sp.includes('bird')) return 900;
    if (sz.includes('large')) return 4200;
    if (sz.includes('small')) return 1900;
    return 2800; // Medium dog default
  };

  const fetchPets = async () => {
    setLoading(true);
    try {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (species !== 'all') params.species = species;
      if (gender !== 'all') params.gender = gender;
      if (location !== 'all') params.location = location;

      const data = await petsApi.list(params);
      let list = data.pets || [];
      if (breed !== 'all') list = list.filter(p => p.breed?.toLowerCase().includes(breed.toLowerCase()));
      if (age === 'young') list = list.filter(p => p.age <= 2);
      else if (age === 'adult') list = list.filter(p => p.age > 2 && p.age < 7);
      else if (age === 'senior') list = list.filter(p => p.age >= 7);

      if (budgetLimit) {
        list = list.filter(p => estimatePetMonthlyCost(p) <= budgetLimit);
      }

      if (sortBy === 'newest') list = [...list].reverse();
      else if (sortBy === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
      setPets(list);
    } catch (e) {
      console.error('Failed to fetch pets:', e);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPets(); }, [species, breed, age, gender, location, sortBy, budgetLimit]);

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    fetchPets();
  };

  const handleFav = async (e, petId) => {
    e.preventDefault(); e.stopPropagation();
    try { await toggleFavorite(petId); } catch (err) {}
  };

  const toggleCompare = (e, petId) => {
    e.preventDefault();
    e.stopPropagation();
    let updated;
    if (compareIds.includes(petId)) {
      updated = compareIds.filter(id => id !== petId);
    } else {
      if (compareIds.length >= 3) {
        alert('You can compare up to 3 pets at a time. Please remove one first or view the Compare page.');
        return;
      }
      updated = [...compareIds, petId];
    }
    setCompareIds(updated);
    localStorage.setItem('pawconnect_compare_ids', JSON.stringify(updated));
  };

  return (
    <div className="ap-page">
      <AdopterHeader searchValue={searchTerm} onSearchChange={(val) => { setSearchTerm(val); }} />
      <div className="ap-wrap">
        {/* Header */}
        <div className="ap-page-header">
          <h1 className="ap-page-title">🐾 Find Your Perfect Companion</h1>
          <p className="ap-page-subtitle">Browse adorable pets waiting for their forever homes.</p>
        </div>

        {/* Filter Bar */}
        <div className="ap-filter-bar">
          <div className="ap-filter-row">
            {/* Search */}
            <form onSubmit={handleSearch} style={{display:'flex',alignItems:'center',gap:'0.5rem',background:'#F8F5EF',border:'1px solid #E5E0D8',borderRadius:'10px',padding:'0.38rem 0.85rem',flex:1,minWidth:180}}>
              <Search size={15} color="#7A9187"/>
              <input
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search pets, breeds..."
                style={{border:'none',background:'transparent',outline:'none',fontFamily:'inherit',fontSize:'0.85rem',color:'#162620',width:'100%'}}
              />
            </form>

            <div className="ap-filter-group">
              <span className="ap-filter-label">Species</span>
              <select className="ap-select" value={species} onChange={e=>setSpecies(e.target.value)}>
                <option value="all">All</option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
                <option value="rabbit">Rabbit</option>
                <option value="bird">Bird</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="ap-filter-group">
              <span className="ap-filter-label">Breed</span>
              <select className="ap-select" value={breed} onChange={e=>setBreed(e.target.value)}>
                <option value="all">All</option>
                <option value="golden retriever">Golden Retriever</option>
                <option value="labrador">Labrador</option>
                <option value="persian">Persian</option>
                <option value="husky">Husky</option>
                <option value="poodle">Poodle</option>
              </select>
            </div>

            <div className="ap-filter-group">
              <span className="ap-filter-label">Age</span>
              <select className="ap-select" value={age} onChange={e=>setAge(e.target.value)}>
                <option value="all">Any</option>
                <option value="young">Young (0–2)</option>
                <option value="adult">Adult (3–6)</option>
                <option value="senior">Senior (7+)</option>
              </select>
            </div>

            <div className="ap-filter-group">
              <span className="ap-filter-label">Gender</span>
              <select className="ap-select" value={gender} onChange={e=>setGender(e.target.value)}>
                <option value="all">Any</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>

            <div className="ap-filter-group">
              <span className="ap-filter-label">Location</span>
              <select className="ap-select" value={location} onChange={e=>setLocation(e.target.value)}>
                <option value="all">All</option>
                <option value="chandigarh">Chandigarh</option>
                <option value="mumbai">Mumbai</option>
                <option value="delhi">Delhi</option>
                <option value="bangalore">Bangalore</option>
              </select>
            </div>

            <button onClick={handleSearch} className="ap-btn-primary" style={{marginTop:'1.15rem'}}>
              <Search size={14}/> Search
            </button>

            <button
              onClick={() => { setSpecies('all'); setBreed('all'); setAge('all'); setGender('all'); setLocation('all'); setSearchTerm(''); }}
              className="ap-btn-secondary"
              style={{marginTop:'1.15rem', fontSize:'0.82rem', padding:'0.5rem 0.85rem'}}
            >
              <SlidersHorizontal size={14}/> Reset
            </button>
          </div>
        </div>

        {/* Budget Filter Banner */}
        {budgetLimit && (
          <div style={{ background: '#E8F5EC', border: '1px solid #A3C9B8', borderRadius: 14, padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#166534', fontSize: '0.9rem', fontWeight: 700 }}>
              <Coins size={20} />
              <span>Filtered by Budget: Showing pets with estimated monthly care within ₹{budgetLimit.toLocaleString('en-IN')}/mo</span>
            </div>
            <button
              type="button"
              onClick={() => setBudgetLimit(null)}
              style={{ background: '#FFFFFF', border: '1px solid #FECACA', color: '#DC2626', fontSize: '0.8rem', fontWeight: 700, padding: '0.35rem 0.75rem', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <X size={14} /> Clear Budget Filter
            </button>
          </div>
        )}

        {/* Results Row */}
        <div className="ap-results-row">
          <span className="ap-results-count">{pets.length} pets found</span>
          <div className="ap-sort-wrap">
            Sort by:
            <select className="ap-select" style={{minWidth:'unset'}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="name">Name A–Z</option>
            </select>
          </div>
        </div>

        {/* Pet Grid */}
        {loading ? (
          <div style={{padding:'4rem', textAlign:'center', color:'#7A9187', fontSize:'1rem'}}>
            <PawPrint size={40} style={{margin:'0 auto 1rem', color:'#174C38'}}/>
            <div>Finding your perfect companions…</div>
          </div>
        ) : pets.length === 0 ? (
          <div className="ap-empty">
            <PawPrint size={52} color="#174C38"/>
            <div className="ap-empty-title">No pets found</div>
            <div className="ap-empty-desc">Try adjusting your filters or raising your monthly budget to see more pets.</div>
          </div>
        ) : (
          <div className="ap-pets-grid">
            {pets.map(pet => {
              const isFav = favoriteIds.includes(pet.id);
              const estCost = estimatePetMonthlyCost(pet);
              return (
                <div key={pet.id} className="ap-pet-card">
                  <div className="ap-pet-img-wrap">
                    <img
                      src={pet.photo_url || pet.image_url || FALLBACK}
                      alt={pet.name}
                      className="ap-pet-img"
                      onError={e => { e.target.src = FALLBACK; }}
                    />
                    <span className="ap-pet-avail-badge">Available</span>
                    <button
                      type="button"
                      className={`ap-pet-fav-btn${isFav ? ' active' : ''}`}
                      onClick={e => handleFav(e, pet.id)}
                    >
                      <Heart size={15} fill={isFav ? '#DC2626' : 'none'} color={isFav ? '#DC2626' : '#94A3B8'}/>
                    </button>
                  </div>
                  <div className="ap-pet-body">
                    <div className="ap-pet-name">{pet.name}</div>
                    <div className="ap-pet-breed">{pet.breed || pet.species}</div>
                    <div className="ap-pet-meta">{pet.age ? `${pet.age} years` : 'Adult'} • {pet.gender || 'Unknown'}</div>
                    <div className="ap-pet-location"><MapPin size={12}/><span>{pet.shelter?.city || pet.city || 'Chandigarh'}</span></div>
                    
                    {/* Monthly budget indicator pill */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.74rem', color: '#166534', background: '#E8F5E9', padding: '0.2rem 0.55rem', borderRadius: 6, fontWeight: 700, marginTop: '0.35rem', width: 'fit-content' }}>
                      <Coins size={12} /> ~₹{estCost.toLocaleString('en-IN')}/mo care
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      <Link to={`/pets/${pet.id}`} className="ap-pet-view-btn" style={{ flex: 1, textAlign: 'center' }}>
                        View Details
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => toggleCompare(e, pet.id)}
                        title={compareIds.includes(pet.id) ? 'Remove from Compare' : 'Add to Compare'}
                        style={{
                          background: compareIds.includes(pet.id) ? '#E8F3EE' : '#FAF7F2',
                          border: `1.5px solid ${compareIds.includes(pet.id) ? '#174C38' : '#D5CDC2'}`,
                          color: compareIds.includes(pet.id) ? '#174C38' : '#5A7167',
                          borderRadius: 9,
                          padding: '0 0.65rem',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <Layers size={13} />
                        {compareIds.includes(pet.id) ? 'Added' : 'Compare'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Compare Tray */}
        {compareIds.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '1.75rem',
            right: '2rem',
            zIndex: 900,
            background: '#174C38',
            color: '#FFFFFF',
            padding: '0.65rem 1.15rem',
            borderRadius: 9999,
            boxShadow: '0 8px 25px rgba(23, 76, 56, 0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            animation: 'cpSlideUp 0.25s ease'
          }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
              🐾 {compareIds.length} / 3 pets selected
            </span>
            <Link
              to={`/compare-pets?pets=${compareIds.join(',')}`}
              style={{
                background: '#FFFFFF',
                color: '#174C38',
                padding: '0.4rem 0.95rem',
                borderRadius: 9999,
                fontWeight: 800,
                fontSize: '0.82rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem'
              }}
            >
              <Layers size={14} /> Compare Side by Side →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowsePetsPage;
