import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { authService } from '../services/authService';
import type { Profile } from '../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'citizen';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ id: string } | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await authService.getCurrentUser();

      if (currentUser) {
        setUser(currentUser);
        const userProfile = await authService.getProfile(currentUser.id);
        setProfile(userProfile);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile?.role !== requiredRole) {
    return <Navigate to={profile?.role === 'admin' ? '/admin' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}
