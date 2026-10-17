import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Footer from './components/Footer';
import PortalSidebar from './components/PortalSidebar';
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
    (isAdopter && (
      location.pathname.startsWith('/pets') ||
      location.pathname === '/pawmatch' ||
      location.pathname === '/readiness-checklist'
    ))
  );

  // Only approved shelters display the Shelter Portal sidebar
  const isShelterPortalRoute = isShelterApproved && (
    location.pathname.startsWith('/shelter-dashboard') ||
    location.pathname.startsWith('/shelter_dashboard') ||
    location.pathname === '/pets/new' ||
    /^\/pets\/[^/]+\/edit/.test(location.pathname)
  );

  const isAdminPortalRoute = location.pathname.startsWith('/admin-dashboard');

  const isPortal = isAdopterPortalRoute || isShelterPortalRoute || isAdminPortalRoute;

  return (
    <div className={isPortal ? 'portal-app-wrapper' : 'public-app-wrapper'}>
      {isPortal ? (
        <PortalSidebar />
      ) : (
        <Navbar />
      )}

      <div className={isPortal ? 'portal-content-area' : 'public-content-area'}>
        <main className={isPortal ? 'portal-main-content' : 'main-content'}>
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
            <Route
              path="/my-applications"
              element={
                <ProtectedRoute requiredRole="adopter">
                  <MyApplicationsPage />
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
        {!isPortal && <Footer />}
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
