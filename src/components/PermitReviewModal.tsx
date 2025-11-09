import { FileText, Download, Clock, User, DollarSign, CheckCircle, XCircle, X, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { permitService } from '../services/permitService';
import { authService } from '../services/authService';
import toast from 'react-hot-toast';

interface PermitReviewModalProps {
  permit: any;
  adminComment: string;
  onCommentChange: (comment: string) => void;
  onApprove: () => void;
  onReject: () => void;
  onDocumentRejected?: () => void;
}

export default function PermitReviewModal({
  permit,
  adminComment,
  onCommentChange,
  onApprove,
  onReject,
  onDocumentRejected,
}: PermitReviewModalProps) {
  const [rejectingDocId, setRejectingDocId] = useState<number | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  const handleRejectDocument = async (docId: number) => {
    setRejectingDocId(docId);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  const confirmRejectDocument = async () => {
    if (!rejectingDocId || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        toast.error('You must be logged in to reject documents');
        return;
      }

      await permitService.rejectDocument(rejectingDocId, rejectionReason.trim(), user.id);
      toast.success('Document rejected successfully');
      setShowRejectModal(false);
      setRejectingDocId(null);
      setRejectionReason('');
      
      // Refresh permit data
      if (onDocumentRejected) {
        onDocumentRejected();
      }
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Failed to reject document');
    }
  };

  const handleApproveDocument = async (docId: number) => {
    try {
      await permitService.approveDocument(docId);
      toast.success('Document approved successfully');
      
      // Refresh permit data
      if (onDocumentRejected) {
        onDocumentRejected();
      }
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
    }
  };

  return (
    <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-2">
      {/* Basic Information */}
      <div className="glass-panel p-4">
        <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
          <FileText className="w-5 h-5 text-cyan-400" />
          Basic Information
        </h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-gray-500">Permit Type</p>
            <p className="text-white font-medium">{permit.permit_type?.title}</p>
          </div>
          <div>
            <p className="text-gray-500">Status</p>
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
          </div>
          <div>
            <p className="text-gray-500">Applicant Name</p>
            <p className="text-white font-medium">
              {permit.applicant 
                ? `${permit.applicant.firstname || ''} ${permit.applicant.middlename || ''} ${permit.applicant.lastname || ''}`.trim() || 'Unknown'
                : 'Unknown'}
            </p>
          </div>
          <div>
            <p className="text-gray-500">Username</p>
            <p className="text-white font-medium">{permit.applicant?.username || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Email</p>
            <p className="text-white font-medium">{permit.applicant?.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Contact Number</p>
            <p className="text-white font-medium">{permit.applicant?.contactnumber || permit.applicant?.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Gender</p>
            <p className="text-white font-medium capitalize">{permit.applicant?.gender || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Birthdate</p>
            <p className="text-white font-medium">
              {permit.applicant?.birthdate ? new Date(permit.applicant.birthdate).toLocaleDateString() : 'N/A'}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-gray-500">Full Address</p>
            <p className="text-white font-medium">{permit.applicant?.fulladdress || 'N/A'}</p>
          </div>
          <div>
            <p className="text-gray-500">Applied Date</p>
            <p className="text-white font-medium">{new Date(permit.created_at).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-gray-500">Last Updated</p>
            <p className="text-white font-medium">{new Date(permit.updated_at).toLocaleString()}</p>
          </div>
          {permit.address && (
            <div className="col-span-2">
              <p className="text-gray-500">Permit Address</p>
              <p className="text-white font-medium">{permit.address}</p>
            </div>
          )}
        </div>
      </div>

      {/* Motorela Permit Details */}
      {permit.motorelaData && (
        <div className="glass-panel p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Motorela Permit Details</h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-gray-500">Application No</p>
              <p className="text-white font-medium">{permit.motorelaData.application_no}</p>
            </div>
            <div>
              <p className="text-gray-500">Date</p>
              <p className="text-white font-medium">{permit.motorelaData.date}</p>
            </div>
            <div>
              <p className="text-gray-500">Body No</p>
              <p className="text-white font-medium">{permit.motorelaData.body_no}</p>
            </div>
            <div>
              <p className="text-gray-500">Chassis No</p>
              <p className="text-white font-medium">{permit.motorelaData.chassis_no}</p>
            </div>
            <div>
              <p className="text-gray-500">Make</p>
              <p className="text-white font-medium">{permit.motorelaData.make}</p>
            </div>
            <div>
              <p className="text-gray-500">Motor No</p>
              <p className="text-white font-medium">{permit.motorelaData.motor_no}</p>
            </div>
            <div>
              <p className="text-gray-500">Route</p>
              <p className="text-white font-medium">{permit.motorelaData.route}</p>
            </div>
            <div>
              <p className="text-gray-500">Plate No</p>
              <p className="text-white font-medium">{permit.motorelaData.plate_no}</p>
            </div>
            <div>
              <p className="text-gray-500">Operator</p>
              <p className="text-white font-medium">{permit.motorelaData.operator}</p>
            </div>
            <div>
              <p className="text-gray-500">Operator Address</p>
              <p className="text-white font-medium">{permit.motorelaData.operator_address}</p>
            </div>
            <div>
              <p className="text-gray-500">Contact</p>
              <p className="text-white font-medium">{permit.motorelaData.contact}</p>
            </div>
            <div>
              <p className="text-gray-500">Driver</p>
              <p className="text-white font-medium">{permit.motorelaData.driver}</p>
            </div>
            <div className="col-span-2">
              <p className="text-gray-500">Driver Address</p>
              <p className="text-white font-medium">{permit.motorelaData.driver_address}</p>
            </div>
            {permit.motorelaData.cedula_no && (
              <>
                <div>
                  <p className="text-gray-500">Cedula No</p>
                  <p className="text-white font-medium">{permit.motorelaData.cedula_no}</p>
                </div>
                <div>
                  <p className="text-gray-500">Place Issued</p>
                  <p className="text-white font-medium">{permit.motorelaData.place_issued || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Date Issued</p>
                  <p className="text-white font-medium">{permit.motorelaData.date_issued || 'N/A'}</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Additional Permit Details (JSON) */}
      {permit.details && Object.keys(permit.details).length > 0 && !permit.businessPermitData && !permit.motorelaData && permit.permit_type?.title?.toLowerCase() !== 'motorela permit' && (
        <div className="glass-panel p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            Additional Permit Details
          </h3>
          
          {/* Building Permit from Details */}
          {permit.details.building_permit && (
            <div className="space-y-4 mb-4">
              <div>
                <h4 className="text-md font-semibold text-cyan-400 mb-2">Application Information</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {permit.details.building_permit.application_no && (
                    <div>
                      <p className="text-gray-500">Application No</p>
                      <p className="text-white font-medium">{permit.details.building_permit.application_no}</p>
                    </div>
                  )}
                  {permit.details.building_permit.bp_no && (
                    <div>
                      <p className="text-gray-500">BP No</p>
                      <p className="text-white font-medium">{permit.details.building_permit.bp_no}</p>
                    </div>
                  )}
                  {permit.details.building_permit.owner_signature_date && (
                    <div>
                      <p className="text-gray-500">Owner Signature Date</p>
                      <p className="text-white font-medium">
                        {new Date(permit.details.building_permit.owner_signature_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-md font-semibold text-cyan-400 mb-2">Applicant Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {permit.details.building_permit.applicant_lastname && (
                    <div>
                      <p className="text-gray-500">Last Name</p>
                      <p className="text-white font-medium">{permit.details.building_permit.applicant_lastname}</p>
                    </div>
                  )}
                  {permit.details.building_permit.applicant_firstname && (
                    <div>
                      <p className="text-gray-500">First Name</p>
                      <p className="text-white font-medium">{permit.details.building_permit.applicant_firstname}</p>
                    </div>
                  )}
                  {permit.details.building_permit.applicant_mi && (
                    <div>
                      <p className="text-gray-500">Middle Initial</p>
                      <p className="text-white font-medium">{permit.details.building_permit.applicant_mi}</p>
                    </div>
                  )}
                  {permit.details.building_permit.applicant_tin && (
                    <div>
                      <p className="text-gray-500">TIN</p>
                      <p className="text-white font-medium">{permit.details.building_permit.applicant_tin}</p>
                    </div>
                  )}
                  {permit.details.building_permit.ownership_form && (
                    <div>
                      <p className="text-gray-500">Ownership Form</p>
                      <p className="text-white font-medium capitalize">{permit.details.building_permit.ownership_form}</p>
                    </div>
                  )}
                  {permit.details.building_permit.address && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Address</p>
                      <p className="text-white font-medium">{permit.details.building_permit.address}</p>
                    </div>
                  )}
                  {permit.details.building_permit.applicant_ctc_no && (
                    <div>
                      <p className="text-gray-500">CTC No</p>
                      <p className="text-white font-medium">{permit.details.building_permit.applicant_ctc_no}</p>
                    </div>
                  )}
                  {permit.details.building_permit.applicant_ctc_date && (
                    <div>
                      <p className="text-gray-500">CTC Date</p>
                      <p className="text-white font-medium">
                        {new Date(permit.details.building_permit.applicant_ctc_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {permit.details.building_permit.applicant_ctc_place && (
                    <div>
                      <p className="text-gray-500">CTC Place Issued</p>
                      <p className="text-white font-medium">{permit.details.building_permit.applicant_ctc_place}</p>
                    </div>
                  )}
                  {permit.details.building_permit.applicant_signature_date && (
                    <div>
                      <p className="text-gray-500">Signature Date</p>
                      <p className="text-white font-medium">
                        {new Date(permit.details.building_permit.applicant_signature_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-md font-semibold text-cyan-400 mb-2">Construction / Project Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {permit.details.building_permit.construction_location && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Construction Location</p>
                      <p className="text-white font-medium">{permit.details.building_permit.construction_location}</p>
                    </div>
                  )}
                  {permit.details.building_permit.scope_of_work && (
                    <div>
                      <p className="text-gray-500">Scope of Work</p>
                      <p className="text-white font-medium capitalize">{permit.details.building_permit.scope_of_work}</p>
                    </div>
                  )}
                  {permit.details.building_permit.occupancy_use && (
                    <div>
                      <p className="text-gray-500">Occupancy / Use</p>
                      <p className="text-white font-medium capitalize">{permit.details.building_permit.occupancy_use}</p>
                    </div>
                  )}
                  {permit.details.building_permit.lot_area && (
                    <div>
                      <p className="text-gray-500">Lot Area</p>
                      <p className="text-white font-medium">
                        {!isNaN(Number(permit.details.building_permit.lot_area)) 
                          ? `${Number(permit.details.building_permit.lot_area).toLocaleString()} sq.m`
                          : 'N/A'}
                      </p>
                    </div>
                  )}
                  {permit.details.building_permit.floor_area && (
                    <div>
                      <p className="text-gray-500">Floor Area</p>
                      <p className="text-white font-medium">
                        {!isNaN(Number(permit.details.building_permit.floor_area)) 
                          ? `${Number(permit.details.building_permit.floor_area).toLocaleString()} sq.m`
                          : 'N/A'}
                      </p>
                    </div>
                  )}
                  {permit.details.building_permit.cost_of_construction && (
                    <div>
                      <p className="text-gray-500">Total Cost of Construction</p>
                      <p className="text-white font-medium text-green-400">
                        {!isNaN(Number(permit.details.building_permit.cost_of_construction)) 
                          ? `₱${Number(permit.details.building_permit.cost_of_construction).toLocaleString('en-PH', { 
                              minimumFractionDigits: 2, 
                              maximumFractionDigits: 2 
                            })}`
                          : 'N/A'}
                      </p>
                    </div>
                  )}
                  {permit.details.building_permit.date_of_construction && (
                    <div>
                      <p className="text-gray-500">Date of Construction</p>
                      <p className="text-white font-medium">
                        {new Date(permit.details.building_permit.date_of_construction).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-md font-semibold text-cyan-400 mb-2">Building Inspector Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {permit.details.building_permit.inspector_name && (
                    <div>
                      <p className="text-gray-500">Inspector Name</p>
                      <p className="text-white font-medium">{permit.details.building_permit.inspector_name}</p>
                    </div>
                  )}
                  {permit.details.building_permit.prc_no && (
                    <div>
                      <p className="text-gray-500">PRC No (License)</p>
                      <p className="text-white font-medium">{permit.details.building_permit.prc_no}</p>
                    </div>
                  )}
                  {permit.details.building_permit.inspector_address && (
                    <div className="col-span-2">
                      <p className="text-gray-500">Inspector Address</p>
                      <p className="text-white font-medium">{permit.details.building_permit.inspector_address}</p>
                    </div>
                  )}
                  {permit.details.building_permit.ptr_no && (
                    <div>
                      <p className="text-gray-500">PTR No</p>
                      <p className="text-white font-medium">{permit.details.building_permit.ptr_no}</p>
                    </div>
                  )}
                  {permit.details.building_permit.inspector_issued_at && (
                    <div>
                      <p className="text-gray-500">Issued At</p>
                      <p className="text-white font-medium">{permit.details.building_permit.inspector_issued_at}</p>
                    </div>
                  )}
                  {permit.details.building_permit.inspector_validity && (
                    <div>
                      <p className="text-gray-500">Validity Date</p>
                      <p className="text-white font-medium">{permit.details.building_permit.inspector_validity}</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-md font-semibold text-cyan-400 mb-2">Civil Engineer Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {permit.details.building_permit.engineer_ctc_no && (
                    <div>
                      <p className="text-gray-500">CTC No</p>
                      <p className="text-white font-medium">{permit.details.building_permit.engineer_ctc_no}</p>
                    </div>
                  )}
                  {permit.details.building_permit.engineer_ctc_date && (
                    <div>
                      <p className="text-gray-500">CTC Date</p>
                      <p className="text-white font-medium">
                        {new Date(permit.details.building_permit.engineer_ctc_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                  {permit.details.building_permit.engineer_ctc_place && (
                    <div>
                      <p className="text-gray-500">CTC Place Issued</p>
                      <p className="text-white font-medium">{permit.details.building_permit.engineer_ctc_place}</p>
                    </div>
                  )}
                </div>
              </div>

              {permit.details.building_permit.proof_of_ownership_url && (
                <div>
                  <h4 className="text-md font-semibold text-cyan-400 mb-2">Proof of Ownership</h4>
                  <div className="space-y-2">
                    <img 
                      src={permit.details.building_permit.proof_of_ownership_url} 
                      alt="Proof of Ownership"
                      className="w-full max-w-md h-auto object-contain rounded-lg border border-gray-700"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <a
                      href={permit.details.building_permit.proof_of_ownership_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center justify-center gap-2 w-full max-w-md"
                    >
                      <Download className="w-4 h-4" />
                      View Full Size
                    </a>
                  </div>
                </div>
              )}

              {/* Additional Documents */}
              {(permit.details.building_permit.cho_url || 
                permit.details.building_permit.cenro_url || 
                permit.details.building_permit.obo_url || 
                permit.details.building_permit.bfp_url) && (
                <div>
                  <h4 className="text-md font-semibold text-cyan-400 mb-2">Additional Documents</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {permit.details.building_permit.cho_url && (
                      <div>
                        <p className="text-gray-500 text-sm mb-1">CHO Document</p>
                        <div className="space-y-2">
                          <img 
                            src={permit.details.building_permit.cho_url} 
                            alt="CHO Document"
                            className="w-full h-auto object-contain rounded-lg border border-gray-700 max-h-40"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <a
                            href={permit.details.building_permit.cho_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary flex items-center justify-center gap-2 text-xs"
                          >
                            <Download className="w-3 h-3" />
                            View CHO
                          </a>
                        </div>
                      </div>
                    )}
                    {permit.details.building_permit.cenro_url && (
                      <div>
                        <p className="text-gray-500 text-sm mb-1">CENRO Document</p>
                        <div className="space-y-2">
                          <img 
                            src={permit.details.building_permit.cenro_url} 
                            alt="CENRO Document"
                            className="w-full h-auto object-contain rounded-lg border border-gray-700 max-h-40"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <a
                            href={permit.details.building_permit.cenro_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary flex items-center justify-center gap-2 text-xs"
                          >
                            <Download className="w-3 h-3" />
                            View CENRO
                          </a>
                        </div>
                      </div>
                    )}
                    {permit.details.building_permit.obo_url && (
                      <div>
                        <p className="text-gray-500 text-sm mb-1">OBO Document</p>
                        <div className="space-y-2">
                          <img 
                            src={permit.details.building_permit.obo_url} 
                            alt="OBO Document"
                            className="w-full h-auto object-contain rounded-lg border border-gray-700 max-h-40"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <a
                            href={permit.details.building_permit.obo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary flex items-center justify-center gap-2 text-xs"
                          >
                            <Download className="w-3 h-3" />
                            View OBO
                          </a>
                        </div>
                      </div>
                    )}
                    {permit.details.building_permit.bfp_url && (
                      <div>
                        <p className="text-gray-500 text-sm mb-1">BFP Document</p>
                        <div className="space-y-2">
                          <img 
                            src={permit.details.building_permit.bfp_url} 
                            alt="BFP Document"
                            className="w-full h-auto object-contain rounded-lg border border-gray-700 max-h-40"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = 'none';
                            }}
                          />
                          <a
                            href={permit.details.building_permit.bfp_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-secondary flex items-center justify-center gap-2 text-xs"
                          >
                            <Download className="w-3 h-3" />
                            View BFP
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Raw JSON (collapsed by default) */}
          {!permit.details.building_permit && (
            <div className="bg-gray-900/50 rounded-lg p-3 overflow-x-auto">
              <pre className="text-xs text-gray-300 whitespace-pre-wrap">
                {JSON.stringify(permit.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}


      {/* Business Permit Details */}
      {permit.businessPermitData && (
        <div className="glass-panel p-4">
          <h3 className="text-lg font-semibold text-white mb-3">Business Permit Details</h3>
          <div className="space-y-4">
            {/* Permit Info */}
            <div>
              <h4 className="text-md font-semibold text-cyan-400 mb-2">Permit Information</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Tax Year</p>
                  <p className="text-white font-medium">{permit.businessPermitData.tax_year || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Control No</p>
                  <p className="text-white font-medium">{permit.businessPermitData.control_no || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Mode of Payment</p>
                  <p className="text-white font-medium">{permit.businessPermitData.mode_of_payment || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Application Type</p>
                  <p className="text-white font-medium">{permit.businessPermitData.application_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-500">Organization Type</p>
                  <p className="text-white font-medium">{permit.businessPermitData.org_type || 'N/A'}</p>
                </div>
                {(permit.businessPermitData.amendment || permit.details?.business_permit?.amendment) && (
                  <div className="col-span-2">
                    <p className="text-gray-500">Amendment</p>
                    <p className="text-white font-medium">{permit.businessPermitData.amendment || permit.details?.business_permit?.amendment}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Taxpayer Details */}
            {permit.businessPermitData.taxpayer && (
              <div>
                <h4 className="text-md font-semibold text-cyan-400 mb-2">Taxpayer Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Name</p>
                    <p className="text-white font-medium">
                      {permit.businessPermitData.taxpayer.firstname} {permit.businessPermitData.taxpayer.middlename} {permit.businessPermitData.taxpayer.lastname}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">TIN</p>
                    <p className="text-white font-medium">{permit.businessPermitData.taxpayer.tin || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">CTC No</p>
                    <p className="text-white font-medium">{permit.businessPermitData.taxpayer.ctc_no || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Address</p>
                    <p className="text-white font-medium">{permit.businessPermitData.taxpayer.address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="text-white font-medium">{permit.businessPermitData.taxpayer.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Email</p>
                    <p className="text-white font-medium">{permit.businessPermitData.taxpayer.email || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Establishment Details */}
            {permit.businessPermitData.establishment && (
              <div>
                <h4 className="text-md font-semibold text-cyan-400 mb-2">Establishment Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Business Name</p>
                    <p className="text-white font-medium">{permit.businessPermitData.establishment.business_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Nature of Business</p>
                    <p className="text-white font-medium">{permit.businessPermitData.establishment.nature_of_business || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Business Address</p>
                    <p className="text-white font-medium">{permit.businessPermitData.establishment.business_address || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Business Area</p>
                    <p className="text-white font-medium">{permit.businessPermitData.establishment.business_area || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Line of Business</p>
                    <p className="text-white font-medium">{permit.businessPermitData.establishment.line_of_business || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">No of Units</p>
                    <p className="text-white font-medium">{permit.businessPermitData.establishment.no_of_units || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Capitalization</p>
                    <p className="text-white font-medium">{permit.businessPermitData.establishment.capitalization ? `₱${Number(permit.businessPermitData.establishment.capitalization).toLocaleString()}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Essential Sales</p>
                    <p className="text-white font-medium">{permit.businessPermitData.establishment.essential_sales ? `₱${Number(permit.businessPermitData.establishment.essential_sales).toLocaleString()}` : 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Non-Essential Sales</p>
                    <p className="text-white font-medium">{permit.businessPermitData.establishment.non_essential_sales ? `₱${Number(permit.businessPermitData.establishment.non_essential_sales).toLocaleString()}` : 'N/A'}</p>
                  </div>
                  {(permit.businessPermitData.establishment?.business_activity_code || permit.details?.business_permit?.business_activity_code) && (
                    <div>
                      <p className="text-gray-500">Business Activity Code</p>
                      <p className="text-white font-medium">{permit.businessPermitData.establishment?.business_activity_code || permit.details?.business_permit?.business_activity_code}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Employment Details */}
            {permit.businessPermitData.employment && (
              <div>
                <h4 className="text-md font-semibold text-cyan-400 mb-2">Employment Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Total Employees</p>
                    <p className="text-white font-medium">{permit.businessPermitData.employment.total_employees || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Employees in LGU</p>
                    <p className="text-white font-medium">{permit.businessPermitData.employment.employees_in_lgu || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Lessor Details */}
            {permit.businessPermitData.lessor && (
              <div>
                <h4 className="text-md font-semibold text-cyan-400 mb-2">Lessor Details</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Lessor Name</p>
                    <p className="text-white font-medium">{permit.businessPermitData.lessor.lessor_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Lessor Address</p>
                    <p className="text-white font-medium">{permit.businessPermitData.lessor.lessor_address || 'N/A'}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Additional Documents */}
            {((permit.businessPermitData.cho_url || permit.details?.business_permit?.cho_url) || 
              (permit.businessPermitData.cenro_url || permit.details?.business_permit?.cenro_url) || 
              (permit.businessPermitData.obo_url || permit.details?.business_permit?.obo_url) || 
              (permit.businessPermitData.bfp_url || permit.details?.business_permit?.bfp_url)) && (
              <div>
                <h4 className="text-md font-semibold text-cyan-400 mb-2">Additional Documents</h4>
                <div className="grid grid-cols-2 gap-3">
                  {(permit.businessPermitData.cho_url || permit.details?.business_permit?.cho_url) && (
                    <div>
                      <p className="text-gray-500 text-sm mb-1">CHO Document</p>
                      <div className="space-y-2">
                        <img 
                          src={permit.businessPermitData.cho_url || permit.details?.business_permit?.cho_url} 
                          alt="CHO Document"
                          className="w-full h-auto object-contain rounded-lg border border-gray-700 max-h-40"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <a
                          href={permit.businessPermitData.cho_url || permit.details?.business_permit?.cho_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center justify-center gap-2 text-xs"
                        >
                          <Download className="w-3 h-3" />
                          View CHO
                        </a>
                      </div>
                    </div>
                  )}
                  {(permit.businessPermitData.cenro_url || permit.details?.business_permit?.cenro_url) && (
                    <div>
                      <p className="text-gray-500 text-sm mb-1">CENRO Document</p>
                      <div className="space-y-2">
                        <img 
                          src={permit.businessPermitData.cenro_url || permit.details?.business_permit?.cenro_url} 
                          alt="CENRO Document"
                          className="w-full h-auto object-contain rounded-lg border border-gray-700 max-h-40"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <a
                          href={permit.businessPermitData.cenro_url || permit.details?.business_permit?.cenro_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center justify-center gap-2 text-xs"
                        >
                          <Download className="w-3 h-3" />
                          View CENRO
                        </a>
                      </div>
                    </div>
                  )}
                  {(permit.businessPermitData.obo_url || permit.details?.business_permit?.obo_url) && (
                    <div>
                      <p className="text-gray-500 text-sm mb-1">OBO Document</p>
                      <div className="space-y-2">
                        <img 
                          src={permit.businessPermitData.obo_url || permit.details?.business_permit?.obo_url} 
                          alt="OBO Document"
                          className="w-full h-auto object-contain rounded-lg border border-gray-700 max-h-40"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <a
                          href={permit.businessPermitData.obo_url || permit.details?.business_permit?.obo_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center justify-center gap-2 text-xs"
                        >
                          <Download className="w-3 h-3" />
                          View OBO
                        </a>
                      </div>
                    </div>
                  )}
                  {(permit.businessPermitData.bfp_url || permit.details?.business_permit?.bfp_url) && (
                    <div>
                      <p className="text-gray-500 text-sm mb-1">BFP Document</p>
                      <div className="space-y-2">
                        <img 
                          src={permit.businessPermitData.bfp_url || permit.details?.business_permit?.bfp_url} 
                          alt="BFP Document"
                          className="w-full h-auto object-contain rounded-lg border border-gray-700 max-h-40"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                        <a
                          href={permit.businessPermitData.bfp_url || permit.details?.business_permit?.bfp_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary flex items-center justify-center gap-2 text-xs"
                        >
                          <Download className="w-3 h-3" />
                          View BFP
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Documents */}
      {permit.documents && permit.documents.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Download className="w-5 h-5 text-cyan-400" />
            Uploaded Documents ({permit.documents.length})
          </h3>
          <div className="space-y-2">
            {permit.documents.map((doc: any, index: number) => {
              const isRejected = doc.status === 'rejected';
              const isApproved = doc.status === 'approved';
              
              return (
                <div 
                  key={doc.id} 
                  className={`flex items-start justify-between p-3 rounded-lg ${
                    isRejected 
                      ? 'bg-red-500/10 border border-red-500/30' 
                      : isApproved
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-white/5'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-cyan-400 font-bold text-xs">#{index + 1}</span>
                      <p className="text-white font-medium">{doc.file_name || 'Unnamed Document'}</p>
                      {isRejected && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-300 text-xs rounded border border-red-500/30 flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          Rejected
                        </span>
                      )}
                      {isApproved && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-300 text-xs rounded border border-green-500/30 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Approved
                        </span>
                      )}
                      {!isRejected && !isApproved && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 text-xs rounded border border-yellow-500/30">
                          Pending Review
                        </span>
                      )}
                    </div>
                    <div className="mt-1 space-y-0.5">
                      <p className="text-gray-500 text-xs">
                        <span className="text-gray-400">Document ID:</span> {doc.id}
                      </p>
                      <p className="text-gray-500 text-xs">
                        <span className="text-gray-400">File Path:</span> {doc.file_path}
                      </p>
                      <p className="text-gray-500 text-xs">
                        <span className="text-gray-400">Uploaded:</span> {new Date(doc.uploaded_at).toLocaleString()}
                      </p>
                      {isRejected && doc.rejection_reason && (
                        <div className="mt-2 p-2 bg-red-500/10 rounded border border-red-500/20">
                          <p className="text-red-300 text-xs font-semibold mb-1 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Rejection Reason:
                          </p>
                          <p className="text-red-200 text-xs">{doc.rejection_reason}</p>
                          {doc.rejected_at && (
                            <p className="text-red-300/70 text-xs mt-1">
                              Rejected on: {new Date(doc.rejected_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3">
                    <a
                      href={doc.file_path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      View
                    </a>
                    {!isRejected && (
                      <button
                        onClick={() => handleRejectDocument(doc.id)}
                        className="px-3 py-2 bg-red-500/20 text-red-300 font-semibold rounded-lg
                                 border border-red-500/30 hover:bg-red-500/30
                                 transition-all duration-300 flex items-center gap-2 text-sm"
                        title="Reject this document"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                    )}
                    {!isApproved && !isRejected && (
                      <button
                        onClick={() => handleApproveDocument(doc.id)}
                        className="px-3 py-2 bg-green-500/20 text-green-300 font-semibold rounded-lg
                                 border border-green-500/30 hover:bg-green-500/30
                                 transition-all duration-300 flex items-center gap-2 text-sm"
                        title="Approve this document"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    )}
                    {isRejected && (
                      <button
                        onClick={() => handleApproveDocument(doc.id)}
                        className="px-3 py-2 bg-green-500/20 text-green-300 font-semibold rounded-lg
                                 border border-green-500/30 hover:bg-green-500/30
                                 transition-all duration-300 flex items-center gap-2 text-sm"
                        title="Approve this document (undo rejection)"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="glass-panel p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                Reject Document
              </h3>
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingDocId(null);
                  setRejectionReason('');
                }}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Please provide a reason for rejecting this document. This will help the applicant understand what needs to be corrected.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="input-field min-h-[120px] w-full mb-4"
              placeholder="Enter rejection reason (e.g., 'Document is unclear', 'Missing required information', 'Document is expired', etc.)"
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectingDocId(null);
                  setRejectionReason('');
                }}
                className="flex-1 px-4 py-2 bg-gray-500/20 text-gray-300 font-semibold rounded-lg
                         border border-gray-500/30 hover:bg-gray-500/30
                         transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmRejectDocument}
                disabled={!rejectionReason.trim()}
                className="flex-1 px-4 py-2 bg-red-500/20 text-red-300 font-semibold rounded-lg
                         border border-red-500/30 hover:bg-red-500/30
                         transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payments */}
      {permit.payments && permit.payments.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-cyan-400" />
            Payment History ({permit.payments.length})
          </h3>
          <div className="space-y-3">
            {permit.payments.map((payment: any, index: number) => (
              <div key={payment.id} className="p-4 bg-white/5 rounded-lg border border-gray-700/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-cyan-400 font-bold text-xs">#{index + 1}</span>
                    <p className="text-white font-bold text-lg text-green-400">
                      ₱{Number(payment.amount).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <span
                    className={
                      payment.payment_status === 'completed'
                        ? 'status-approved'
                        : payment.payment_status === 'failed'
                        ? 'status-rejected'
                        : 'status-pending'
                    }
                  >
                    {payment.payment_status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-gray-400">Payment ID</p>
                    <p className="text-gray-300 font-mono">{payment.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Payment Method</p>
                    <p className="text-gray-300 capitalize">{payment.payment_method || 'N/A'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-400">Payment Reference</p>
                    <p className="text-gray-300 font-mono">{payment.payment_reference || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Created Date</p>
                    <p className="text-gray-300">{new Date(payment.created_at).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Status</p>
                    <p className="text-gray-300 capitalize">{payment.payment_status}</p>
                  </div>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <p className="text-gray-400 font-semibold">Total Amount Paid:</p>
                <p className="text-white font-bold text-xl text-green-400">
                  ₱{permit.payments
                    .filter((p: any) => p.payment_status === 'completed')
                    .reduce((sum: number, p: any) => sum + Number(p.amount), 0)
                    .toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Audit Trail */}
      {permit.auditTrail && permit.auditTrail.length > 0 && (
        <div className="glass-panel p-4">
          <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-cyan-400" />
            Audit Trail / Activity Log ({permit.auditTrail.length})
          </h3>
          <div className="space-y-3">
            {permit.auditTrail.map((audit: any, index: number) => (
              <div key={audit.id} className="p-4 bg-white/5 rounded-lg border-l-4 border-cyan-400">
                <div className="flex items-start gap-3">
                  <User className="w-5 h-5 text-cyan-400 mt-1 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-cyan-400 font-bold text-xs">#{permit.auditTrail.length - index}</span>
                      <p className="text-white font-semibold">{audit.action}</p>
                    </div>
                    {audit.note && (
                      <div className="bg-gray-900/50 rounded p-2 mt-2">
                        <p className="text-gray-300 text-sm">{audit.note}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs mt-3">
                      <div>
                        <p className="text-gray-400">Performed By</p>
                        <p className="text-gray-300 font-medium">
                          {audit.actor?.full_name || 
                           (audit.actor ? `${audit.actor.firstname || ''} ${audit.actor.lastname || ''}`.trim() : null) || 
                           'System'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-400">Actor ID</p>
                        <p className="text-gray-300 font-mono text-xs">{audit.actor_id || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Date & Time</p>
                        <p className="text-gray-300">{new Date(audit.created_at).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-400">Audit ID</p>
                        <p className="text-gray-300 font-mono text-xs">{audit.id}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Comment */}
      <div className="glass-panel p-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">Admin Comment</label>
        <textarea
          value={adminComment}
          onChange={(e) => onCommentChange(e.target.value)}
          className="input-field min-h-[100px]"
          placeholder="Add your comment here..."
        />
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 sticky bottom-0 bg-gray-900/95 p-4 -mx-4 -mb-4 rounded-b-lg">
        <button
          onClick={onReject}
          className="flex-1 px-6 py-3 bg-red-500/20 text-red-300 font-semibold rounded-lg
                   border border-red-500/30 hover:bg-red-500/30
                   transition-all duration-300 flex items-center justify-center gap-2"
        >
          <XCircle className="w-5 h-5" />
          Reject
        </button>
        <button
          onClick={onApprove}
          className="flex-1 px-6 py-3 bg-green-500/20 text-green-300 font-semibold rounded-lg
                   border border-green-500/30 hover:bg-green-500/30
                   transition-all duration-300 flex items-center justify-center gap-2"
        >
          <CheckCircle className="w-5 h-5" />
          Approve
        </button>
      </div>
    </div>
  );
}
