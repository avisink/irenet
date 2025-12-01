import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPage';
import { DashboardLayout } from './components/DashboardLayout';
import { OverviewPage } from './components/OverviewPage';
import { OrganizationDashboard } from './components/OrganizationDashboard';
import { CreateRequestPage } from './components/CreateRequestPage';
import { MatchesPage } from './components/MatchesPage';
import { DonationsPage } from './components/DonationsPage';
import { MyDonations } from './components/MyDonations';
import { CreateDonationPage } from './components/CreateDonationPage';
import { BrowseRequestsPage } from './components/BrowseRequestsPage';
import { DonorMatchesPage } from './components/DonorMatchesPage';
import { Toaster } from './components/ui/sonner';
import { MyRequests } from './components/MyRequests';
import { BrowseAvailableDonations } from './components/BrowseAvailableDonations';

function AppContent() {
  const { user, loading } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const [currentPage, setCurrentPage] = useState('overview');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated - show landing or auth page
  if (!user) {
    if (showAuth) {
      return <AuthPage />;
    }
    return <LandingPage onGetStarted={() => setShowAuth(true)} />;
  }

  // Authenticated - show dashboard
  function renderPage() {
    // Overview page for all users
    if (currentPage === 'overview') {
      return <OverviewPage onNavigate={setCurrentPage} />;
    }

    // Donor-specific pages
    if (user.role === 'donor') {
      if (currentPage === 'my-donations') {
        return <MyDonations />;
      }
      if (currentPage === 'create-donation') {
        return <CreateDonationPage />;
      }
      if (currentPage === 'browse-requests') {
        return <BrowseRequestsPage />;
      }
      if (currentPage === 'my-matches') {
        return <DonorMatchesPage />;
      }
    }

    // Organization-specific pages
    if (user.role === 'organization') {
      if (currentPage === 'my-requests') {
        return <MyRequests />;
      }
      if (currentPage === 'my-matches') {
        return <CreateRequestPage />;
      }
      if (currentPage === 'matches') {
        return <MatchesPage />;
      }
      if (currentPage === 'donations') {
        return <BrowseAvailableDonations />;
      }
      if (currentPage === 'completed-donations') {
        return <DonationsPage />;
      }
    }

    // Default to overview
    return <OverviewPage onNavigate={setCurrentPage} />;
  }

  return (
    <DashboardLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster />
    </AuthProvider>
  );
}