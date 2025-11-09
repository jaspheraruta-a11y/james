import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Permits from './pages/Permits';
import AdminDashboard from './pages/AdminDashboard';
import AdminPermits from './pages/AdminPermits';
import AdminApprovedPermits from './pages/AdminApprovedPermits';
import Settings from './pages/Settings';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(20, 20, 35, 0.95)',
            backdropFilter: 'blur(12px)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />

      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute requiredRole="citizen">
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/permits"
          element={
            <ProtectedRoute requiredRole="citizen">
              <Permits />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/permits/pending"
          element={
            <ProtectedRoute requiredRole="citizen">
              <Permits />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/permits/approved"
          element={
            <ProtectedRoute requiredRole="citizen">
              <Permits />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/permits/rejected"
          element={
            <ProtectedRoute requiredRole="citizen">
              <Permits />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/permits"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminPermits />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/approved-permits"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminApprovedPermits />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

