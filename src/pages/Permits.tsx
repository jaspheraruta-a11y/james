import { motion } from 'framer-motion';
import { CheckCircle, Clock, FileText, Plus, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/authService';
import { permitService } from '../services/permitService';
import type { Permit, Profile } from '../types';

export default function Permits() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Determine status filter from URL path or query parameter
  const getStatusFromPath = () => {
    const path = location.pathname;
    if (path.includes('/pending')) return 'pending';
    if (path.includes('/approved')) return 'approved';
    if (path.includes('/rejected')) return 'rejected';
    return searchParams.get('status') || 'all';
  };
  
  const statusFilter = getStatusFromPath();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const userProfile = await authService.getProfile(user.id);
        setProfile(userProfile);

        const userPermits = await permitService.getUserPermits(user.id);
        setPermits(userPermits);
      }
    } catch {
      toast.error('Failed to load permits');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (permit: Permit) => {
    if (permit.status !== 'pending') {
      toast.error('Only pending applications can be deleted');
      return;
    }
    const ok = confirm('Delete this pending application? This cannot be undone.');
    if (!ok) return;
    try {
      await permitService.deletePermit(permit.id);
      toast.success('Application deleted successfully');
      loadData();
    } catch (err: any) {
      console.error('Error deleting application:', err);
      const errorMessage = err?.message || 'Failed to delete application';
      toast.error(errorMessage);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'status-approved';
      case 'rejected':
        return 'status-rejected';
      case 'under_review':
        return 'status-under-review';
      default:
        return 'status-pending';
    }
  };

  const filteredPermits = statusFilter === 'all' 
    ? permits 
    : permits.filter(p => p.status === statusFilter);

  const statusTabs = [
    { label: 'All', value: 'all', count: permits.length },
    { label: 'Pending', value: 'pending', count: permits.filter(p => p.status === 'pending').length },
    { label: 'Approved', value: 'approved', count: permits.filter(p => p.status === 'approved').length },
    { label: 'Rejected', value: 'rejected', count: permits.filter(p => p.status === 'rejected').length },
  ];

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
        <Navbar onMenuClick={() => setSidebarOpen(true)} title="My Permits" />

        {/* Status Filter Tabs */}
        <div className="mb-6 glass-panel p-2 inline-flex rounded-lg gap-2">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => {
                const path = tab.value === 'all' 
                  ? '/dashboard/permits' 
                  : `/dashboard/permits/${tab.value}`;
                navigate(path);
              }}
              className={`px-4 py-2 rounded-md font-medium transition-all duration-200 flex items-center gap-2
                ${statusFilter === tab.value
                  ? 'bg-gradient-to-r from-cyan-500/20 to-purple-600/20 text-cyan-400 border border-cyan-400/50'
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <span>{tab.label}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                statusFilter === tab.value ? 'bg-cyan-400/20' : 'bg-white/10'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Permits</p>
                <p className="text-3xl font-bold text-white">{permits.length}</p>
              </div>
              <FileText className="w-12 h-12 text-cyan-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-6 card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Pending</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {permits.filter(p => p.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-12 h-12 text-yellow-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-400">
                  {permits.filter(p => p.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </motion.div>
        </div>

        {/* Permits List */}
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold neon-text">
              {statusFilter === 'all' ? 'All Permits' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1)} Permits`}
            </h2>
            <button 
              onClick={() => navigate('/dashboard')} 
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              New Application
            </button>
          </div>

          <div className="space-y-4">
            {filteredPermits.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {statusFilter === 'all' 
                    ? 'No permit applications yet' 
                    : `No ${statusFilter} permits`}
                </p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="btn-secondary mt-4"
                >
                  Create Your First Application
                </button>
              </div>
            ) : (
              filteredPermits.map((permit) => (
                <motion.div
                  key={permit.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="glass-panel p-6 card-hover"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {getStatusIcon(permit.status)}
                        <h3 className="text-lg font-semibold text-white">
                          {permit.permit_type?.title || 'Unknown Permit Type'}
                        </h3>
                        <span className={getStatusClass(permit.status)}>
                          {permit.status}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm mb-2">{permit.address}</p>
                      <p className="text-gray-500 text-xs">
                        Applied: {new Date(permit.created_at).toLocaleDateString()}
                      </p>
                      {permit.admin_comment && (
                        <div className="mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                          <p className="text-sm text-gray-300">
                            <span className="font-semibold">Admin Comment:</span> {permit.admin_comment}
                          </p>
                        </div>
                      )}
                    </div>
                    {permit.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => navigate('/dashboard')}
                          className="btn-secondary px-3 py-2"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(permit)}
                          className="btn-danger px-3 py-2"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
