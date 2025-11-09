import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, DollarSign, QrCode, Upload, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../services/supabaseClient';
import type { Notification } from '../types';
import { validateImage } from '../utils/imageValidation';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: Notification | null;
}

export default function PaymentModal({ isOpen, onClose, notification }: PaymentModalProps) {
  const [proofOfPaymentFile, setProofOfPaymentFile] = useState<File | null>(null);
  const [proofOfPaymentPreview, setProofOfPaymentPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [qrCodeError, setQrCodeError] = useState<string | null>(null);

  // Reset QR code error when notification changes
  useEffect(() => {
    setQrCodeError(null);
  }, [notification?.gcash_qr_code_url]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.loading('Validating document content...', { id: 'doc-validation' });

    // Comprehensive image validation with document content validation
    const validation = await validateImage(file, {
      maxSizeMB: 5,
      allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      documentCategory: 'PROOF_OF_PAYMENT',
    });

    toast.dismiss('doc-validation');

    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      // Reset the input
      e.target.value = '';
      return;
    }

    setProofOfPaymentFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofOfPaymentPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveFile = () => {
    setProofOfPaymentFile(null);
    setProofOfPaymentPreview(null);
  };

  const handleSubmitProof = async () => {
    if (!proofOfPaymentFile || !notification?.permit_id) {
      toast.error('Please select a proof of payment image');
      return;
    }

    setIsUploading(true);
    try {
      // Upload proof of payment to Supabase Storage
      const fileExt = proofOfPaymentFile.name.split('.').pop() || '';
      const fileName = `proof-of-payment/${notification.permit_id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('permit-documents')
        .upload(fileName, proofOfPaymentFile);

      if (uploadError) {
        toast.error('Failed to upload proof of payment');
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('permit-documents')
        .getPublicUrl(fileName);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Store proof of payment metadata in uploaded_images table
      const { error: imageError } = await supabase
        .from('uploaded_images')
        .insert([
          {
            permit_id: notification.permit_id,
            uploader_id: user.id,
            category: 'proof_of_payment',
            file_name: proofOfPaymentFile.name,
            file_ext: fileExt,
            mime_type: proofOfPaymentFile.type,
            size_bytes: proofOfPaymentFile.size,
            storage_bucket: 'permit-documents',
            storage_path: fileName,
            public_url: publicUrl,
          },
        ]);

      if (imageError) {
        console.error('Error inserting proof of payment metadata:', imageError);
        toast.error('Failed to save proof of payment record');
        throw imageError;
      }

      // Check if a completed payment record already exists for this permit
      const { data: existingPayments } = await supabase
        .from('payments')
        .select('*')
        .eq('permit_id', notification.permit_id)
        .eq('payment_status', 'completed');

      // Only create a payment record if one doesn't already exist
      if (!existingPayments || existingPayments.length === 0) {
        const { error: paymentError } = await supabase
          .from('payments')
          .insert([
            {
              permit_id: notification.permit_id,
              amount: 0, // You may want to get the actual amount from the notification or permit
              payment_method: 'gcash',
              payment_status: 'completed',
              payment_reference: `GCASH-${Date.now()}`,
            },
          ]);

        if (paymentError) {
          console.error('Error creating payment record:', paymentError);
          toast.error('Failed to save payment record');
          throw paymentError;
        }
      }

      toast.success('Proof of payment uploaded successfully!');
      
      // Reset form
      setProofOfPaymentFile(null);
      setProofOfPaymentPreview(null);
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error uploading proof of payment:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (!notification) return null;

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 backdrop-blur-sm z-[100] bg-black/80"
          />
          <motion.div
            key="modal"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[101] flex justify-center items-start p-4 pt-8 pointer-events-none"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-black border border-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[calc(95vh-2rem)] flex flex-col pointer-events-auto">
              <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
                <h2 className="text-xl font-bold neon-text flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-cyan-400" />
                  Payment Process
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  aria-label="Close payment modal"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>

              <div className="p-4 space-y-4 overflow-y-auto flex-1 min-h-0">
                {/* Payment Instructions */}
                <div className="bg-gray-900 rounded-lg p-3 border border-gray-700">
                  <h3 className="text-base font-semibold text-white mb-2">Payment Instructions</h3>
                  <div className="space-y-1 text-xs text-gray-300">
                    <p>1. Scan the GCash QR code below using your GCash app</p>
                    <p>2. Enter the payment amount as shown</p>
                    <p>3. Complete the payment transaction</p>
                    <p>4. Take a screenshot or photo of your payment receipt</p>
                    <p>5. Upload the proof of payment below</p>
                  </div>
                </div>

                {/* QR Code */}
                {notification.gcash_qr_code_url && (
                  <div className="flex flex-col items-center bg-gray-900 rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <QrCode className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-base font-semibold text-white">GCash QR Code</h3>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-gray-600 max-w-[280px] max-h-[280px] w-full aspect-square flex items-center justify-center">
                      {qrCodeError ? (
                        <div className="text-center p-2">
                          <p className="text-red-500 font-semibold mb-1 text-sm">Failed to load QR code image</p>
                          <p className="text-xs text-gray-600 mb-1">URL: {notification.gcash_qr_code_url}</p>
                          <p className="text-xs text-gray-500">Please check if the image file exists at: public{notification.gcash_qr_code_url}</p>
                        </div>
                      ) : (
                        <img
                          src={notification.gcash_qr_code_url}
                          alt="GCash QR Code"
                          className="max-w-full max-h-full w-auto h-auto object-contain"
                          onError={() => {
                            console.error('Failed to load QR code image:', notification.gcash_qr_code_url);
                            setQrCodeError('Image failed to load');
                          }}
                          onLoad={() => {
                            console.log('QR code image loaded successfully:', notification.gcash_qr_code_url);
                            setQrCodeError(null);
                          }}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Proof of Payment Upload */}
                <div className="space-y-2">
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <Upload className="w-4 h-4 text-cyan-400" />
                    Upload Proof of Payment
                  </h3>
                  
                  <div className="space-y-2">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-700 rounded-lg cursor-pointer bg-gray-900 hover:bg-gray-800 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-3 pb-4">
                        <Upload className="w-6 h-6 text-gray-400 mb-1" />
                        <p className="text-xs text-gray-400">
                          {proofOfPaymentPreview || proofOfPaymentFile ? 'Click to change image' : 'Click to upload proof of payment'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                        disabled={isUploading}
                      />
                    </label>
                    
                    {proofOfPaymentPreview && (
                      <div className="relative">
                        <img
                          src={proofOfPaymentPreview}
                          alt="Proof of Payment Preview"
                          className="w-full max-h-40 object-contain rounded-lg border border-gray-700 bg-gray-900 p-2"
                        />
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          disabled={isUploading}
                          className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-white disabled:opacity-50"
                          aria-label="Remove proof of payment image"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex gap-3 pt-2 flex-shrink-0">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={isUploading}
                    className="btn-secondary flex-1 disabled:opacity-50 disabled:cursor-not-allowed text-sm py-2"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmitProof}
                    disabled={!proofOfPaymentFile || isUploading}
                    className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm py-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Submit Proof of Payment
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

