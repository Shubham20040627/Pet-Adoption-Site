import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Heart, MapPin, ArrowLeft, X, Calendar, Clock, PawPrint,
  Phone, Mail, Building, Check, AlertCircle, Layers, Coins, ShieldCheck
} from 'lucide-react';
import { petsApi } from '../api/petsApi';
import { adoptionsApi } from '../api/adoptionsApi';
import { useAuth } from '../context/AuthContext';
import AdopterHeader from '../components/AdopterHeader';
import ScheduleMeetAndGreetModal from '../components/ScheduleMeetAndGreetModal';
import DigitalCareProfileCard from '../components/DigitalCareProfileCard';
import DigitalCareProfileModal from '../components/DigitalCareProfileModal';
import '../styles/adopter-portal.css';
import '../styles/meet-and-greet.css';

const FALLBACK = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80';

const PetDetailPage = () => {
  const { petId } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isAdopter, isShelter, user, favoriteIds, toggleFavorite } = useAuth();

  const [pet, setPet] = useState(null);
  const [similarPets, setSimilarPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('about');
  const [selectedPhoto, setSelectedPhoto] = useState(0);
  const [isCareModalOpen, setIsCareModalOpen] = useState(false);

  // Apply Modal
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [applySuccess, setApplySuccess] = useState(null);
  const [applyError, setApplyError] = useState(null);
  const [formData, setFormData] = useState({
    fullName: user?.name || 'Alex Morgan',
    email: user?.email || 'alex@example.com',
    phone: user?.phone || '9876543210',
    city: user?.city || 'Chandigarh',
    reason: '',
    living_type: 'Independent House',
    household_members: '2 Adults',
    hours_alone: '2–4 hours',
    experience_level: 'Experienced',
    other_pets: 'None',
    agreement: true,
  });

  // Visit Modal
  const [isVisitOpen, setIsVisitOpen] = useState(false);
  const [visitDate, setVisitDate] = useState('2026-10-20');
  const [visitSlot, setVisitSlot] = useState('3:00 PM – 4:00 PM');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitLoading, setVisitLoading] = useState(false);
  const [visitSuccess, setVisitSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
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
    load();
    window.scrollTo({ top: 0 });
  }, [petId]);

  const handleFav = async () => {
    if (!pet) return;
    try { await toggleFavorite(pet.id); } catch (e) {}
  };

  const handleApplySubmit = async () => {
    if (!formData.reason.trim()) { setApplyError('Please tell us why you want to adopt this pet.'); return; }
    setSubmitting(true);
    setApplyError(null);
    try {
      const payload = {
        pet_id: pet.id,
        pet: pet.id,
        reason_for_adoption: formData.reason,
        reason: formData.reason,
        living_type: formData.living_type,
        living_situation: formData.living_type,
        household_members: formData.household_members,
        time_alone_hours: formData.hours_alone,
        hours_pet_alone: formData.hours_alone,
        previous_experience: formData.experience_level,
        pet_experience: formData.experience_level,
        other_pets: formData.other_pets,
        has_other_pets: Boolean(formData.other_pets && formData.other_pets.toLowerCase() !== 'none'),
        other_pets_details: formData.other_pets,
        adopter_name: formData.fullName,
        applicant_name: formData.fullName,
        adopter_email: formData.email,
        applicant_email: formData.email,
        adopter_phone: formData.phone,
        applicant_phone: formData.phone,
        city: formData.city,
        applicant_city: formData.city,
        readiness_acknowledged: Boolean(formData.agreement),
      };
      await adoptionsApi.submitApplication(payload);
      setApplySuccess(true);
    } catch (err) {
      setApplyError(err.response?.data?.error || err.response?.data?.detail || err.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVisitSubmit = async () => {
    setVisitLoading(true);
    try {
      await adoptionsApi.bookVisit({
        pet_id: pet.id,
        pet: pet.id,
        visit_date: visitDate,
        time_slot: visitSlot,
        visit_time: visitSlot,
        notes: visitNotes,
      });
      setVisitSuccess(true);
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || err.message || 'Could not schedule visit. Please try again.');
    } finally {
      setVisitLoading(false);
    }
  };

  const photos = pet ? [
    pet.photo_url || pet.image_url || FALLBACK,
    ...(pet.additional_photos || []),
  ].filter(Boolean) : [];

  const isFav = pet && favoriteIds.includes(pet.id);

  if (loading) return (
    <div className="ap-page" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{textAlign:'center',color:'#7A9187'}}>
        <PawPrint size={48} style={{margin:'0 auto 1rem',color:'#174C38'}}/>
        <div>Loading pet profile…</div>
      </div>
    </div>
  );

  if (error || !pet) return (
    <div className="ap-page" style={{display:'flex',alignItems:'center',justifyContent:'center',minHeight:'60vh'}}>
      <div style={{textAlign:'center'}}>
        <div style={{fontWeight:700,marginBottom:'0.5rem'}}>Pet not found</div>
        <Link to="/pets" className="ap-btn-primary">← Back to Pets</Link>
      </div>
    </div>
  );

  const STEPS = ['Personal Info', 'Home & Lifestyle', 'Experience', 'Review'];

  return (
    <div className="ap-page">
      <AdopterHeader backLink="/pets" backText="Back to Pets" />
      <div className="ap-wrap" style={{ paddingTop: '1.5rem' }}>

        {/* Main Detail Grid */}
        <div className="ap-detail-grid">
          {/* LEFT: Gallery */}
          <div>
            <img
              src={photos[selectedPhoto] || FALLBACK}
              alt={pet.name}
              className="ap-gallery-main-img"
              onError={e => { e.target.src = FALLBACK; }}
            />
            {photos.length > 1 && (
              <div className="ap-gallery-thumbs">
                {photos.map((ph, i) => (
                  <div key={i} className={`ap-gallery-thumb${selectedPhoto===i?' active':''}`} onClick={()=>setSelectedPhoto(i)}>
                    <img src={ph} alt={`View ${i+1}`} onError={e=>{e.target.src=FALLBACK;}}/>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Info */}
          <div className="ap-detail-info">
            <div className="ap-detail-name-row">
              <h1 className="ap-detail-name">{pet.name}</h1>
              <span className="ap-badge ap-badge-available">Available</span>
            </div>
            <div className="ap-detail-breed">{pet.breed || pet.species}</div>

            <div className="ap-detail-meta-row">
              <span className="ap-detail-meta-item">🎂 {pet.age ? `${pet.age} years` : 'Unknown'}</span>
              <span className="ap-detail-meta-item">⚥ {pet.gender || 'Unknown'}</span>
              <span className="ap-detail-meta-item"><MapPin size={14}/> {pet.shelter?.city || 'Chandigarh'}</span>
              <button 
                type="button" 
                onClick={() => setIsCareModalOpen(true)}
                style={{
                  border: '1px solid #A7F3D0',
                  background: '#ECFDF5',
                  color: '#065F46',
                  padding: '0.22rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.76rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                title="Click to open digital veterinary care passport dialog"
              >
                🩺 Verified Care Passport
              </button>
            </div>

            {/* Action Buttons */}
            <div className="ap-detail-actions">
              <button
                className={isFav ? 'ap-btn-secondary' : 'ap-btn-secondary'}
                onClick={handleFav}
                style={{display:'flex',alignItems:'center',gap:'0.4rem'}}
              >
                <Heart size={16} fill={isFav?'#DC2626':'none'} color={isFav?'#DC2626':'currentColor'}/>
                {isFav ? 'Saved to Favorites' : 'Add to Favorites'}
              </button>

              {isAdopter && (
                <button className="ap-btn-primary" onClick={()=>setIsApplyOpen(true)} style={{flex:1}}>
                  🐾 Apply for Adoption
                </button>
              )}
              {!isAuthenticated && (
                <Link to="/login" className="ap-btn-primary" style={{flex:1,textAlign:'center'}}>
                  Login to Apply
                </Link>
              )}
            </div>

            {/* Quick Digital Care Profile Dialog Button */}
            <button
              type="button"
              className="ap-btn-secondary"
              onClick={() => setIsCareModalOpen(true)}
              style={{
                width: '100%',
                marginBottom: '0.65rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: 'linear-gradient(135deg, #ECFDF5 0%, #F0FDF4 100%)',
                border: '1.5px solid #10B981',
                color: '#065F46',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.12)',
                cursor: 'pointer'
              }}
            >
              <ShieldCheck size={17} color="#059669" /> 📋 View Health &amp; Care Passport (Dialog)
            </button>

            {/* Meet & Greet & Compare buttons */}
            {isAdopter && (
              <button className="ap-btn-secondary" onClick={()=>setIsVisitOpen(true)} style={{width:'100%',marginBottom:'0.65rem'}}>
                <Calendar size={15}/> Schedule Meet &amp; Greet
              </button>
            )}

            <button
              className="ap-btn-secondary"
              onClick={() => {
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
              }}
              style={{ width: '100%', marginBottom: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem' }}
            >
              <Layers size={15} /> Compare with Other Pets
            </button>

            <Link
              to={`/cost-calculator?pet=${pet.id}`}
              className="ap-btn-secondary"
              style={{ width: '100%', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', textDecoration: 'none' }}
            >
              <Coins size={15} /> 💰 Estimate Adoption &amp; Care Budget
            </Link>

            {/* Tabs */}
            <div className="ap-detail-tabs-bar">
              {[{k:'about',l:'About'},{k:'health',l:'🏥 Digital Care Profile'},{k:'shelter',l:'Shelter Info'}].map(t=>(
                <button key={t.k} className={`ap-detail-tab${activeTab===t.k?' active':''}`} onClick={()=>setActiveTab(t.k)}>{t.l}</button>
              ))}
            </div>

            {activeTab === 'about' && (
              <div style={{fontSize:'0.88rem',color:'#4A6359',lineHeight:'1.65'}}>
                <p>{pet.description || `${pet.name} is a friendly, energetic ${pet.breed || pet.species}. They are well-socialised, great with people, and would make a wonderful family companion.`}</p>
                {pet.personality_traits?.length > 0 && (
                  <div className="ap-trait-pills">
                    {pet.personality_traits.map((t,i)=><span key={i} className="ap-trait-pill">{t}</span>)}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'health' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.65rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsCareModalOpen(true)}
                    style={{
                      border: '1px solid #A7F3D0',
                      background: '#ECFDF5',
                      color: '#065F46',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      padding: '0.35rem 0.8rem',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem'
                    }}
                  >
                    ⛶ Open in Interactive Dialog Box
                  </button>
                </div>
                <DigitalCareProfileCard pet={pet} />
              </div>
            )}

            {activeTab === 'shelter' && (
              <div style={{fontSize:'0.88rem',color:'#4A6359',lineHeight:'1.7'}}>
                <div style={{fontWeight:700,marginBottom:'0.4rem'}}>{pet.shelter?.shelter_name || 'Green Haven Animal Sanctuary'}</div>
                {pet.shelter?.address && <div style={{display:'flex',gap:'0.4rem',marginBottom:'0.25rem'}}><MapPin size={14} style={{flexShrink:0,marginTop:2}}/>{pet.shelter.address}</div>}
                {pet.shelter?.phone && <div style={{display:'flex',gap:'0.4rem',marginBottom:'0.25rem'}}><Phone size={14} style={{flexShrink:0,marginTop:2}}/>{pet.shelter.phone}</div>}
                {pet.shelter?.email && <div style={{display:'flex',gap:'0.4rem'}}><Mail size={14} style={{flexShrink:0,marginTop:2}}/>{pet.shelter.email}</div>}
              </div>
            )}
          </div>
        </div>

        {/* Similar Pets */}
        {similarPets.length > 0 && (
          <div style={{marginTop:'0.5rem'}}>
            <div className="ap-section-header">
              <h2 className="ap-section-title">Similar Pets</h2>
              <Link to="/pets" className="ap-section-link">View All</Link>
            </div>
            <div className="ap-pets-grid">
              {similarPets.map(p => (
                <div key={p.id} className="ap-pet-card">
                  <div className="ap-pet-img-wrap">
                    <img src={p.photo_url || p.image_url || FALLBACK} alt={p.name} className="ap-pet-img" onError={e=>{e.target.src=FALLBACK;}}/>
                    <span className="ap-pet-avail-badge">Available</span>
                  </div>
                  <div className="ap-pet-body">
                    <div className="ap-pet-name">{p.name}</div>
                    <div className="ap-pet-breed">{p.breed || p.species}</div>
                    <div className="ap-pet-meta">{p.age ? `${p.age} yrs` : 'Adult'} • {p.gender || 'Unknown'}</div>
                    <Link to={`/pets/${p.id}`} className="ap-pet-view-btn">View Details</Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── APPLY MODAL ──────────────────────────────────────── */}
      {isApplyOpen && (
        <div className="ap-modal-backdrop" onClick={()=>{if(!submitting && !applySuccess){setIsApplyOpen(false);setStep(1);setApplySuccess(null);setApplyError(null);}}}>
          <div className="ap-modal" onClick={e=>e.stopPropagation()}>
            <div className="ap-modal-header">
              <h3 className="ap-modal-title">🐾 Apply for Adoption</h3>
              <button className="ap-modal-close" onClick={()=>{setIsApplyOpen(false);setStep(1);setApplySuccess(null);setApplyError(null);}}><X size={18}/></button>
            </div>

            {applySuccess ? (
              <div style={{textAlign:'center',padding:'2rem 1rem'}}>
                <div style={{fontSize:'3rem',marginBottom:'0.75rem'}}>🎉</div>
                <div style={{fontFamily:'Nunito Sans',fontSize:'1.2rem',fontWeight:800,color:'#174C38',marginBottom:'0.5rem'}}>Application Submitted!</div>
                <p style={{color:'#4A6359',fontSize:'0.9rem',marginBottom:'1.5rem'}}>Your application for <strong>{pet.name}</strong> has been submitted. Shelter staff will review it and contact you soon.</p>
                <Link to="/my-applications" className="ap-btn-primary" onClick={()=>setIsApplyOpen(false)}>Track My Applications</Link>
              </div>
            ) : (
              <>
                {/* Stepper */}
                <div className="ap-stepper">
                  {STEPS.map((label, i) => {
                    const n = i + 1;
                    const isDone = step > n;
                    const isCurr = step === n;
                    return (
                      <React.Fragment key={n}>
                        <div className={`ap-step${isDone?' done':isCurr?' active':''}`}>
                          <div className="ap-step-dot">{isDone ? <Check size={11}/> : n}</div>
                          <span className="ap-step-label" style={{display:window.innerWidth>480?'inline':'none'}}>{label}</span>
                        </div>
                        {i < STEPS.length-1 && <div className="ap-step-line"/>}
                      </React.Fragment>
                    );
                  })}
                </div>

                {/* Pet Preview */}
                <div className="ap-app-pet-preview">
                  <img src={photos[0] || FALLBACK} alt={pet.name} onError={e=>{e.target.src=FALLBACK;}}/>
                  <div>
                    <div className="ap-app-pet-name">{pet.name}</div>
                    <div className="ap-app-pet-meta">{pet.breed || pet.species} • {pet.age ? `${pet.age} years` : 'Adult'} • {pet.gender || 'Unknown'}</div>
                  </div>
                </div>

                {applyError && (
                  <div style={{background:'#FDE8E8',border:'1px solid #FECACA',color:'#A82222',borderRadius:8,padding:'0.75rem 1rem',marginBottom:'1rem',fontSize:'0.85rem',display:'flex',gap:'0.5rem'}}>
                    <AlertCircle size={16} style={{flexShrink:0,marginTop:1}}/> {applyError}
                  </div>
                )}

                {/* Step 1: Personal Info */}
                {step === 1 && (
                  <div>
                    <h4 style={{fontFamily:'Nunito Sans',fontWeight:800,fontSize:'1rem',margin:'0 0 1rem',color:'#162620'}}>Personal Information</h4>
                    <div className="ap-form-grid">
                      <div className="ap-form-group">
                        <label className="ap-label">Full Name *</label>
                        <input className="ap-input" value={formData.fullName} onChange={e=>setFormData({...formData,fullName:e.target.value})}/>
                      </div>
                      <div className="ap-form-group">
                        <label className="ap-label">Email *</label>
                        <input type="email" className="ap-input" value={formData.email} onChange={e=>setFormData({...formData,email:e.target.value})}/>
                      </div>
                      <div className="ap-form-group">
                        <label className="ap-label">Phone *</label>
                        <input type="tel" className="ap-input" value={formData.phone} onChange={e=>setFormData({...formData,phone:e.target.value})}/>
                      </div>
                      <div className="ap-form-group">
                        <label className="ap-label">City *</label>
                        <input className="ap-input" value={formData.city} onChange={e=>setFormData({...formData,city:e.target.value})}/>
                      </div>
                    </div>
                    <div className="ap-form-group">
                      <label className="ap-label">Why do you want to adopt {pet.name}? *</label>
                      <textarea className="ap-textarea" rows={3} placeholder={`Tell us why you're interested in adopting ${pet.name}…`} value={formData.reason} onChange={e=>setFormData({...formData,reason:e.target.value})}/>
                    </div>
                  </div>
                )}

                {/* Step 2: Home & Lifestyle */}
                {step === 2 && (
                  <div>
                    <h4 style={{fontFamily:'Nunito Sans',fontWeight:800,fontSize:'1rem',margin:'0 0 1rem',color:'#162620'}}>Home &amp; Lifestyle</h4>
                    <div className="ap-form-group">
                      <label className="ap-label">Type of Living Situation</label>
                      <select className="ap-select" style={{width:'100%'}} value={formData.living_type} onChange={e=>setFormData({...formData,living_type:e.target.value})}>
                        {['Apartment','Independent House','Independent House with Yard','Farm / Rural','Sharing Accommodation'].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="ap-form-group">
                      <label className="ap-label">Household Members</label>
                      <input className="ap-input" value={formData.household_members} onChange={e=>setFormData({...formData,household_members:e.target.value})} placeholder="e.g. 2 Adults, 1 Child"/>
                    </div>
                    <div className="ap-form-group">
                      <label className="ap-label">Hours Pet Will Be Alone Daily</label>
                      <select className="ap-select" style={{width:'100%'}} value={formData.hours_alone} onChange={e=>setFormData({...formData,hours_alone:e.target.value})}>
                        {['0–2 hours','2–4 hours','4–6 hours','6–8 hours','More than 8 hours'].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                  </div>
                )}

                {/* Step 3: Experience */}
                {step === 3 && (
                  <div>
                    <h4 style={{fontFamily:'Nunito Sans',fontWeight:800,fontSize:'1rem',margin:'0 0 1rem',color:'#162620'}}>Pet Experience</h4>
                    <div className="ap-form-group">
                      <label className="ap-label">Experience Level</label>
                      <select className="ap-select" style={{width:'100%'}} value={formData.experience_level} onChange={e=>setFormData({...formData,experience_level:e.target.value})}>
                        {['First-time owner','Some experience','Experienced dog owner','Professional / Trainer'].map(o=><option key={o}>{o}</option>)}
                      </select>
                    </div>
                    <div className="ap-form-group">
                      <label className="ap-label">Other Pets at Home</label>
                      <input className="ap-input" value={formData.other_pets} onChange={e=>setFormData({...formData,other_pets:e.target.value})} placeholder="e.g. 1 cat, No other pets"/>
                    </div>
                    <div className="ap-form-group" style={{flexDirection:'row',alignItems:'center',gap:'0.65rem',cursor:'pointer'}} onClick={()=>setFormData({...formData,agreement:!formData.agreement})}>
                      <div style={{width:18,height:18,borderRadius:5,border:'2px solid',borderColor:formData.agreement?'#174C38':'#CBD5E1',background:formData.agreement?'#174C38':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                        {formData.agreement && <Check size={11} color="#fff"/>}
                      </div>
                      <span style={{fontSize:'0.85rem',color:'#4A6359'}}>I agree to the adoption terms and understand this is a long-term commitment.</span>
                    </div>
                  </div>
                )}

                {/* Step 4: Review */}
                {step === 4 && (
                  <div>
                    <h4 style={{fontFamily:'Nunito Sans',fontWeight:800,fontSize:'1rem',margin:'0 0 1rem',color:'#162620'}}>Review Your Application</h4>
                    <div style={{background:'#F8F5EF',borderRadius:10,padding:'1rem',fontSize:'0.85rem',display:'flex',flexDirection:'column',gap:'0.5rem'}}>
                      {[['Name',formData.fullName],['Email',formData.email],['Phone',formData.phone],['City',formData.city],['Housing',formData.living_type],['Household',formData.household_members],['Experience',formData.experience_level],['Other Pets',formData.other_pets]].map(([k,v])=>(
                        <div key={k} style={{display:'flex',gap:'0.5rem'}}><strong style={{minWidth:90,color:'#162620'}}>{k}:</strong><span style={{color:'#4A6359'}}>{v}</span></div>
                      ))}
                      <div><strong style={{minWidth:90,color:'#162620'}}>Reason:</strong></div>
                      <div style={{color:'#4A6359',marginTop:'-0.25rem',paddingLeft:'0'}}>{formData.reason}</div>
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'1.5rem',paddingTop:'1rem',borderTop:'1px solid #EDEBE6'}}>
                  <button className="ap-btn-secondary" onClick={()=>step>1?setStep(s=>s-1):setIsApplyOpen(false)}>{step>1 ? '← Back' : 'Cancel'}</button>
                  {step < 4 ? (
                    <button className="ap-btn-primary" onClick={()=>{
                      if(step===1 && !formData.reason.trim()){setApplyError('Please tell us why you want to adopt.');return;}
                      setApplyError(null); setStep(s=>s+1);
                    }}>Next →</button>
                  ) : (
                    <button className="ap-btn-primary" disabled={submitting} onClick={handleApplySubmit}>
                      {submitting ? 'Submitting…' : 'Submit Application'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── VISIT MODAL ──────────────────────────────────────── */}
      {isVisitOpen && (
        <ScheduleMeetAndGreetModal
          isOpen={isVisitOpen}
          pet={pet}
          onClose={() => setIsVisitOpen(false)}
          onSuccess={() => {
            setIsVisitOpen(false);
          }}
        />
      )}

      {/* ── DIGITAL CARE PROFILE & HEALTH PASSPORT DIALOG BOX ── */}
      <DigitalCareProfileModal
        isOpen={isCareModalOpen}
        onClose={() => setIsCareModalOpen(false)}
        pet={pet}
        onApply={() => setIsApplyOpen(true)}
        isAdopter={isAdopter}
      />
    </div>
  );
};

export default PetDetailPage;
