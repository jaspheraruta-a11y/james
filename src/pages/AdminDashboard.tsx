import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Users, FileText, TrendingUp, Edit, Search, X } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import PermitReviewModal from '../components/PermitReviewModal';
import { permitService } from '../services/permitService';
import { profileService } from '../services/profileService';
import { authService } from '../services/authService';
import type { Profile, Permit, DashboardStats, PermitType } from '../types';
import toast from 'react-hot-toast';

export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [selectedPermit, setSelectedPermit] = useState<any | null>(null);
  const [showPermitModal, setShowPermitModal] = useState(false);
  const [adminComment, setAdminComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermitTypeId, setSelectedPermitTypeId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const userProfile = await authService.getProfile(user.id);
        setProfile(userProfile);

        const [dashboardStats, allPermits, allUsers] = await Promise.all([
          permitService.getDashboardStats(),
          permitService.getAllPermits(),
          profileService.getAllProfiles(),
        ]);

        setStats(dashboardStats);
        setPermits(allPermits);
        setUsers(allUsers);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handlePermitAction = async (permitId: string, status: string) => {
    try {
      await permitService.updatePermitStatus(permitId, status, adminComment);
      toast.success(`Permit ${status} successfully`);
      setShowPermitModal(false);
      setSelectedPermit(null);
      setAdminComment('');
      loadData();
    } catch {
      toast.error('Failed to update permit');
    }
  };

  const openPermitModal = async (permit: Permit) => {
    try {
      const fullPermitData = await permitService.getPermitById(permit.id);
      setSelectedPermit(fullPermitData);
      setAdminComment(fullPermitData.admin_comment || '');
      setShowPermitModal(true);
    } catch (error) {
      toast.error('Failed to load permit details');
      console.error(error);
    }
  };

  const handleDocumentRejected = async () => {
    // Refresh the permit data after document rejection
    if (selectedPermit) {
      try {
        const fullPermitData = await permitService.getPermitById(selectedPermit.id);
        setSelectedPermit(fullPermitData);
      } catch (error) {
        console.error('Error refreshing permit data:', error);
      }
    }
  };

  // Get unique permit types from the permits
  const availablePermitTypes = useMemo(() => {
    const typeMap = new Map<number, PermitType>();
    permits.forEach((permit) => {
      if (permit.permit_type && !typeMap.has(permit.permit_type.id)) {
        typeMap.set(permit.permit_type.id, permit.permit_type);
      }
    });
    return Array.from(typeMap.values()).sort((a, b) => 
      (a.title || '').localeCompare(b.title || '')
    );
  }, [permits]);

  // Filter permits based on search query and permit type
  const filteredPermits = useMemo(() => {
    return permits.filter((permit) => {
      // Filter by permit type
      if (selectedPermitTypeId !== null && permit.permit_type_id !== selectedPermitTypeId) {
        return false;
      }

      // Filter by search query (search in applicant name and permit type)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const applicant = permit.applicant;
        
        if (applicant) {
          const fullName = `${applicant.firstname || ''} ${applicant.middlename || ''} ${applicant.lastname || ''}`
            .toLowerCase()
            .trim();
          
          // Check if search query matches any part of the name
          const nameParts = fullName.split(/\s+/).filter(Boolean);
          const matchesName = nameParts.some(part => part.includes(query)) || fullName.includes(query);
          
          // Also check if permit type title matches
          const permitTypeMatches = permit.permit_type?.title?.toLowerCase().includes(query) || false;
          
          // Check if address matches
          const addressMatches = (permit.applicant?.fulladdress || permit.address || '')
            .toLowerCase()
            .includes(query);
          
          if (!matchesName && !permitTypeMatches && !addressMatches) {
            return false;
          }
        } else {
          // If no applicant but search query exists, only check permit type
          const permitTypeMatches = permit.permit_type?.title?.toLowerCase().includes(query) || false;
          const addressMatches = (permit.address || '').toLowerCase().includes(query);
          if (!permitTypeMatches && !addressMatches) {
            return false;
          }
        }
      }

      return true;
    });
  }, [permits, searchQuery, selectedPermitTypeId]);

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
        <Navbar onMenuClick={() => setSidebarOpen(true)} title="Admin Dashboard" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold text-white">{stats?.totalUsers || 0}</p>
              </div>
              <Users className="w-12 h-12 text-cyan-400" />
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
                <p className="text-gray-400 text-sm mb-1">Total Permits</p>
                <p className="text-3xl font-bold text-white">{stats?.totalPermits || 0}</p>
              </div>
              <FileText className="w-12 h-12 text-purple-400" />
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
                <p className="text-gray-400 text-sm mb-1">Pending Permits</p>
                <p className="text-3xl font-bold text-yellow-400">{stats?.pendingPermits || 0}</p>
              </div>
              <TrendingUp className="w-12 h-12 text-yellow-400" />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-6 card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm mb-1">Total Payments</p>
                <p className="text-3xl font-bold text-green-400">{stats?.totalPayments || 0}</p>
              </div>
              <div className="w-12 h-12 flex items-center justify-center text-green-400 font-bold text-4xl">₱</div>
            </div>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold neon-text mb-4">Recent Users</h2>
            <div className="space-y-3">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div>
                    <p className="font-semibold text-white">{user.full_name || 'Unknown'}</p>
                    <p className="text-sm text-gray-400 capitalize">{user.role}</p>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-6">
            <h2 className="text-xl font-bold neon-text mb-4">Permit Status Overview</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Approved', value: stats?.approvedPermits || 0 },
                    { name: 'Pending', value: stats?.pendingPermits || 0 },
                    { name: 'Rejected', value: stats?.rejectedPermits || 0 },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) => `${props.name}: ${(props.percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#22c55e" />
                  <Cell fill="#facc15" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Legend
                  wrapperStyle={{
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <h2 className="text-2xl font-bold neon-text">All Permits</h2>
            {permits.length !== filteredPermits.length && (
              <p className="text-sm text-gray-400">
                Showing {filteredPermits.length} of {permits.length} permits
              </p>
            )}
          </div>

          {/* Search and Filter Section */}
          <div className="mb-6 p-4 bg-black/20 rounded-lg border border-white/10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by applicant name, permit type, or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-10 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Permit Type Filter */}
              <div className="relative">
                <select
                  value={selectedPermitTypeId || ''}
                  onChange={(e) => setSelectedPermitTypeId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-4 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent appearance-none cursor-pointer"
                >
                  <option value="">All Permit Types</option>
                  {availablePermitTypes.map((type) => (
                    <option key={type.id} value={type.id} className="bg-gray-800">
                      {type.title}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchQuery || selectedPermitTypeId !== null) && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-gray-400">Active filters:</span>
                {searchQuery && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-sm">
                    Search: "{searchQuery}"
                    <button
                      onClick={() => setSearchQuery('')}
                      className="hover:text-cyan-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                {selectedPermitTypeId !== null && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded text-sm">
                    Type: {availablePermitTypes.find(t => t.id === selectedPermitTypeId)?.title || 'Unknown'}
                    <button
                      onClick={() => setSelectedPermitTypeId(null)}
                      className="hover:text-cyan-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedPermitTypeId(null);
                  }}
                  className="text-sm text-gray-400 hover:text-white underline"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {filteredPermits.length === 0 ? (
              <div className="glass-panel p-6 text-gray-400 text-center">
                {permits.length === 0 
                  ? 'No permits found.' 
                  : 'No permits match your search criteria.'}
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
                    <h3 className="text-lg font-semibold text-white mb-2">
                      {permit.permit_type?.title || 'Unknown Permit Type'}
                    </h3>
                    <p className="text-gray-400 text-sm mb-2">
                      Applicant: {permit.applicant 
                        ? `${permit.applicant.firstname || ''} ${permit.applicant.middlename || ''} ${permit.applicant.lastname || ''}`.trim() || 'Unknown'
                        : 'Unknown'}
                    </p>
                    <p className="text-gray-400 text-sm mb-2">Address: {permit.applicant?.fulladdress || 'N/A'}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <span
                        className={
                          permit.status === 'approved'
                            ? 'status-approved'
                            : permit.status === 'rejected'
                            ? 'status-rejected'
                            : 'status-pending'
                        }
                      >
                        {permit.status}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(permit.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openPermitModal(permit)}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Review
                  </button>
                </div>
              </motion.div>
              ))
            )}
          </div>
        </div>
      </main>

      <Modal
        isOpen={showPermitModal}
        onClose={() => setShowPermitModal(false)}
        title="Review Permit Application"
      >
        {selectedPermit && (
          <PermitReviewModal
            permit={selectedPermit}
            adminComment={adminComment}
            onCommentChange={setAdminComment}
            onApprove={() => handlePermitAction(selectedPermit.id, 'approved')}
            onReject={() => handlePermitAction(selectedPermit.id, 'rejected')}
            onDocumentRejected={handleDocumentRejected}
          />
        )}
      </Modal>
    </div>
  );
}
