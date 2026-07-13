import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

// Intro Component
import SplashAnimation from './components/SplashAnimation';

import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Contact from './pages/Contact';
import Help from './pages/Help';
import Home from './pages/buyer/Home';
import Browse from './pages/buyer/Browse';
import PropertyDetails from './pages/buyer/PropertyDetails';
import UnifiedDashboard from './pages/buyer/Dashboard';
import UploadProperty from './pages/seller/UploadProperty';
import EditProperty from './pages/seller/EditProperty';
import SecureViewer from './pages/buyer/SecureViewer';

import AdminDashboard from './pages/admin/Dashboard';
import Wishlist from './pages/buyer/Wishlist';
import MapSearch from './pages/buyer/MapSearch';
import NotFound from './pages/NotFound';
import SellGuide from './pages/SellGuide';
import Settings from './pages/Settings';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    /* mode="sync" = crossfade dissolve: splash fades out while app fades in simultaneously */
    <AnimatePresence mode="sync">
      {showSplash ? (
        <SplashAnimation key="splash" onComplete={() => setShowSplash(false)} />
      ) : (
        <motion.div
          key="app-router-root"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
          className="min-h-screen"
        >
          <Router>
            <Routes>
              <Route path="/" element={<Layout />}>
                {/* Public Routes */}
                <Route index element={<Home />} />
                <Route path="browse" element={<Browse />} />
                <Route path="map" element={<MapSearch />} />
                <Route path="property/:id" element={<PropertyDetails />} />
                <Route path="wishlist" element={<Wishlist />} />
                <Route path="login" element={<Login />} />
                <Route path="contact" element={<Contact />} />
                <Route path="help" element={<Help />} />
                <Route path="settings" element={<Settings />} />
                <Route path="sell-guide" element={<SellGuide />} />

                {/* Protected: Unified Dashboard (BUY + SELL) */}
                <Route path="dashboard/buyer" element={
                  <ProtectedRoute requiredRole="BUYER"><UnifiedDashboard /></ProtectedRoute>
                } />
                <Route path="dashboard/seller" element={
                  <ProtectedRoute><UnifiedDashboard /></ProtectedRoute>
                } />
                <Route path="dashboard/seller/upload" element={
                  <ProtectedRoute><UploadProperty /></ProtectedRoute>
                } />
                <Route path="dashboard/seller/edit/:id" element={
                  <ProtectedRoute><EditProperty /></ProtectedRoute>
                } />

                {/* Protected: Admin */}
                <Route path="dashboard/admin" element={
                  <ProtectedRoute requiredRole="ADMIN"><AdminDashboard /></ProtectedRoute>
                } />

                {/* 404 */}
                <Route path="*" element={<NotFound />} />
              </Route>

              {/* Fullscreen Secure Viewer — /viewer/:propertyId/:docIndex */}
              <Route path="/viewer/:propertyId/:docIndex" element={
                <ProtectedRoute><SecureViewer /></ProtectedRoute>
              } />
            </Routes>
          </Router>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;
