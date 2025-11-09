import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Edit, FileText } from 'lucide-react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { permitService } from '../services/permitService';
import { authService } from '../services/authService';
import type { Profile, Permit } from '../types';
import toast from 'react-hot-toast';

export default function AdminPermits() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const user = await authService.getCurrentUser();
      if (!user) throw new Error('Not authenticated');
      const p = await authService.getProfile(user.id);
      setProfile(p);
      const allPermits = await permitService.getAllPermits();
      setPermits(allPermits);
    } catch (e) {
      toast.error('Failed to load permits');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteOne = async (permitId: string) => {
    if (!window.confirm('Delete this permit and all associated records?')) return;
    setDeleting(permitId);
    try {
      await permitService.deletePermit(permitId);
      toast.success('Permit deleted');
      setPermits((prev) => prev.filter((p) => p.id !== permitId));
    } catch (e) {
      toast.error('Failed to delete permit');
      console.error(e);
    } finally {
      setDeleting(null);
    }
  };

  const deleteAll = async () => {
    if (permits.length === 0) {
      toast('No permits to delete');
      return;
    }
    if (!window.confirm('Delete ALL permits and all associated records? This cannot be undone.')) return;
    setDeletingAll(true);
    try {
      // Delete sequentially to be safe with FK constraints and rate limits
      for (const p of permits) {
        try {
          await permitService.deletePermit(p.id);
        } catch (inner) {
          console.error('Failed to delete permit', p.id, inner);
        }
      }
      toast.success('All permits deleted');
      await loadData();
    } catch (e) {
      toast.error('Failed to delete all permits');
      console.error(e);
    } finally {
      setDeletingAll(false);
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

      <main className="flex-1 p-6 space-y-6">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title="Admin Permits" />

        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold neon-text flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-400" />
            All Permits
          </h2>
          <button
            onClick={deleteAll}
            disabled={deletingAll || permits.length === 0}
            className={`btn-secondary flex items-center gap-2 ${deletingAll ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <Trash2 className="w-4 h-4" />
            {deletingAll ? 'Deleting...' : 'Delete All'}
          </button>
        </div>

        <div className="space-y-4">
          {permits.length === 0 && (
            <div className="glass-panel p-6 text-gray-400">No permits found.</div>
          )}

          {permits.map((permit) => (
            <motion.div
              key={permit.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-6 card-hover"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-1">
                    {permit.permit_type?.title || 'Unknown Permit Type'}
                  </h3>
                  <p className="text-gray-400 text-sm mb-1">
                    Applicant: {permit.applicant 
                      ? `${permit.applicant.firstname || ''} ${permit.applicant.middlename || ''} ${permit.applicant.lastname || ''}`.trim() || 'Unknown'
                      : 'Unknown'}
                  </p>
                  <div className="flex items-center gap-3">
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
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => deleteOne(permit.id)}
                    disabled={deleting === permit.id || deletingAll}
                    className={`px-4 py-2 rounded-lg border border-red-500/40 text-red-300 hover:bg-red-500/20 transition-all flex items-center gap-2 ${deleting === permit.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                  >
                    <Trash2 className="w-4 h-4" />
                    {deleting === permit.id ? 'Deleting...' : 'Delete'}
                  </button>
                  <button
                    onClick={() => window.alert('Open review in Admin Dashboard modal via its list for now.')}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Review
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
