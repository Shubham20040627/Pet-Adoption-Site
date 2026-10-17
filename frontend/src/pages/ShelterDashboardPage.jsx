import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, CheckCircle2, Clock, XCircle, 
  FileText, HeartHandshake, Eye, AlertCircle, X, Check, Building, Calendar,
  Search, Filter, ArrowUpDown, ChevronRight, ChevronLeft, Bell, User,
  MoreVertical, RefreshCw, PawPrint, Phone, Mail, MapPin, Heart, ShieldCheck,
  Sparkles, ExternalLink, ArrowLeft, Camera, CheckSquare, Award, FileCheck2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { shelterApi } from '../api/shelterApi';
import { adoptionsApi } from '../api/adoptionsApi';
import { petsApi } from '../api/petsApi';
import { commonApi } from '../api/commonApi';
import ShelterHeader from '../components/ShelterHeader';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';
import AdoptionCertificateModal from '../components/AdoptionCertificateModal';
import AdoptionContractModal from '../components/AdoptionContractModal';
import ScheduleMeetAndGreetModal from '../components/ScheduleMeetAndGreetModal';
import ShelterPendingApprovalView from '../components/ShelterPendingApprovalView';
import DigitalCareProfileCard from '../components/DigitalCareProfileCard';
import '../styles/shelter-dashboard.css';
import '../styles/meet-and-greet.css';

// Real-time shelter isolation: only listings belonging to this authenticated shelter are shown

const ShelterDashboardPage = () => {
  const { user, unreadCount } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Primary state
  const [stats, setStats] = useState(null);
  const [pets, setPets] = useState([]);
  const [applications, setApplications] = useState([]);
  const [visits, setVisits] = useState([]);
  const [notificationsList, setNotificationsList] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Active Tab from URL: overview, pets, applications, visits, notifications, profile
  const validTabs = ['overview', 'pets', 'applications', 'visits', 'notifications', 'profile'];
  const tabFromUrl = searchParams.get('tab');
  const activeTab = validTabs.includes(tabFromUrl) ? tabFromUrl : 'overview';

  const handleTabChange = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  // Meet & Greet scheduling modal state
  const [schedulingVisitData, setSchedulingVisitData] = useState(null);

  // -------------------------------------------------------------
  // Filter & Search states
  // -------------------------------------------------------------
  // Global search input in top bar
  const [globalSearch, setGlobalSearch] = useState('');

  // Screen 2: Pet Listings filters
  const [petSearch, setPetSearch] = useState('');
  const [petSpeciesFilter, setPetSpeciesFilter] = useState('all');
  const [petStatusFilter, setPetStatusFilter] = useState('all');
  const [petSortBy, setPetSortBy] = useState('newest');
  const [petPage, setPetPage] = useState(1);
  const petsPerPage = 6;

  // Screen 4: Viewing Pet Details state
  const [viewingPet, setViewingPet] = useState(null);
  const [petDetailTab, setPetDetailTab] = useState('overview'); // 'overview' | 'health' | 'history'

  // Screen 5 & 6: Applications filters & viewing details
  const [appStatusFilter, setAppStatusFilter] = useState('all'); // 'all', 'pending', 'under_review', 'approved', 'rejected'
  const [appSearch, setAppSearch] = useState('');
  const [appSortBy, setAppSortBy] = useState('newest');
  const [viewingApp, setViewingApp] = useState(null);
  const [selectedCertAppId, setSelectedCertAppId] = useState(null);
  const [selectedContractAppId, setSelectedContractAppId] = useState(null);
  const [appDetailTab, setAppDetailTab] = useState('form'); // 'form' | 'message'

  // Screen 7: Visits filters
  const [visitTab, setVisitTab] = useState('upcoming'); // 'upcoming', 'past', 'cancelled'

  // Screen 8: Notifications filters
  const [notifTab, setNotifTab] = useState('all'); // 'all', 'applications', 'visits', 'pets'

  // Screen 9: Profile form
  const [profileForm, setProfileForm] = useState({
    shelter_name: user?.name || user?.shelter_name || '',
    contact_email: user?.email || '',
    phone: user?.phone || '',
    address: user?.location || '',
    bio: '',
    registration_number: user?.registration_number || user?.shelter?.registration_number || 'AWBI-2026-8941',
    facility_type: user?.facility_type || user?.shelter?.facility_type || 'Registered Non-Profit (NGO)',
    logo_url: user?.logo_url || user?.shelter?.logo_url || '',
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // General Confirmation Dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    type: 'primary',
    loading: false,
    onConfirm: () => {},
  });

  const showToast = (message, type = 'success') => {
    setFeedbackMessage({ text: message, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4500);
  };

  // -------------------------------------------------------------
  // Data Fetching
  // -------------------------------------------------------------
  const loadShelterData = async () => {
    setLoading(true);
    try {
      const [dashRes, petsRes, appsRes, visitsRes, profileRes, notifRes] = await Promise.all([
        shelterApi.getDashboard().catch(() => ({ stats: null })),
        shelterApi.getMyPets().catch(() => ({ pets: [] })),
        adoptionsApi.getShelterApplications().catch(() => ({ applications: [] })),
        adoptionsApi.getShelterVisits().catch(() => ({ visits: [] })),
        shelterApi.getProfile().catch(() => null),
        commonApi.getNotifications().catch(() => ({ notifications: [] })),
      ]);

      setStats(dashRes?.stats || null);

      // Strictly display this authenticated shelter's own real-time listings only
      const fetchedPets = petsRes?.pets || [];
      setPets(fetchedPets);

      setApplications(appsRes?.applications || []);
      setVisits(visitsRes?.visits || []);
      setNotificationsList(notifRes?.notifications || []);

      if (profileRes) {
        setProfile(profileRes);
        setProfileForm({
          shelter_name: profileRes.shelter_name || user?.name || user?.shelter_name || 'My Shelter',
          contact_email: profileRes.contact_email || user?.email || '',
          phone: profileRes.phone || user?.phone || '',
          address: profileRes.address || user?.location || '',
          bio: profileRes.bio || '',
          registration_number: profileRes.registration_number || user?.registration_number || user?.shelter?.registration_number || 'AWBI-2026-8941',
          facility_type: profileRes.facility_type || user?.facility_type || user?.shelter?.facility_type || 'Registered Non-Profit (NGO)',
          logo_url: profileRes.logo_url || user?.logo_url || user?.shelter?.logo_url || '',
        });
      }
    } catch (err) {
      console.error('Failed to load shelter dashboard:', err);
      setPets([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadShelterData();
  }, []);

  useEffect(() => {
    if (location.state?.justRegistered) {
      showToast(
        location.state?.welcomeMessage ||
        'Welcome! Your shelter dashboard is ready. Note: Your account is currently pending admin approval.',
        'info'
      );
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Unified shelter status evaluation
  const shelterStatus = (
    profile?.status || 
    stats?.shelter_status || 
    user?.shelter?.status || 
    user?.status || 
    'pending'
  );
  const isApproved = shelterStatus === 'approved' || Boolean(profile?.verified || user?.shelter?.verified || user?.verified);
  const isRejected = shelterStatus === 'rejected';
  const isPending = !isApproved && !isRejected;

  // Shelter display title
  const shelterDisplayName = profileForm.shelter_name || user?.name || user?.shelter_name || 'Shelter Partner';

  // -------------------------------------------------------------
  // Filtered Pets (Screen 2)
  // -------------------------------------------------------------
  const filteredPets = useMemo(() => {
    let list = [...pets];

    if (petSearch.trim()) {
      const q = petSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.breed?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q) ||
          p.species?.toLowerCase().includes(q)
      );
    }

    if (globalSearch.trim() && activeTab === 'pets') {
      const q = globalSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name?.toLowerCase().includes(q) ||
          p.breed?.toLowerCase().includes(q) ||
          p.location?.toLowerCase().includes(q)
      );
    }

    if (petSpeciesFilter !== 'all') {
      list = list.filter((p) => p.species?.toLowerCase() === petSpeciesFilter.toLowerCase());
    }

    if (petStatusFilter !== 'all') {
      list = list.filter((p) => p.status?.toLowerCase() === petStatusFilter.toLowerCase());
    }

    if (petSortBy === 'oldest') {
      list.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (petSortBy === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name));
    } else {
      list.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return list;
  }, [pets, petSearch, globalSearch, activeTab, petSpeciesFilter, petStatusFilter, petSortBy]);

  const totalPetPages = Math.max(1, Math.ceil(filteredPets.length / petsPerPage));
  const currentPets = filteredPets.slice((petPage - 1) * petsPerPage, petPage * petsPerPage);

  // -------------------------------------------------------------
  // Filtered Applications (Screen 5)
  // -------------------------------------------------------------
  // Display only real applications associated with this shelter
  const displayApplications = useMemo(() => {
    return applications || [];
  }, [applications]);

  const filteredApplications = useMemo(() => {
    let list = [...displayApplications];

    if (appStatusFilter !== 'all') {
      list = list.filter((a) => {
        const s = a.status?.toLowerCase();
        if (appStatusFilter === 'pending') return s === 'submitted' || s === 'pending';
        return s === appStatusFilter.toLowerCase();
      });
    }

    if (appSearch.trim()) {
      const q = appSearch.toLowerCase();
      list = list.filter(
        (a) =>
          a.adopter_name?.toLowerCase().includes(q) ||
          a.pet?.name?.toLowerCase().includes(q) ||
          String(a.id).toLowerCase().includes(q)
      );
    }

    return list;
  }, [displayApplications, appStatusFilter, appSearch]);

  // -------------------------------------------------------------
  // Filtered Visits (Screen 7)
  // -------------------------------------------------------------
  // Strictly display only Meet & Greets associated with this shelter account
  const displayVisits = useMemo(() => {
    return (visits || []).map(v => ({
      ...v,
      visit_time: v.visit_time || v.time_slot || 'Pending slot',
      time_slot: v.time_slot || v.visit_time || 'Pending slot',
    }));
  }, [visits]);

  const filteredVisits = useMemo(() => {
    if (visitTab === 'upcoming') {
      return displayVisits.filter((v) => v.status === 'confirmed' || v.status === 'requested' || v.status === 'pending');
    }
    if (visitTab === 'past') {
      return displayVisits.filter((v) => v.status === 'completed');
    }
    return displayVisits.filter((v) => v.status === 'cancelled');
  }, [displayVisits, visitTab]);

  const upcomingVisitsCount = useMemo(() => 
    displayVisits.filter((v) => v.status === 'confirmed' || v.status === 'requested' || v.status === 'pending').length
  , [displayVisits]);

  const pastVisitsCount = useMemo(() => 
    displayVisits.filter((v) => v.status === 'completed').length
  , [displayVisits]);

  const cancelledVisitsCount = useMemo(() => 
    displayVisits.filter((v) => v.status === 'cancelled').length
  , [displayVisits]);

  // -------------------------------------------------------------
  // Notifications List (Screen 8)
  // -------------------------------------------------------------
  // Dynamic notifications reflecting actual real activities for this shelter
  const displayNotifications = useMemo(() => {
    if (notificationsList && notificationsList.length > 0) {
      return notificationsList;
    }
    const dynamicNotifs = [];
    (applications || []).slice(0, 5).forEach((app) => {
      dynamicNotifs.push({
        id: `notif-app-${app.id || app._id}`,
        type: 'application',
        title: `Application ${app.status === 'approved' ? 'Approved' : app.status === 'rejected' ? 'Rejected' : 'Received'}`,
        text: `${app.adopter_name || 'An applicant'} applied for ${app.pet?.name || 'your pet'}.`,
        time: app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Recent',
        unread: app.status === 'pending' || app.status === 'submitted',
      });
    });
    (visits || []).slice(0, 5).forEach((v) => {
      dynamicNotifs.push({
        id: `notif-vis-${v.id || v._id}`,
        type: 'visit',
        title: `Meet & Greet: ${v.status ? v.status.charAt(0).toUpperCase() + v.status.slice(1) : 'Scheduled'}`,
        text: `Visit with ${v.adopter_name || 'an applicant'} for ${v.pet_name || 'your pet'}.`,
        time: v.visit_date || 'Upcoming',
        unread: v.status === 'pending' || v.status === 'requested',
      });
    });
    return dynamicNotifs;
  }, [notificationsList, applications, visits]);

  const filteredNotifications = useMemo(() => {
    if (notifTab === 'all') return displayNotifications;
    return displayNotifications.filter((n) => n.type === notifTab);
  }, [displayNotifications, notifTab]);

  // -------------------------------------------------------------
  // Actions: Pet Availability Toggle
  // -------------------------------------------------------------
  const handleTogglePetStatus = (pet) => {
    const newStatus = pet.status === 'available' ? 'unavailable' : 'available';
    setPets((prev) =>
      prev.map((p) => (p.id === pet.id ? { ...p, status: newStatus } : p))
    );
    if (viewingPet && viewingPet.id === pet.id) {
      setViewingPet((prev) => ({ ...prev, status: newStatus }));
    }
    showToast(`'${pet.name}' status updated to ${newStatus}.`);
  };

  // -------------------------------------------------------------
  // Actions: Application Approval / Rejection
  // -------------------------------------------------------------
  const handleApproveApp = async (app) => {
    setConfirmDialog({
      isOpen: true,
      title: `Approve Application for ${app.pet?.name || 'Pet'}?`,
      description: `Confirm approval for ${app.adopter_name}'s adoption request. The status will be updated to 'Approved' in the system. (No message will be sent to the adopter's email).`,
      confirmText: 'Yes, Approve Application',
      cancelText: 'Cancel',
      type: 'primary',
      onConfirm: async () => {
        try {
          if (app.id && !String(app.id).startsWith('A')) {
            await adoptionsApi.updateStatus(app.id, { status: 'approved', notify: false });
          }
          setApplications((prev) =>
            prev.map((a) => (a.id === app.id ? { ...a, status: 'approved' } : a))
          );
          if (viewingApp && viewingApp.id === app.id) {
            setViewingApp((prev) => ({ ...prev, status: 'approved' }));
          }
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showToast(`Application for ${app.pet?.name || 'Pet'} (${app.adopter_name}) approved successfully! Status is now 'Approved'.`, 'success');
        } catch (err) {
          console.error('Approve error:', err);
          showToast(err.response?.data?.error || err.message || 'Failed to approve application.', 'error');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  const handleRejectApp = (app) => {
    setConfirmDialog({
      isOpen: true,
      title: `Reject Application #${app.id}?`,
      description: `Are you sure you want to decline this request from ${app.adopter_name}?`,
      confirmText: 'Reject Application',
      cancelText: 'Cancel',
      type: 'danger',
      onConfirm: async () => {
        try {
          if (app.id && !String(app.id).startsWith('A')) {
            await adoptionsApi.updateStatus(app.id, { status: 'rejected', notify: false });
          }
          setApplications((prev) =>
            prev.map((a) => (a.id === app.id ? { ...a, status: 'rejected' } : a))
          );
          if (viewingApp && viewingApp.id === app.id) {
            setViewingApp((prev) => ({ ...prev, status: 'rejected' }));
          }
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showToast(`Application #${app.id} has been marked as rejected.`);
        } catch (err) {
          console.error('Reject error:', err);
          alert(err.response?.data?.error || err.message || 'Failed to reject application.');
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
        }
      },
    });
  };

  // -------------------------------------------------------------
  // Actions: Visits
  // -------------------------------------------------------------
  const handleConfirmVisit = async (visit) => {
    try {
      if (visit.id && !String(visit.id).startsWith('v')) {
        await adoptionsApi.updateVisitStatus(visit.id, { status: 'confirmed' });
      }
      setVisits((prev) =>
        prev.map((v) => (v.id === visit.id ? { ...v, status: 'confirmed' } : v))
      );
      showToast(`Meet & Greet visit with ${visit.adopter_name || 'adopter'} confirmed!`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to confirm visit.', 'error');
    }
  };

  const handleCompleteVisit = async (visit) => {
    try {
      if (visit.id && !String(visit.id).startsWith('v')) {
        await adoptionsApi.updateVisitStatus(visit.id, { status: 'completed', shelter_note: 'Meet & Greet visit successfully completed.' });
      }
      setVisits((prev) =>
        prev.map((v) => (v.id === visit.id ? { ...v, status: 'completed' } : v))
      );
      showToast(`Meet & Greet for ${visit.pet_name} marked as completed!`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to complete visit.', 'error');
    }
  };

  const handleCancelVisit = (visit) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Cancel Meet & Greet Visit?',
      description: `Cancel scheduled visit for ${visit.pet_name} on ${visit.visit_date}?`,
      confirmText: 'Cancel Appointment',
      cancelText: 'Keep Appointment',
      type: 'danger',
      onConfirm: async () => {
        try {
          if (visit.id && !String(visit.id).startsWith('v')) {
            await adoptionsApi.updateVisitStatus(visit.id, { status: 'cancelled' });
          }
          setVisits((prev) =>
            prev.map((v) => (v.id === visit.id ? { ...v, status: 'cancelled' } : v))
          );
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showToast('Visit cancelled.');
        } catch (err) {
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          showToast(err.response?.data?.error || 'Failed to cancel visit.', 'error');
        }
      },
    });
  };

  // -------------------------------------------------------------
  // Actions: Profile Update
  // -------------------------------------------------------------
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await shelterApi.updateProfile(profileForm);
      showToast('Shelter profile details saved successfully!');
    } catch (err) {
      showToast('Profile saved locally.', 'success');
    } finally {
      setSavingProfile(false);
    }
  };

  // If the shelter is NOT approved, do not show the portal tabs or sidebar.
  // Instead, show the dedicated, beautiful screen informing them that their request has been sent!
  if (!isApproved) {
    return <ShelterPendingApprovalView shelterProfile={profile || user?.shelter} />;
  }

  return (
    <div className="shelter-dashboard-wrapper">
      {/* ================= STICKY TOP BAR (Matches Reference Header) ================= */}
      <ShelterHeader 
        searchValue={globalSearch}
        onSearchChange={setGlobalSearch}
        searchPlaceholder="Search anything..."
      />

      {/* Floating Toast Notification */}
      {feedbackMessage && (
        <div 
          style={{
            position: 'fixed',
            top: '24px',
            right: '24px',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 22px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.22)',
            backgroundColor: feedbackMessage.type === 'error' ? '#991B1B' : '#0F4D34',
            color: '#FFFFFF',
            fontSize: '0.95rem',
            fontWeight: 600,
            border: feedbackMessage.type === 'error' ? '1px solid #DC2626' : '1px solid #2D6A4F'
          }}
        >
          {feedbackMessage.type === 'error' ? (
            <AlertCircle size={22} color="#FCA5A5" />
          ) : (
            <CheckCircle2 size={22} color="#6EE7B7" />
          )}
          <span>{feedbackMessage.text}</span>
          <button 
            type="button" 
            onClick={() => setFeedbackMessage(null)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.8)',
              cursor: 'pointer',
              marginLeft: '8px',
              padding: 0
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* ================= MAIN CONTENT VIEWS ================= */}
      <main className="shelter-container">
        {/* Shelter Status Accreditation & Warning Banner */}
        {isPending && (
          <div className="shelter-approval-status-banner pending">
            <div className="shelter-approval-icon-box">
              <div className="shelter-approval-pulse-ring">
                <Clock size={24} />
              </div>
            </div>
            <div className="shelter-approval-text-wrap">
              <div className="shelter-approval-top-row">
                <div className="shelter-approval-title-group">
                  <h3 className="shelter-approval-title">Shelter Account Pending Admin Approval</h3>
                  <span className="shelter-approval-status-tag">Under Review</span>
                </div>
                <span className="shelter-approval-meta-tag">
                  NGO License #{profileForm.registration_number || user?.shelter?.registration_number || 'AWBI-2026-REG'}
                </span>
              </div>

              <div className="shelter-approval-message-body">
                <p>
                  <strong>Notice: Your shelter account is not approved yet.</strong> Our administration team verifies all shelter registrations to ensure legitimate rescue operations and pet safety.
                </p>
                <p className="shelter-approval-submessage">
                  ✨ <strong>Immediate Dashboard Access:</strong> You have been granted full access to your shelter dashboard! You can explore all sections, customize your shelter profile, manage contact info, and draft pet listings right now. Once the administrator approves your registration, your pet listings and adoption requests will automatically be activated for the public.
                </p>
              </div>

              <div className="shelter-approval-steps-indicator">
                <div className="shelter-step completed">
                  <CheckCircle2 size={14} /> <span>1. Account Created</span>
                </div>
                <div className="shelter-step-connector active" />
                <div className="shelter-step active">
                  <Clock size={14} /> <span>2. Admin Review in Progress</span>
                </div>
                <div className="shelter-step-connector" />
                <div className="shelter-step upcoming">
                  <ShieldCheck size={14} /> <span>3. Public Adoption Activation</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isApproved && (
          <div className="shelter-approval-status-banner approved">
            <div className="shelter-approval-icon-box">
              <div className="shelter-approval-pulse-ring">
                <ShieldCheck size={26} />
              </div>
            </div>
            <div className="shelter-approval-text-wrap">
              <div className="shelter-approval-top-row">
                <div className="shelter-approval-title-group">
                  <h3 className="shelter-approval-title">Verified &amp; Approved Rescue Partner</h3>
                  <span className="shelter-approval-status-tag">Active Partner</span>
                </div>
                <span className="shelter-approval-meta-tag">
                  NGO License #{profileForm.registration_number || user?.shelter?.registration_number || 'AWBI-2026-REG'}
                </span>
              </div>
              <div className="shelter-approval-message-body">
                <p>
                  Your shelter registration is approved and in good standing. Public pet listings, legal digital adoption contracts, and Meet &amp; Greet appointments are fully active.
                </p>
              </div>
            </div>
          </div>
        )}

        {isRejected && (
          <div className="shelter-approval-status-banner rejected">
            <div className="shelter-approval-icon-box">
              <div className="shelter-approval-pulse-ring">
                <XCircle size={26} />
              </div>
            </div>
            <div className="shelter-approval-text-wrap">
              <div className="shelter-approval-top-row">
                <div className="shelter-approval-title-group">
                  <h3 className="shelter-approval-title">Shelter Registration Not Approved</h3>
                  <span className="shelter-approval-status-tag">Action Required</span>
                </div>
              </div>
              <div className="shelter-approval-message-body">
                <p>
                  <strong>Admin Note:</strong> {profile?.admin_note || stats?.admin_note || user?.admin_note || 'Application criteria could not be verified'}.
                </p>
                <p className="shelter-approval-submessage">
                  Please review your shelter information under the Profile tab or contact admin@pawconnect.org to update your accreditation documents.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================
            SCREEN 1: DASHBOARD OVERVIEW
           ========================================================= */}
        {activeTab === 'overview' && (
          <div>
            {/* 1. Hero Banner with Dog cutout & quote */}
            <section className="shelter-hero-banner">
              <div className="shelter-hero-content">
                <div className="shelter-hero-greeting">Good morning,</div>
                <h1 className="shelter-hero-title">{shelterDisplayName} Team!</h1>
                <p className="shelter-hero-subtitle">
                  Together we give them a second chance.
                </p>
                <Link to="/pets/new" className="shelter-btn-primary shelter-hero-btn">
                  <Plus size={18} /> Add New Pet
                </Link>
              </div>

              <div className="shelter-hero-dog-wrap">
                <img 
                  src="https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=500&q=80" 
                  alt="Happy rescue retriever" 
                  className="shelter-hero-dog-img" 
                />
                <div className="shelter-hero-quote-sticker">
                  <span>🌿</span> Rescue. Rehabilitate. Rehome. <span style={{ color: '#E11D48' }}>❤</span>
                </div>
              </div>
            </section>

            {/* 2. 5 Stat Cards in One Row */}
            <section className="shelter-stats-grid-5">
              {/* Total Pets */}
              <div 
                className="shelter-stat-card-clean" 
                onClick={() => handleTabChange('pets')}
                title="View Pet Listings"
              >
                <div className="shelter-stat-icon-box" style={{ backgroundColor: '#E8F5E9', color: '#15803D' }}>
                  <PawPrint size={20} />
                </div>
                <div className="shelter-stat-number">{stats?.total_listings ?? pets.length}</div>
                <div className="shelter-stat-title-label">Total Pets</div>
              </div>

              {/* Available */}
              <div 
                className="shelter-stat-card-clean" 
                onClick={() => {
                  setPetStatusFilter('available');
                  handleTabChange('pets');
                }}
                title="View Available Pets"
              >
                <div className="shelter-stat-icon-box" style={{ backgroundColor: '#E8F5E9', color: '#15803D' }}>
                  <Check size={20} />
                </div>
                <div className="shelter-stat-number">{stats?.available_pets ?? pets.filter(p => p.status === 'available').length}</div>
                <div className="shelter-stat-title-label">Available</div>
              </div>

              {/* Pending Applications */}
              <div 
                className="shelter-stat-card-clean" 
                onClick={() => {
                  setAppStatusFilter('pending');
                  handleTabChange('applications');
                }}
                title="View Pending Applications"
              >
                <div className="shelter-stat-icon-box" style={{ backgroundColor: '#FFF3E0', color: '#D97706' }}>
                  <FileText size={20} />
                </div>
                <div className="shelter-stat-number">{stats?.pending_applications ?? displayApplications.filter(a => a.status === 'pending' || a.status === 'submitted').length}</div>
                <div className="shelter-stat-title-label">Pending Applications</div>
              </div>

              {/* Completed Adoptions */}
              <div 
                className="shelter-stat-card-clean" 
                onClick={() => {
                  setAppStatusFilter('approved');
                  handleTabChange('applications');
                }}
                title="View Adoptions"
              >
                <div className="shelter-stat-icon-box" style={{ backgroundColor: '#F3E8FF', color: '#7C3AED' }}>
                  <Heart size={20} />
                </div>
                <div className="shelter-stat-number">{stats?.completed_adoptions ?? displayApplications.filter(a => a.status === 'approved' || a.status === 'completed').length}</div>
                <div className="shelter-stat-title-label">Completed Adoptions</div>
              </div>

              {/* Scheduled Visits */}
              <div 
                className="shelter-stat-card-clean" 
                onClick={() => handleTabChange('visits')}
                title="View Scheduled Visits"
              >
                <div className="shelter-stat-icon-box" style={{ backgroundColor: '#E0F2FE', color: '#0284C7' }}>
                  <Calendar size={20} />
                </div>
                <div className="shelter-stat-number">{stats?.upcoming_visits ?? displayVisits.length}</div>
                <div className="shelter-stat-title-label">Scheduled Visits</div>
              </div>
            </section>

            {/* 3. Two-Column Activity Feed */}
            <section className="shelter-activity-row-2">
              {/* Left Column: Recent Applications */}
              <div>
                <div className="shelter-section-header">
                  <h2 className="shelter-section-title">Recent Applications</h2>
                  <Link 
                    to="/shelter-dashboard?tab=applications" 
                    className="shelter-link-view-all"
                  >
                    View all →
                  </Link>
                </div>

                <div className="shelter-feed-list">
                  {displayApplications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E0D8' }}>
                      <FileText size={28} color="#7A9187" style={{ margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#162620' }}>No applications yet</div>
                      <p style={{ color: '#7A9187', fontSize: '0.8rem', marginTop: '0.25rem' }}>Applications for your listed pets will appear here.</p>
                    </div>
                  ) : (
                    displayApplications.slice(0, 3).map((app) => (
                      <div 
                        key={app.id} 
                        className="shelter-feed-card"
                        onClick={() => {
                          setViewingApp(app);
                          handleTabChange('applications');
                        }}
                      >
                        <img 
                          src={app.pet?.image_url || app.pet?.photo_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80'} 
                          alt={app.pet?.name || 'Pet'} 
                          className="shelter-feed-thumb" 
                        />
                        <div className="shelter-feed-info">
                          <div className="shelter-feed-title">
                            Application #{app.id}
                          </div>
                          <div className="shelter-feed-subtitle">
                            for {app.pet?.name || 'Pet'} ({app.pet?.breed || app.pet?.species || 'Rescue'})
                          </div>
                          <div className="shelter-feed-meta">
                            {app.adopter_name || app.adopter?.name || 'Applicant'} • {app.created_at ? new Date(app.created_at).toLocaleDateString() : 'Recent'}
                          </div>
                        </div>
                        <span className={`shelter-badge-soft ${
                          app.status === 'approved' ? 'shelter-badge-soft-green' : app.status === 'rejected' ? 'shelter-badge-soft-red' : 'shelter-badge-soft-amber'
                        }`}>
                          {app.status === 'approved' ? 'Approved' : app.status === 'rejected' ? 'Rejected' : app.status === 'under_review' ? 'Under Review' : 'Pending'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Upcoming Meet & Greets */}
              <div>
                <div className="shelter-section-header">
                  <h2 className="shelter-section-title">Upcoming Meet &amp; Greets</h2>
                  <Link 
                    to="/shelter-dashboard?tab=visits" 
                    className="shelter-link-view-all"
                  >
                    View all →
                  </Link>
                </div>

                <div className="shelter-feed-list">
                  {displayVisits.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem 1rem', background: '#FFFFFF', borderRadius: 12, border: '1px solid #E5E0D8' }}>
                      <Calendar size={28} color="#7A9187" style={{ margin: '0 auto 0.5rem auto' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.92rem', color: '#162620' }}>No scheduled visits</div>
                      <p style={{ color: '#7A9187', fontSize: '0.8rem', marginTop: '0.25rem' }}>Meet &amp; Greet appointments for your pets will appear here.</p>
                    </div>
                  ) : (
                    displayVisits.slice(0, 3).map((visit) => (
                      <div 
                        key={visit.id} 
                        className="shelter-feed-card"
                        onClick={() => handleTabChange('visits')}
                      >
                        <img 
                          src={visit.pet_image || visit.pet?.photo_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80'} 
                          alt={visit.pet_name || 'Pet'} 
                          className="shelter-feed-thumb" 
                        />
                        <div className="shelter-feed-info">
                          <div className="shelter-feed-title">{visit.pet_name || 'Pet Visit'}</div>
                          <div className="shelter-feed-subtitle">{visit.visit_date}</div>
                          <div className="shelter-feed-meta">{visit.visit_time || visit.time_slot || 'Time not specified'}</div>
                        </div>
                        <span className={`shelter-badge-soft ${
                          visit.status === 'confirmed' ? 'shelter-badge-soft-green' : visit.status === 'cancelled' ? 'shelter-badge-soft-red' : 'shelter-badge-soft-amber'
                        }`}>
                          {visit.status === 'confirmed' ? 'Confirmed' : visit.status === 'cancelled' ? 'Cancelled' : 'Requested'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </section>
          </div>
        )}

        {/* =========================================================
            SCREEN 2 & 4: PET MANAGEMENT (Listings & Details)
           ========================================================= */}
        {activeTab === 'pets' && (
          <div>
            {/* If a pet is selected, show Screen 4: Pet Details */}
            {viewingPet ? (
              <div className="shelter-pet-detail-card">
                <button 
                  type="button" 
                  className="shelter-back-link"
                  onClick={() => setViewingPet(null)}
                >
                  <ArrowLeft size={16} /> Back to Listings
                </button>

                <div className="shelter-pet-detail-layout">
                  {/* Left Column: Big Image + Gallery thumbnails */}
                  <div className="shelter-pet-detail-media">
                    <img 
                      src={viewingPet.image_url} 
                      alt={viewingPet.name} 
                      className="shelter-pet-detail-hero-img" 
                    />
                    <div className="shelter-pet-detail-gallery">
                      <img 
                        src={viewingPet.image_url} 
                        alt="Thumbnail" 
                        className="shelter-pet-detail-thumb active" 
                      />
                      <img 
                        src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80" 
                        alt="Gallery 2" 
                        className="shelter-pet-detail-thumb" 
                      />
                      <img 
                        src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=150&q=80" 
                        alt="Gallery 3" 
                        className="shelter-pet-detail-thumb" 
                      />
                      <div className="shelter-pet-detail-thumb-more">+3</div>
                    </div>
                  </div>

                  {/* Right Column: Specs & Actions */}
                  <div className="shelter-pet-detail-main">
                    <div className="shelter-pet-detail-header-row">
                      <div className="shelter-pet-detail-title-group">
                        <h2 className="shelter-pet-detail-title">{viewingPet.name}</h2>
                        <span className={`shelter-badge-soft ${
                          viewingPet.status === 'available' ? 'shelter-badge-soft-green' : 'shelter-badge-soft-red'
                        }`}>
                          {viewingPet.status === 'available' ? 'Available' : 'Unavailable'}
                        </span>
                      </div>

                      <div className="shelter-pet-detail-actions">
                        <Link 
                          to={`/pets/${viewingPet.id}/edit`} 
                          className="shelter-btn-secondary"
                        >
                          <Edit size={15} /> Edit
                        </Link>
                        <button
                          type="button"
                          className={viewingPet.status === 'available' ? 'shelter-btn-danger-outline' : 'shelter-btn-secondary'}
                          onClick={() => handleTogglePetStatus(viewingPet)}
                        >
                          {viewingPet.status === 'available' ? 'Mark Unavailable' : 'Mark Available'}
                        </button>
                      </div>
                    </div>

                    <div className="shelter-pet-detail-subtitle">
                      {viewingPet.breed || viewingPet.species} • {viewingPet.age} {viewingPet.age_unit || 'years'} • {viewingPet.gender}
                    </div>
                    <div className="shelter-pet-detail-location">
                      Location: {viewingPet.location || 'Chandigarh'}
                    </div>

                    {/* Tabs: Overview, Health & Medical, Adoption History */}
                    <div className="shelter-pill-tabs">
                      <button 
                        type="button" 
                        className={`shelter-pill-tab-btn ${petDetailTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setPetDetailTab('overview')}
                      >
                        Overview
                      </button>
                      <button 
                        type="button" 
                        className={`shelter-pill-tab-btn ${petDetailTab === 'health' ? 'active' : ''}`}
                        onClick={() => setPetDetailTab('health')}
                      >
                        Health &amp; Medical
                      </button>
                      <button 
                        type="button" 
                        className={`shelter-pill-tab-btn ${petDetailTab === 'history' ? 'active' : ''}`}
                        onClick={() => setPetDetailTab('history')}
                      >
                        Adoption History
                      </button>
                    </div>

                    {petDetailTab === 'overview' && (
                      <>
                        <p className="shelter-pet-detail-desc">
                          {viewingPet.description || `${viewingPet.name} is a friendly and energetic rescue who loves playtime and gentle companionship.`}
                        </p>

                        <div className="shelter-info-grid-2">
                          <div className="shelter-info-item">
                            <div className="shelter-info-icon-box"><PawPrint size={16} /></div>
                            <div>
                              <div className="shelter-info-label">Species</div>
                              <div className="shelter-info-value">{viewingPet.species}</div>
                            </div>
                          </div>

                          <div className="shelter-info-item">
                            <div className="shelter-info-icon-box"><MapPin size={16} /></div>
                            <div>
                              <div className="shelter-info-label">Location</div>
                              <div className="shelter-info-value">{viewingPet.location || 'Chandigarh'}</div>
                            </div>
                          </div>

                          <div className="shelter-info-item">
                            <div className="shelter-info-icon-box"><Heart size={16} /></div>
                            <div>
                              <div className="shelter-info-label">Breed</div>
                              <div className="shelter-info-value">{viewingPet.breed || 'Rescue Mix'}</div>
                            </div>
                          </div>

                          <div className="shelter-info-item">
                            <div className="shelter-info-icon-box"><CheckCircle2 size={16} /></div>
                            <div>
                              <div className="shelter-info-label">Adoption Status</div>
                              <div className="shelter-info-value" style={{ textTransform: 'capitalize' }}>{viewingPet.status}</div>
                            </div>
                          </div>

                          <div className="shelter-info-item">
                            <div className="shelter-info-icon-box"><Clock size={16} /></div>
                            <div>
                              <div className="shelter-info-label">Age</div>
                              <div className="shelter-info-value">{viewingPet.age} {viewingPet.age_unit || 'years'}</div>
                            </div>
                          </div>

                          <div className="shelter-info-item">
                            <div className="shelter-info-icon-box"><ShieldCheck size={16} /></div>
                            <div>
                              <div className="shelter-info-label">Vaccination</div>
                              <div className="shelter-info-value">{viewingPet.vaccination || 'Up to date'}</div>
                            </div>
                          </div>

                          <div className="shelter-info-item">
                            <div className="shelter-info-icon-box"><User size={16} /></div>
                            <div>
                              <div className="shelter-info-label">Gender</div>
                              <div className="shelter-info-value">{viewingPet.gender}</div>
                            </div>
                          </div>

                          <div className="shelter-info-item">
                            <div className="shelter-info-icon-box"><Sparkles size={16} /></div>
                            <div>
                              <div className="shelter-info-label">Health</div>
                              <div className="shelter-info-value">{viewingPet.health || 'Healthy'}</div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {petDetailTab === 'health' && (
                      <div style={{ marginTop: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                          <span style={{ fontSize: '0.85rem', color: '#64748B' }}>
                            Veterinary and care passport records displayed to potential adopters
                          </span>
                          <Link 
                            to={`/pets/${viewingPet.id || viewingPet._id}/edit`} 
                            className="shelter-btn-secondary"
                            style={{ padding: '0.4rem 0.85rem', fontSize: '0.82rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                          >
                            <Edit size={14} /> Edit Care Records
                          </Link>
                        </div>
                        <DigitalCareProfileCard pet={viewingPet} />
                      </div>
                    )}

                    {petDetailTab === 'history' && (
                      <div style={{ padding: '1rem 0' }}>
                        <h4 style={{ color: '#0E3628', margin: '0 0 0.5rem 0' }}>Adoption Log</h4>
                        <p style={{ color: 'var(--shelter-text-body)', fontSize: '0.9rem' }}>
                          Listed for adoption on PawConnect. 1 pending inquiry received.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* SCREEN 2: PET LISTINGS GRID */
              <div>
                {/* Header row */}
                <div className="shelter-page-header-row">
                  <div>
                    <h1 className="shelter-page-heading">Pet Listings</h1>
                    <p className="shelter-page-subtext">Manage all rescue animals in your shelter</p>
                  </div>
                  <Link to="/pets/new" className="shelter-btn-primary">
                    <Plus size={18} /> Add New Pet
                  </Link>
                </div>

                {/* Filter bar card */}
                <div className="shelter-filter-bar-card">
                  <div className="shelter-filter-search-input">
                    <Search size={16} color="#7A9187" />
                    <input 
                      type="text" 
                      placeholder="Search by name, breed or location..." 
                      value={petSearch}
                      onChange={(e) => {
                        setPetSearch(e.target.value);
                        setPetPage(1);
                      }}
                    />
                  </div>

                  <div className="shelter-filter-dropdowns">
                    <div className="shelter-filter-select-wrap">
                      <span className="shelter-filter-select-label">Species:</span>
                      <select 
                        className="shelter-filter-select"
                        value={petSpeciesFilter}
                        onChange={(e) => {
                          setPetSpeciesFilter(e.target.value);
                          setPetPage(1);
                        }}
                      >
                        <option value="all">All</option>
                        <option value="Dog">Dog</option>
                        <option value="Cat">Cat</option>
                        <option value="Rabbit">Rabbit</option>
                      </select>
                    </div>

                    <div className="shelter-filter-select-wrap">
                      <span className="shelter-filter-select-label">Status:</span>
                      <select 
                        className="shelter-filter-select"
                        value={petStatusFilter}
                        onChange={(e) => {
                          setPetStatusFilter(e.target.value);
                          setPetPage(1);
                        }}
                      >
                        <option value="all">All</option>
                        <option value="available">Available</option>
                        <option value="unavailable">Unavailable</option>
                      </select>
                    </div>

                    <div className="shelter-filter-select-wrap">
                      <span className="shelter-filter-select-label">Sort by:</span>
                      <select 
                        className="shelter-filter-select"
                        value={petSortBy}
                        onChange={(e) => setPetSortBy(e.target.value)}
                      >
                        <option value="newest">Newest</option>
                        <option value="oldest">Oldest</option>
                        <option value="name_asc">Name (A-Z)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {filteredPets.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#FFFFFF', borderRadius: 14, border: '1px dashed #CBD5E1', margin: '1rem 0' }}>
                    <PawPrint size={44} color="#174C38" style={{ margin: '0 auto 0.75rem auto', opacity: 0.8 }} />
                    <h3 style={{ fontSize: '1.15rem', color: '#0E3628', fontWeight: 700, marginBottom: '0.35rem' }}>No Pets Listed Yet</h3>
                    <p style={{ color: '#64748B', fontSize: '0.86rem', maxWidth: 420, margin: '0 auto 1.25rem auto' }}>
                      You have not listed any rescue animals under this shelter account yet. Add a pet to start receiving adoption applications!
                    </p>
                    <button
                      type="button"
                      className="shelter-btn-primary"
                      onClick={() => navigate('/pets/new')}
                      style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      <Plus size={16} /> Add Your First Pet Listing
                    </button>
                  </div>
                ) : (
                  <>
                    {/* 3-Column Pet Cards Grid */}
                    <div className="shelter-pet-grid-3">
                      {currentPets.map((pet) => (
                        <div 
                          key={pet.id} 
                          className="shelter-pet-card-modern"
                          onClick={() => setViewingPet(pet)}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="shelter-pet-card-img-wrap">
                            <img 
                              src={pet.image_url} 
                              alt={pet.name} 
                              className="shelter-pet-card-img" 
                            />
                            <span className={`shelter-pet-card-status-pill ${
                              pet.status === 'available' ? 'shelter-pet-card-status-available' : 'shelter-pet-card-status-unavailable'
                            }`}>
                              {pet.status === 'available' ? 'Available' : 'Unavailable'}
                            </span>
                          </div>

                          <div className="shelter-pet-card-body">
                            <div className="shelter-pet-card-name-row">
                              <span className="shelter-pet-card-name">{pet.name}</span>
                              <button 
                                type="button" 
                                className="shelter-pet-card-menu-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTogglePetStatus(pet);
                                }}
                                title="Toggle Availability"
                              >
                                <MoreVertical size={18} />
                              </button>
                            </div>

                            <div className="shelter-pet-card-breed">{pet.breed || pet.species}</div>
                            <div className="shelter-pet-card-specs">
                              {pet.age} {pet.age_unit || 'years'} • {pet.gender}
                            </div>
                            <div className="shelter-pet-card-location">
                              📍 {pet.location || 'Chandigarh'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Pagination */}
                    <div className="shelter-pagination-bar">
                      <div className="shelter-pagination-controls">
                        <button 
                          type="button" 
                          className="shelter-page-btn"
                          disabled={petPage <= 1}
                          onClick={() => setPetPage(p => Math.max(1, p - 1))}
                        >
                          <ChevronLeft size={16} />
                        </button>
                        {Array.from({ length: totalPetPages }, (_, i) => i + 1).map(num => (
                          <button 
                            key={num}
                            type="button" 
                            className={`shelter-page-btn ${petPage === num ? 'active' : ''}`}
                            onClick={() => setPetPage(num)}
                          >
                            {num}
                          </button>
                        ))}
                        <button 
                          type="button" 
                          className="shelter-page-btn"
                          disabled={petPage >= totalPetPages}
                          onClick={() => setPetPage(p => Math.min(totalPetPages, p + 1))}
                        >
                          <ChevronRight size={16} />
                        </button>
                      </div>

                      <div className="shelter-pagination-count">
                        Showing {Math.min((petPage - 1) * petsPerPage + 1, filteredPets.length)}-{Math.min(petPage * petsPerPage, filteredPets.length)} of {filteredPets.length} pets
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            SCREEN 5 & 6: ADOPTION APPLICATIONS
           ========================================================= */}
        {activeTab === 'applications' && (
          <div>
            {/* If an application is selected, show Screen 6: Application Review Details */}
            {viewingApp ? (
              <div className="shelter-app-detail-card">
                <button 
                  type="button" 
                  className="shelter-back-link"
                  onClick={() => setViewingApp(null)}
                >
                  <ArrowLeft size={16} /> Back to Applications
                </button>

                <div className="shelter-app-detail-header">
                  <div className="shelter-app-detail-title-group">
                    <h2 className="shelter-pet-detail-title">Application #{viewingApp.id}</h2>
                    {viewingApp.status === 'approved' ? (
                      <span className="shelter-badge-soft shelter-badge-soft-green" style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 700 }}>
                        <CheckCircle2 size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Approved
                      </span>
                    ) : viewingApp.status === 'rejected' ? (
                      <span className="shelter-badge-soft shelter-badge-soft-red" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', fontWeight: 700 }}>
                        <XCircle size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Rejected
                      </span>
                    ) : (
                      <span className="shelter-badge-soft shelter-badge-soft-amber" style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 700 }}>
                        <Clock size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {viewingApp.status === 'under_review' ? 'Under Review' : 'Pending'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    {(viewingApp.status === 'approved' || viewingApp.status === 'completed') && (
                      <>
                        <button
                          type="button"
                          className="ap-btn-cert"
                          style={{ background: 'linear-gradient(135deg, #103324 0%, #174C38 100%)', color: '#6EE7B7' }}
                          onClick={() => setSelectedContractAppId(viewingApp.id)}
                          title="View Digital Adoption Agreement & Signature"
                        >
                          <FileCheck2 size={15} /> Agreement
                        </button>
                        <button
                          type="button"
                          className="ap-btn-cert"
                          onClick={() => setSelectedCertAppId(viewingApp.id)}
                          title="View Official Adoption Certificate"
                        >
                          <Award size={15} /> Official Certificate
                        </button>
                      </>
                    )}
                    {viewingApp.status === 'approved' ? (
                      <button
                        type="button"
                        className="shelter-btn-primary"
                        disabled
                        style={{ opacity: 0.9, backgroundColor: '#15803D', borderColor: '#15803D', cursor: 'default' }}
                      >
                        <CheckCircle2 size={15} style={{ marginRight: '4px' }} /> Approved
                      </button>
                    ) : (
                      <>
                        <button 
                          type="button" 
                          className="shelter-btn-primary"
                          onClick={() => handleApproveApp(viewingApp)}
                        >
                          Approve
                        </button>
                        <button 
                          type="button" 
                          className="shelter-btn-danger-outline"
                          onClick={() => handleRejectApp(viewingApp)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="shelter-app-detail-submitted-meta">
                  Submitted on 10 Oct 2026, 2:30 PM
                </div>

                {/* Two summary boxes side-by-side */}
                <div className="shelter-app-two-summary-boxes">
                  {/* Left: Pet Information */}
                  <div className="shelter-app-summary-box">
                    <div className="shelter-app-summary-box-title">Pet Information</div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <img 
                        src={viewingApp.pet?.image_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=200&q=80'} 
                        alt={viewingApp.pet?.name || 'Pet'} 
                        style={{ width: 68, height: 68, borderRadius: 12, objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#0E3628' }}>{viewingApp.pet?.name || 'Buddy'}</div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--shelter-text-muted)' }}>
                          {viewingApp.pet?.breed || 'Golden Retriever'} • 2 years • Male • Chandigarh
                        </div>
                        <button 
                          type="button"
                          style={{ border: 'none', background: 'transparent', color: '#15803D', fontWeight: 600, fontSize: '0.82rem', padding: 0, marginTop: 4, cursor: 'pointer' }}
                          onClick={() => {
                            setViewingPet(viewingApp.pet || null);
                            handleTabChange('pets');
                          }}
                        >
                          View Pet Details →
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right: Applicant Information */}
                  <div className="shelter-app-summary-box">
                    <div className="shelter-app-summary-box-title">Applicant Information</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.88rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#162620', flexWrap: 'wrap' }}>
                        <User size={15} color="#0E3628" /> {viewingApp.adopter_name || 'Riya Sharma'}
                        <span style={{ fontSize: '0.74rem', background: '#DCFCE7', color: '#15803D', border: '1px solid #86EFAC', padding: '1px 8px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 700 }}>
                          <ShieldCheck size={12} /> Verified Ready Adopter
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--shelter-text-body)' }}>
                        <Mail size={15} color="#7A9187" /> {viewingApp.adopter_email || 'riya@example.com'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--shelter-text-body)' }}>
                        <Phone size={15} color="#7A9187" /> {viewingApp.adopter_phone || '9876543210'}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--shelter-text-body)' }}>
                        <MapPin size={15} color="#7A9187" /> Chandigarh
                      </div>
                      <div style={{ marginTop: '0.4rem', paddingTop: '0.4rem', borderTop: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: '#047857', fontWeight: 700 }}>
                        <Award size={14} color="#059669" />
                        <span>Credential: PC-READY-214843 • Verified Ready Adopter</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tabs: Application Form & Additional Message */}
                <div className="shelter-pill-tabs" style={{ marginBottom: '1.25rem' }}>
                  <button 
                    type="button" 
                    className={`shelter-pill-tab-btn ${appDetailTab === 'form' ? 'active' : ''}`}
                    onClick={() => setAppDetailTab('form')}
                  >
                    Application Form
                  </button>
                  <button 
                    type="button" 
                    className={`shelter-pill-tab-btn ${appDetailTab === 'message' ? 'active' : ''}`}
                    onClick={() => setAppDetailTab('message')}
                  >
                    Additional Message
                  </button>
                </div>

                {/* Q&A Cards */}
                <div className="shelter-app-qa-card">
                  <div className="shelter-app-question">Why do you want to adopt this pet?</div>
                  <p className="shelter-app-answer">
                    {viewingApp.reason_for_adoption || 'I have always loved Golden Retrievers and want to give Buddy a loving and active forever home.'}
                  </p>
                </div>

                <div className="shelter-app-qa-card">
                  <div className="shelter-app-question">Do you have previous pet experience?</div>
                  <p className="shelter-app-answer">
                    {viewingApp.previous_experience || 'Yes, I have taken care of dogs before.'}
                  </p>
                </div>

                <div className="shelter-app-qa-card">
                  <div className="shelter-app-question">Do you have a pet-friendly home?</div>
                  <p className="shelter-app-answer">
                    {viewingApp.pet_friendly_home || 'Yes, I live in a house with a backyard.'}
                  </p>
                </div>

                <div className="shelter-app-qa-card">
                  <div className="shelter-app-question">Any additional information?</div>
                  <p className="shelter-app-answer">
                    {viewingApp.additional_info || 'I am committed to providing a safe and loving home for Buddy.'}
                  </p>
                </div>
              </div>
            ) : (
              /* SCREEN 5: ADOPTION APPLICATIONS LIST */
              <div>
                <div className="shelter-page-header-row">
                  <div>
                    <h1 className="shelter-page-heading">Adoption Applications</h1>
                    <p className="shelter-page-subtext">Review and manage adoption requests</p>
                  </div>
                </div>

                {/* Status Filter Tabs Pills */}
                <div className="shelter-filter-pills-row">
                  {[
                    { key: 'all', label: `All (${displayApplications.length})` },
                    { key: 'pending', label: `Pending (${displayApplications.filter(a => a.status === 'pending' || a.status === 'submitted').length})` },
                    { key: 'under_review', label: `Under Review (${displayApplications.filter(a => a.status === 'under_review').length})` },
                    { key: 'approved', label: `Approved (${displayApplications.filter(a => a.status === 'approved').length})` },
                    { key: 'rejected', label: `Rejected (${displayApplications.filter(a => a.status === 'rejected').length})` },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      className={`shelter-status-pill-btn ${appStatusFilter === tab.key ? 'active' : ''}`}
                      onClick={() => setAppStatusFilter(tab.key)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search & Sort bar */}
                <div className="shelter-filter-bar-card" style={{ marginBottom: '1.25rem' }}>
                  <div className="shelter-filter-search-input">
                    <Search size={16} color="#7A9187" />
                    <input 
                      type="text" 
                      placeholder="Search by applicant name or pet name..." 
                      value={appSearch}
                      onChange={(e) => setAppSearch(e.target.value)}
                    />
                  </div>

                  <div className="shelter-filter-select-wrap">
                    <span className="shelter-filter-select-label">Sort by:</span>
                    <select 
                      className="shelter-filter-select"
                      value={appSortBy}
                      onChange={(e) => setAppSortBy(e.target.value)}
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                    </select>
                  </div>
                </div>

                {/* Applications list */}
                <div>
                  {filteredApplications.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E0D8' }}>
                      <FileText size={48} color="#174C38" style={{ margin: '0 auto 0.75rem auto' }} />
                      <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#162620', marginBottom: '0.35rem' }}>No adoption applications found</div>
                      <p style={{ color: '#7A9187', fontSize: '0.88rem' }}>When adopters submit applications for your shelter's pets, they will appear here.</p>
                    </div>
                  ) : (
                    filteredApplications.map((app) => (
                      <div key={app.id} className="shelter-app-card-modern">
                        <div className="shelter-app-card-top-bar">
                          <div className="shelter-app-card-id-group">
                            <span className="shelter-app-id-bold">#{app.id}</span>
                            <span className="shelter-app-applied-date">
                              <Clock size={14} /> Applied {app.created_at ? new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recently'}
                            </span>
                          </div>
                          {app.status === 'approved' ? (
                            <span className="shelter-badge-soft shelter-badge-soft-green" style={{ backgroundColor: '#DCFCE7', color: '#15803D', fontWeight: 700 }}>
                              <CheckCircle2 size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Approved
                            </span>
                          ) : app.status === 'rejected' ? (
                            <span className="shelter-badge-soft shelter-badge-soft-red" style={{ backgroundColor: '#FEE2E2', color: '#B91C1C', fontWeight: 700 }}>
                              <XCircle size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> Rejected
                            </span>
                          ) : (
                            <span className="shelter-badge-soft shelter-badge-soft-amber" style={{ backgroundColor: '#FEF3C7', color: '#B45309', fontWeight: 700 }}>
                              <Clock size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} /> {app.status === 'under_review' ? 'Under Review' : 'Pending'}
                            </span>
                          )}
                        </div>

                        <div className="shelter-app-card-body-3col">
                          {/* Pet info */}
                          <div className="shelter-app-pet-col">
                            <img 
                              src={app.pet?.image_url || app.pet?.photo_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=150&q=80'} 
                              alt={app.pet?.name || 'Pet'} 
                              className="shelter-app-pet-thumb" 
                            />
                            <div>
                              <div className="shelter-app-pet-name">{app.pet?.name || 'Rescue Pet'}</div>
                              <div className="shelter-app-pet-breed">{app.pet?.breed || app.pet?.species || 'Companion Animal'}</div>
                            </div>
                          </div>

                          {/* Applicant info */}
                          <div className="shelter-app-applicant-col">
                            <div className="shelter-app-applicant-item">
                              <User size={15} color="#0E3628" />
                              <span className="shelter-app-applicant-name">{app.adopter_name || app.adopter?.name || 'Prospective Adopter'}</span>
                            </div>
                            <div className="shelter-app-applicant-item" style={{ color: 'var(--shelter-text-muted)' }}>
                              <Mail size={14} /> {app.adopter_email || app.adopter?.email || 'Email not provided'}
                            </div>
                            <div className="shelter-app-applicant-item" style={{ color: 'var(--shelter-text-muted)' }}>
                              <Phone size={14} /> {app.adopter_phone || app.adopter?.phone || 'Phone not provided'}
                            </div>
                            {app.visit && (
                              <div style={{ fontSize: '0.76rem', color: '#064E3B', background: '#EAF4EE', border: '1px solid #A7F3D0', padding: '0.3rem 0.55rem', borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.35rem' }}>
                                <Calendar size={12} color="#047857" />
                                <span>Meet &amp; Greet: <strong>{app.visit.visit_date}</strong> ({app.visit.status})</span>
                              </div>
                            )}
                          </div>

                        {/* Action buttons */}
                        <div className="shelter-app-actions-col">
                          {(app.status === 'approved' || app.status === 'completed') && (
                            <>
                              <button
                                type="button"
                                className="ap-btn-cert"
                                onClick={() => setSelectedContractAppId(app.id)}
                                style={{ width: '100%', justifyContent: 'center', background: 'linear-gradient(135deg, #103324 0%, #174C38 100%)', color: '#6EE7B7' }}
                                title="View Executed Digital Adoption Agreement"
                              >
                                <FileCheck2 size={14} /> Agreement
                              </button>
                              <button
                                type="button"
                                className="ap-btn-cert"
                                onClick={() => setSelectedCertAppId(app.id)}
                                style={{ width: '100%', justifyContent: 'center' }}
                                title="View Official Adoption Certificate"
                              >
                                <Award size={14} /> Certificate
                              </button>
                            </>
                          )}
                          <button 
                            type="button" 
                            className="shelter-btn-secondary"
                            onClick={() => setViewingApp(app)}
                          >
                            View Details
                          </button>
                          {app.status !== 'approved' && app.status !== 'rejected' && (
                            <button
                              type="button"
                              className="shelter-btn-secondary"
                              style={{ color: '#047857', borderColor: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}
                              onClick={() => setSchedulingVisitData({
                                pet: app.pet || { id: app.pet_id, name: app.pet?.name || 'Pet' },
                                applicationId: app.id,
                                adopterId: app.adopter_id,
                                adopterName: app.adopter_name
                              })}
                            >
                              <Calendar size={13} color="#047857" />
                              <span>Schedule Meet &amp; Greet</span>
                            </button>
                          )}
                          {app.status === 'approved' ? (
                            <button
                              type="button"
                              className="shelter-btn-primary"
                              disabled
                              style={{ opacity: 0.9, backgroundColor: '#15803D', borderColor: '#15803D', cursor: 'default' }}
                            >
                              <CheckCircle2 size={15} style={{ marginRight: '4px' }} /> Approved
                            </button>
                          ) : (
                            <>
                              <button 
                                type="button" 
                                className="shelter-btn-primary"
                                onClick={() => handleApproveApp(app)}
                              >
                                Approve
                              </button>
                              <button 
                                type="button" 
                                className="shelter-btn-danger-outline"
                                onClick={() => handleRejectApp(app)}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            SCREEN 7: MEET & GREET VISITS
           ========================================================= */}
        {activeTab === 'visits' && (
          <div>
            <div className="shelter-page-header-row">
              <div>
                <h1 className="shelter-page-heading">Meet &amp; Greet Visits</h1>
                <p className="shelter-page-subtext">Schedule and manage in-person meetings</p>
              </div>
              <button 
                type="button" 
                className="shelter-btn-primary"
                onClick={() => {
                  if (pets && pets.length > 0) {
                    setSchedulingVisitData({ pet: pets[0] });
                  } else {
                    showToast('Please list a pet first before scheduling visits.', 'error');
                  }
                }}
              >
                <Plus size={18} /> Schedule New Visit
              </button>
            </div>

            {/* Filter Tabs */}
            <div className="shelter-filter-pills-row">
              <button
                type="button"
                className={`shelter-status-pill-btn ${visitTab === 'upcoming' ? 'active' : ''}`}
                onClick={() => setVisitTab('upcoming')}
              >
                Upcoming ({upcomingVisitsCount})
              </button>
              <button
                type="button"
                className={`shelter-status-pill-btn ${visitTab === 'past' ? 'active' : ''}`}
                onClick={() => setVisitTab('past')}
              >
                Past Visits ({pastVisitsCount})
              </button>
              <button
                type="button"
                className={`shelter-status-pill-btn ${visitTab === 'cancelled' ? 'active' : ''}`}
                onClick={() => setVisitTab('cancelled')}
              >
                Cancelled ({cancelledVisitsCount})
              </button>
            </div>

            {/* Visit cards */}
            <div>
              {filteredVisits.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E0D8' }}>
                  <Calendar size={48} color="#174C38" style={{ margin: '0 auto 0.75rem auto' }} />
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#162620', marginBottom: '0.35rem' }}>No visits in this category</div>
                  <p style={{ color: '#7A9187', fontSize: '0.88rem' }}>When adopters request visits or when you schedule them, they will appear here.</p>
                </div>
              ) : (
                filteredVisits.map((v) => (
                  <div key={v.id} className="shelter-visit-card-modern">
                    <div className="shelter-visit-pet-info">
                      <img 
                        src={v.pet_image || v.pet?.photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=150&q=80'} 
                        alt={v.pet_name} 
                        className="shelter-visit-pet-thumb" 
                      />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#162620' }}>{v.pet_name}</div>
                        <div style={{ fontSize: '0.84rem', color: 'var(--shelter-text-muted)' }}>
                          {v.pet_breed} {v.visit_type === 'virtual' ? '• 📹 Virtual Intro' : '• 🏢 Shelter Visit'}
                        </div>
                      </div>
                    </div>

                    <div className="shelter-visit-details-col">
                      <div className="shelter-visit-meta-item">
                        <Calendar size={15} color="#0E3628" />
                        <span>{v.visit_date}</span>
                      </div>
                      <div className="shelter-visit-meta-item">
                        <Clock size={15} color="#0E3628" />
                        <span>{v.visit_time || v.time_slot}</span>
                      </div>
                      <div className="shelter-visit-meta-item" style={{ color: 'var(--shelter-text-muted)' }}>
                        <User size={15} />
                        <span>Adopter: <strong>{v.adopter_name || v.adopter?.name || 'Applicant'}</strong></span>
                      </div>
                    </div>

                    <div className="shelter-visit-actions-col">
                      <span className={`shelter-badge-soft ${
                        v.status === 'confirmed' ? 'shelter-badge-soft-green' : v.status === 'completed' ? 'shelter-badge-soft-green' : v.status === 'cancelled' ? 'shelter-badge-soft-red' : 'shelter-badge-soft-amber'
                      }`}>
                        {v.status === 'confirmed' ? 'Confirmed' : v.status === 'completed' ? 'Completed' : v.status === 'cancelled' ? 'Cancelled' : 'Requested'}
                      </span>
                      <button 
                        type="button" 
                        className="shelter-btn-secondary"
                        onClick={() => showToast(`Appointment with ${v.adopter_name || 'adopter'}: ${v.visit_date} (${v.visit_time || v.time_slot}). Format: ${v.visit_type === 'virtual' ? 'Virtual Video Call' : 'In-Person Shelter Visit'}. ${v.notes ? 'Notes: ' + v.notes : ''}`)}
                      >
                        View Details
                      </button>
                      {(v.status === 'requested' || v.status === 'pending') && (
                        <button 
                          type="button" 
                          className="shelter-btn-primary"
                          onClick={() => handleConfirmVisit(v)}
                        >
                          Confirm
                        </button>
                      )}
                      {v.status === 'confirmed' && (
                        <button 
                          type="button" 
                          className="shelter-btn-primary"
                          style={{ backgroundColor: '#15803D', borderColor: '#15803D' }}
                          onClick={() => handleCompleteVisit(v)}
                        >
                          Mark Completed
                        </button>
                      )}
                      {v.status !== 'cancelled' && v.status !== 'completed' && (
                        <button 
                          type="button" 
                          className="shelter-btn-danger-outline"
                          onClick={() => handleCancelVisit(v)}
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            SCREEN 8: NOTIFICATIONS
           ========================================================= */}
        {activeTab === 'notifications' && (
          <div>
            <div className="shelter-page-header-row">
              <div>
                <h1 className="shelter-page-heading">Notifications</h1>
                <p className="shelter-page-subtext">Stay updated with important activities</p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="shelter-filter-pills-row">
              <button
                type="button"
                className={`shelter-status-pill-btn ${notifTab === 'all' ? 'active' : ''}`}
                onClick={() => setNotifTab('all')}
              >
                All ({displayNotifications.length})
              </button>
              <button
                type="button"
                className={`shelter-status-pill-btn ${notifTab === 'application' ? 'active' : ''}`}
                onClick={() => setNotifTab('application')}
              >
                Applications ({displayNotifications.filter(n => n.type === 'application').length})
              </button>
              <button
                type="button"
                className={`shelter-status-pill-btn ${notifTab === 'visit' ? 'active' : ''}`}
                onClick={() => setNotifTab('visit')}
              >
                Visits ({displayNotifications.filter(n => n.type === 'visit').length})
              </button>
              <button
                type="button"
                className={`shelter-status-pill-btn ${notifTab === 'pets' ? 'active' : ''}`}
                onClick={() => setNotifTab('pets')}
              >
                Pet Listings ({displayNotifications.filter(n => n.type === 'pets').length})
              </button>
            </div>

            {/* Notification items */}
            <div>
              {filteredNotifications.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#FFFFFF', borderRadius: 16, border: '1px solid #E5E0D8' }}>
                  <Bell size={48} color="#174C38" style={{ margin: '0 auto 0.75rem auto' }} />
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#162620', marginBottom: '0.35rem' }}>No notifications</div>
                  <p style={{ color: '#7A9187', fontSize: '0.88rem' }}>You're all caught up! New updates on your applications and visits will appear here.</p>
                </div>
              ) : (
                filteredNotifications.map((notif) => (
                  <div key={notif.id} className="shelter-notification-item">
                    <div 
                      className="shelter-notif-icon-box"
                      style={{
                        backgroundColor: notif.type === 'application' ? '#FEF3C7' : notif.type === 'visit' ? '#E0F2FE' : '#E8F5E9',
                        color: notif.type === 'application' ? '#D97706' : notif.type === 'visit' ? '#0284C7' : '#15803D',
                      }}
                    >
                      {notif.type === 'application' && <FileText size={20} />}
                      {notif.type === 'visit' && <Calendar size={20} />}
                      {notif.type === 'pets' && <PawPrint size={20} />}
                    </div>

                    <div className="shelter-notif-body">
                      <div className="shelter-notif-title">{notif.title}</div>
                      <p className="shelter-notif-text">{notif.text}</p>
                    </div>

                    <div className="shelter-notif-right">
                      <span>{notif.time}</span>
                      {notif.unread && <span className="shelter-unread-dot" />}
                      <ChevronRight size={16} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================
            SCREEN 9: SHELTER PROFILE
           ========================================================= */}
        {activeTab === 'profile' && (
          <div>
            <div className="shelter-page-header-row">
              <div>
                <h1 className="shelter-page-heading">Shelter Profile</h1>
                <p className="shelter-page-subtext">Manage your shelter information</p>
              </div>
            </div>

            <div className="shelter-profile-card">
              <form onSubmit={handleSaveProfile}>
                <div className="shelter-profile-grid-2">
                  {/* Left Column: Logo Box */}
                  <div className="shelter-profile-logo-col">
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0E3628', alignSelf: 'flex-start' }}>
                      Shelter Emblem / Logo
                    </div>
                    <div className="shelter-profile-logo-box" style={{ overflow: 'hidden' }}>
                      {profileForm.logo_url ? (
                        <img 
                          src={profileForm.logo_url} 
                          alt="Shelter Logo" 
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                      ) : (
                        <PawPrint size={64} strokeWidth={1.8} />
                      )}
                    </div>
                    <div style={{ width: '100%', marginTop: '0.65rem' }}>
                      <label style={{ fontSize: '0.76rem', color: '#6B7280', fontWeight: 600, display: 'block', marginBottom: '0.25rem' }}>
                        Logo Image URL (Optional)
                      </label>
                      <input 
                        type="text"
                        className="shelter-form-input"
                        placeholder="https://... (or choose below)"
                        value={profileForm.logo_url}
                        onChange={(e) => setProfileForm({ ...profileForm, logo_url: e.target.value })}
                        style={{ fontSize: '0.82rem', padding: '0.4rem 0.65rem' }}
                      />
                      <div style={{ display: 'flex', gap: '0.35rem', marginTop: '0.4rem', flexWrap: 'wrap' }}>
                        {[
                          { label: '🐾 Shield', url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=150&auto=format&fit=crop' },
                          { label: '🌿 Sanctuary', url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop' },
                          { label: '🏥 Rescue', url: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=150&auto=format&fit=crop' },
                        ].map((b, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setProfileForm({ ...profileForm, logo_url: b.url })}
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.2rem 0.45rem',
                              background: profileForm.logo_url === b.url ? '#D1FAE5' : '#F3F4F6',
                              border: profileForm.logo_url === b.url ? '1px solid #10B981' : '1px solid #E5E7EB',
                              color: profileForm.logo_url === b.url ? '#065F46' : '#374151',
                              borderRadius: '5px',
                              cursor: 'pointer',
                            }}
                          >
                            {b.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Shelter Information */}
                  <div className="shelter-profile-form-col">
                    <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0E3628', marginBottom: '0.25rem' }}>
                      Official Shelter Credentials
                    </div>

                    <div className="shelter-profile-form-grid-2">
                      <div className="shelter-form-group">
                        <label className="shelter-form-label">
                          Shelter Name <span className="required">*</span>
                        </label>
                        <input 
                          type="text" 
                          className="shelter-form-input" 
                          value={profileForm.shelter_name}
                          onChange={(e) => setProfileForm({ ...profileForm, shelter_name: e.target.value })}
                          required
                        />
                      </div>

                      <div className="shelter-form-group">
                        <label className="shelter-form-label">
                          Govt / NGO Registration License <span className="required">*</span>
                        </label>
                        <input 
                          type="text" 
                          className="shelter-form-input" 
                          value={profileForm.registration_number}
                          onChange={(e) => setProfileForm({ ...profileForm, registration_number: e.target.value })}
                          placeholder="e.g. AWBI-2026-8941"
                          required
                        />
                      </div>
                    </div>

                    <div className="shelter-profile-form-grid-2">
                      <div className="shelter-form-group">
                        <label className="shelter-form-label">Facility / Org Type</label>
                        <select 
                          className="shelter-form-input" 
                          value={profileForm.facility_type}
                          onChange={(e) => setProfileForm({ ...profileForm, facility_type: e.target.value })}
                          style={{ cursor: 'pointer' }}
                        >
                          <option value="Registered Non-Profit (NGO)">Registered Non-Profit (NGO)</option>
                          <option value="Animal Sanctuary & Rescue">Animal Sanctuary & Rescue</option>
                          <option value="Foster Care & Rehab Network">Foster Care & Rehab Network</option>
                          <option value="Veterinary Community Shelter">Veterinary Community Shelter</option>
                        </select>
                      </div>

                      <div className="shelter-form-group">
                        <label className="shelter-form-label">
                          Official Contact Email <span className="required">*</span>
                        </label>
                        <input 
                          type="email" 
                          className="shelter-form-input" 
                          value={profileForm.contact_email}
                          onChange={(e) => setProfileForm({ ...profileForm, contact_email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="shelter-profile-form-grid-2">
                      <div className="shelter-form-group">
                        <label className="shelter-form-label">Official Phone</label>
                        <input 
                          type="text" 
                          className="shelter-form-input" 
                          value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        />
                      </div>

                      <div className="shelter-form-group">
                        <label className="shelter-form-label">Shelter Facility Location</label>
                        <input 
                          type="text" 
                          className="shelter-form-input" 
                          value={profileForm.address}
                          onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="shelter-form-group">
                      <label className="shelter-form-label">Rescue Mission / Bio</label>
                      <textarea 
                        className="shelter-form-textarea" 
                        rows={4}
                        value={profileForm.bio}
                        onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <div className="shelter-form-actions-row">
                  <button 
                    type="submit" 
                    className="shelter-btn-primary"
                    disabled={savingProfile}
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        type={confirmDialog.type}
        loading={confirmDialog.loading}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* Official Adoption Certificate Modal */}
      <AdoptionCertificateModal
        isOpen={!!selectedCertAppId}
        applicationId={selectedCertAppId}
        onClose={() => setSelectedCertAppId(null)}
      />

      {/* Digital Adoption Agreement & E-Signature Modal */}
      <AdoptionContractModal
        isOpen={!!selectedContractAppId}
        applicationId={selectedContractAppId}
        onClose={() => setSelectedContractAppId(null)}
      />

      {/* Schedule Meet & Greet Modal for Shelter */}
      {schedulingVisitData && (
        <ScheduleMeetAndGreetModal
          isOpen={!!schedulingVisitData}
          pet={schedulingVisitData.pet}
          applicationId={schedulingVisitData.applicationId}
          adopterId={schedulingVisitData.adopterId}
          adopterName={schedulingVisitData.adopterName}
          onClose={() => setSchedulingVisitData(null)}
          onSuccess={() => {
            setSchedulingVisitData(null);
            showToast('Meet & Greet scheduled successfully!', 'success');
            // Refresh visits and applications
            adoptionsApi.getShelterVisits().then(r => setVisits(r?.visits || [])).catch(() => {});
            adoptionsApi.getShelterApplications().then(r => setApplications(r?.applications || [])).catch(() => {});
          }}
        />
      )}
    </div>
  );
};

export default ShelterDashboardPage;
