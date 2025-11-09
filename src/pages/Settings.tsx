import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Lock, Save } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/authService';
import { profileService } from '../services/profileService';
import type { Profile } from '../types';
import toast from 'react-hot-toast';

export default function Settings() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profileData, setProfileData] = useState({
    full_name: '',
    phone: '',
  });

  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const userProfile = await authService.getProfile(user.id);
        if (userProfile) {
          setProfile(userProfile);
          setProfileData({
            full_name: userProfile.full_name || '',
            phone: userProfile.phone || '',
          });
        }
      }
    } catch {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (!profile) return;

      await profileService.updateProfile(profile.id, {
        full_name: profileData.full_name,
        phone: profileData.phone,
      });

      toast.success('Profile updated successfully!');
      loadProfile();
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setSaving(true);

    try {
      await authService.updatePassword(passwordData.newPassword);
      toast.success('Password updated successfully!');
      setPasswordData({ newPassword: '', confirmPassword: '' });
    } catch {
      toast.error('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 p-6">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title="Settings" />

        <div className="max-w-4xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-8"
          >
            <h2 className="text-2xl font-bold neon-text mb-6">Profile Information</h2>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={profileData.full_name}
                      onChange={(e) => setProfileData({ ...profileData, full_name: e.target.value })}
                      className="input-field pl-12"
                      placeholder="Enter your full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                      className="input-field pl-12"
                      placeholder="Enter your phone number"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8"
          >
            <h2 className="text-2xl font-bold neon-text mb-6">Change Password</h2>

            <form onSubmit={handlePasswordUpdate} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      className="input-field pl-12"
                      placeholder="Enter new password"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      className="input-field pl-12"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Lock className="w-5 h-5" />
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-8"
          >
            <h2 className="text-2xl font-bold neon-text mb-4">Account Information</h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-400">Account Type</span>
                <span className="font-semibold text-white capitalize">{profile.role}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/10">
                <span className="text-gray-400">Member Since</span>
                <span className="font-semibold text-white">
                  {new Date(profile.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-gray-400">Account ID</span>
                <span className="font-mono text-sm text-gray-500">{profile.id.slice(0, 8)}...</span>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
