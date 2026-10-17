import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, MapPin, Calendar, Check, ChevronRight, PawPrint, Search, Award, Clock, AlertCircle, FileCheck2, Feather } from 'lucide-react';
import { adoptionsApi } from '../api/adoptionsApi';
import AdopterHeader from '../components/AdopterHeader';
import AdoptionCertificateModal from '../components/AdoptionCertificateModal';
import AdoptionContractModal from '../components/AdoptionContractModal';
import ScheduleMeetAndGreetModal from '../components/ScheduleMeetAndGreetModal';
import VerifiedAdopterBadgeCard from '../components/VerifiedAdopterBadgeCard';
import '../styles/adopter-portal.css';
import '../styles/meet-and-greet.css';

const FALLBACK = 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=200&q=80';

const STATUS_MAP = {
  submitted: { label: 'Submitted', cls: 'ap-badge-review' },
  under_review: { label: 'Under Review', cls: 'ap-badge-review' },
  approved: { label: 'Approved', cls: 'ap-badge-approved' },
  rejected: { label: 'Rejected', cls: 'ap-badge-rejected' },
  withdrawn: { label: 'Withdrawn', cls: 'ap-badge-rejected' },
};

const TRACKER_STEPS = ['Submitted', 'Under Review', 'Decision'];

const getTrackerIndex = (status) => {
  const s = status?.toLowerCase();
  if (s === 'submitted') return 0;
  if (s === 'under_review') return 1;
  if (s === 'approved' || s === 'rejected' || s === 'withdrawn') return 2;
  return 0;
};

const MyApplicationsPage = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCertAppId, setSelectedCertAppId] = useState(null);
  const [selectedContractAppId, setSelectedContractAppId] = useState(null);
  const [selectedVisitApp, setSelectedVisitApp] = useState(null);

  const loadApplications = async () => {
    try {
      const res = await adoptionsApi.getMyApplications();
      setApplications(res.applications || []);
    } catch (e) {
      console.error('Failed to load applications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  const handleCancelVisit = async (visitId) => {
    if (!window.confirm('Are you sure you want to cancel this Meet & Greet appointment?')) return;
    try {
      await adoptionsApi.cancelVisit(visitId);
      loadApplications();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to cancel visit.');
    }
  };

  const filteredApps = applications.filter(app => {
    const statusMatch = filter === 'all' || app.status?.toLowerCase() === filter;
    const searchMatch = !searchQuery || app.pet?.name?.toLowerCase().includes(searchQuery.toLowerCase()) || app.pet?.breed?.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && searchMatch;
  }).sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at);
    return new Date(a.created_at) - new Date(b.created_at);
  });

  const counts = {
    all: applications.length,
    submitted: applications.filter(a => a.status?.toLowerCase() === 'submitted').length,
    under_review: applications.filter(a => a.status?.toLowerCase() === 'under_review').length,
    approved: applications.filter(a => a.status?.toLowerCase() === 'approved').length,
    rejected: applications.filter(a => a.status?.toLowerCase() === 'rejected').length,
  };

  return (
    <div className="ap-page">
      <AdopterHeader searchValue={searchQuery} onSearchChange={setSearchQuery} />
      <div className="ap-wrap">
        <div className="ap-page-header">
          <h1 className="ap-page-title"><FileText size={26}/> My Applications</h1>
          <p className="ap-page-subtitle">Track the status of your adoption applications.</p>
        </div>

        {/* Official Verified Adopter Credential Card */}
        <div style={{ marginBottom: '1.5rem' }}>
          <VerifiedAdopterBadgeCard />
        </div>

        {/* Filter Pills */}
        <div className="ap-pills-bar">
          {[
            {k:'all', l:'All'},
            {k:'submitted', l:'Submitted'},
            {k:'under_review', l:'Under Review'},
            {k:'approved', l:'Approved'},
            {k:'rejected', l:'Rejected'},
          ].map(f => (
            <button
              key={f.k}
              className={`ap-pill${filter===f.k?' active':''}`}
              onClick={()=>setFilter(f.k)}
            >
              {f.l} ({counts[f.k] || 0})
            </button>
          ))}
        </div>

        {/* Search & Sort Row */}
        <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1.25rem',flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.4rem',background:'#fff',border:'1px solid #E5E0D8',borderRadius:10,padding:'0.4rem 0.85rem',flex:1,minWidth:200}}>
            <Search size={14} color="#7A9187"/>
            <input
              value={searchQuery}
              onChange={e=>setSearchQuery(e.target.value)}
              placeholder="Search applications…"
              style={{border:'none',background:'transparent',outline:'none',fontFamily:'inherit',fontSize:'0.84rem',color:'#162620',width:'100%'}}
            />
          </div>
          <div style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.84rem',color:'#7A9187'}}>
            Sort by:
            <select className="ap-select" style={{minWidth:'unset'}} value={sortBy} onChange={e=>setSortBy(e.target.value)}>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{padding:'4rem',textAlign:'center',color:'#7A9187'}}>
            <PawPrint size={44} style={{margin:'0 auto 1rem',color:'#174C38'}}/>
            <div>Loading your applications…</div>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="ap-empty">
            <FileText size={52} color="#174C38"/>
            <div className="ap-empty-title">No applications found</div>
            <div className="ap-empty-desc">
              {filter !== 'all' ? 'No applications match this filter.' : 'You haven\'t applied for any pets yet.'}
            </div>
            {filter === 'all' && <Link to="/pets" className="ap-btn-primary" style={{marginTop:'0.5rem'}}>Browse Pets to Apply</Link>}
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {filteredApps.map(app => {
              const pet = app.pet || {};
              const status = app.status?.toLowerCase() || 'submitted';
              const statusInfo = STATUS_MAP[status] || STATUS_MAP.submitted;
              const trackerIdx = getTrackerIndex(status);
              const submittedDate = app.created_at ? new Date(app.created_at).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'}) : 'Recently';

              return (
                <div key={app.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <div className="ap-app-card">
                    {/* Left: Pet Thumbnail + Info */}
                    <div className="ap-app-left">
                      <img
                        src={pet.photo_url || pet.image_url || FALLBACK}
                        alt={pet.name || 'Pet'}
                        className="ap-app-pet-thumb"
                        onError={e => { e.target.src = FALLBACK; }}
                      />
                      <div className="ap-app-info">
                        <div className="ap-app-pet-name-text">{pet.name || 'Unknown Pet'}</div>
                        <div className="ap-app-breed-text">{pet.breed || pet.species || '—'}</div>
                        <div className="ap-app-date-text">
                          <Calendar size={13} color="#174C38" /> Applied on {submittedDate}
                        </div>
                      </div>
                    </div>

                    {/* Center: Status Badge + Horizontal Timeline Tracker */}
                    <div className="ap-app-center">
                      <div className="ap-app-status-badge-row">
                        <span className={`ap-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
                      </div>

                      <div className="ap-timeline-tracker">
                        <div className="ap-timeline-line">
                          <div 
                            className="ap-timeline-line-fill" 
                            style={{ width: trackerIdx === 0 ? '0%' : trackerIdx === 1 ? '50%' : '100%' }}
                          />
                        </div>
                        <div className="ap-timeline-steps">
                          {TRACKER_STEPS.map((label, i) => {
                            const isDone = trackerIdx > i;
                            const isCurrent = trackerIdx === i;
                            const stepLabel = (i === 2 && status === 'approved') ? 'Approved' : (i === 2 && status === 'rejected') ? 'Rejected' : label;
                            return (
                              <div key={label} className={`ap-timeline-step${isDone ? ' done' : isCurrent ? ' current' : ''}`}>
                                <div className={`ap-timeline-dot${isDone ? ' done' : isCurrent ? ' current' : ''}`}>
                                  {isDone ? (
                                    <Check size={10} strokeWidth={2.6} color="#FFFFFF" />
                                  ) : isCurrent ? (
                                    <div className="ap-timeline-dot-inner" />
                                  ) : null}
                                </div>
                                <span className={`ap-timeline-label${isDone || isCurrent ? ' active' : ''}`}>
                                  {stepLabel}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="ap-app-right" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', alignItems: 'flex-end' }}>
                      {(status === 'approved' || status === 'completed') && (
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => setSelectedContractAppId(app.id)}
                            className="ap-btn-cert"
                            style={app.contract_signed ? { background: 'linear-gradient(135deg, #103324 0%, #174C38 100%)', color: '#6EE7B7' } : { background: 'linear-gradient(135deg, #D4AF37 0%, #AA820A 100%)', color: '#0A1C14' }}
                            title={app.contract_signed ? 'View Executed Digital Adoption Agreement' : 'Action Required: Digitally Sign Adoption Agreement'}
                          >
                            {app.contract_signed ? <FileCheck2 size={15} color="#6EE7B7" /> : <Feather size={15} color="#0A1C14" />}
                            <span>{app.contract_signed ? 'Contract Signed' : 'Sign Agreement'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedCertAppId(app.id)}
                            className="ap-btn-cert"
                            title="View Official Adoption Certificate"
                          >
                            <Award size={15} />
                            <span>Certificate</span>
                          </button>
                        </div>
                      )}

                      {!app.visit && (status === 'submitted' || status === 'under_review') && (
                        <button
                          type="button"
                          onClick={() => setSelectedVisitApp(app)}
                          className="ap-btn-primary"
                          style={{ fontSize: '0.82rem', padding: '0.45rem 0.95rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', whiteSpace: 'nowrap' }}
                        >
                          <Calendar size={13} />
                          <span>Schedule Meet &amp; Greet</span>
                        </button>
                      )}

                      <Link to={`/pets/${pet.id}`} className="ap-btn-secondary" style={{ fontSize: '0.84rem', padding: '0.48rem 1.05rem', whiteSpace: 'nowrap' }}>
                        View Details
                      </Link>
                    </div>
                  </div>

                  {/* Integrated Meet & Greet Status Banner */}
                  {app.visit && (
                    <div className="mg-app-visit-banner">
                      <div className="mg-app-visit-left">
                        <div className="mg-app-visit-icon">
                          <Calendar size={18} />
                        </div>
                        <div>
                          <div className="mg-app-visit-title">
                            <span>Meet &amp; Greet {app.visit.status === 'confirmed' ? 'Confirmed' : app.visit.status === 'completed' ? 'Completed' : 'Requested'}</span>
                            <span 
                              className={`ap-badge ${app.visit.status === 'confirmed' ? 'ap-badge-confirmed' : app.visit.status === 'cancelled' ? 'ap-badge-rejected' : 'ap-badge-review'}`}
                              style={{ fontSize: '0.72rem', padding: '0.15rem 0.5rem', textTransform: 'capitalize' }}
                            >
                              {app.visit.status}
                            </span>
                          </div>
                          <div className="mg-app-visit-sub">
                            📅 {app.visit.visit_date} • ⏰ {app.visit.visit_time || app.visit.time_slot} • 📍 {app.visit.shelter_name || 'Shelter'}
                            {app.visit.visit_type === 'virtual' ? ' (📹 Virtual Video Call)' : ' (🏢 Shelter Visit)'}
                          </div>
                        </div>
                      </div>

                      <div className="mg-app-visit-actions">
                        {app.visit.status !== 'cancelled' && app.visit.status !== 'completed' && (
                          <button
                            type="button"
                            className="mg-btn-visit-action danger"
                            onClick={() => handleCancelVisit(app.visit.id)}
                          >
                            Cancel Appointment
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Official Adoption Certificate Modal */}
        <AdoptionCertificateModal
          isOpen={!!selectedCertAppId}
          applicationId={selectedCertAppId}
          onClose={() => setSelectedCertAppId(null)}
        />

        {/* Digital Adoption Agreement & E-Signature Contract Modal */}
        <AdoptionContractModal
          isOpen={!!selectedContractAppId}
          applicationId={selectedContractAppId}
          onClose={() => setSelectedContractAppId(null)}
          onSigned={() => {
            loadApplications();
          }}
        />

        {/* Schedule Meet & Greet Modal */}
        {selectedVisitApp && (
          <ScheduleMeetAndGreetModal
            isOpen={!!selectedVisitApp}
            pet={selectedVisitApp.pet}
            applicationId={selectedVisitApp.id}
            onClose={() => setSelectedVisitApp(null)}
            onSuccess={() => {
              setSelectedVisitApp(null);
              loadApplications();
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MyApplicationsPage;
