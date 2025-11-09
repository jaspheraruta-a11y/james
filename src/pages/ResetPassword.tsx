import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmPassword: '',
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Check if we have a valid session from the email link
    const checkSession = async () => {
      try {
        // Supabase processes hash fragments automatically when detectSessionInUrl is true
        // Wait a moment for Supabase to process the URL hash
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const user = await authService.getCurrentUser();
        if (user) {
          // User is authenticated via the email link
          setShowPasswordModal(true);
          setLoading(false);
        } else {
          // Check if there's a hash fragment in the URL (Supabase uses hash fragments for security)
          const hash = window.location.hash;
          const hasToken = hash.includes('access_token') || hash.includes('type=recovery');
          
          if (hasToken) {
            // Set up auth state listener to catch when Supabase processes the token
            const unsubscribe = authService.onAuthStateChange((user) => {
              if (user) {
                setShowPasswordModal(true);
                setLoading(false);
                unsubscribe();
              }
            });
            
            // Also check after a delay as fallback
            setTimeout(async () => {
              const userAfterWait = await authService.getCurrentUser();
              if (userAfterWait) {
                setShowPasswordModal(true);
                setLoading(false);
                unsubscribe();
              } else {
                // Give it more time if still no user
                setTimeout(async () => {
                  const userFinal = await authService.getCurrentUser();
                  if (!userFinal) {
                    unsubscribe();
                    toast.error('Invalid or expired reset link. Please request a new password reset.');
                    navigate('/login');
                  } else {
                    setShowPasswordModal(true);
                    setLoading(false);
                    unsubscribe();
                  }
                }, 2000);
              }
            }, 1000);
          } else {
            // No token found, redirect to login
            toast.error('Invalid reset link. Please request a new password reset.');
            navigate('/login');
            setLoading(false);
          }
        }
      } catch (error: any) {
        console.error('Error checking session:', error);
        toast.error('Failed to verify reset link. Please request a new password reset.');
        navigate('/login');
        setLoading(false);
      }
    };

    checkSession();
  }, [navigate]);

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
      setSuccess(true);
      setPasswordData({ newPassword: '', confirmPassword: '' });
      
      // Redirect to login after a short delay
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Verifying reset link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Modal
        isOpen={showPasswordModal}
        onClose={() => {
          if (!saving && !success) {
            navigate('/login');
          }
        }}
        title={success ? 'Password Reset Successful' : 'Reset Password'}
      >
        {success ? (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full
                            bg-gradient-to-br from-green-400 to-emerald-600 mb-4
                            shadow-lg shadow-green-500/50">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-300 text-lg">
                Your password has been successfully reset!
              </p>
              <p className="text-gray-400 text-sm mt-2">
                Redirecting to login page...
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full
                            bg-gradient-to-br from-cyan-400 to-purple-600 mb-4
                            shadow-lg shadow-cyan-500/50">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <p className="text-gray-300">
                Please enter your new password below.
              </p>
            </div>

            <form onSubmit={handlePasswordUpdate} className="space-y-6">
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
                    required
                    minLength={6}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">Password must be at least 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Confirm New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="input-field pl-12"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="btn-secondary flex-1"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}

