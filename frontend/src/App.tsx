import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import NotFound from './pages/NotFound';
import SellGuide from './pages/SellGuide';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path="browse" element={<Browse />} />
          <Route path="property/:id" element={<PropertyDetails />} />
          <Route path="wishlist" element={<Wishlist />} />
          <Route path="login" element={<Login />} />
          <Route path="contact" element={<Contact />} />
          <Route path="help" element={<Help />} />
          <Route path="sell-guide" element={<SellGuide />} />

          {/* Protected: Unified Dashboard (BUY + SELL) */}
          <Route path="dashboard/buyer" element={
            <ProtectedRoute requiredRole="BUYER"><UnifiedDashboard /></ProtectedRoute>
          } />
          <Route path="dashboard/seller" element={
            <ProtectedRoute requiredRole="SELLER"><UnifiedDashboard /></ProtectedRoute>
          } />
          <Route path="dashboard/seller/upload" element={
            <ProtectedRoute requiredRole="SELLER"><UploadProperty /></ProtectedRoute>
          } />
          <Route path="dashboard/seller/edit/:id" element={
            <ProtectedRoute requiredRole="SELLER"><EditProperty /></ProtectedRoute>
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
  );
}

export default App;
