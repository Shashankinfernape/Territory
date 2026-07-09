import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/auth/Login';
import Contact from './pages/Contact';
import Help from './pages/Help';
import Home from './pages/buyer/Home';
import PropertyDetails from './pages/buyer/PropertyDetails';
import SellerDashboard from './pages/seller/Dashboard';
import UploadProperty from './pages/seller/UploadProperty';
import EditProperty from './pages/seller/EditProperty';
import SecureViewer from './pages/buyer/SecureViewer';
import BuyerDashboard from './pages/buyer/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import NotFound from './pages/NotFound';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Public Routes */}
          <Route index element={<Home />} />
          <Route path="property/:id" element={<PropertyDetails />} />
          <Route path="login" element={<Login />} />
          <Route path="contact" element={<Contact />} />
          <Route path="help" element={<Help />} />

          {/* Protected: Buyer */}
          <Route path="dashboard/buyer" element={
            <ProtectedRoute requiredRole="BUYER"><BuyerDashboard /></ProtectedRoute>
          } />

          {/* Protected: Seller */}
          <Route path="dashboard/seller" element={
            <ProtectedRoute requiredRole="SELLER"><SellerDashboard /></ProtectedRoute>
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

        {/* Fullscreen Secure Viewer */}
        <Route path="/viewer/:docId" element={
          <ProtectedRoute><SecureViewer /></ProtectedRoute>
        } />
      </Routes>
    </Router>
  );
}

export default App;
