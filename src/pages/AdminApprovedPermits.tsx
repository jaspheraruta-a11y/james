import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle, Eye, Printer, RefreshCw, Search, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import Modal from '../components/Modal';
import { authService } from '../services/authService';
import { permitService } from '../services/permitService';
import { notificationService } from '../services/notificationService';
import type { Permit, Profile, UploadedImage, PermitType } from '../types';

export default function AdminApprovedPermits() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [proofModalOpen, setProofModalOpen] = useState(false);
  const [selectedProofs, setSelectedProofs] = useState<UploadedImage[]>([]);
  const [selectedPermit, setSelectedPermit] = useState<Permit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPermitTypeId, setSelectedPermitTypeId] = useState<number | null>(null);
  const [notifyingPermitIds, setNotifyingPermitIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const userProfile = await authService.getProfile(user.id);
      setProfile(userProfile);

      const approvedPermits = await permitService.getApprovedPermits();
      setPermits(approvedPermits);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load approved permits');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const openProofModal = (permit: Permit) => {
    const proofs = (permit.uploadedImages || []).filter(
      (image) => image.category === 'proof_of_payment'
    );

    if (proofs.length === 0) {
      toast.error('No proof of payment uploaded for this permit yet');
      return;
    }

    setSelectedPermit(permit);
    setSelectedProofs(proofs);
    setProofModalOpen(true);
  };

  const closeProofModal = () => {
    setProofModalOpen(false);
    setSelectedPermit(null);
    setSelectedProofs([]);
  };

  const handleNotifyReadyForPickup = async (permit: Permit) => {
    if (!permit.applicant_id) {
      toast.error('Cannot send notification: Applicant information not found');
      return;
    }

    setNotifyingPermitIds(prev => new Set(prev).add(permit.id));

    try {
      const applicantName = permit.applicant
        ? `${permit.applicant.firstname || ''} ${permit.applicant.lastname || ''}`.trim() || 'Applicant'
        : 'Applicant';

      const permitTitle = permit.permit_type?.title || 'Your permit';

      await notificationService.sendNotification(
        permit.applicant_id,
        permit.id,
        'Permit Ready for Pickup',
        `Good day ${applicantName}! Your ${permitTitle} is now ready for pickup.\n\nPickup Details:\n📍 Location: Municipal Hall of Valencia\n🏢 Office: Office of the Building Official\n\nPlease bring a valid ID and your payment receipt when claiming your permit. Office hours are Monday to Friday, 8:00 AM - 5:00 PM.`,
        'permit_ready'
      );

      toast.success(`Notification sent to ${applicantName}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification. Please try again.');
    } finally {
      setNotifyingPermitIds(prev => {
        const next = new Set(prev);
        next.delete(permit.id);
        return next;
      });
    }
  };

  const handlePrintPermit = async (permit: Permit) => {
    try {
      // Fetch detailed permit data
      const detailedPermit = await permitService.getPermitById(permit.id);
      
      const applicantName = permit.applicant
        ? `${permit.applicant.firstname || ''} ${permit.applicant.middlename || ''} ${permit.applicant.lastname || ''}`.trim() || 'N/A'
        : 'N/A';

      // Import template functions
      const { 
        generateBusinessPermitHTML, 
        generateBuildingPermitHTML, 
        generateMotorelaPermitHTML, 
        generateGenericPermitHTML 
      } = await import('../utils/permitPrintTemplates');

      let htmlContent = '';
      
      // Determine which template to use based on permit type slug
      const permitSlug = permit.permit_type?.slug?.toLowerCase() || '';
      
      if (permitSlug.includes('business')) {
        htmlContent = generateBusinessPermitHTML(detailedPermit, applicantName);
      } else if (permitSlug.includes('building')) {
        htmlContent = generateBuildingPermitHTML(detailedPermit, applicantName);
      } else if (permitSlug.includes('motorela')) {
        htmlContent = generateMotorelaPermitHTML(detailedPermit);
      } else {
        htmlContent = generateGenericPermitHTML(permit, applicantName);
      }

      // Try to open in new window first
      const printWindow = window.open('', '_blank', 'width=900,height=650');

      if (!printWindow || printWindow.closed || typeof printWindow.closed === 'undefined') {
        // Pop-up was blocked - use alternative method
        toast.loading('Preparing permit for printing...', { duration: 1000 });
        
        // Create a blob and download as HTML file
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `permit-${permit.permit_type?.title || 'document'}-${permit.id.substring(0, 8)}.html`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast.success('Permit downloaded! Open the file to print.', { duration: 4000 });
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
    } catch (error) {
      console.error('Error printing permit:', error);
      toast.error('Failed to generate permit. Please try again.');
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

      // Filter by search query (search in applicant name)
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
          
          if (!matchesName && !permitTypeMatches) {
            return false;
          }
        } else {
          // If no applicant but search query exists, only check permit type
          const permitTypeMatches = permit.permit_type?.title?.toLowerCase().includes(query) || false;
          if (!permitTypeMatches) {
            return false;
          }
        }
      }

      return true;
    });
  }, [permits, searchQuery, selectedPermitTypeId]);

  const paymentSummary = useMemo(() => {
    const total = filteredPermits.length;
    const withCompletedPayment = filteredPermits.filter((permit) => {
      // Check if there's a completed payment record
      const hasCompletedPayment = (permit.payments || []).some(
        (payment) => payment.payment_status === 'completed'
      );
      
      // Also check if there's proof of payment uploaded (for backward compatibility)
      const hasProofOfPayment = (permit.uploadedImages || []).some(
        (image) => image.category === 'proof_of_payment'
      );
      
      return hasCompletedPayment || hasProofOfPayment;
    }).length;

    return {
      total,
      paid: withCompletedPayment,
      unpaid: Math.max(total - withCompletedPayment, 0),
    };
  }, [filteredPermits]);

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Loading approved permits...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 p-6 space-y-6">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title="Approved Permits" />

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-bold neon-text flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-green-400" />
              Approved Permits Overview
            </h2>
            <p className="text-sm text-gray-400">Track payment status and manage approved applications.</p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className={`btn-secondary flex items-center gap-2 ${refreshing ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>

        {/* Search and Filter Section */}
        <div className="glass-panel p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by applicant name or permit type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                  aria-label="Clear search query"
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
                aria-label="Filter by permit type"
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
                    aria-label="Remove search filter"
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
                    aria-label="Remove permit type filter"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-5"
          >
            <p className="text-gray-400 text-sm">Total Approved Permits</p>
            <p className="text-3xl font-bold text-white">{paymentSummary.total}</p>
            {permits.length !== filteredPermits.length && (
              <p className="text-xs text-gray-500 mt-1">
                Showing {filteredPermits.length} of {permits.length}
              </p>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-5"
          >
            <p className="text-gray-400 text-sm">Payments Completed</p>
            <p className="text-3xl font-bold text-green-400">{paymentSummary.paid}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-5"
          >
            <p className="text-gray-400 text-sm">Awaiting Payment</p>
            <p className="text-3xl font-bold text-yellow-400">{paymentSummary.unpaid}</p>
          </motion.div>
        </div>

        <div className="space-y-4">
          {filteredPermits.length === 0 ? (
            <div className="glass-panel p-6 text-gray-400">
              {permits.length === 0 
                ? 'No approved permits found.' 
                : 'No permits match your search criteria.'}
            </div>
          ) : (
            filteredPermits.map((permit) => {
              // Check if there's a completed payment record
              const hasCompletedPaymentRecord = (permit.payments || []).some(
                (payment) => payment.payment_status === 'completed'
              );
              
              // Also check if there's proof of payment uploaded (for backward compatibility)
              const hasProofOfPayment = (permit.uploadedImages || []).some(
                (image) => image.category === 'proof_of_payment'
              );
              
              const hasCompletedPayment = hasCompletedPaymentRecord || hasProofOfPayment;

              const lastPayment = (permit.payments || [])
                .filter((payment) => payment.payment_status === 'completed')
                .sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0];

              return (
                <motion.div
                  key={permit.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-panel p-6 card-hover"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="text-sm text-gray-400">Permit Type</p>
                        <h3 className="text-xl font-semibold text-white">
                          {permit.permit_type?.title || 'Approved Permit'}
                        </h3>
                      </div>

                      <div>
                        <p className="text-sm text-gray-400">Applicant</p>
                        <p className="text-lg text-white">
                          {permit.applicant
                            ? `${permit.applicant.firstname || ''} ${permit.applicant.middlename || ''} ${permit.applicant.lastname || ''}`.trim() || 'Unknown applicant'
                            : 'Unknown applicant'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {permit.applicant?.fulladdress || permit.address || 'No address provided'}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-3">
                        <span className="status-approved">Approved</span>
                        <span className="text-xs text-gray-500">
                          Approved on {new Date(permit.updated_at || permit.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="mt-4">
                        <p className="text-sm text-gray-400">Payment Status</p>
                        <div className="flex flex-wrap items-center gap-3">
                          <span
                            className={
                              hasCompletedPayment ? 'status-approved' : 'status-pending'
                            }
                          >
                            {hasCompletedPayment ? 'Payment Completed' : 'Awaiting Payment'}
                          </span>

                          {lastPayment && (
                            <span className="text-xs text-gray-400">
                              Ref: {lastPayment.payment_reference || 'N/A'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-end">
                      {hasCompletedPayment ? (
                        <>
                          <button
                            onClick={() => openProofModal(permit)}
                            className="btn-primary flex items-center gap-2 justify-center"
                          >
                            <Eye className="w-4 h-4" />
                            View Proof of Payment
                          </button>
                          
                          <button
                            onClick={() => handleNotifyReadyForPickup(permit)}
                            disabled={notifyingPermitIds.has(permit.id)}
                            className="btn-primary flex items-center gap-2 justify-center bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <Bell className={`w-4 h-4 ${notifyingPermitIds.has(permit.id) ? 'animate-pulse' : ''}`} />
                            {notifyingPermitIds.has(permit.id) ? 'Sending...' : 'Notify Ready for Pickup'}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handlePrintPermit(permit)}
                          className="btn-secondary flex items-center gap-2 justify-center"
                        >
                          <Printer className="w-4 h-4" />
                          Print Hard Copy
                        </button>
                      )}

                      {hasCompletedPayment && (
                        <button
                          onClick={() => handlePrintPermit(permit)}
                          className="btn-secondary flex items-center gap-2 justify-center"
                        >
                          <Printer className="w-4 h-4" />
                          Print Permit
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>

      <Modal
        isOpen={proofModalOpen}
        onClose={closeProofModal}
        title={selectedPermit ? `Proof of Payment - ${selectedPermit.permit_type?.title || 'Permit'}` : 'Proof of Payment'}
      >
        {selectedProofs.length === 0 ? (
          <p className="text-gray-400">No proof of payment available.</p>
        ) : (
          <div className="space-y-4">
            {selectedProofs.map((proof) => (
              <div key={proof.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-400">Uploaded on {new Date(proof.uploaded_at).toLocaleString()}</p>
                  {proof.public_url && (
                    <a
                      href={proof.public_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary inline-flex items-center gap-2"
                    >
                      Open in New Tab
                    </a>
                  )}
                </div>
                {proof.public_url ? (
                  <img
                    src={proof.public_url}
                    alt={proof.file_name || 'Proof of payment'}
                    className="w-full max-h-[420px] object-contain rounded-lg border border-white/10 bg-black/30"
                  />
                ) : (
                  <p className="text-gray-500 italic">Proof image URL unavailable.</p>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

