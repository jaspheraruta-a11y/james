import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Lock, ShieldCheck, Mail } from 'lucide-react';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authService.signInWithUsername(username, password);
      const user = await authService.getCurrentUser();
      if (user) {
        const profile = await authService.getProfile(user.id);
        toast.success('Welcome back!');
        navigate(profile?.role === 'admin' ? '/admin' : '/dashboard');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPasswordLoading(true);

    try {
      // Send password reset email with redirect URL
      const redirectUrl = `${window.location.origin}/reset-password`;
      await authService.resetPassword(forgotPasswordEmail, redirectUrl);
      toast.success('Password reset email sent! Please check your inbox and click the link to reset your password.');
      setShowForgotPassword(false);
      setForgotPasswordEmail('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send password reset email');
    } finally {
      setForgotPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-8 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full
                        bg-gradient-to-br from-cyan-400 to-purple-600 mb-4
                        shadow-lg shadow-cyan-500/50">
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold neon-text mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-400">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Username</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field pl-12"
                placeholder="Enter your username"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field pl-12"
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="flex justify-end mt-2">
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 font-medium transition-colors"
              >
                Forgot Password?
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Don't have an account?{' '}
            <Link to="/register" className="text-cyan-500 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 font-semibold">
              Register
            </Link>
          </p>
        </div>
      </motion.div>

      <Modal
        isOpen={showForgotPassword}
        onClose={() => {
          setShowForgotPassword(false);
          setForgotPasswordEmail('');
        }}
        title="Reset Password"
      >
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full
                          bg-gradient-to-br from-cyan-400 to-purple-600 mb-4
                          shadow-lg shadow-cyan-500/50">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <p className="text-gray-300">
              Enter your email address and we'll send you a password reset link.
            </p>
          </div>

          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="Enter your email address"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setForgotPasswordEmail('');
                }}
                className="btn-secondary flex-1"
                disabled={forgotPasswordLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={forgotPasswordLoading}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {forgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  );
}
