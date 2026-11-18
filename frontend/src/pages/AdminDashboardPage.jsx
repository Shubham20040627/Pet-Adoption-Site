import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, Building, CheckCircle2, XCircle, Clock, 
  Search, RefreshCw, LogOut, Check, X, Phone, Mail, MapPin, 
  FileText, Users, Eye, Bell, ChevronRight, ChevronLeft, ChevronDown, 
  ClipboardCheck, PawPrint
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/adminApi';
import '../styles/admin-dashboard.css';

const CAROUSEL_SLIDES = [
  {
    title: 'Central Administration',
    subtitle: 'Shelter Verification, Review & Approval Oversight',
  },
  {
    title: 'Rescue Welfare & AWBI Compliance',
    subtitle: 'Inspecting verification credentials and community animal safety standards',
  },
  {
    title: 'Platform-Wide Moderation',
    subtitle: 'Centralized auditing across all registered shelters and active adoption listings',
  },
];

const AdminDashboardPage = () => {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [shelters, setShelters] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [rejectModalShelter, setRejectModalShelter] = useState(null);
  const [reviewModalShelter, setReviewModalShelter] = useState(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);

  // Sync active tab with URL query (?tab=pending | ?tab=all)
  const tabFromUrl = searchParams.get('tab');
  const activeTab = tabFromUrl === 'all' ? 'all' : 'pending';
  const setActiveTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [overviewData, sheltersData] = await Promise.all([
        adminApi.getOverview(),
        adminApi.getShelters(),
      ]);
      setOverview(overviewData);
      setShelters(sheltersData.shelters || []);
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle 1-click or modal Approve
  const handleApprove = async (shelter) => {
    const shelterId = shelter.user_id || shelter.id;
    setActionLoadingId(shelterId);
    try {
      await adminApi.updateShelterStatus(shelterId, { status: 'approved' });
      showToast(`✓ Shelter "${shelter.shelter_name}" has been APPROVED and activated!`);
      setShelters((prev) =>
        prev.map((s) => (s.id === shelter.id || s.user_id === shelter.user_id ? { ...s, status: 'approved', verified: true } : s))
      );
      adminApi.getOverview().then(setOverview).catch(() => {});
    } catch (err) {
      console.error('Failed to approve shelter:', err);
      alert('Failed to approve shelter. Please try again.');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Open Reject Modal
  const openRejectModal = (shelter) => {
    setRejectModalShelter(shelter);
    setRejectionNote('');
  };

  // Submit Rejection
  const handleConfirmReject = async () => {
    if (!rejectModalShelter) return;
    const shelterId = rejectModalShelter.user_id || rejectModalShelter.id;
    setActionLoadingId(shelterId);
    try {
      await adminApi.updateShelterStatus(shelterId, {
        status: 'rejected',
        note: rejectionNote || 'Documentation or license criteria not met.',
      });
      showToast(`Shelter "${rejectModalShelter.shelter_name}" has been DISAPPROVED.`);
      setShelters((prev) =>
        prev.map((s) =>
          s.id === rejectModalShelter.id || s.user_id === rejectModalShelter.user_id
            ? { ...s, status: 'rejected', verified: false, admin_note: rejectionNote }
            : s
        )
      );
      setRejectModalShelter(null);
      adminApi.getOverview().then(setOverview).catch(() => {});
    } catch (err) {
      console.error('Failed to reject shelter:', err);
      alert('Failed to update shelter status.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingShelters = useMemo(() => shelters.filter((s) => s.status === 'pending'), [shelters]);
  const approvedShelters = useMemo(() => shelters.filter((s) => s.status === 'approved'), [shelters]);
  const rejectedShelters = useMemo(() => shelters.filter((s) => s.status === 'rejected'), [shelters]);

  // Filtered & Sorted Shelters
  const displayedShelters = useMemo(() => {
    return shelters.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.shelter_name?.toLowerCase().includes(q) ||
        s.contact_email?.toLowerCase().includes(q) ||
        s.address?.toLowerCase().includes(q) ||
        s.phone?.includes(q) ||
        s.license_code?.toLowerCase().includes(q);

      if (activeTab === 'pending') {
        return s.status === 'pending' && matchesSearch;
      }

      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }

      return matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return (a.shelter_name || '').localeCompare(b.shelter_name || '');
      }
      return 0; // Default order
    });
  }, [shelters, searchQuery, activeTab, statusFilter, sortBy]);

  const prevSlide = () => setActiveSlide((prev) => (prev === 0 ? CAROUSEL_SLIDES.length - 1 : prev - 1));
  const nextSlide = () => setActiveSlide((prev) => (prev === CAROUSEL_SLIDES.length - 1 ? 0 : prev + 1));

  const currentSlide = CAROUSEL_SLIDES[activeSlide];

  return (
    <div className="admin-portal-wrap">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="admin-toast-banner">
          <CheckCircle2 size={18} color="#34D399" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          1. TOP NAVIGATION HEADER
         ═══════════════════════════════════════════════════════════ */}
      <header className="admin-top-nav-bar">
        {/* Search Input across the top */}
        <div className="admin-top-search-wrap">
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            className="admin-top-search-input"
            placeholder="Search shelters by name, email, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Top Bar Actions */}
        <div className="admin-top-nav-actions">
          {/* Notification Bell */}
          <button type="button" className="admin-notif-bell-btn" title="Admin Notifications">
            <Bell size={18} />
            {pendingShelters.length > 0 && <span className="admin-notif-badge-dot" />}
          </button>

          {/* User Profile Badge */}
          <div className="admin-user-profile-badge">
            <div className="admin-user-avatar-circle">C</div>
            <span className="admin-user-name">Central Administrator</span>
            <ChevronDown size={14} color="#64748B" />
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            className="admin-header-pill-btn"
            onClick={loadData}
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Sign Out Action */}
          <button
            type="button"
            className="admin-header-pill-btn"
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            title="Sign out of Admin Session"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ═══════════════════════════════════════════════════════════
          2. HERO BANNER / CAROUSEL
         ═══════════════════════════════════════════════════════════ */}
      <section className="admin-hero-banner-card">
        {/* Carousel Prev Arrow */}
        <button
          type="button"
          className="admin-carousel-arrow-btn left"
          onClick={prevSlide}
          aria-label="Previous slide"
        >
          <ChevronLeft size={18} />
        </button>

        {/* Left Content */}
        <div className="admin-hero-text-block">
          <div className="admin-hero-brand-line">
            <PawPrint size={18} color="#0066FF" />
            <span>PawConnect</span>
          </div>

          <h1 className="admin-hero-main-title">{currentSlide.title}</h1>
          <p className="admin-hero-subtitle">{currentSlide.subtitle}</p>

          {/* Accent Blue Underline */}
          <div className="admin-hero-accent-bar" />

          {/* Carousel Pagination Dots */}
          <div className="admin-carousel-dots-row">
            {CAROUSEL_SLIDES.map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`admin-carousel-dot-btn ${idx === activeSlide ? 'active' : ''}`}
                onClick={() => setActiveSlide(idx)}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Right Image Graphic */}
        <div className="admin-hero-img-container">
          <img
            src="/adopter-hero-pets.jpg"
            alt="Central Administration Pets"
            className="admin-hero-pets-visual"
          />
        </div>

        {/* Carousel Next Arrow */}
        <button
          type="button"
          className="admin-carousel-arrow-btn right"
          onClick={nextSlide}
          aria-label="Next slide"
        >
          <ChevronRight size={18} />
        </button>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          3. SUMMARY METRIC KPI CARDS (Exact 4 Cards from Design)
         ═══════════════════════════════════════════════════════════ */}
      <section className="admin-metrics-row-grid">
        {/* Card 1: Pending Approvals */}
        <div
          className={`admin-metric-card blue ${activeTab === 'pending' ? 'active-tab' : ''}`}
          onClick={() => setActiveTab('pending')}
          role="button"
          tabIndex={0}
        >
          <div className="admin-metric-icon-circle blue">
            <Clock size={24} />
          </div>
          <div className="admin-metric-info">
            <div className="admin-metric-number">{pendingShelters.length}</div>
            <div className="admin-metric-label">Pending Approval Requests</div>
          </div>
        </div>

        {/* Card 2: Verified & Active Shelters */}
        <div
          className={`admin-metric-card green ${activeTab === 'all' && statusFilter === 'approved' ? 'active-tab' : ''}`}
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('approved');
          }}
          role="button"
          tabIndex={0}
        >
          <div className="admin-metric-icon-circle green">
            <ShieldCheck size={24} />
          </div>
          <div className="admin-metric-info">
            <div className="admin-metric-number">{approvedShelters.length}</div>
            <div className="admin-metric-label">Verified &amp; Active Shelters</div>
          </div>
        </div>

        {/* Card 3: Disapproved / Rejected */}
        <div
          className={`admin-metric-card red ${activeTab === 'all' && statusFilter === 'rejected' ? 'active-tab' : ''}`}
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('rejected');
          }}
          role="button"
          tabIndex={0}
        >
          <div className="admin-metric-icon-circle red">
            <XCircle size={24} />
          </div>
          <div className="admin-metric-info">
            <div className="admin-metric-number">{rejectedShelters.length}</div>
            <div className="admin-metric-label">Disapproved / Rejected</div>
          </div>
        </div>

        {/* Card 4: Total Shelters Onboarded */}
        <div
          className={`admin-metric-card purple ${activeTab === 'all' && statusFilter === 'all' ? 'active-tab' : ''}`}
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('all');
          }}
          role="button"
          tabIndex={0}
        >
          <div className="admin-metric-icon-circle purple">
            <Users size={24} />
          </div>
          <div className="admin-metric-info">
            <div className="admin-metric-number">{shelters.length}</div>
            <div className="admin-metric-label">Total Shelters Onboarded</div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          4. TABS NAVIGATION BAR
         ═══════════════════════════════════════════════════════════ */}
      <div className="admin-tabs-nav-bar">
        <button
          type="button"
          className={`admin-tab-item ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <ClipboardCheck size={18} />
          <span>Shelter Approvals Queue</span>
          <span className="admin-tab-count-badge blue">{pendingShelters.length}</span>
        </button>

        <button
          type="button"
          className={`admin-tab-item ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('all');
          }}
        >
          <Building size={18} />
          <span>All Registered Shelters</span>
          <span className="admin-tab-count-badge gray">{shelters.length}</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          5. SUB-TOOLBAR / SEARCH BAR
         ═══════════════════════════════════════════════════════════ */}
      <div className="admin-sub-toolbar-row">
        <div className="admin-sub-search-box">
          <Search size={16} color="#94A3B8" />
          <input
            type="text"
            className="admin-sub-search-input"
            placeholder="Search by shelter name, email, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {activeTab === 'all' && (
          <div className="admin-sub-filters-group">
            <select
              className="admin-sub-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses ({shelters.length})</option>
              <option value="approved">Approved &amp; Active ({approvedShelters.length})</option>
              <option value="pending">Pending Review ({pendingShelters.length})</option>
              <option value="rejected">Disapproved ({rejectedShelters.length})</option>
            </select>

            <select
              className="admin-sub-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Recently Registered</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        )}

        <button
          type="button"
          className="admin-sub-refresh-btn"
          onClick={loadData}
          title="Refresh List"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          6. SHELTER ROWS LIST (Matching Reference Mockup Rows)
         ═══════════════════════════════════════════════════════════ */}
      <div className="admin-shelters-list-wrapper">
        {loading ? (
          <div className="admin-loading-state">
            <RefreshCw size={28} className="animate-spin" />
            <p>Loading Central Administration records...</p>
          </div>
        ) : displayedShelters.length === 0 ? (
          <div className="admin-empty-state-card">
            <CheckCircle2 size={44} color="#10B981" />
            <h3>All Caught Up!</h3>
            <p>
              {activeTab === 'pending'
                ? 'There are no pending shelter registrations awaiting approval.'
                : 'No shelters match your current search and filter settings.'}
            </p>
          </div>
        ) : (
          <div className="admin-shelter-rows-container">
            {displayedShelters.map((s) => {
              const shelterId = s.user_id || s.id || '';
              const isOperating = actionLoadingId === shelterId;
              const licCode = s.license_code || s.registration_number || `REG-${shelterId.slice(-4).toUpperCase()}`;
              const isPending = s.status === 'pending';
              const isApproved = s.status === 'approved';
              const isRejected = s.status === 'rejected';

              return (
                <div key={s.id || s.user_id} className="admin-shelter-row-card">
                  {/* Left Column Group: Icon + Name + Dividers + Contact Details */}
                  <div className="admin-row-left-content">
                    {/* Shelter Icon Box */}
                    <div className="admin-row-shelter-icon-box">
                      <Building size={20} />
                    </div>

                    {/* Shelter Name & License */}
                    <div className="admin-row-name-license-col">
                      <h3 className="admin-row-shelter-title">{s.shelter_name}</h3>
                      <span className="admin-row-license-text">Lic: {licCode}</span>
                    </div>

                    <div className="admin-row-vertical-divider" />

                    {/* Email */}
                    <div className="admin-row-meta-item">
                      <Mail size={15} className="admin-row-meta-icon" />
                      <span className="admin-row-meta-val">{s.contact_email || 'contact@shelter.org'}</span>
                    </div>

                    <div className="admin-row-vertical-divider" />

                    {/* Phone */}
                    <div className="admin-row-meta-item">
                      <Phone size={15} className="admin-row-meta-icon" />
                      <span className="admin-row-meta-val">{s.phone || s.user_phone || '9876543210'}</span>
                    </div>

                    <div className="admin-row-vertical-divider" />

                    {/* Location */}
                    <div className="admin-row-meta-item admin-row-loc-item">
                      <MapPin size={15} className="admin-row-meta-icon" />
                      <span className="admin-row-meta-val">{s.address || 'Facility Address, India'}</span>
                    </div>

                    <div className="admin-row-vertical-divider" />

                    {/* Status Pill Badge */}
                    <div className="admin-row-status-col">
                      {isApproved ? (
                        <span className="admin-status-pill approved">
                          <Check size={12} strokeWidth={2.5} />
                          <span>Approved &amp; Active</span>
                        </span>
                      ) : isRejected ? (
                        <span className="admin-status-pill rejected">
                          <X size={12} strokeWidth={2.5} />
                          <span>Disapproved</span>
                        </span>
                      ) : (
                        <span className="admin-status-pill pending">
                          <Clock size={12} />
                          <span>Pending Review</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions Group: View (Eye), Approve (Check), Reject (X) */}
                  <div className="admin-row-actions-group">
                    {/* View Details Button */}
                    <button
                      type="button"
                      className="admin-row-action-btn view"
                      onClick={() => setReviewModalShelter(s)}
                      title="Inspect Shelter Verification Details"
                    >
                      <Eye size={17} />
                    </button>

                    {/* Approve Button */}
                    {isApproved ? (
                      <button
                        type="button"
                        className="admin-row-action-btn approve disabled"
                        disabled
                        title="Shelter Already Approved"
                      >
                        <Check size={18} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-row-action-btn approve"
                        onClick={() => handleApprove(s)}
                        disabled={isOperating}
                        title="Approve &amp; Activate Shelter"
                      >
                        <Check size={18} strokeWidth={2.5} />
                      </button>
                    )}

                    {/* Reject Button */}
                    {isRejected ? (
                      <button
                        type="button"
                        className="admin-row-action-btn reject disabled"
                        disabled
                        title="Shelter Already Disapproved"
                      >
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="admin-row-action-btn reject"
                        onClick={() => openRejectModal(s)}
                        disabled={isOperating}
                        title="Disapprove Shelter Registration"
                      >
                        <X size={18} strokeWidth={2.5} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          7. SHELTER INSPECTION / REVIEW MODAL
         ═══════════════════════════════════════════════════════════ */}
      {reviewModalShelter && (
        <div className="admin-modal-backdrop" onClick={() => setReviewModalShelter(null)}>
          <div className="admin-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <div>
                <div className="admin-modal-status-row">
                  <span className={`admin-status-pill ${reviewModalShelter.status === 'approved' ? 'approved' : reviewModalShelter.status === 'rejected' ? 'rejected' : 'pending'}`}>
                    {reviewModalShelter.status === 'approved' ? (
                      <><Check size={12} strokeWidth={2.5} /> Approved &amp; Active</>
                    ) : reviewModalShelter.status === 'rejected' ? (
                      <><X size={12} strokeWidth={2.5} /> Disapproved</>
                    ) : (
                      <><Clock size={12} /> Pending Review</>
                    )}
                  </span>
                  <span className="admin-modal-sub-id">
                    ID: {reviewModalShelter.id || reviewModalShelter.user_id}
                  </span>
                </div>
                <h2 className="admin-modal-title">
                  <Building size={22} color="#0066FF" />
                  {reviewModalShelter.shelter_name}
                </h2>
              </div>

              <button
                type="button"
                className="admin-modal-close-btn"
                onClick={() => setReviewModalShelter(null)}
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Information Grid */}
            <div className="admin-modal-grid">
              <div className="admin-modal-item">
                <div className="admin-modal-item-label">
                  <Mail size={13} /> Contact Email
                </div>
                <div className="admin-modal-item-val">
                  {reviewModalShelter.contact_email || 'Not provided'}
                </div>
              </div>

              <div className="admin-modal-item">
                <div className="admin-modal-item-label">
                  <Phone size={13} /> Contact Phone
                </div>
                <div className="admin-modal-item-val">
                  {reviewModalShelter.phone || reviewModalShelter.user_phone || 'Not provided'}
                </div>
              </div>

              <div className="admin-modal-item">
                <div className="admin-modal-item-label">
                  <MapPin size={13} /> Facility Address
                </div>
                <div className="admin-modal-item-val">
                  {reviewModalShelter.address || 'Address not registered'}
                </div>
              </div>

              <div className="admin-modal-item">
                <div className="admin-modal-item-label">
                  <ShieldCheck size={13} /> License / Reg Code
                </div>
                <div className="admin-modal-item-val">
                  {reviewModalShelter.license_code || reviewModalShelter.registration_number || `REG-${(reviewModalShelter.user_id || reviewModalShelter.id || '').slice(-6).toUpperCase()}`}
                </div>
              </div>
            </div>

            {/* Shelter Bio / Mission Statement */}
            <div className="admin-modal-bio-box">
              <div className="admin-modal-item-label" style={{ marginBottom: '0.4rem' }}>
                <FileText size={13} /> Shelter Mission &amp; Facility Description
              </div>
              <p className="admin-modal-bio-text">
                {reviewModalShelter.bio || 'No mission statement or bio was submitted by this organization.'}
              </p>
            </div>

            {/* Previous Admin Note (if any) */}
            {reviewModalShelter.admin_note && (
              <div className="admin-modal-note-box">
                <div className="admin-modal-note-title">
                  Admin Review Note:
                </div>
                <div className="admin-modal-note-body">
                  {reviewModalShelter.admin_note}
                </div>
              </div>
            )}

            {/* Actions Inside Review Modal */}
            <div className="admin-modal-actions-bar">
              <button
                type="button"
                className="admin-header-pill-btn"
                onClick={() => setReviewModalShelter(null)}
              >
                Close
              </button>

              {reviewModalShelter.status !== 'rejected' && (
                <button
                  type="button"
                  className="admin-btn-disapprove-action"
                  onClick={() => {
                    const target = reviewModalShelter;
                    setReviewModalShelter(null);
                    openRejectModal(target);
                  }}
                >
                  <X size={15} />
                  <span>Disapprove Shelter</span>
                </button>
              )}

              {reviewModalShelter.status !== 'approved' && (
                <button
                  type="button"
                  className="admin-btn-approve-action"
                  onClick={async () => {
                    await handleApprove(reviewModalShelter);
                    setReviewModalShelter(null);
                  }}
                >
                  <Check size={15} strokeWidth={2.5} />
                  <span>Approve &amp; Activate Shelter</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          8. DISAPPROVAL NOTE MODAL
         ═══════════════════════════════════════════════════════════ */}
      {rejectModalShelter && (
        <div className="admin-modal-backdrop" onClick={() => setRejectModalShelter(null)}>
          <div className="admin-modal-container compact" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-dialog-title">Disapprove Shelter Registration</h3>
            <p className="admin-modal-dialog-desc">
              Specify the reason for disapproving <strong>{rejectModalShelter.shelter_name}</strong>.
              This note will be recorded and sent to the shelter organization.
            </p>

            <textarea
              className="admin-modal-dialog-textarea"
              rows={3}
              placeholder="e.g. Invalid rescue license code, facility location unverifiable, or missing AWBI documentation..."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
            />

            <div className="admin-modal-dialog-btns">
              <button
                type="button"
                className="admin-header-pill-btn"
                onClick={() => setRejectModalShelter(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="admin-btn-disapprove-action"
                onClick={handleConfirmReject}
              >
                Confirm Disapproval
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboardPage;
