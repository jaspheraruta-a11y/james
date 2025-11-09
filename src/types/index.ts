export interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  firstname: string | null;
  middlename: string | null;
  lastname: string | null;
  full_name?: string | null;
  gender: string | null;
  birthdate: string | null;
  contactnumber: string | null;
  phone?: string | null;
  fulladdress: string | null;
  role: 'admin' | 'citizen' | 'client' | 'staff';
  created_at: string;
}

export interface PermitType {
  id: number;
  slug: string;
  title: string;
  description: string | null;
  created_at: string;
}

export interface PermitRequirement {
  id: number;
  permit_type_id: number | null;
  requirement_text: string;
}

export interface Permit {
  id: string;
  applicant_id: string;
  permit_type_id: number;
  address: string | null;
  details: Record<string, any> | null;
  status: 'pending' | 'approved' | 'rejected' | 'under_review';
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
  permit_type?: PermitType;
  applicant?: Profile;
  payments?: Payment[];
  uploadedImages?: UploadedImage[];
}

export interface PermitDocument {
  id: number;
  permit_id: string | null;
  file_path: string;
  file_name: string | null;
  uploaded_at: string;
  status?: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string | null;
  rejected_at?: string | null;
  rejected_by?: string | null;
}

export interface Payment {
  id: string;
  permit_id: string;
  amount: number;
  payment_method: string | null;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_reference: string | null;
  created_at: string;
}

export interface UploadedImage {
  id: number;
  permit_id: string | null;
  uploader_id: string | null;
  category: string | null;
  file_name: string | null;
  file_ext: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  storage_bucket: string | null;
  storage_path: string | null;
  public_url: string | null;
  uploaded_at: string;
}

export interface PermitAudit {
  id: number;
  permit_id: string;
  action: string;
  actor_id: string | null;
  note: string | null;
  created_at: string;
  actor?: Profile;
}

export interface DashboardStats {
  totalUsers: number;
  totalPermits: number;
  totalPayments: number;
  pendingPermits: number;
  approvedPermits: number;
  rejectedPermits: number;
}

export interface Notification {
  id: string;
  user_id: string;
  permit_id: string | null;
  title: string;
  message: string;
  type: 'permit_ready' | 'payment_required' | 'general' | 'application_rejected';
  is_read: boolean;
  gcash_qr_code_url: string | null;
  created_at: string;
}
