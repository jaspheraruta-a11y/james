import { Home, FileText, Settings, LogOut, Users, ShieldCheck, CheckCircle } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import ProfileCard from './ProfileCard';
import type { Profile } from '../types';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import { useEffect, useState } from 'react';

interface SidebarProps {
  profile: Profile;
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ profile, isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Keep sidebar visible on large screens regardless of isOpen
  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const update = () => setIsLargeScreen(mediaQuery.matches);
    update();
    mediaQuery.addEventListener('change', update);
    return () => mediaQuery.removeEventListener('change', update);
  }, []);

  const handleLogout = async () => {
    try {
      await authService.signOut();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch {
      toast.error('Failed to log out');
    }
  };

  const navItems = profile.role === 'admin'
    ? [
        { icon: Home, label: 'Dashboard', path: '/admin' },
        { icon: Users, label: 'Users', path: '/admin/users' },
        { icon: FileText, label: 'Permits', path: '/admin/permits' },
        { icon: CheckCircle, label: 'Approved Permits', path: '/admin/approved-permits' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ]
    : [
        { icon: Home, label: 'Dashboard', path: '/dashboard' },
        { icon: FileText, label: 'My Permits', path: '/dashboard/permits' },
        { icon: Settings, label: 'Settings', path: '/settings' },
      ];

  return (
    <>
      {isOpen && !isLargeScreen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <motion.aside
        initial={{ x: -300 }}
        animate={{ x: isOpen || isLargeScreen ? 0 : -300 }}
        transition={{ type: 'spring', damping: 20 }}
        className={`fixed top-50 left-50 h-full w-72 glass-panel z-50 lg:translate-x-0 lg:static lg:mt-6
                   flex flex-col ${isOpen ? '' : 'lg:flex'}`}
      >
        <div className="p-6 border-b border-gray-200/50 dark:border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
            <h1 className="text-xl font-bold neon-text">PermitHub</h1>
          </div>
          <ProfileCard profile={profile} />
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300
                          ${isActive
                            ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-400/50 shadow-lg shadow-cyan-500/20'
                            : 'hover:bg-gray-200/50 dark:hover:bg-white/10'
                          }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-gray-500 dark:text-gray-400'}`} />
                <span className={`font-medium ${isActive ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200/50 dark:border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-lg
                     hover:bg-red-500/20 border border-transparent hover:border-red-500/50
                     transition-all duration-300 group"
          >
            <LogOut className="w-5 h-5 text-gray-500 dark:text-gray-400 group-hover:text-red-500 dark:group-hover:text-red-400" />
            <span className="font-medium text-gray-700 dark:text-gray-300 group-hover:text-red-600 dark:group-hover:text-red-300">Logout</span>
          </button>
        </div>
      </motion.aside>
    </>
  );
}
