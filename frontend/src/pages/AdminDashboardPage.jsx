import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  ShieldCheck, Building, CheckCircle2, XCircle, Clock, 
  Search, RefreshCw, LogOut, Check, X, Phone, Mail, MapPin, 
  FileText, Users, Eye, Bell, ChevronRight, Shield, ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../api/adminApi';
import '../styles/admin-dashboard.css';

// Distinct pastel color combinations for the All Shelters cards (matching Image 2)
const CARD_PALETTES = [
  { bg: '#D1FAE5', color: '#059669' }, // Emerald / Mint
  { bg: '#DBEAFE', color: '#2563EB' }, // Sky Blue
  { bg: '#FEF3C7', color: '#D97706' }, // Warm Amber
  { bg: '#EDE9FE', color: '#7C3AED' }, // Violet / Purple
  { bg: '#FFE4E6', color: '#E11D48' }, // Soft Rose
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
      // Update local state
      setShelters((prev) =>
        prev.map((s) => (s.id === shelter.id || s.user_id === shelter.user_id ? { ...s, status: 'approved', verified: true } : s))
      );
      // Reload overview stats
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
      const matchesSearch =
        !searchQuery ||
        s.shelter_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.contact_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.phone?.includes(searchQuery);

      if (activeTab === 'pending') {
        return s.status === 'pending' && matchesSearch;
      }

      // In All Shelters tab, apply status dropdown filter
      if (statusFilter !== 'all' && s.status !== statusFilter) {
        return false;
      }

      return matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'name') {
        return (a.shelter_name || '').localeCompare(b.shelter_name || '');
      }
      return 0; // Default recently added order
    });
  }, [shelters, searchQuery, activeTab, statusFilter, sortBy]);

  const adminName = user?.name || 'Shubham';
  const adminInitial = adminName.charAt(0).toUpperCase();

  return (
    <div className="admin-portal-wrap">
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '24px',
          background: '#064E3B',
          color: '#A7F3D0',
          border: '1px solid #10B981',
          padding: '0.85rem 1.4rem',
          borderRadius: 10,
          boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
          zIndex: 99999,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '0.6rem',
        }}>
          <CheckCircle2 size={18} color="#34D399" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          Top Navigation Bar (Matches Image 1 & 2)
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

          {/* User Profile Pill */}
          <div className="admin-user-profile-pill">
            <div className="admin-user-avatar-circle">{adminInitial}</div>
            <div className="admin-user-meta">
              <span className="admin-user-name">{adminName}</span>
              <span className="admin-user-role">Platform Admin</span>
            </div>
          </div>

          {/* Admin Console Pill */}
          <div className="admin-console-badge">
            <ShieldCheck size={14} color="#D97706" />
            <span>Admin Console</span>
          </div>

          {/* Refresh Action */}
          <button
            type="button"
            className="admin-action-pill-btn"
            onClick={loadData}
            title="Refresh Data"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {/* Sign Out Action */}
          <button
            type="button"
            className="admin-action-pill-btn"
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
          Page Heading Row
         ═══════════════════════════════════════════════════════════ */}
      <div className="admin-page-header-row">
        <div className="admin-header-left">
          {activeTab === 'pending' ? (
            <div className="admin-header-shield-box">
              <ShieldCheck size={28} />
            </div>
          ) : null}
          <div>
            <h1 className="admin-main-heading">
              {activeTab === 'pending'
                ? 'PawConnect Central Administration'
                : 'All Registered Shelters'}
            </h1>
            <p className="admin-sub-heading">
              {activeTab === 'pending'
                ? 'Shelter Verification, Review & Approval Oversight'
                : 'View and manage all shelters onboarded on PawConnect'}
            </p>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          KPI Metrics Grid (Exact 4 Cards from Reference)
         ═══════════════════════════════════════════════════════════ */}
      <section className="admin-kpi-grid">
        {/* Card 1: Pending Approvals */}
        <div
          className={`admin-kpi-card ${activeTab === 'pending' ? 'active-tab-card' : ''}`}
          onClick={() => setActiveTab('pending')}
          style={{ cursor: 'pointer' }}
        >
          <div className="admin-kpi-content-left">
            <div className="admin-kpi-icon-bubble amber">
              <Clock size={24} />
            </div>
            <div>
              <div className="admin-kpi-val">{pendingShelters.length}</div>
              <div className="admin-kpi-label">Pending Approval Requests</div>
            </div>
          </div>
          <ChevronRight size={18} className="admin-kpi-chevron" />
        </div>

        {/* Card 2: Verified & Active Shelters */}
        <div
          className={`admin-kpi-card ${activeTab === 'all' && statusFilter === 'approved' ? 'active-tab-card' : ''}`}
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('approved');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="admin-kpi-content-left">
            <div className="admin-kpi-icon-bubble emerald">
              <Building size={24} />
            </div>
            <div>
              <div className="admin-kpi-val">{approvedShelters.length}</div>
              <div className="admin-kpi-label">Verified &amp; Active Shelters</div>
            </div>
          </div>
          <ChevronRight size={18} className="admin-kpi-chevron" />
        </div>

        {/* Card 3: Disapproved / Rejected */}
        <div
          className="admin-kpi-card"
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('rejected');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="admin-kpi-content-left">
            <div className="admin-kpi-icon-bubble red">
              <XCircle size={24} />
            </div>
            <div>
              <div className="admin-kpi-val">{rejectedShelters.length}</div>
              <div className="admin-kpi-label">Disapproved / Rejected</div>
            </div>
          </div>
          <ChevronRight size={18} className="admin-kpi-chevron" />
        </div>

        {/* Card 4: Total Shelters Onboarded */}
        <div
          className={`admin-kpi-card ${activeTab === 'all' && statusFilter === 'all' ? 'active-tab-card' : ''}`}
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('all');
          }}
          style={{ cursor: 'pointer' }}
        >
          <div className="admin-kpi-content-left">
            <div className="admin-kpi-icon-bubble blue">
              <Users size={24} />
            </div>
            <div>
              <div className="admin-kpi-val">{shelters.length}</div>
              <div className="admin-kpi-label">Total Shelters Onboarded</div>
            </div>
          </div>
          <ChevronRight size={18} className="admin-kpi-chevron" />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          Tabs Navigation Bar (Underline + Pill Badges)
         ═══════════════════════════════════════════════════════════ */}
      <div className="admin-tabs-nav-row">
        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          <Clock size={16} />
          <span>Shelter Approvals Queue</span>
          {pendingShelters.length > 0 ? (
            <span className="admin-tab-pill-red">{pendingShelters.length} Action Required</span>
          ) : (
            <span className="admin-tab-pill-gray">0</span>
          )}
        </button>

        <button
          type="button"
          className={`admin-nav-tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('all');
            setStatusFilter('all');
          }}
        >
          <Building size={16} />
          <span>All Registered Shelters</span>
          <span className="admin-tab-pill-gray">{shelters.length}</span>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════
          Tab 1: PENDING APPROVALS QUEUE (Image 1 Style)
         ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'pending' && (
        <div>
          {/* Search Box on Pending View */}
          <div className="admin-filters-bar">
            <div className="admin-search-box">
              <Search size={16} color="#94A3B8" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search by shelter name, email, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--admin-green-primary)' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.8rem auto' }} />
              <p style={{ color: 'var(--admin-text-muted)' }}>Loading Central Administration records...</p>
            </div>
          ) : displayedShelters.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 1.5rem',
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1px dashed var(--admin-border)',
            }}>
              <CheckCircle2 size={44} color="#10B981" style={{ margin: '0 auto 0.8rem auto' }} />
              <h3 style={{ color: 'var(--admin-text-main)', margin: '0 0 0.35rem 0', fontSize: '1.25rem', fontWeight: 800 }}>
                All Caught Up!
              </h3>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                There are no pending shelter registrations awaiting approval.
              </p>
            </div>
          ) : (
            <div>
              {displayedShelters.map((s) => {
                const shelterId = s.user_id || s.id;
                const isOperating = actionLoadingId === shelterId;

                return (
                  <div key={s.id || s.user_id} className="admin-pending-card">
                    {/* Top Row: Icon + Name + Lic + Status Pill */}
                    <div className="admin-pending-header-row">
                      <div className="admin-pending-shelter-title-group">
                        <div className="admin-shelter-icon-box">
                          <Building size={24} />
                        </div>
                        <div>
                          <h3 className="admin-pending-name">{s.shelter_name}</h3>
                          <span className="admin-license-pill">
                            Lic: {s.license_code || `REG-${shelterId.slice(-4).toUpperCase()}`}
                          </span>
                        </div>
                      </div>

                      <div className="admin-status-pill-amber">
                        <Clock size={13} />
                        <span>Pending Review</span>
                      </div>
                    </div>

                    {/* Metadata Row: Email, Phone, Location */}
                    <div className="admin-meta-columns-row">
                      <div className="admin-meta-item-box">
                        <Mail size={16} />
                        <span>{s.contact_email || 'contact@shelter.org'}</span>
                      </div>
                      <div className="admin-meta-item-box">
                        <Phone size={16} />
                        <span>{s.phone || '+1 (555) 876-5432'}</span>
                      </div>
                      <div className="admin-meta-item-box">
                        <MapPin size={16} />
                        <span>{s.address || 'Facility address not registered'}</span>
                      </div>
                    </div>

                    {/* Bio Quote Box */}
                    <div className="admin-bio-quote-container">
                      "{s.bio || 'Community foster network providing medical care, love, and forever-home placement for rescued animals.'}"
                    </div>

                    {/* 3 Explicit Action Buttons */}
                    <div className="admin-pending-actions-row">
                      {/* 1. Review Option */}
                      <button
                        type="button"
                        className="btn-admin-review"
                        onClick={() => setReviewModalShelter(s)}
                      >
                        <Eye size={16} />
                        <span>Review Shelter</span>
                      </button>

                      {/* 2. Approve Option */}
                      <button
                        type="button"
                        className="btn-admin-approve"
                        onClick={() => handleApprove(s)}
                        disabled={isOperating}
                      >
                        <Check size={16} strokeWidth={2.5} />
                        <span>{isOperating ? 'Approving...' : 'Approve'}</span>
                      </button>

                      {/* 3. Disapprove Option */}
                      <button
                        type="button"
                        className="btn-admin-disapprove"
                        onClick={() => openRejectModal(s)}
                        disabled={isOperating}
                      >
                        <X size={16} strokeWidth={2.5} />
                        <span>Disapprove</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          Tab 2: ALL REGISTERED SHELTERS (Image 2 Style)
         ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'all' && (
        <div>
          {/* Top Filter Controls (Search + Sort by + Status) */}
          <div className="admin-filters-bar">
            <div className="admin-search-box">
              <Search size={16} color="#94A3B8" />
              <input
                type="text"
                className="admin-search-input"
                placeholder="Search shelters by name, email, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="admin-dropdowns-group">
              <div className="admin-filter-select-wrap">
                <span>Sort by</span>
                <select
                  className="admin-select-input"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="newest">Recently Added</option>
                  <option value="name">Shelter Name (A-Z)</option>
                </select>
              </div>

              <div className="admin-filter-select-wrap">
                <span>Status</span>
                <select
                  className="admin-select-input"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Disapproved</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--admin-green-primary)' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.8rem auto' }} />
              <p style={{ color: 'var(--admin-text-muted)' }}>Loading Central Administration records...</p>
            </div>
          ) : displayedShelters.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 1.5rem',
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1px dashed var(--admin-border)',
            }}>
              <Building size={44} color="#94A3B8" style={{ margin: '0 auto 0.8rem auto' }} />
              <h3 style={{ color: 'var(--admin-text-main)', margin: '0 0 0.35rem 0', fontSize: '1.25rem', fontWeight: 800 }}>
                No Shelters Found
              </h3>
              <p style={{ color: 'var(--admin-text-muted)', fontSize: '0.9rem', margin: 0 }}>
                No shelters match your current search and filter settings.
              </p>
            </div>
          ) : (
            <div className="admin-all-shelters-grid">
              {displayedShelters.map((s, index) => {
                const palette = CARD_PALETTES[index % CARD_PALETTES.length];
                const isApproved = s.status === 'approved';
                const isPending = s.status === 'pending';
                const shelterId = s.user_id || s.id;

                return (
                  <div key={s.id || s.user_id} className="admin-shelter-directory-card">
                    <div>
                      {/* Top Row: Colored Icon + Status Pill */}
                      <div className="admin-card-top-header">
                        <div
                          className="admin-shelter-color-icon"
                          style={{ backgroundColor: palette.bg, color: palette.color }}
                        >
                          <Building size={20} />
                        </div>

                        {isApproved ? (
                          <span className="admin-status-badge-approved">
                            <Check size={12} strokeWidth={2.8} />
                            <span>Approved</span>
                          </span>
                        ) : isPending ? (
                          <span className="admin-status-pill-amber" style={{ fontSize: '0.7rem', padding: '0.15rem 0.55rem' }}>
                            <Clock size={11} />
                            <span>Pending</span>
                          </span>
                        ) : (
                          <span className="admin-status-badge-rejected">
                            <X size={12} strokeWidth={2.8} />
                            <span>Disapproved</span>
                          </span>
                        )}
                      </div>

                      {/* Shelter Name & License */}
                      <h4 className="admin-card-shelter-name">{s.shelter_name}</h4>
                      <span className="admin-license-pill">
                        Lic: {s.license_code || `REG-${shelterId.slice(-4).toUpperCase()}`}
                      </span>

                      {/* Contact & Meta rows */}
                      <div className="admin-card-meta-list">
                        <div className="admin-card-meta-row">
                          <Mail size={13} />
                          <span>{s.contact_email || 'contact@shelter.org'}</span>
                        </div>
                        <div className="admin-card-meta-row">
                          <Phone size={13} />
                          <span>{s.phone || '+1 (555) 000-0000'}</span>
                        </div>
                        <div className="admin-card-meta-row">
                          <MapPin size={13} />
                          <span>{s.address || 'Address not listed'}</span>
                        </div>
                      </div>

                      {/* Bio snippet */}
                      <p className="admin-card-bio-snippet">
                        "{s.bio || 'Dedicated rescue organization specializing in animal shelter, rehabilitation, and adoption outreach.'}"
                      </p>
                    </div>

                    {/* View Details Button */}
                    <button
                      type="button"
                      className="btn-admin-view-details"
                      onClick={() => setReviewModalShelter(s)}
                    >
                      <Eye size={14} />
                      <span>View Details</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          Comprehensive Shelter Review Modal
         ═══════════════════════════════════════════════════════════ */}
      {reviewModalShelter && (
        <div className="admin-review-modal-backdrop" onClick={() => setReviewModalShelter(null)}>
          <div className="admin-review-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-review-modal-header">
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
                  <span className={reviewModalShelter.status === 'approved' ? 'admin-status-badge-approved' : reviewModalShelter.status === 'rejected' ? 'admin-status-badge-rejected' : 'admin-status-pill-amber'}>
                    {reviewModalShelter.status === 'approved' ? (
                      <><Check size={12} strokeWidth={2.8} /> Approved &amp; Active</>
                    ) : reviewModalShelter.status === 'rejected' ? (
                      <><X size={12} strokeWidth={2.8} /> Disapproved</>
                    ) : (
                      <><Clock size={12} /> Pending Review</>
                    )}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 700 }}>
                    ID: {reviewModalShelter.id || reviewModalShelter.user_id}
                  </span>
                </div>
                <h2 className="admin-review-title">
                  <Building size={22} color="var(--admin-green-primary)" />
                  {reviewModalShelter.shelter_name}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setReviewModalShelter(null)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  color: '#475569',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Information Grid */}
            <div className="admin-review-grid">
              <div className="admin-review-item">
                <div className="admin-review-label">
                  <Mail size={13} /> Contact Email
                </div>
                <div className="admin-review-value">
                  {reviewModalShelter.contact_email || 'Not provided'}
                </div>
              </div>

              <div className="admin-review-item">
                <div className="admin-review-label">
                  <Phone size={13} /> Contact Phone
                </div>
                <div className="admin-review-value">
                  {reviewModalShelter.phone || 'Not provided'}
                </div>
              </div>

              <div className="admin-review-item">
                <div className="admin-review-label">
                  <MapPin size={13} /> Facility Address
                </div>
                <div className="admin-review-value">
                  {reviewModalShelter.address || 'Address not registered'}
                </div>
              </div>

              <div className="admin-review-item">
                <div className="admin-review-label">
                  <ShieldCheck size={13} /> License / Reg Code
                </div>
                <div className="admin-review-value">
                  {reviewModalShelter.license_code || `REG-${(reviewModalShelter.user_id || reviewModalShelter.id || '').slice(-6).toUpperCase()}`}
                </div>
              </div>
            </div>

            {/* Shelter Bio / Mission Statement */}
            <div className="admin-review-bio-box">
              <div className="admin-review-label" style={{ marginBottom: '0.4rem' }}>
                <FileText size={13} /> Shelter Mission &amp; Facility Description
              </div>
              <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: '1.5', color: '#334155' }}>
                {reviewModalShelter.bio || 'No mission statement or bio was submitted by this organization.'}
              </p>
            </div>

            {/* Previous Admin Note (if any) */}
            {reviewModalShelter.admin_note && (
              <div style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 10,
                padding: '0.85rem 1rem',
                marginBottom: '1.4rem',
              }}>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                  Admin Review Note:
                </div>
                <div style={{ fontSize: '0.86rem', color: '#991B1B' }}>
                  {reviewModalShelter.admin_note}
                </div>
              </div>
            )}

            {/* Actions Inside Review Modal */}
            <div className="admin-review-actions-bar">
              <button
                type="button"
                className="admin-action-pill-btn"
                onClick={() => setReviewModalShelter(null)}
              >
                Close
              </button>

              {reviewModalShelter.status !== 'rejected' && (
                <button
                  type="button"
                  className="btn-admin-disapprove"
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
                  className="btn-admin-approve"
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
          Disapproval Note Modal
         ═══════════════════════════════════════════════════════════ */}
      {rejectModalShelter && (
        <div className="admin-reject-modal-backdrop" onClick={() => setRejectModalShelter(null)}>
          <div className="admin-reject-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="admin-modal-title">Disapprove Shelter Registration</h3>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0, lineHeight: 1.45 }}>
              Specify the reason for disapproving <strong>{rejectModalShelter.shelter_name}</strong>.
              This note will be recorded and sent to the shelter organization.
            </p>

            <textarea
              className="admin-modal-textarea"
              rows={3}
              placeholder="e.g. Invalid rescue license code, facility location unverifiable, or missing tax-exempt documentation..."
              value={rejectionNote}
              onChange={(e) => setRejectionNote(e.target.value)}
            />

            <div className="admin-modal-btns">
              <button
                type="button"
                className="admin-action-pill-btn"
                onClick={() => setRejectModalShelter(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-admin-disapprove"
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
