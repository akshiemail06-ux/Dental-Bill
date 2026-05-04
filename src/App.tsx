/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClinicProvider, useClinic } from './contexts/ClinicContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { PWAProvider } from './contexts/PWAContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';

// Lazy load pages for fast initial loading experience
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const CreateBillPage = lazy(() => import('./pages/CreateBillPage'));
const BillsHistoryPage = lazy(() => import('./pages/BillsHistoryPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const BillPreviewPage = lazy(() => import('./pages/BillPreviewPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const DisclaimerPage = lazy(() => import('./pages/DisclaimerPage'));
const TroubleshootPage = lazy(() => import('./pages/TroubleshootPage'));
const OrthoPatientsPage = lazy(() => import('./pages/OrthoPatientsPage'));
const OrthoPatientDetailPage = lazy(() => import('./pages/OrthoPatientDetailPage'));
const AdminBlogPage = lazy(() => import('./pages/AdminBlogPage'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const MembershipPage = lazy(() => import('./pages/MembershipPage'));
const UpgradePage = lazy(() => import('./pages/UpgradePage'));
const BlogListingPage = lazy(() => import('./pages/BlogListingPage'));
const BlogDetailPage = lazy(() => import('./pages/BlogDetailPage'));
const SEOLandingIndiaPage = lazy(() => import('./pages/SEOLandingIndiaPage'));

const LoadingFallback = ({ message = "Loading..." }: { message?: string }) => (
  <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50">
    <div className="flex items-center gap-2 text-gray-500 font-medium">
      <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
      {message}
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthReady, isDemo } = useAuth();
  
  if (loading || !isAuthReady) {
    return <LoadingFallback message="Authenticating..." />;
  }

  if (isDemo) return <>{children}</>;
  if (!user) return <Navigate to="/login" replace />;
  
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthReady } = useAuth();
  const ADMIN_EMAILS = ["akshiemail06@gmail.com", "akshitb948@gmail.com"];

  if (loading || !isAuthReady) {
    return <LoadingFallback message="Verifying Admin..." />;
  }

  if (!user) return <Navigate to="/login" state={{ from: window.location.pathname }} replace />;
  
  if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isAuthReady, isDemo } = useAuth();
  
  if (loading || !isAuthReady) {
    return <LoadingFallback message="Loading..." />;
  }
  
  if (user || isDemo) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
};

export default function App() {
  React.useEffect(() => {
    const loader = document.getElementById('pwa-loader');
    if (loader) {
      // Faster hide for the static loader
      const hideLoader = () => {
        loader.classList.add('hidden');
        setTimeout(() => {
          loader.style.display = 'none';
        }, 300);
      };
      
      // If document is already loaded
      if (document.readyState === 'complete') {
        hideLoader();
      } else {
        window.addEventListener('load', hideLoader);
        // Fallback timeout
        const timeout = setTimeout(hideLoader, 1500);
        return () => {
          window.removeEventListener('load', hideLoader);
          clearTimeout(timeout);
        };
      }
    }
  }, []);

  return (
    <ErrorBoundary>
      <HelmetProvider>
        <Router>
          <AuthProvider>
            <SubscriptionProvider>
              <ClinicProvider>
                <PWAProvider>
                  <Suspense fallback={<LoadingFallback />}>
                    <Routes>
                      <Route path="/dental-clinic-software-india" element={<SEOLandingIndiaPage />} />
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/pricing" element={<PricingPage />} />
                      <Route path="/login" element={
                        <PublicRoute>
                          <LoginPage />
                        </PublicRoute>
                      } />
                      <Route path="/signup" element={
                        <PublicRoute>
                          <SignupPage />
                        </PublicRoute>
                      } />
                      
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <DashboardPage />
                        </ProtectedRoute>
                      } />

                      <Route path="/membership" element={
                        <ProtectedRoute>
                          <MembershipPage />
                        </ProtectedRoute>
                      } />

                      <Route path="/upgrade" element={
                        <ProtectedRoute>
                          <UpgradePage />
                        </ProtectedRoute>
                      } />

                      <Route path="/bills/new" element={
                        <ProtectedRoute>
                          <CreateBillPage />
                        </ProtectedRoute>
                      } />

                  <Route path="/bills/:id/edit" element={
                    <ProtectedRoute>
                      <CreateBillPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/bills" element={
                    <ProtectedRoute>
                      <BillsHistoryPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/ortho" element={
                    <ProtectedRoute>
                      <OrthoPatientsPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/ortho/:id" element={
                    <ProtectedRoute>
                      <OrthoPatientDetailPage />
                    </ProtectedRoute>
                  } />

                  {/* Bill Preview is now PUBLICLY ACCESSIBLE for shared WhatsApp links */}
                  <Route path="/bills/:id" element={<BillPreviewPage />} />

                  <Route path="/settings" element={
                    <ProtectedRoute>
                      <SettingsPage />
                    </ProtectedRoute>
                  } />

                  <Route path="/reports" element={
                    <ProtectedRoute>
                      <ReportsPage />
                    </ProtectedRoute>
                  } />

                  {/* Blog Routes */}
                  <Route path="/blog" element={<BlogListingPage />} />
                  <Route path="/blog/:slug" element={<BlogDetailPage />} />
                  <Route path="/admin/blog" element={
                    <AdminRoute>
                      <AdminBlogPage />
                    </AdminRoute>
                  } />

                  {/* Legal & Help Pages */}
                  <Route path="/privacy" element={<PrivacyPage />} />
                  <Route path="/terms" element={<TermsPage />} />
                  <Route path="/disclaimer" element={<DisclaimerPage />} />
                  <Route path="/troubleshoot" element={<TroubleshootPage />} />
                  
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
              <Toaster position="top-right" richColors />
            </PWAProvider>
          </ClinicProvider>
        </SubscriptionProvider>
      </AuthProvider>
      </Router>
    </HelmetProvider>
  </ErrorBoundary>
  );
}

