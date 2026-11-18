import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PortalSidebar from './components/PortalSidebar';
import AdopterNavbar from './components/AdopterNavbar';
import ShelterNavbar from './components/ShelterNavbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import BrowsePetsPage from './pages/BrowsePetsPage';
import PetDetailPage from './pages/PetDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdopterDashboardPage from './pages/AdopterDashboardPage';
import ShelterDashboardPage from './pages/ShelterDashboardPage';
import AddEditPetPage from './pages/AddEditPetPage';
import MyApplicationsPage from './pages/MyApplicationsPage';
import PawMatchPage from './pages/PawMatchPage';
import ReadinessChecklistPage from './pages/ReadinessChecklistPage';
import AboutPage from './pages/AboutPage';
import ContactPage from './pages/ContactPage';
import ComparePetsPage from './pages/ComparePetsPage';
import PetCostCalculatorPage from './pages/PetCostCalculatorPage';
import VerifyCertificatePage from './pages/VerifyCertificatePage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import MessagesPage from './pages/MessagesPage';
import NotFoundPage from './pages/NotFoundPage';

import './styles/global.css';

const AppContent = () => {
  const location = useLocation();
  const { isAdopter, isShelter, user } = useAuth();

  const isShelterApproved = isShelter && Boolean(
    user?.status === 'approved' ||
    user?.shelter?.status === 'approved' ||
    user?.verified ||
    user?.shelter?.verified
  );

  // Check if current route is within either the Adopter or Shelter Portal
  const isAdopterPortalRoute = (
    location.pathname.startsWith('/adopter-dashboard') ||
    location.pathname.startsWith('/adopter_dashboard') ||
    location.pathname.startsWith('/my-applications') ||
    location.pathname === '/compare-pets' ||
    location.pathname === '/compare' ||
    location.pathname === '/cost-calculator' ||
    location.pathname === '/messages' ||
    (isAdopter && (
      location.pathname.startsWith('/pets') ||
      location.pathname === '/pawmatch' ||
      location.pathname === '/readiness-checklist'
    ))
  );

  // Shelter Portal routes display the dedicated top horizontal Shelter Navbar matching reference mockup
  const isShelterPortalRoute = isShelter && (
    location.pathname.startsWith('/shelter-dashboard') ||
    location.pathname.startsWith('/shelter_dashboard') ||
    location.pathname === '/pets/new' ||
    (isShelter && location.pathname === '/messages') ||
    /^\/pets\/[^/]+\/edit/.test(location.pathname)
  );

  const isAdminPortalRoute = location.pathname.startsWith('/admin-dashboard');

  const isAdopterPortal = !isShelterPortalRoute && !isAdminPortalRoute && isAdopterPortalRoute;
  const isLoginPage = location.pathname === '/login';

  const renderNav = () => {
    if (isLoginPage) {
      return null;
    }
    if (isAdminPortalRoute) {
      return <PortalSidebar />;
    }
    if (isShelterPortalRoute) {
      return <ShelterNavbar />;
    }
    if (isAdopterPortal) {
      return <AdopterNavbar />;
    }
    return <Navbar />;
  };

  const wrapperClass = isLoginPage
    ? 'login-app-wrapper'
    : isAdminPortalRoute
    ? 'portal-app-wrapper'
    : isShelterPortalRoute
    ? 'shelter-app-wrapper'
    : isAdopterPortal
    ? 'adopter-app-wrapper'
    : 'public-app-wrapper';

  const contentAreaClass = isLoginPage
    ? 'login-content-area'
    : isAdminPortalRoute
    ? 'portal-content-area'
    : isShelterPortalRoute
    ? 'shelter-content-area'
    : isAdopterPortal
    ? 'adopter-content-area'
    : 'public-content-area';

  const mainContentClass = isLoginPage
    ? 'login-main-content'
    : isAdminPortalRoute
    ? 'portal-main-content'
    : isShelterPortalRoute
    ? 'shelter-main-content'
    : isAdopterPortal
    ? 'adopter-main-content'
    : 'main-content';

  return (
    <div className={wrapperClass}>
      {renderNav()}

      <div className={contentAreaClass}>
        <main className={mainContentClass}>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/pets" element={<BrowsePetsPage />} />
            <Route path="/pets/:petId" element={<PetDetailPage />} />
            <Route path="/pawmatch" element={<PawMatchPage />} />
            <Route path="/readiness-checklist" element={<ReadinessChecklistPage />} />
            <Route path="/cost-calculator" element={<PetCostCalculatorPage />} />
            <Route path="/compare-pets" element={<ComparePetsPage />} />
            <Route path="/compare" element={<ComparePetsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/verify-certificate/:certNumber" element={<VerifyCertificatePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />

            {/* Adopter Protected Pages (Adopter Portal) */}
            <Route
              path="/adopter-dashboard"
              element={
                <ProtectedRoute requiredRole="adopter">
                  <AdopterDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/adopter_dashboard"
              element={
                <ProtectedRoute requiredRole="adopter">
                  <AdopterDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route path="/adopter" element={<Navigate to="/adopter-dashboard" replace />} />
            <Route path="/shelter" element={<Navigate to="/shelter-dashboard" replace />} />
            <Route path="/admin" element={<Navigate to="/admin-dashboard" replace />} />
            <Route
              path="/my-applications"
              element={
                <ProtectedRoute requiredRole="adopter">
                  <MyApplicationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/messages"
              element={
                <ProtectedRoute>
                  <MessagesPage />
                </ProtectedRoute>
              }
            />

            {/* Shelter Protected Pages (Shelter Portal) */}
            <Route
              path="/shelter-dashboard"
              element={
                <ProtectedRoute requiredRole="shelter">
                  <ShelterDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shelter_dashboard"
              element={
                <ProtectedRoute requiredRole="shelter">
                  <ShelterDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pets/new"
              element={
                <ProtectedRoute requiredRole="shelter">
                  <AddEditPetPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/pets/:petId/edit"
              element={
                <ProtectedRoute requiredRole="shelter">
                  <AddEditPetPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Pages (Admin Portal) */}
            <Route
              path="/admin-dashboard"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* 404 Catch-all */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </main>
        {!isAdminPortalRoute && !isShelterPortalRoute && !isAdopterPortal && !isLoginPage && <Footer />}
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
