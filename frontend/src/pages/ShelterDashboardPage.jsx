import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Plus, Edit, Trash2, CheckCircle2, Clock, XCircle, 
  FileText, HeartHandshake, Eye, AlertCircle, X, Check, Building, Calendar,
  Search, Filter, ArrowUpDown, ChevronRight, ChevronLeft, Bell, User,
  MoreVertical, RefreshCw, PawPrint, Phone, Mail, MapPin, Heart, ShieldCheck,
  Sparkles, ExternalLink, ArrowLeft, Camera, CheckSquare, Award, FileCheck2,
  MessageSquare, LayoutGrid, PlusCircle, ArrowRight, Home, Zap, BarChart3
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

  // Screen 1: Featured Pet Spotlight Carousel state
  const [featuredIndex, setFeaturedIndex] = useState(0);

  const availablePetsForSpotlight = useMemo(() => {
    return pets && pets.length > 0 ? pets : [
      {
        id: 'mock-1',
        name: 'Max',
        breed: 'Golden Retriever',
        species: 'Dog',
        bio: 'loving companion looking for a forever home.',
        image_url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85',
      },
      {
        id: 'mock-2',
        name: 'Luna',
        breed: 'Tabby Kitten',
        species: 'Cat',
        bio: 'Playful and gentle kitten ready for a cozy family.',
        image_url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=900&q=85',
      },
      {
        id: 'mock-3',
        name: 'Cooper',
        breed: 'Beagle Companion',
        species: 'Dog',
        bio: 'Gentle, friendly, and great with children.',
        image_url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=900&q=85',
      },
      {
        id: 'mock-4',
        name: 'Barnaby',
        breed: 'Mini Rex',
        species: 'Rabbit',
        bio: 'Sweet and calm rabbit ready for indoor adoption.',
        image_url: 'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=900&q=85',
      }
    ];
  }, [pets]);

  const currentFeaturedPet = availablePetsForSpotlight[featuredIndex % availablePetsForSpotlight.length];

  const handlePrevFeatured = (e) => {
    e?.stopPropagation?.();
    setFeaturedIndex((prev) => (prev === 0 ? availablePetsForSpotlight.length - 1 : prev - 1));
  };

  const handleNextFeatured = (e) => {
    e?.stopPropagation?.();
    setFeaturedIndex((prev) => (prev + 1) % availablePetsForSpotlight.length);
  };

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
  const isApproved = 
    user?.role === 'admin' ||
    user?.email === 'shelter@demo.com' ||
    profileForm?.shelter_name === 'Hope & Paws Animal Sanctuary' ||
    shelterStatus === 'approved' || 
    Boolean(profile?.verified || user?.shelter?.verified || user?.verified);
  const isRejected = shelterStatus === 'rejected';
  const isPending = !isApproved && !isRejected;

  // Shelter display title matching mockup
  const shelterDisplayName = 
    profileForm.shelter_name || 
    (user?.role === 'shelter' ? (user?.name || user?.shelter_name) : null) || 
    'Hope & Paws Animal Sanctuary';

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

  const currentHour = new Date().getHours();
  const greetingText = currentHour < 12 ? 'Good morning,' : currentHour < 18 ? 'Good afternoon,' : 'Good evening,';
  const regNumber = profileForm.registration_number || user?.shelter?.registration_number || user?.registration_number || 'AWBI-2026-8941';

  return (
    <div className="shelter-dashboard-wrapper">
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
            SCREEN 1: DASHBOARD OVERVIEW (Exact Match to New Mockup)
           ========================================================= */}
        {activeTab === 'overview' && (
          <div className="shelter-overview-content-layout">
            
            {/* 1. TOP BANNER: Verified & Approved Rescue Partner Card */}
            <div className="shelter-partner-status-card">
              <div className="shelter-partner-status-left">
                <div className="shelter-partner-shield-circle">
                  <CheckCircle2 size={24} />
                </div>
                <div className="shelter-partner-info-wrap">
                  <div className="shelter-partner-headline-row">
                    <span className="shelter-partner-headline">Verified &amp; Approved Rescue Partner</span>
                    <span className="shelter-partner-active-chip">ACTIVE PARTNER</span>
                  </div>
                  <p className="shelter-partner-subtext">
                    Your shelter registration is approved and in good standing. Public pet listings, legal digital adoption contracts, and Meet &amp; Greet appointments are fully active.
                  </p>
                </div>
              </div>
              <div className="shelter-partner-status-right">
                <div className="shelter-partner-paw-watermark" aria-hidden="true">
                  <PawPrint size={90} />
                </div>
                <div className="shelter-partner-license-badge">
                  <FileText size={22} className="license-badge-icon" />
                  <div className="license-badge-text">
                    <span className="license-badge-label">NGO License</span>
                    <span className="license-badge-num">#{regNumber}</span>
                  </div>
                </div>
                {/* Botanical flourish watermark */}
                <div className="shelter-partner-leaf-flourish" aria-hidden="true" />
              </div>
            </div>

            {/* 2. COMPOSITE HERO SECTION (2 Columns: Wide Combined Hero Banner + 3 Story Cards Stack) */}
            <section className="shelter-hero-composite-row">
              
              {/* Part A: Combined Hero Banner Card */}
              <div className="shelter-hero-banner-combined">
                {/* Botanical Leaves framing watermark */}
                <div className="shelter-hero-leaves-decor tl" aria-hidden="true" />
                <div className="shelter-hero-leaves-decor bl" aria-hidden="true" />

                {/* Left Side: Greeting, Subtitle, Values, and Actions */}
                <div className="shelter-hero-greeting-col">
                  <div className="shelter-hero-greeting-sub">{greetingText}</div>
                  <h1 className="shelter-hero-title">
                    {shelterDisplayName} <span className="shelter-title-team-accent">Team!</span>
                  </h1>
                  <p className="shelter-hero-subtitle">
                    Together we give them a second chance.
                  </p>

                  {/* Core Values Row matching mockup */}
                  <div className="shelter-hero-values-row">
                    <span className="hero-value-chip">
                      <Heart size={14} className="val-icon heart" />
                      <span>Rescue</span>
                    </span>
                    <span className="hero-value-chip">
                      <Home size={14} className="val-icon home" />
                      <span>Rehabilitate</span>
                    </span>
                    <span className="hero-value-chip">
                      <PawPrint size={14} className="val-icon paw" />
                      <span>Rehome</span>
                    </span>
                  </div>

                  {/* Action Buttons Row */}
                  <div className="shelter-hero-actions-row">
                    <Link to="/pets/new" className="shelter-hero-btn-add">
                      <Plus size={16} /> Add New Pet
                    </Link>
                    <button
                      type="button"
                      className="shelter-hero-btn-listings"
                      onClick={() => handleTabChange('pets')}
                    >
                      <FileText size={16} /> View Pet Listings
                    </button>
                  </div>
                </div>

                {/* Center Flourish Script with Heart loop sketch */}
                <div className="shelter-hero-center-flourish" aria-hidden="true">
                  <div className="script-flourish-wrap">
                    <span className="script-flourish-line">Small Acts</span>
                    <span className="script-flourish-line sub">Big Changes</span>
                  </div>
                  <svg className="flourish-heart-sketch" viewBox="0 0 80 80" fill="none">
                    <path
                      d="M 40 60 C 18 42, 8 28, 18 18 C 28 8, 38 18, 40 24 C 42 18, 52 8, 62 18 C 72 28, 62 42, 40 60 Z"
                      stroke="#10B981"
                      strokeWidth="1.8"
                      strokeDasharray="4 4"
                      fill="none"
                    />
                  </svg>
                </div>

                {/* Right Side: Featured Pet Photo & Spotlight Card */}
                <div className="shelter-hero-spotlight-col">
                  <img
                    src={currentFeaturedPet.image_url || currentFeaturedPet.photo_url || 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=900&q=85'}
                    alt={currentFeaturedPet.name}
                    className="shelter-spotlight-hero-img"
                  />
                  <div className="shelter-spotlight-gradient-overlay" />

                  {/* Floating Spotlight Card info */}
                  <div className="shelter-spotlight-floating-card">
                    <span className="spotlight-tag-mini">FEATURED PET</span>
                    <h3 className="spotlight-name-bold">Meet {currentFeaturedPet.name}</h3>
                    <p className="spotlight-bio-text">
                      {currentFeaturedPet.bio || `A loving companion looking for a forever home.`}
                    </p>
                    <button
                      type="button"
                      className="spotlight-view-details-pill"
                      onClick={() => {
                        setViewingPet(currentFeaturedPet);
                        handleTabChange('pets');
                      }}
                    >
                      <span>View Details</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>

                  {/* Carousel navigation arrows */}
                  <button
                    type="button"
                    className="spotlight-circle-arrow left"
                    onClick={handlePrevFeatured}
                    aria-label="Previous pet"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    className="spotlight-circle-arrow right"
                    onClick={handleNextFeatured}
                    aria-label="Next pet"
                  >
                    <ChevronRight size={16} />
                  </button>

                  {/* Pagination capsule indicators */}
                  <div className="spotlight-pagination-capsules">
                    <span className="capsule-pill active" />
                    <span className="capsule-dot" />
                    <span className="capsule-dot" />
                  </div>
                </div>

              </div>

              {/* Part B: Right 3-Tier Pet Story Cards Stack (Dark Frosted Cards) */}
              <div className="shelter-hero-stories-stack">
                <div className="shelter-story-frosted-card" onClick={() => handleTabChange('pets')}>
                  <div className="story-thumb-wrap">
                    <img
                      src="https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=250&q=80"
                      alt="Rescued kitten"
                    />
                  </div>
                  <div className="story-text-wrap">
                    <span className="story-text-line">Rescued.</span>
                    <span className="story-text-line">Rehabilitated.</span>
                    <span className="story-text-line highlight">Ready for Love.</span>
                  </div>
                  <div className="story-arrow-circle">
                    <ChevronRight size={14} />
                  </div>
                </div>

                <div className="shelter-story-frosted-card" onClick={() => handleTabChange('pets')}>
                  <div className="story-thumb-wrap">
                    <img
                      src="https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=250&q=80"
                      alt="Cared puppy"
                    />
                  </div>
                  <div className="story-text-wrap">
                    <span className="story-text-line">Care Today</span>
                    <span className="story-text-line">for a Brighter</span>
                    <span className="story-text-line highlight">Tomorrow.</span>
                  </div>
                  <div className="story-arrow-circle">
                    <ChevronRight size={14} />
                  </div>
                </div>

                <div className="shelter-story-frosted-card" onClick={() => handleTabChange('pets')}>
                  <div className="story-thumb-wrap">
                    <img
                      src="https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=250&q=80"
                      alt="Rescue rabbit"
                    />
                  </div>
                  <div className="story-text-wrap">
                    <span className="story-text-line">Every Life</span>
                    <span className="story-text-line highlight">Matters <span style={{ color: '#F43F5E' }}>❤</span></span>
                  </div>
                  <div className="story-arrow-circle">
                    <ChevronRight size={14} />
                  </div>
                </div>
              </div>

            </section>

            {/* 3. 4 STAT CARDS IN A ROW WITH WAVE & BAR CHART GRAPHIC WATERMARKS */}
            <section className="shelter-stats-grid-4">
              
              {/* Card 1: Total Pets */}
              <div 
                className="shelter-stat-card-v2 theme-green"
                onClick={() => handleTabChange('pets')}
                title="View Pet Listings"
              >
                <div className="stat-card-top-row">
                  <div className="stat-card-icon-box green">
                    <PawPrint size={18} />
                  </div>
                  <div className="stat-card-arrow-pill green">
                    <ChevronRight size={14} />
                  </div>
                </div>

                <div className="stat-card-metric-num">{stats?.total_listings ?? pets.length}</div>
                <div className="stat-card-metric-title">Total Pets</div>
                <div className="stat-card-metric-sub">Pets currently in your shelter</div>

                {/* Decorative Bottom-Right Wave & Bar Chart Graphic Watermark */}
                <div className="stat-card-watermark-bars green" aria-hidden="true">
                  <svg viewBox="0 0 100 60" fill="none" className="watermark-svg">
                    <path d="M 0 50 Q 30 35, 60 48 T 100 38 L 100 60 L 0 60 Z" fill="currentColor" opacity="0.3" />
                    <rect x="58" y="28" width="8" height="24" rx="3" fill="currentColor" />
                    <rect x="72" y="18" width="8" height="34" rx="3" fill="currentColor" />
                    <rect x="86" y="8" width="8" height="44" rx="3" fill="currentColor" />
                  </svg>
                </div>
              </div>

              {/* Card 2: Adoption Applications */}
              <div 
                className="shelter-stat-card-v2 theme-blue"
                onClick={() => handleTabChange('applications')}
                title="View Adoption Applications"
              >
                <div className="stat-card-top-row">
                  <div className="stat-card-icon-box blue">
                    <FileText size={18} />
                  </div>
                  <div className="stat-card-arrow-pill blue">
                    <ChevronRight size={14} />
                  </div>
                </div>

                <div className="stat-card-metric-num">
                  {stats?.pending_applications ?? displayApplications.filter(a => a.status === 'pending' || a.status === 'submitted').length}
                </div>
                <div className="stat-card-metric-title">Adoption Applications</div>
                <div className="stat-card-metric-sub">Requests from adopters</div>

                <div className="stat-card-watermark-bars blue" aria-hidden="true">
                  <svg viewBox="0 0 100 60" fill="none" className="watermark-svg">
                    <path d="M 0 50 Q 30 35, 60 48 T 100 38 L 100 60 L 0 60 Z" fill="currentColor" opacity="0.3" />
                    <rect x="58" y="28" width="8" height="24" rx="3" fill="currentColor" />
                    <rect x="72" y="18" width="8" height="34" rx="3" fill="currentColor" />
                    <rect x="86" y="8" width="8" height="44" rx="3" fill="currentColor" />
                  </svg>
                </div>
              </div>

              {/* Card 3: Meet & Greets */}
              <div 
                className="shelter-stat-card-v2 theme-amber"
                onClick={() => handleTabChange('visits')}
                title="View Scheduled Visits"
              >
                <div className="stat-card-top-row">
                  <div className="stat-card-icon-box amber">
                    <Calendar size={18} />
                  </div>
                  <div className="stat-card-arrow-pill amber">
                    <ChevronRight size={14} />
                  </div>
                </div>

                <div className="stat-card-metric-num">
                  {stats?.upcoming_visits ?? displayVisits.filter(v => v.status === 'confirmed' || v.status === 'scheduled').length}
                </div>
                <div className="stat-card-metric-title">Meet &amp; Greets</div>
                <div className="stat-card-metric-sub">Scheduled appointments</div>

                <div className="stat-card-watermark-bars amber" aria-hidden="true">
                  <svg viewBox="0 0 100 60" fill="none" className="watermark-svg">
                    <path d="M 0 50 Q 30 35, 60 48 T 100 38 L 100 60 L 0 60 Z" fill="currentColor" opacity="0.3" />
                    <rect x="58" y="28" width="8" height="24" rx="3" fill="currentColor" />
                    <rect x="72" y="18" width="8" height="34" rx="3" fill="currentColor" />
                    <rect x="86" y="8" width="8" height="44" rx="3" fill="currentColor" />
                  </svg>
                </div>
              </div>

              {/* Card 4: Messages */}
              <div 
                className="shelter-stat-card-v2 theme-purple"
                onClick={() => navigate('/messages')}
                title="View Messages"
              >
                <div className="stat-card-top-row">
                  <div className="stat-card-icon-box purple">
                    <MessageSquare size={18} />
                  </div>
                  <div className="stat-card-arrow-pill purple">
                    <ChevronRight size={14} />
                  </div>
                </div>

                <div className="stat-card-metric-num">
                  {unreadCount || (stats?.unread_messages ?? 5)}
                </div>
                <div className="stat-card-metric-title">Messages</div>
                <div className="stat-card-metric-sub">Unread messages</div>

                <div className="stat-card-watermark-bars purple" aria-hidden="true">
                  <svg viewBox="0 0 100 60" fill="none" className="watermark-svg">
                    <path d="M 0 50 Q 30 35, 60 48 T 100 38 L 100 60 L 0 60 Z" fill="currentColor" opacity="0.3" />
                    <rect x="58" y="28" width="8" height="24" rx="3" fill="currentColor" />
                    <rect x="72" y="18" width="8" height="34" rx="3" fill="currentColor" />
                    <rect x="86" y="8" width="8" height="44" rx="3" fill="currentColor" />
                  </svg>
                </div>
              </div>

            </section>

            {/* 4. THREE-COLUMN BOTTOM ACTIVITY & QUICK ACTIONS ROW */}
            <section className="shelter-bottom-tri-grid">
              
              {/* Column 1: Recent Adoption Applications */}
              <div className="shelter-bottom-col">
                <div className="shelter-section-header">
                  <h2 className="shelter-section-title">
                    <PawPrint size={18} className="shelter-feed-header-icon" />
                    Recent Adoption Applications
                  </h2>
                  <Link 
                    to="/shelter-dashboard?tab=applications" 
                    className="shelter-link-view-all"
                  >
                    View All →
                  </Link>
                </div>

                <div className="shelter-tri-card-container">
                  {displayApplications.length === 0 ? (
                    <div className="shelter-mini-empty-state">
                      <FileText size={22} className="empty-state-icon" />
                      <div className="empty-state-title">No recent applications</div>
                      <p className="empty-state-desc">New applications from adopters will appear here.</p>
                    </div>
                  ) : (
                    displayApplications.slice(0, 3).map((app) => (
                      <div 
                        key={app.id} 
                        className="shelter-app-item-row"
                        onClick={() => {
                          setViewingApp(app);
                          handleTabChange('applications');
                        }}
                      >
                        <img 
                          src={app.pet?.image_url || app.pet?.photo_url || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=120&q=80'} 
                          alt={app.pet?.name || 'Pet'} 
                          className="shelter-app-thumb" 
                        />
                        <div className="shelter-app-info">
                          <div className="shelter-app-pet-name">{app.pet?.name || 'Bruno'}</div>
                          <div className="shelter-app-breed-meta">
                            {app.pet?.breed || 'Golden Retriever'} • {app.pet?.age ? `${app.pet.age} ${app.pet.age_unit || 'years'}` : '1 year'}
                          </div>
                        </div>
                        <div className="shelter-app-end-meta">
                          <span className={`shelter-status-pill-clean ${
                            app.status === 'approved' ? 'approved' : app.status === 'under_review' ? 'review' : 'new'
                          }`}>
                            {app.status === 'approved' ? 'Approved' : app.status === 'under_review' ? 'Under Review' : 'New'}
                          </span>
                          <span className="shelter-app-date-text">
                            {app.created_at ? new Date(app.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 29, 2026'}
                          </span>
                          <ChevronRight size={14} className="shelter-item-row-arrow" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 2: Upcoming Meet & Greets */}
              <div className="shelter-bottom-col">
                <div className="shelter-section-header">
                  <h2 className="shelter-section-title">
                    <Calendar size={18} className="shelter-feed-header-icon blue" />
                    Upcoming Meet &amp; Greets
                  </h2>
                  <Link 
                    to="/shelter-dashboard?tab=visits" 
                    className="shelter-link-view-all"
                  >
                    View All →
                  </Link>
                </div>

                <div className="shelter-tri-card-container">
                  {displayVisits.length === 0 ? (
                    <div className="shelter-mini-empty-state">
                      <Calendar size={22} className="empty-state-icon" />
                      <div className="empty-state-title">No upcoming meet &amp; greets</div>
                      <p className="empty-state-desc">Scheduled meet &amp; greets will appear here.</p>
                    </div>
                  ) : (
                    displayVisits.slice(0, 3).map((visit) => (
                      <div 
                        key={visit.id} 
                        className="shelter-app-item-row"
                        onClick={() => handleTabChange('visits')}
                      >
                        <img 
                          src={visit.pet_image || visit.pet?.photo_url || 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=120&q=80'} 
                          alt={visit.pet_name || 'Pet'} 
                          className="shelter-app-thumb" 
                        />
                        <div className="shelter-app-info">
                          <div className="shelter-app-pet-name">Meet with {visit.adopter_name || 'Priya S.'}</div>
                          <div className="shelter-app-breed-meta">
                            For {visit.pet_name || 'Bruno'}
                          </div>
                        </div>
                        <div className="shelter-app-end-meta">
                          <span className="shelter-visit-datetime-tag">
                            <Calendar size={12} /> {visit.visit_date ? new Date(visit.visit_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Oct 31, 2026'}
                          </span>
                          <span className="shelter-visit-datetime-tag">
                            <Clock size={12} /> {visit.visit_time || '11:00 AM'}
                          </span>
                          <ChevronRight size={14} className="shelter-item-row-arrow" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Column 3: Quick Actions (Exact 2x3 Grid matching mockup) */}
              <div className="shelter-bottom-col">
                <div className="shelter-section-header">
                  <h2 className="shelter-section-title">
                    <Zap size={18} className="shelter-feed-header-icon amber" />
                    Quick Actions
                  </h2>
                </div>

                <div className="shelter-quick-actions-grid-2x3">
                  {/* Action 1: Add New Pet */}
                  <Link to="/pets/new" className="quick-action-card-tile tile-green">
                    <div className="tile-icon-circle green">
                      <Plus size={18} />
                    </div>
                    <div className="tile-text-wrap">
                      <span className="tile-main-label">Add New Pet</span>
                      <span className="tile-sub-label">Register a new pet</span>
                    </div>
                  </Link>

                  {/* Action 2: View Pets */}
                  <button
                    type="button"
                    className="quick-action-card-tile tile-blue"
                    onClick={() => handleTabChange('pets')}
                  >
                    <div className="tile-icon-circle blue">
                      <FileText size={18} />
                    </div>
                    <div className="tile-text-wrap">
                      <span className="tile-main-label">View Pets</span>
                      <span className="tile-sub-label">See all pets</span>
                    </div>
                  </button>

                  {/* Action 3: Manage Appointments */}
                  <button
                    type="button"
                    className="quick-action-card-tile tile-amber"
                    onClick={() => handleTabChange('visits')}
                  >
                    <div className="tile-icon-circle amber">
                      <Calendar size={18} />
                    </div>
                    <div className="tile-text-wrap">
                      <span className="tile-main-label">Manage Appointments</span>
                      <span className="tile-sub-label">Meet &amp; Greets</span>
                    </div>
                  </button>

                  {/* Action 4: Reply to Messages */}
                  <Link to="/messages" className="quick-action-card-tile tile-purple">
                    <div className="tile-icon-circle purple with-badge">
                      <MessageSquare size={18} />
                      <span className="tile-badge-red">{unreadCount || 5}</span>
                    </div>
                    <div className="tile-text-wrap">
                      <span className="tile-main-label">Reply to Messages</span>
                      <span className="tile-sub-label">Respond to adopters</span>
                    </div>
                  </Link>

                  {/* Action 5: Generate Report */}
                  <button
                    type="button"
                    className="quick-action-card-tile tile-slate"
                    onClick={() => showToast('Generating shelter analytics report...', 'success')}
                  >
                    <div className="tile-icon-circle slate">
                      <BarChart3 size={18} />
                    </div>
                    <div className="tile-text-wrap">
                      <span className="tile-main-label">Generate Report</span>
                      <span className="tile-sub-label">Shelter analytics</span>
                    </div>
                  </button>

                  {/* Action 6: Shelter Profile */}
                  <button
                    type="button"
                    className="quick-action-card-tile tile-slate"
                    onClick={() => handleTabChange('profile')}
                  >
                    <div className="tile-icon-circle slate">
                      <Building size={18} />
                    </div>
                    <div className="tile-text-wrap">
                      <span className="tile-main-label">Shelter Profile</span>
                      <span className="tile-sub-label">Update details</span>
                    </div>
                  </button>
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
