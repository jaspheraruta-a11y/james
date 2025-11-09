import { motion } from 'framer-motion';
import { CheckCircle, Clock, FileText, Plus, Upload, X, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '../components/Modal';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { authService } from '../services/authService';
import { permitService } from '../services/permitService';
import { supabase } from '../services/supabaseClient';
import type { Permit, PermitType, Profile } from '../types';
import type { DocumentCategory } from '../utils/documentValidation';
import { validateImage } from '../utils/imageValidation';

export default function Dashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [permits, setPermits] = useState<Permit[]>([]);
  const [permitTypes, setPermitTypes] = useState<PermitType[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingPermitId, setEditingPermitId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    permit_type_id: '',
    address: '',
    details: {},
  });
  // Motorela-specific fields captured under details when Motorela is selected
  const today = new Date().toISOString().slice(0, 10);
  const [motorelaDetails, setMotorelaDetails] = useState({
    application_no: '',
    date: today,
    body_no: '',
    chassis_no: '',
    make: '',
    motor_no: '',
    route: '',
    plate_no: '',
    operator: '',
    operator_address: '',
    contact: '',
    driver: '',
    driver_address: '',
    cedula_no: '',
    place_issued: '',
    date_issued: '',
    cho_url: '',
    cenro_url: '',
  });
  const [buildingDetails, setBuildingDetails] = useState({
    application_no: '',
    bp_no: '',
    applicant_lastname: '',
    applicant_firstname: '',
    applicant_mi: '',
    applicant_tin: '',
    ownership_form: '',
    address: '',
    construction_location: '',
    scope_of_work: '',
    occupancy_use: '',
    lot_area: '',
    floor_area: '',
    cost_of_construction: '',
    date_of_construction: '',
    inspector_name: '',
    inspector_address: '',
    prc_no: '',
    ptr_no: '',
    inspector_issued_at: '',
    inspector_validity: '',
    applicant_signature_date: '',
    owner_signature_date: '',
    applicant_ctc_no: '',
    applicant_ctc_date: '',
    applicant_ctc_place: '',
    engineer_ctc_no: '',
    engineer_ctc_date: '',
    engineer_ctc_place: '',
    proof_of_ownership_url: '',
    cho_url: '',
    cenro_url: '',
    obo_url: '',
    bfp_url: '',
  });
  const [proofOfOwnershipFile, setProofOfOwnershipFile] = useState<File | null>(null);
  const [proofOfOwnershipPreview, setProofOfOwnershipPreview] = useState<string | null>(null);
  const [choFile, setChoFile] = useState<File | null>(null);
  const [choPreview, setChoPreview] = useState<string | null>(null);
  const [cenroFile, setCenroFile] = useState<File | null>(null);
  const [cenroPreview, setCenroPreview] = useState<string | null>(null);
  const [oboFile, setOboFile] = useState<File | null>(null);
  const [oboPreview, setOboPreview] = useState<string | null>(null);
  const [bfpFile, setBfpFile] = useState<File | null>(null);
  const [bfpPreview, setBfpPreview] = useState<string | null>(null);
  const [motorelaChoFile, setMotorelaChoFile] = useState<File | null>(null);
  const [motorelaChoPreview, setMotorelaChoPreview] = useState<string | null>(null);
  const [motorelaCenroFile, setMotorelaCenroFile] = useState<File | null>(null);
  const [motorelaCenroPreview, setMotorelaCenroPreview] = useState<string | null>(null);

  const [businessDetails, setBusinessDetails] = useState({
    // Permit Details
    tax_year: '',
    control_no: '',
    mode_of_payment: '',
    application_type: '',
    amendment: '',
    // Taxpayer Information
    tax_payer_lastname: '',
    tax_payer_firstname: '',
    tax_payer_middlename: '',
    tin: '',
    ctc_no: '',
    org_type: '',
    // Business Details
    business_name: '',
    nature_of_business: '',
    business_address: '',
    owner_address: '',
    phone: '',
    email: '',
    business_area: '',
    total_employees: '',
    // Lessor Information (If Rented)
    lessor_name: '',
    lessor_address: '',
    // Business Activity
    business_activity_code: '',
    line_of_business: '',
    no_of_units: '',
    capitalization: '',
    essential_sales: '',
    non_essential_sales: '',
    cho_url: '',
    cenro_url: '',
    obo_url: '',
    bfp_url: '',
  });
  const [businessChoFile, setBusinessChoFile] = useState<File | null>(null);
  const [businessChoPreview, setBusinessChoPreview] = useState<string | null>(null);
  const [businessCenroFile, setBusinessCenroFile] = useState<File | null>(null);
  const [businessCenroPreview, setBusinessCenroPreview] = useState<string | null>(null);
  const [businessOboFile, setBusinessOboFile] = useState<File | null>(null);
  const [businessOboPreview, setBusinessOboPreview] = useState<string | null>(null);
  const [businessBfpFile, setBusinessBfpFile] = useState<File | null>(null);
  const [businessBfpPreview, setBusinessBfpPreview] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const user = await authService.getCurrentUser();
      if (user) {
        const userProfile = await authService.getProfile(user.id);
        setProfile(userProfile);

        const [userPermits, types] = await Promise.all([
          permitService.getUserPermits(user.id),
          permitService.getPermitTypes(),
        ]);

        setPermits(userPermits);
        setPermitTypes(types);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const selectedPermitType = permitTypes.find(
    (t) => String(t.id) === String(formData.permit_type_id)
  );
  const isMotorelaSelected = Boolean(
    selectedPermitType && (
      (selectedPermitType.slug || '').toLowerCase().includes('motorela') ||
      (selectedPermitType.title || '').toLowerCase().includes('motorela')
    )
  );

  // Building permit: detection + details setter (non-intrusive to other types)
  const isBuildingPermit = Boolean(
    selectedPermitType && (
      (selectedPermitType.slug || '').toLowerCase().includes('building') ||
      (selectedPermitType.title || '').toLowerCase().includes('building')
    )
  );

  const isBusinessPermit = Boolean(
    selectedPermitType && (
      (selectedPermitType.slug || '').toLowerCase().includes('business') ||
      (selectedPermitType.title || '').toLowerCase().includes('business')
    )
  );

  const handleProofOfOwnershipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    toast.loading('Validating document content...', { id: 'doc-validation' });

    // Comprehensive image validation with document content validation
    const validation = await validateImage(file, {
      maxSizeMB: 5,
      allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
      documentCategory: 'PROOF_OF_OWNERSHIP',
    });

    toast.dismiss('doc-validation');

    if (!validation.isValid) {
      validation.errors.forEach(error => toast.error(error));
      // Reset the input
      e.target.value = '';
      return;
    }

    setProofOfOwnershipFile(file);
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setProofOfOwnershipPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const createImageHandler = (
    setFile: (file: File | null) => void,
    setPreview: (preview: string | null) => void,
    documentCategory?: DocumentCategory
  ) => {
    return async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Show loading toast for document validation
      if (documentCategory) {
        toast.loading('Validating document content...', { id: 'doc-validation' });
      }

      // Comprehensive image validation with document content validation
      const validation = await validateImage(file, {
        maxSizeMB: 5,
        allowedFormats: ['image/jpeg', 'image/png', 'image/webp'],
        documentCategory, // Validate document content if category is provided
      });

      // Dismiss loading toast
      if (documentCategory) {
        toast.dismiss('doc-validation');
      }

      if (!validation.isValid) {
        validation.errors.forEach(error => toast.error(error));
        // Reset the input
        e.target.value = '';
        return;
      }

      setFile(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    };
  };

  const handleChoChange = createImageHandler(setChoFile, setChoPreview, 'CHO');
  const handleCenroChange = createImageHandler(setCenroFile, setCenroPreview, 'CENRO');
  const handleOboChange = createImageHandler(setOboFile, setOboPreview, 'OBO');
  const handleBfpChange = createImageHandler(setBfpFile, setBfpPreview, 'BFP');
  const handleBusinessChoChange = createImageHandler(setBusinessChoFile, setBusinessChoPreview, 'CHO');
  const handleBusinessCenroChange = createImageHandler(setBusinessCenroFile, setBusinessCenroPreview, 'CENRO');
  const handleBusinessOboChange = createImageHandler(setBusinessOboFile, setBusinessOboPreview, 'OBO');
  const handleBusinessBfpChange = createImageHandler(setBusinessBfpFile, setBusinessBfpPreview, 'BFP');
  const handleMotorelaChoChange = createImageHandler(setMotorelaChoFile, setMotorelaChoPreview, 'CHO');
  const handleMotorelaCenroChange = createImageHandler(setMotorelaCenroFile, setMotorelaCenroPreview, 'CENRO');

  const uploadFile = async (file: File, category: string): Promise<string> => {
    const fileExt = file.name.split('.').pop() || '';
    const fileName = `${category}/${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('permit-documents')
      .upload(fileName, file);

    if (uploadError) {
      toast.error(`Failed to upload ${category} image`);
      throw uploadError;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('permit-documents')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const validateRequiredFields = (): { isValid: boolean; errorMessage: string } => {
    // Validate permit type (required for all)
    if (!formData.permit_type_id || formData.permit_type_id === '') {
      return { isValid: false, errorMessage: 'Please select a permit type' };
    }

    // Validate Building Permit required fields
    if (isBuildingPermit) {
      if (!buildingDetails.application_no.trim()) {
        return { isValid: false, errorMessage: 'Application No is required' };
      }
      if (!buildingDetails.bp_no.trim()) {
        return { isValid: false, errorMessage: 'BP No. is required' };
      }
      if (!buildingDetails.applicant_lastname.trim()) {
        return { isValid: false, errorMessage: 'Applicant Last Name is required' };
      }
      if (!buildingDetails.applicant_firstname.trim()) {
        return { isValid: false, errorMessage: 'Applicant First Name is required' };
      }
      if (!buildingDetails.applicant_mi.trim()) {
        return { isValid: false, errorMessage: 'Applicant Middle Initial is required' };
      }
      if (!buildingDetails.applicant_tin.trim()) {
        return { isValid: false, errorMessage: 'Applicant TIN is required' };
      }
      if (!buildingDetails.ownership_form.trim()) {
        return { isValid: false, errorMessage: 'Form of Ownership is required' };
      }
      if (!proofOfOwnershipFile && !buildingDetails.proof_of_ownership_url) {
        return { isValid: false, errorMessage: 'Proof of Ownership is required' };
      }
      if (!buildingDetails.address.trim()) {
        return { isValid: false, errorMessage: 'Address is required' };
      }
      if (!buildingDetails.construction_location.trim()) {
        return { isValid: false, errorMessage: 'Location of Construction is required' };
      }
      if (!buildingDetails.scope_of_work.trim()) {
        return { isValid: false, errorMessage: 'Scope of Work is required' };
      }
      if (!buildingDetails.occupancy_use.trim()) {
        return { isValid: false, errorMessage: 'Use or Character of Occupancy is required' };
      }
      if (!buildingDetails.lot_area.trim()) {
        return { isValid: false, errorMessage: 'Lot Area is required' };
      }
      if (!buildingDetails.floor_area.trim()) {
        return { isValid: false, errorMessage: 'Total Floor Area is required' };
      }
      if (!buildingDetails.cost_of_construction.trim()) {
        return { isValid: false, errorMessage: 'Estimated Cost of Construction is required' };
      }
      if (!buildingDetails.date_of_construction.trim()) {
        return { isValid: false, errorMessage: 'Expected Date of Construction is required' };
      }
      if (!buildingDetails.inspector_name.trim()) {
        return { isValid: false, errorMessage: 'Inspector Name is required' };
      }
      if (!buildingDetails.inspector_address.trim()) {
        return { isValid: false, errorMessage: 'Inspector Address is required' };
      }
      if (!buildingDetails.prc_no.trim()) {
        return { isValid: false, errorMessage: 'PRC No is required' };
      }
      if (!buildingDetails.ptr_no.trim()) {
        return { isValid: false, errorMessage: 'PTR No is required' };
      }
      if (!buildingDetails.inspector_issued_at.trim()) {
        return { isValid: false, errorMessage: 'Inspector Issued at is required' };
      }
      if (!buildingDetails.inspector_validity.trim()) {
        return { isValid: false, errorMessage: 'Inspector Validity is required' };
      }
      if (!buildingDetails.applicant_signature_date.trim()) {
        return { isValid: false, errorMessage: 'Applicant Signature Date is required' };
      }
      if (!buildingDetails.owner_signature_date.trim()) {
        return { isValid: false, errorMessage: 'Owner/Representative Signature Date is required' };
      }
      if (!buildingDetails.applicant_ctc_no.trim()) {
        return { isValid: false, errorMessage: 'Applicant CTC No is required' };
      }
      if (!buildingDetails.applicant_ctc_date.trim()) {
        return { isValid: false, errorMessage: 'Applicant CTC Date is required' };
      }
      if (!buildingDetails.applicant_ctc_place.trim()) {
        return { isValid: false, errorMessage: 'Applicant CTC Place is required' };
      }
      if (!buildingDetails.engineer_ctc_no.trim()) {
        return { isValid: false, errorMessage: 'Engineer/Architect CTC No is required' };
      }
      if (!buildingDetails.engineer_ctc_date.trim()) {
        return { isValid: false, errorMessage: 'Engineer CTC Date is required' };
      }
      if (!buildingDetails.engineer_ctc_place.trim()) {
        return { isValid: false, errorMessage: 'Engineer CTC Place is required' };
      }
      if (!choFile && !buildingDetails.cho_url) {
        return { isValid: false, errorMessage: 'CHO (City Health Office) document is required' };
      }
      if (!cenroFile && !buildingDetails.cenro_url) {
        return { isValid: false, errorMessage: 'CENRO (City Environment and Natural Resources Office) document is required' };
      }
      if (!oboFile && !buildingDetails.obo_url) {
        return { isValid: false, errorMessage: 'OBO (Office of Building Official) document is required' };
      }
      if (!bfpFile && !buildingDetails.bfp_url) {
        return { isValid: false, errorMessage: 'BFP (Bureau of Fire Protection) document is required' };
      }
    }

    // Validate Business Permit required fields
    if (isBusinessPermit) {
      if (!businessDetails.tax_year.trim()) {
        return { isValid: false, errorMessage: 'Tax Year is required' };
      }
      if (!businessDetails.control_no.trim()) {
        return { isValid: false, errorMessage: 'Control No is required' };
      }
      if (!businessDetails.mode_of_payment.trim()) {
        return { isValid: false, errorMessage: 'Mode of Payment is required' };
      }
      if (!businessDetails.application_type.trim()) {
        return { isValid: false, errorMessage: 'Application Type is required' };
      }
      if (!businessDetails.tax_payer_lastname.trim()) {
        return { isValid: false, errorMessage: 'Taxpayer Last Name is required' };
      }
      if (!businessDetails.tax_payer_firstname.trim()) {
        return { isValid: false, errorMessage: 'Taxpayer First Name is required' };
      }
      if (!businessDetails.tax_payer_middlename.trim()) {
        return { isValid: false, errorMessage: 'Taxpayer Middle Name is required' };
      }
      if (!businessDetails.tin.trim()) {
        return { isValid: false, errorMessage: 'TIN is required' };
      }
      if (!businessDetails.ctc_no.trim()) {
        return { isValid: false, errorMessage: 'CTC No is required' };
      }
      if (!businessDetails.org_type.trim()) {
        return { isValid: false, errorMessage: 'Type of Organization is required' };
      }
      if (!businessDetails.business_name.trim()) {
        return { isValid: false, errorMessage: 'Business Name is required' };
      }
      if (!businessDetails.nature_of_business.trim()) {
        return { isValid: false, errorMessage: 'Nature of Business is required' };
      }
      if (!businessDetails.business_address.trim()) {
        return { isValid: false, errorMessage: 'Business Address is required' };
      }
      if (!businessDetails.owner_address.trim()) {
        return { isValid: false, errorMessage: 'Owner Address is required' };
      }
      if (!businessDetails.phone.trim()) {
        return { isValid: false, errorMessage: 'Phone is required' };
      }
      if (!businessDetails.email.trim()) {
        return { isValid: false, errorMessage: 'Email is required' };
      }
      if (!businessDetails.business_area.trim()) {
        return { isValid: false, errorMessage: 'Business Area is required' };
      }
      if (!businessDetails.total_employees.trim()) {
        return { isValid: false, errorMessage: 'Total Employees is required' };
      }
      if (!businessDetails.lessor_name.trim()) {
        return { isValid: false, errorMessage: 'Lessor Name is required' };
      }
      if (!businessDetails.lessor_address.trim()) {
        return { isValid: false, errorMessage: 'Lessor Address is required' };
      }
      if (!businessDetails.business_activity_code.trim()) {
        return { isValid: false, errorMessage: 'Activity Code is required' };
      }
      if (!businessDetails.line_of_business.trim()) {
        return { isValid: false, errorMessage: 'Line of Business is required' };
      }
      if (!businessDetails.no_of_units.trim()) {
        return { isValid: false, errorMessage: 'No. of Units is required' };
      }
      if (!businessDetails.capitalization.trim()) {
        return { isValid: false, errorMessage: 'Capitalization is required' };
      }
      if (!businessDetails.essential_sales.trim()) {
        return { isValid: false, errorMessage: 'Essential Gross Sales is required' };
      }
      if (!businessDetails.non_essential_sales.trim()) {
        return { isValid: false, errorMessage: 'Non-Essential Gross Sales is required' };
      }
      if (!businessChoFile && !businessDetails.cho_url) {
        return { isValid: false, errorMessage: 'CHO (City Health Office) document is required' };
      }
      if (!businessCenroFile && !businessDetails.cenro_url) {
        return { isValid: false, errorMessage: 'CENRO (City Environment and Natural Resources Office) document is required' };
      }
      if (!businessOboFile && !businessDetails.obo_url) {
        return { isValid: false, errorMessage: 'OBO (Office of Building Official) document is required' };
      }
      if (!businessBfpFile && !businessDetails.bfp_url) {
        return { isValid: false, errorMessage: 'BFP (Bureau of Fire Protection) document is required' };
      }
    }

    // Validate Motorela Permit required fields
    if (isMotorelaSelected) {
      if (!motorelaDetails.date.trim()) {
        return { isValid: false, errorMessage: 'Date is required' };
      }
      if (!motorelaDetails.application_no.trim()) {
        return { isValid: false, errorMessage: 'Application Control No. is required' };
      }
      if (!motorelaDetails.body_no.trim()) {
        return { isValid: false, errorMessage: 'Body No is required' };
      }
      if (!motorelaDetails.chassis_no.trim()) {
        return { isValid: false, errorMessage: 'Chassis No is required' };
      }
      if (!motorelaDetails.make.trim()) {
        return { isValid: false, errorMessage: 'Make is required' };
      }
      if (!motorelaDetails.motor_no.trim()) {
        return { isValid: false, errorMessage: 'Motor No is required' };
      }
      if (!motorelaDetails.route.trim()) {
        return { isValid: false, errorMessage: 'Route of Operation is required' };
      }
      if (!motorelaDetails.plate_no.trim()) {
        return { isValid: false, errorMessage: 'Plate No is required' };
      }
      if (!motorelaDetails.operator.trim()) {
        return { isValid: false, errorMessage: 'Name of Operator is required' };
      }
      if (!motorelaDetails.operator_address.trim()) {
        return { isValid: false, errorMessage: 'Operator Address is required' };
      }
      if (!motorelaDetails.contact.trim()) {
        return { isValid: false, errorMessage: 'Contact Number is required' };
      }
      if (!motorelaDetails.driver.trim()) {
        return { isValid: false, errorMessage: 'Name of Driver is required' };
      }
      if (!motorelaDetails.driver_address.trim()) {
        return { isValid: false, errorMessage: 'Driver Address is required' };
      }
      if (!motorelaDetails.cedula_no.trim()) {
        return { isValid: false, errorMessage: 'CEDULA No. is required' };
      }
      if (!motorelaDetails.place_issued.trim()) {
        return { isValid: false, errorMessage: 'Place of Issue is required' };
      }
      if (!motorelaDetails.date_issued.trim()) {
        return { isValid: false, errorMessage: 'Date of Issue is required' };
      }
      if (!motorelaChoFile && !motorelaDetails.cho_url) {
        return { isValid: false, errorMessage: 'CHO (City Health Office) attachment is required' };
      }
      if (!motorelaCenroFile && !motorelaDetails.cenro_url) {
        return { isValid: false, errorMessage: 'CENRO (City Environment and Natural Resources Office) attachment is required' };
      }
    }

    return { isValid: true, errorMessage: '' };
  };

  const handleSubmitPermit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all required fields before submission
    const validation = validateRequiredFields();
    if (!validation.isValid) {
      toast.error(validation.errorMessage);
      return;
    }

    try {
      const details: any = { ...(formData.details || {}) };
      
      // Handle building permit with file upload
      if (isBuildingPermit) {
        let proofOfOwnershipUrl = buildingDetails.proof_of_ownership_url;
        let choUrl = buildingDetails.cho_url;
        let cenroUrl = buildingDetails.cenro_url;
        let oboUrl = buildingDetails.obo_url;
        let bfpUrl = buildingDetails.bfp_url;
        
        // Upload new files if they were selected
        if (proofOfOwnershipFile) {
          proofOfOwnershipUrl = await uploadFile(proofOfOwnershipFile, 'proof-of-ownership');
        }
        if (choFile) {
          choUrl = await uploadFile(choFile, 'cho');
        }
        if (cenroFile) {
          cenroUrl = await uploadFile(cenroFile, 'cenro');
        }
        if (oboFile) {
          oboUrl = await uploadFile(oboFile, 'obo');
        }
        if (bfpFile) {
          bfpUrl = await uploadFile(bfpFile, 'bfp');
        }
        
        details.building_permit = { 
          ...buildingDetails,
          proof_of_ownership_url: proofOfOwnershipUrl,
          cho_url: choUrl,
          cenro_url: cenroUrl,
          obo_url: oboUrl,
          bfp_url: bfpUrl
        };
      }
      
      if (isMotorelaSelected) {
        let motorelaChoUrl = motorelaDetails.cho_url;
        let motorelaCenroUrl = motorelaDetails.cenro_url;
        
        // Upload new files if they were selected
        if (motorelaChoFile) {
          motorelaChoUrl = await uploadFile(motorelaChoFile, 'motorela-cho');
        }
        if (motorelaCenroFile) {
          motorelaCenroUrl = await uploadFile(motorelaCenroFile, 'motorela-cenro');
        }
        
        details.motorela = { 
          ...motorelaDetails,
          cho_url: motorelaChoUrl,
          cenro_url: motorelaCenroUrl
        };
      }
      if (isBusinessPermit) {
        let choUrl = businessDetails.cho_url;
        let cenroUrl = businessDetails.cenro_url;
        let oboUrl = businessDetails.obo_url;
        let bfpUrl = businessDetails.bfp_url;
        
        // Upload new files if they were selected
        if (businessChoFile) {
          choUrl = await uploadFile(businessChoFile, 'cho');
        }
        if (businessCenroFile) {
          cenroUrl = await uploadFile(businessCenroFile, 'cenro');
        }
        if (businessOboFile) {
          oboUrl = await uploadFile(businessOboFile, 'obo');
        }
        if (businessBfpFile) {
          bfpUrl = await uploadFile(businessBfpFile, 'bfp');
        }
        
        details.business_permit = { 
          ...businessDetails,
          cho_url: choUrl,
          cenro_url: cenroUrl,
          obo_url: oboUrl,
          bfp_url: bfpUrl
        };
      }

      if (isEditing && editingPermitId) {
        // Update only pending applications
        const { data: target, error: fetchErr } = await supabase
          .from('permits')
          .select('status')
          .eq('id', editingPermitId)
          .single();
        if (fetchErr) throw fetchErr;
        if (!target || target.status !== 'pending') {
          toast.error('Only pending applications can be edited');
          return;
        }
        // Use permitService.updatePermit to properly update related tables
        await permitService.updatePermit(editingPermitId, {
          permit_type_id: Number(formData.permit_type_id),
          address: formData.address,
          details,
        });
        toast.success('Application updated successfully!');
      } else {
        await permitService.createPermit({
          permit_type_id: Number(formData.permit_type_id),
          address: formData.address,
          details,
        });
        toast.success('Permit application submitted successfully!');
      }
      setShowCreateModal(false);
      setIsEditing(false);
      setEditingPermitId(null);
      setFormData({ permit_type_id: '', address: '', details: {} });
      setMotorelaDetails({
        application_no: '',
        date: today,
        body_no: '',
        chassis_no: '',
        make: '',
        motor_no: '',
        route: '',
        plate_no: '',
        operator: '',
        operator_address: '',
        contact: '',
        driver: '',
        driver_address: '',
        cedula_no: '',
        place_issued: '',
        date_issued: '',
        cho_url: '',
        cenro_url: '',
      });
      setMotorelaChoFile(null);
      setMotorelaChoPreview(null);
      setMotorelaCenroFile(null);
      setMotorelaCenroPreview(null);
      setBuildingDetails({
        application_no: '',
        bp_no: '',
        applicant_lastname: '',
        applicant_firstname: '',
        applicant_mi: '',
        applicant_tin: '',
        ownership_form: '',
        address: '',
        construction_location: '',
        scope_of_work: '',
        occupancy_use: '',
        lot_area: '',
        floor_area: '',
        cost_of_construction: '',
        date_of_construction: '',
        inspector_name: '',
        inspector_address: '',
        prc_no: '',
        ptr_no: '',
        inspector_issued_at: '',
        inspector_validity: '',
        applicant_signature_date: '',
        owner_signature_date: '',
        applicant_ctc_no: '',
        applicant_ctc_date: '',
        applicant_ctc_place: '',
        engineer_ctc_no: '',
        engineer_ctc_date: '',
        engineer_ctc_place: '',
        proof_of_ownership_url: '',
        cho_url: '',
        cenro_url: '',
        obo_url: '',
        bfp_url: '',
      });
      setProofOfOwnershipFile(null);
      setProofOfOwnershipPreview(null);
      setChoFile(null);
      setChoPreview(null);
      setCenroFile(null);
      setCenroPreview(null);
      setOboFile(null);
      setOboPreview(null);
      setBfpFile(null);
      setBfpPreview(null);
      setBusinessDetails({
        tax_year: '',
        control_no: '',
        mode_of_payment: '',
        application_type: '',
        amendment: '',
        tax_payer_lastname: '',
        tax_payer_firstname: '',
        tax_payer_middlename: '',
        tin: '',
        ctc_no: '',
        org_type: '',
        business_name: '',
        nature_of_business: '',
        business_address: '',
        owner_address: '',
        phone: '',
        email: '',
        business_area: '',
        total_employees: '',
        lessor_name: '',
        lessor_address: '',
        business_activity_code: '',
        line_of_business: '',
        no_of_units: '',
        capitalization: '',
        essential_sales: '',
        non_essential_sales: '',
        cho_url: '',
        cenro_url: '',
        obo_url: '',
        bfp_url: '',
      });
      setBusinessChoFile(null);
      setBusinessChoPreview(null);
      setBusinessCenroFile(null);
      setBusinessCenroPreview(null);
      setBusinessOboFile(null);
      setBusinessOboPreview(null);
      setBusinessBfpFile(null);
      setBusinessBfpPreview(null);
      loadData();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      const errorMessage = error?.message || 'Failed to submit application';
      toast.error(errorMessage);
    }
  };

  const startCreate = () => {
    setIsEditing(false);
    setEditingPermitId(null);
    setFormData({ permit_type_id: '', address: '', details: {} });
    setProofOfOwnershipFile(null);
    setProofOfOwnershipPreview(null);
    setChoFile(null);
    setChoPreview(null);
    setCenroFile(null);
    setCenroPreview(null);
    setOboFile(null);
    setOboPreview(null);
    setBfpFile(null);
    setBfpPreview(null);
    setBusinessChoFile(null);
    setBusinessChoPreview(null);
    setBusinessCenroFile(null);
    setBusinessCenroPreview(null);
    setBusinessOboFile(null);
    setBusinessOboPreview(null);
    setBusinessBfpFile(null);
    setBusinessBfpPreview(null);
    setMotorelaChoFile(null);
    setMotorelaChoPreview(null);
    setMotorelaCenroFile(null);
    setMotorelaCenroPreview(null);
    setShowCreateModal(true);
  };

  const startEdit = (permit: Permit) => {
    if (permit.status !== 'pending') return;
    setIsEditing(true);
    setEditingPermitId(permit.id);
    setFormData({
      permit_type_id: String(permit.permit_type_id),
      address: permit.address || '',
      details: permit.details || {},
    });
    // Prefill sub-forms when applicable
    const d: any = permit.details || {};
    if (d.motorela) {
      setMotorelaDetails({
        application_no: d.motorela.application_no || '',
        date: d.motorela.date || today,
        body_no: d.motorela.body_no || '',
        chassis_no: d.motorela.chassis_no || '',
        make: d.motorela.make || '',
        motor_no: d.motorela.motor_no || '',
        route: d.motorela.route || '',
        plate_no: d.motorela.plate_no || '',
        operator: d.motorela.operator || '',
        operator_address: d.motorela.operator_address || '',
        contact: d.motorela.contact || '',
        driver: d.motorela.driver || '',
        driver_address: d.motorela.driver_address || '',
        cedula_no: d.motorela.cedula_no || '',
        place_issued: d.motorela.place_issued || '',
        date_issued: d.motorela.date_issued || '',
        cho_url: d.motorela.cho_url || '',
        cenro_url: d.motorela.cenro_url || '',
      });
      // Set previews for motorela files
      if (d.motorela.cho_url) {
        setMotorelaChoPreview(d.motorela.cho_url);
      } else {
        setMotorelaChoPreview(null);
      }
      if (d.motorela.cenro_url) {
        setMotorelaCenroPreview(d.motorela.cenro_url);
      } else {
        setMotorelaCenroPreview(null);
      }
      setMotorelaChoFile(null);
      setMotorelaCenroFile(null);
    }
    // Check both locations for building permit data
    const permitWithExtras = permit as any;
    if (d.building_permit || permitWithExtras.buildingPermitData) {
      const buildingPermit = d.building_permit || {};
      const buildingPermitData = permitWithExtras.buildingPermitData || {};
      
      // Extract data from normalized tables if available
      const applicant = buildingPermitData.applicant || {};
      const construction = buildingPermitData.construction || {};
      const inspector = buildingPermitData.inspector || {};
      const engineer = buildingPermitData.engineer || {};
      
      const proofOfOwnershipUrl = buildingPermit.proof_of_ownership_url || '';
      
      setBuildingDetails({
        application_no: buildingPermitData.application_no || buildingPermit.application_no || '',
        bp_no: buildingPermitData.bp_no || buildingPermit.bp_no || '',
        applicant_lastname: applicant.lastname || buildingPermit.applicant_lastname || '',
        applicant_firstname: applicant.firstname || buildingPermit.applicant_firstname || '',
        applicant_mi: applicant.middle_initial || buildingPermit.applicant_mi || '',
        applicant_tin: applicant.tin || buildingPermit.applicant_tin || '',
        ownership_form: applicant.ownership_form || buildingPermit.ownership_form || '',
        address: applicant.address || buildingPermit.address || '',
        construction_location: construction.location || buildingPermit.construction_location || '',
        scope_of_work: construction.scope_of_work || buildingPermit.scope_of_work || '',
        occupancy_use: construction.occupancy_use || buildingPermit.occupancy_use || '',
        lot_area: construction.lot_area?.toString() || buildingPermit.lot_area || '',
        floor_area: construction.floor_area?.toString() || buildingPermit.floor_area || '',
        cost_of_construction: construction.cost_of_construction?.toString() || buildingPermit.cost_of_construction || '',
        date_of_construction: construction.date_of_construction || buildingPermit.date_of_construction || '',
        inspector_name: inspector.name || buildingPermit.inspector_name || '',
        inspector_address: inspector.address || buildingPermit.inspector_address || '',
        prc_no: inspector.prc_no || buildingPermit.prc_no || '',
        ptr_no: inspector.ptr_no || buildingPermit.ptr_no || '',
        inspector_issued_at: inspector.issued_at || buildingPermit.inspector_issued_at || '',
        inspector_validity: inspector.validity || buildingPermit.inspector_validity || '',
        applicant_signature_date: applicant.signature_date || buildingPermit.applicant_signature_date || '',
        owner_signature_date: buildingPermitData.owner_signature_date || buildingPermit.owner_signature_date || '',
        applicant_ctc_no: applicant.ctc_no || buildingPermit.applicant_ctc_no || '',
        applicant_ctc_date: applicant.ctc_date || buildingPermit.applicant_ctc_date || '',
        applicant_ctc_place: applicant.ctc_place || buildingPermit.applicant_ctc_place || '',
        engineer_ctc_no: engineer.ctc_no || buildingPermit.engineer_ctc_no || '',
        engineer_ctc_date: engineer.ctc_date || buildingPermit.engineer_ctc_date || '',
        engineer_ctc_place: engineer.ctc_place || buildingPermit.engineer_ctc_place || '',
        proof_of_ownership_url: proofOfOwnershipUrl,
        cho_url: buildingPermit.cho_url || '',
        cenro_url: buildingPermit.cenro_url || '',
        obo_url: buildingPermit.obo_url || '',
        bfp_url: buildingPermit.bfp_url || '',
      });
      // Set preview if URL exists
      if (proofOfOwnershipUrl) {
        setProofOfOwnershipPreview(proofOfOwnershipUrl);
      } else {
        setProofOfOwnershipPreview(null);
      }
      setProofOfOwnershipFile(null);
      // Set previews for new fields
      if (buildingPermit.cho_url) {
        setChoPreview(buildingPermit.cho_url);
      } else {
        setChoPreview(null);
      }
      if (buildingPermit.cenro_url) {
        setCenroPreview(buildingPermit.cenro_url);
      } else {
        setCenroPreview(null);
      }
      if (buildingPermit.obo_url) {
        setOboPreview(buildingPermit.obo_url);
      } else {
        setOboPreview(null);
      }
      if (buildingPermit.bfp_url) {
        setBfpPreview(buildingPermit.bfp_url);
      } else {
        setBfpPreview(null);
      }
      setChoFile(null);
      setCenroFile(null);
      setOboFile(null);
      setBfpFile(null);
    }
    if (d.business_permit) setBusinessDetails({
      tax_year: d.business_permit.tax_year || '',
      control_no: d.business_permit.control_no || '',
      mode_of_payment: d.business_permit.mode_of_payment || '',
      application_type: d.business_permit.application_type || '',
      amendment: d.business_permit.amendment || '',
      tax_payer_lastname: d.business_permit.tax_payer_lastname || '',
      tax_payer_firstname: d.business_permit.tax_payer_firstname || '',
      tax_payer_middlename: d.business_permit.tax_payer_middlename || '',
      tin: d.business_permit.tin || '',
      ctc_no: d.business_permit.ctc_no || '',
      org_type: d.business_permit.org_type || '',
      business_name: d.business_permit.business_name || '',
      nature_of_business: d.business_permit.nature_of_business || '',
      business_address: d.business_permit.business_address || '',
      owner_address: d.business_permit.owner_address || '',
      phone: d.business_permit.phone || '',
      email: d.business_permit.email || '',
      business_area: d.business_permit.business_area || '',
      total_employees: d.business_permit.total_employees || '',
      lessor_name: d.business_permit.lessor_name || '',
      lessor_address: d.business_permit.lessor_address || '',
      business_activity_code: d.business_permit.business_activity_code || '',
      line_of_business: d.business_permit.line_of_business || '',
      no_of_units: d.business_permit.no_of_units || '',
      capitalization: d.business_permit.capitalization || '',
      essential_sales: d.business_permit.essential_sales || '',
      non_essential_sales: d.business_permit.non_essential_sales || '',
      cho_url: d.business_permit.cho_url || '',
      cenro_url: d.business_permit.cenro_url || '',
      obo_url: d.business_permit.obo_url || '',
      bfp_url: d.business_permit.bfp_url || '',
    });
    // Set previews for new fields
    if (d.business_permit.cho_url) {
      setBusinessChoPreview(d.business_permit.cho_url);
    } else {
      setBusinessChoPreview(null);
    }
    if (d.business_permit.cenro_url) {
      setBusinessCenroPreview(d.business_permit.cenro_url);
    } else {
      setBusinessCenroPreview(null);
    }
    if (d.business_permit.obo_url) {
      setBusinessOboPreview(d.business_permit.obo_url);
    } else {
      setBusinessOboPreview(null);
    }
    if (d.business_permit.bfp_url) {
      setBusinessBfpPreview(d.business_permit.bfp_url);
    } else {
      setBusinessBfpPreview(null);
    }
    setBusinessChoFile(null);
    setBusinessCenroFile(null);
    setBusinessOboFile(null);
    setBusinessBfpFile(null);
    setShowCreateModal(true);
  };

  const handleDelete = async (permit: Permit) => {
    if (permit.status !== 'pending') return;
    const ok = confirm('Delete this pending application? This cannot be undone.');
    if (!ok) return;
    try {
      await permitService.deletePermit(permit.id);
      toast.success('Application deleted successfully');
      // Reload data to ensure consistency
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
        return <XCircle className="w-5 h-5 text-red-500 dark:text-red-400" />;
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

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="flex-1 p-6">
        <Navbar onMenuClick={() => setSidebarOpen(true)} title="Client Dashboard" />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel p-6 card-hover"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-600 dark:text-gray-400 text-sm mb-1">Total Permits</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-gray-900 dark:text-white">{permits.length}</p>
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
                <p className="text-gray-600 dark:text-gray-600 dark:text-gray-400 text-sm mb-1">Pending</p>
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
                <p className="text-gray-600 dark:text-gray-600 dark:text-gray-400 text-sm mb-1">Approved</p>
                <p className="text-3xl font-bold text-green-400">
                  {permits.filter(p => p.status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-400" />
            </div>
          </motion.div>
        </div>

        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold neon-text">My Permit Applications</h2>
            <button onClick={startCreate} className="btn-primary flex items-center gap-2">
              <Plus className="w-5 h-5" />
              New Application
            </button>
          </div>

          <div className="space-y-4">
            {permits.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-600 dark:text-gray-500 dark:text-gray-600 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-600 dark:text-gray-400">No permit applications yet</p>
                <button
                  onClick={startCreate}
                  className="btn-secondary mt-4"
                >
                  Create Your First Application
                </button>
              </div>
            ) : (
              permits.map((permit) => (
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
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-900 dark:text-white">
                          {permit.permit_type?.title || 'Unknown Permit Type'}
                        </h3>
                        <span className={getStatusClass(permit.status)}>
                          {permit.status}
                        </span>
                      </div>
                      <p className="text-gray-600 dark:text-gray-600 dark:text-gray-400 text-sm mb-2">{permit.address}</p>
                      <p className="text-gray-600 dark:text-gray-600 dark:text-gray-500 text-xs">
                        Applied: {new Date(permit.created_at).toLocaleDateString()}
                      </p>
                      {permit.admin_comment && (
                        <div className="mt-3 p-3 bg-gray-100/80 dark:bg-gray-100/80 dark:bg-white/5 rounded-lg border border-gray-200/50 dark:border-gray-200/50 dark:border-white/10">
                          <p className="text-sm text-gray-700 dark:text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">Admin Comment:</span> {permit.admin_comment}
                          </p>
                        </div>
                      )}
                    </div>
                    {permit.status === 'pending' && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(permit)}
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

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={isEditing ? 'Edit Permit Application' : 'New Permit Application'}
      >
        <form onSubmit={handleSubmitPermit} className="space-y-4">
          <div>
            <label htmlFor="permit-type-select" className="block text-sm font-medium text-gray-700 dark:text-gray-700 dark:text-gray-300 mb-2">Permit Type <span className="text-red-500 dark:text-red-500 dark:text-red-400">*</span></label>
            <div>
              <select
                id="permit-type-select"
                value={formData.permit_type_id}
                onChange={(e) => setFormData({ ...formData, permit_type_id: e.target.value })}
                className="input-field combo-role flex-1"
                required
                disabled={isEditing}
              >
                <option value="">Select the type of permit you want to apply for (e.g., Building Permit, Business Permit, Motorela Permit)</option>
                {permitTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isBuildingPermit && (
            <div className="space-y-6">
              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Owner Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="building-application-no" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Application No <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-application-no"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.application_no}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, application_no: e.target.value })}
                        placeholder="Enter the application number assigned to this building permit application"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="building-bp-no" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">BP No. <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-bp-no"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.bp_no}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, bp_no: e.target.value })}
                        placeholder="Enter the Building Permit (BP) number if this is a renewal or amendment"
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="building-applicant-lastname" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Last Name <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-applicant-lastname"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.applicant_lastname}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, applicant_lastname: e.target.value })}
                        placeholder="Enter the applicant's last name or surname"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="building-applicant-firstname" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">First Name <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-applicant-firstname"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.applicant_firstname}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, applicant_firstname: e.target.value })}
                        placeholder="Enter the applicant's first name"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="building-applicant-mi" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Middle Initial <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-applicant-mi"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.applicant_mi}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, applicant_mi: e.target.value })}
                        placeholder="Enter the middle initial (single letter) of the applicant"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="building-applicant-tin" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">TIN <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-applicant-tin"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.applicant_tin}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, applicant_tin: e.target.value })}
                        placeholder="Enter the Tax Identification Number (TIN) of the applicant"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="building-ownership-form" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Form of Ownership <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <select
                      id="building-ownership-form"
                      className="input-field combo-role flex-1"
                      value={buildingDetails.ownership_form}
                      onChange={(e) => setBuildingDetails({ ...buildingDetails, ownership_form: e.target.value })}
                    >
                      <option value="">Select the form of ownership for this building</option>
                      <option value="Sole Proprietor">Sole Proprietor</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Corporation">Corporation</option>
                      <option value="Cooperative">Cooperative</option>
                      <option value="Association">Association</option>
                      <option value="Individual">Individual</option>
                      <option value="Joint Ownership">Joint Ownership</option>
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Proof of Ownership / Right to Use the Property <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/50 dark:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {proofOfOwnershipPreview || proofOfOwnershipFile ? 'Click to change image' : 'Click to upload image'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Upload a document or image proving ownership or right to use the property (e.g., Title Deed, Tax Declaration, Contract of Lease)</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleProofOfOwnershipChange}
                          key={proofOfOwnershipPreview || 'file-input'}
                        />
                      </label>
                      {proofOfOwnershipPreview && (
                        <div className="relative mt-2">
                          <img
                            src={proofOfOwnershipPreview}
                            alt="Proof of Ownership Preview"
                            className="w-full h-48 object-contain rounded-lg border border-gray-200/50 dark:border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setProofOfOwnershipFile(null);
                              setProofOfOwnershipPreview(null);
                              setBuildingDetails({ ...buildingDetails, proof_of_ownership_url: '' });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-gray-900 dark:text-white"
                            aria-label="Remove proof of ownership image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="building-address" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Address <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <textarea
                      id="building-address"
                      className="input-field flex-1"
                      rows={2}
                      value={buildingDetails.address}
                      onChange={(e) => setBuildingDetails({ ...buildingDetails, address: e.target.value })}
                      placeholder="Enter the complete address of the applicant or property owner"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="building-construction-location" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Location of Construction <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <textarea
                      id="building-construction-location"
                      className="input-field flex-1"
                      rows={2}
                      value={buildingDetails.construction_location}
                      onChange={(e) => setBuildingDetails({ ...buildingDetails, construction_location: e.target.value })}
                      placeholder="Enter the complete address where the construction will take place"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Construction Details</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="building-scope-of-work" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Scope of Work <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <select
                        id="building-scope-of-work"
                        className="input-field combo-role flex-1"
                        value={buildingDetails.scope_of_work}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, scope_of_work: e.target.value })}
                      >
                        <option value="">Select the scope of construction work</option>
                        <option value="New Construction">New Construction</option>
                        <option value="Renovation">Renovation</option>
                        <option value="Addition">Addition</option>
                        <option value="Alteration">Alteration</option>
                        <option value="Repair">Repair</option>
                        <option value="Demolition">Demolition</option>
                        <option value="Reconstruction">Reconstruction</option>
                        <option value="Conversion">Conversion</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="building-occupancy-use" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Use or Character of Occupancy <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <select
                        id="building-occupancy-use"
                        className="input-field combo-role flex-1"
                        value={buildingDetails.occupancy_use}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, occupancy_use: e.target.value })}
                      >
                        <option value="">Select the intended use of the building</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Mixed Use">Mixed Use</option>
                        <option value="Industrial">Industrial</option>
                        <option value="Institutional">Institutional</option>
                        <option value="Agricultural">Agricultural</option>
                        <option value="Storage">Storage</option>
                        <option value="Assembly">Assembly</option>
                        <option value="Business">Business</option>
                        <option value="Educational">Educational</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Religious">Religious</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="building-lot-area" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Lot Area (sq.m.) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-lot-area"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.lot_area}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, lot_area: e.target.value })}
                        placeholder="Enter the total lot area in square meters"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="building-floor-area" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Total Floor Area (sq.m.) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-floor-area"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.floor_area}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, floor_area: e.target.value })}
                        placeholder="Enter the total floor area in square meters (sum of all floors)"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="building-cost-of-construction" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Estimated Cost of Construction <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-cost-of-construction"
                        type="number"
                        step="0.01"
                        className="input-field flex-1"
                        value={buildingDetails.cost_of_construction}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, cost_of_construction: e.target.value })}
                        placeholder="Enter the estimated total cost of the construction project in pesos"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="building-date-of-construction" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Expected Date of Construction <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-date-of-construction"
                        type="date"
                        className="input-field flex-1"
                        value={buildingDetails.date_of_construction}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, date_of_construction: e.target.value })}
                        title="Select the expected start date of construction"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Inspector (Architect / Engineer)</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="building-inspector-name" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Inspector Name <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-inspector-name"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.inspector_name}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, inspector_name: e.target.value })}
                        placeholder="Enter the full name of the licensed architect or engineer supervising the project"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="building-inspector-address" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Address <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <textarea
                        id="building-inspector-address"
                        className="input-field flex-1"
                        rows={2}
                        value={buildingDetails.inspector_address}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, inspector_address: e.target.value })}
                        placeholder="Enter the complete address of the architect or engineer"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="building-prc-no" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">PRC No <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-prc-no"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.prc_no}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, prc_no: e.target.value })}
                        placeholder="Enter the Professional Regulation Commission (PRC) license number"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="building-ptr-no" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">PTR No <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-ptr-no"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.ptr_no}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, ptr_no: e.target.value })}
                        placeholder="Enter the Professional Tax Receipt (PTR) number"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="building-inspector-issued-at" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Issued at <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-inspector-issued-at"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.inspector_issued_at}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, inspector_issued_at: e.target.value })}
                        placeholder="Enter the place where the PRC/PTR was issued"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="building-inspector-validity" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Validity <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-inspector-validity"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.inspector_validity}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, inspector_validity: e.target.value })}
                        placeholder="Enter the validity period of the PRC/PTR (e.g., Until Dec 31, 2024)"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Consent and Signatures</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="building-applicant-signature-date" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Applicant Signature Date <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-applicant-signature-date"
                        type="date"
                        className="input-field flex-1"
                        value={buildingDetails.applicant_signature_date}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, applicant_signature_date: e.target.value })}
                        title="Select the date when the applicant signed the application"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="building-owner-signature-date" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Owner/Representative Signature Date <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-owner-signature-date"
                        type="date"
                        className="input-field flex-1"
                        value={buildingDetails.owner_signature_date}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, owner_signature_date: e.target.value })}
                        title="Select the date when the property owner or authorized representative signed"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Sworn Statement</h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label htmlFor="building-applicant-ctc-no" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Applicant CTC No <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-applicant-ctc-no"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.applicant_ctc_no}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, applicant_ctc_no: e.target.value })}
                        placeholder="Enter the Community Tax Certificate (CTC) number of the applicant"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="building-applicant-ctc-date" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Applicant CTC Date <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-applicant-ctc-date"
                        type="date"
                        className="input-field flex-1"
                        value={buildingDetails.applicant_ctc_date}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, applicant_ctc_date: e.target.value })}
                        title="Select the date when the CTC was issued"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="building-applicant-ctc-place" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Applicant CTC Place <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-applicant-ctc-place"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.applicant_ctc_place}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, applicant_ctc_place: e.target.value })}
                        placeholder="Enter the place where the CTC was issued"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 mt-4">
                  <div>
                    <label htmlFor="building-engineer-ctc-no" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Engineer/Architect CTC No <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-engineer-ctc-no"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.engineer_ctc_no}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, engineer_ctc_no: e.target.value })}
                        placeholder="Enter the Community Tax Certificate (CTC) number of the engineer/architect"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="building-engineer-ctc-date" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Engineer CTC Date <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-engineer-ctc-date"
                        type="date"
                        className="input-field flex-1"
                        value={buildingDetails.engineer_ctc_date}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, engineer_ctc_date: e.target.value })}
                        title="Select the date when the engineer's CTC was issued"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="building-engineer-ctc-place" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Engineer CTC Place <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="building-engineer-ctc-place"
                        type="text"
                        className="input-field flex-1"
                        value={buildingDetails.engineer_ctc_place}
                        onChange={(e) => setBuildingDetails({ ...buildingDetails, engineer_ctc_place: e.target.value })}
                        placeholder="Enter the place where the engineer's CTC was issued"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Attachments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">CHO (City Health Office) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/50 dark:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {choPreview || choFile ? 'Click to change image' : 'Click to upload image'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleChoChange}
                          key={choPreview || 'cho-input'}
                        />
                      </label>
                      {choPreview && (
                        <div className="relative mt-2">
                          <img
                            src={choPreview}
                            alt="CHO Preview"
                            className="w-full h-48 object-contain rounded-lg border border-gray-200/50 dark:border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setChoFile(null);
                              setChoPreview(null);
                              setBuildingDetails({ ...buildingDetails, cho_url: '' });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-gray-900 dark:text-white"
                            aria-label="Remove CHO image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">CENRO (City Environment and Natural Resources Office) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/50 dark:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {cenroPreview || cenroFile ? 'Click to change image' : 'Click to upload image'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleCenroChange}
                          key={cenroPreview || 'cenro-input'}
                        />
                      </label>
                      {cenroPreview && (
                        <div className="relative mt-2">
                          <img
                            src={cenroPreview}
                            alt="CENRO Preview"
                            className="w-full h-48 object-contain rounded-lg border border-gray-200/50 dark:border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setCenroFile(null);
                              setCenroPreview(null);
                              setBuildingDetails({ ...buildingDetails, cenro_url: '' });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-gray-900 dark:text-white"
                            aria-label="Remove CENRO image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">OBO (Office of Building Official) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/50 dark:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {oboPreview || oboFile ? 'Click to change image' : 'Click to upload image'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleOboChange}
                          key={oboPreview || 'obo-input'}
                        />
                      </label>
                      {oboPreview && (
                        <div className="relative mt-2">
                          <img
                            src={oboPreview}
                            alt="OBO Preview"
                            className="w-full h-48 object-contain rounded-lg border border-gray-200/50 dark:border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setOboFile(null);
                              setOboPreview(null);
                              setBuildingDetails({ ...buildingDetails, obo_url: '' });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-gray-900 dark:text-white"
                            aria-label="Remove OBO image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">BFP (Bureau of Fire Protection) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/50 dark:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {bfpPreview || bfpFile ? 'Click to change image' : 'Click to upload image'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleBfpChange}
                          key={bfpPreview || 'bfp-input'}
                        />
                      </label>
                      {bfpPreview && (
                        <div className="relative mt-2">
                          <img
                            src={bfpPreview}
                            alt="BFP Preview"
                            className="w-full h-48 object-contain rounded-lg border border-gray-200/50 dark:border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBfpFile(null);
                              setBfpPreview(null);
                              setBuildingDetails({ ...buildingDetails, bfp_url: '' });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-gray-900 dark:text-white"
                            aria-label="Remove BFP image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isBusinessPermit && (
            <div className="space-y-6">
              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Permit Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="business-tax-year" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Tax Year <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <select
                        id="business-tax-year"
                        className="input-field combo-role flex-1"
                        value={businessDetails.tax_year}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, tax_year: e.target.value })}
                      >
                        <option value="">Select the tax year for this business permit</option>
                        {Array.from({ length: 11 }, (_, i) => {
                          const year = new Date().getFullYear() - 5 + i;
                          return (
                            <option key={year} value={year.toString()}>
                              {year}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-control-no" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Control No <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-control-no"
                        type="text"
                        className="input-field flex-1"
                        value={businessDetails.control_no}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, control_no: e.target.value })}
                        placeholder="Enter the control number assigned to this business permit application"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="business-mode-of-payment" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Mode of Payment <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <select
                        id="business-mode-of-payment"
                        className="input-field combo-role flex-1"
                        value={businessDetails.mode_of_payment}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, mode_of_payment: e.target.value })}
                      >
                        <option value="">Select the mode of payment for this business permit</option>
                        <option value="Annual">Annual</option>
                        <option value="Quarterly">Quarterly</option>
                        <option value="Monthly">Monthly</option>
                        <option value="Semi-Annual">Semi-Annual</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-application-type" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Application Type <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <select
                        id="business-application-type"
                        className="input-field combo-role flex-1"
                        value={businessDetails.application_type}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, application_type: e.target.value })}
                      >
                        <option value="">Select the type of application for this business permit</option>
                        <option value="New">New</option>
                        <option value="Renewal">Renewal</option>
                        <option value="Amendment">Amendment</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="business-amendment" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Amendment (optional) <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="business-amendment"
                      type="text"
                      className="input-field flex-1"
                      value={businessDetails.amendment}
                      onChange={(e) => setBusinessDetails({ ...businessDetails, amendment: e.target.value })}
                      placeholder="If this is an amendment, enter details about what is being amended (optional field)"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Taxpayer Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="business-tax-payer-lastname" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Last Name <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-tax-payer-lastname"
                        type="text"
                        className="input-field flex-1"
                        value={businessDetails.tax_payer_lastname}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, tax_payer_lastname: e.target.value })}
                        placeholder="Enter the taxpayer's last name or surname"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-tax-payer-firstname" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">First Name <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-tax-payer-firstname"
                        type="text"
                        className="input-field flex-1"
                        value={businessDetails.tax_payer_firstname}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, tax_payer_firstname: e.target.value })}
                        placeholder="Enter the taxpayer's first name"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-tax-payer-middlename" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Middle Name <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-tax-payer-middlename"
                        type="text"
                        className="input-field flex-1"
                        value={businessDetails.tax_payer_middlename}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, tax_payer_middlename: e.target.value })}
                        placeholder="Enter the taxpayer's middle name"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label htmlFor="business-tin" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">TIN <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-tin"
                        type="text"
                        className="input-field flex-1"
                        value={businessDetails.tin}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, tin: e.target.value })}
                        placeholder="Enter the Tax Identification Number (TIN) of the taxpayer"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-ctc-no" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">CTC No <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-ctc-no"
                        type="text"
                        className="input-field flex-1"
                        value={businessDetails.ctc_no}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, ctc_no: e.target.value })}
                        placeholder="Enter the Community Tax Certificate (CTC) number"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-org-type" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Type of Organization <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <select
                        id="business-org-type"
                        className="input-field combo-role flex-1"
                        value={businessDetails.org_type}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, org_type: e.target.value })}
                      >
                        <option value="">Select the type of organization for this business</option>
                        <option value="Sole Proprietorship">Sole Proprietorship</option>
                        <option value="Partnership">Partnership</option>
                        <option value="Corporation">Corporation</option>
                        <option value="Cooperative">Cooperative</option>
                        <option value="Association">Association</option>
                        <option value="Foundation">Foundation</option>
                        <option value="Non-Profit Organization">Non-Profit Organization</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="business-name" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Business Name <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-name"
                        type="text"
                        className="input-field flex-1"
                        value={businessDetails.business_name}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, business_name: e.target.value })}
                        placeholder="Enter the registered business name as it appears in your DTI registration"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-nature-of-business" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Nature of Business <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <select
                        id="business-nature-of-business"
                        className="input-field combo-role flex-1"
                        value={businessDetails.nature_of_business}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, nature_of_business: e.target.value })}
                      >
                        <option value="">Select the nature of your business</option>
                        <option value="Retail">Retail</option>
                        <option value="Wholesale">Wholesale</option>
                        <option value="Services">Services</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Trading">Trading</option>
                        <option value="Food and Beverage">Food and Beverage</option>
                        <option value="Construction">Construction</option>
                        <option value="Transportation">Transportation</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Entertainment">Entertainment</option>
                        <option value="Education">Education</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Agriculture">Agriculture</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="business-address" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Business Address <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <textarea
                      id="business-address"
                      className="input-field flex-1"
                      rows={2}
                      value={businessDetails.business_address}
                      onChange={(e) => setBusinessDetails({ ...businessDetails, business_address: e.target.value })}
                      placeholder="Enter the complete address where the business is located"
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label htmlFor="business-owner-address" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Owner Address <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <textarea
                      id="business-owner-address"
                      className="input-field flex-1"
                      rows={2}
                      value={businessDetails.owner_address}
                      onChange={(e) => setBusinessDetails({ ...businessDetails, owner_address: e.target.value })}
                      placeholder="Enter the complete residential address of the business owner"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="business-phone" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Phone <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-phone"
                        type="text"
                        className="input-field flex-1"
                        value={businessDetails.phone}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, phone: e.target.value })}
                        placeholder="Enter the business contact phone number"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-email" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-email"
                        type="email"
                        className="input-field flex-1"
                        value={businessDetails.email}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, email: e.target.value })}
                        placeholder="Enter the business contact email address"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="business-area" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Business Area (sq.m) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-area"
                        type="text"
                        className="input-field flex-1"
                        value={businessDetails.business_area}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, business_area: e.target.value })}
                        placeholder="Enter the total floor area of the business in square meters"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-total-employees" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Total Employees <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-total-employees"
                        type="number"
                        className="input-field flex-1"
                        value={businessDetails.total_employees}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, total_employees: e.target.value })}
                        placeholder="Enter the total number of employees working in the business"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Lessor Information (If Rented)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="business-lessor-name" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Lessor Name <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-lessor-name"
                        type="text"
                        className="input-field flex-1"
                        value={businessDetails.lessor_name}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, lessor_name: e.target.value })}
                        placeholder="Enter the name of the property owner/lessor if the business is operating in a rented space"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-lessor-address" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Lessor Address <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-lessor-address"
                        type="text"
                        className="input-field flex-1"
                        value={businessDetails.lessor_address}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, lessor_address: e.target.value })}
                        placeholder="Enter the complete address of the lessor/property owner"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Business Activity</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="business-activity-code" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Activity Code <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-activity-code"
                        type="text"
                        className="input-field flex-1"
                        value={businessDetails.business_activity_code}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, business_activity_code: e.target.value })}
                        placeholder="Enter the business activity code from the standard classification system"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-line-of-business" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Line of Business <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <select
                        id="business-line-of-business"
                        className="input-field combo-role flex-1"
                        value={businessDetails.line_of_business}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, line_of_business: e.target.value })}
                      >
                        <option value="">Select the specific line of business</option>
                        <option value="Grocery Store">Grocery Store</option>
                        <option value="Restaurant">Restaurant</option>
                        <option value="Cafe">Cafe</option>
                        <option value="Retail Shop">Retail Shop</option>
                        <option value="Construction">Construction</option>
                        <option value="General Merchandise">General Merchandise</option>
                        <option value="Hardware Store">Hardware Store</option>
                        <option value="Pharmacy">Pharmacy</option>
                        <option value="Beauty Salon">Beauty Salon</option>
                        <option value="Barber Shop">Barber Shop</option>
                        <option value="Repair Shop">Repair Shop</option>
                        <option value="Internet Cafe">Internet Cafe</option>
                        <option value="Printing Services">Printing Services</option>
                        <option value="Laundry Services">Laundry Services</option>
                        <option value="Transportation Services">Transportation Services</option>
                        <option value="Real Estate Services">Real Estate Services</option>
                        <option value="Consulting Services">Consulting Services</option>
                        <option value="Educational Services">Educational Services</option>
                        <option value="Healthcare Services">Healthcare Services</option>
                        <option value="Food Processing">Food Processing</option>
                        <option value="Manufacturing">Manufacturing</option>
                        <option value="Wholesale Trading">Wholesale Trading</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <label htmlFor="business-no-of-units" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">No. of Units <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-no-of-units"
                        type="number"
                        className="input-field flex-1"
                        value={businessDetails.no_of_units}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, no_of_units: e.target.value })}
                        placeholder="Enter the number of units or branches of the business"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-capitalization" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Capitalization <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-capitalization"
                        type="number"
                        step="0.01"
                        className="input-field flex-1"
                        value={businessDetails.capitalization}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, capitalization: e.target.value })}
                        placeholder="Enter the total capital investment in pesos"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="business-essential-sales" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Essential Gross Sales <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-essential-sales"
                        type="number"
                        step="0.01"
                        className="input-field flex-1"
                        value={businessDetails.essential_sales}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, essential_sales: e.target.value })}
                        placeholder="Enter the gross sales from essential goods/services in pesos"
                      />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label htmlFor="business-non-essential-sales" className="block text-sm text-gray-700 dark:text-gray-300 mb-1">Non-Essential Gross Sales <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div>
                      <input
                        id="business-non-essential-sales"
                        type="number"
                        step="0.01"
                        className="input-field flex-1"
                        value={businessDetails.non_essential_sales}
                        onChange={(e) => setBusinessDetails({ ...businessDetails, non_essential_sales: e.target.value })}
                        placeholder="Enter the gross sales from non-essential goods/services in pesos"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Attachments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">CHO (City Health Office) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/50 dark:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {businessChoPreview || businessChoFile ? 'Click to change image' : 'Click to upload image'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleBusinessChoChange}
                          key={businessChoPreview || 'business-cho-input'}
                        />
                      </label>
                      {businessChoPreview && (
                        <div className="relative mt-2">
                          <img
                            src={businessChoPreview}
                            alt="CHO Preview"
                            className="w-full h-48 object-contain rounded-lg border border-gray-200/50 dark:border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBusinessChoFile(null);
                              setBusinessChoPreview(null);
                              setBusinessDetails({ ...businessDetails, cho_url: '' });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-gray-900 dark:text-white"
                            aria-label="Remove CHO image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">CENRO (City Environment and Natural Resources Office) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/50 dark:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {businessCenroPreview || businessCenroFile ? 'Click to change image' : 'Click to upload image'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleBusinessCenroChange}
                          key={businessCenroPreview || 'business-cenro-input'}
                        />
                      </label>
                      {businessCenroPreview && (
                        <div className="relative mt-2">
                          <img
                            src={businessCenroPreview}
                            alt="CENRO Preview"
                            className="w-full h-48 object-contain rounded-lg border border-gray-200/50 dark:border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBusinessCenroFile(null);
                              setBusinessCenroPreview(null);
                              setBusinessDetails({ ...businessDetails, cenro_url: '' });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-gray-900 dark:text-white"
                            aria-label="Remove CENRO image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">OBO (Office of Building Official) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/50 dark:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {businessOboPreview || businessOboFile ? 'Click to change image' : 'Click to upload image'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleBusinessOboChange}
                          key={businessOboPreview || 'business-obo-input'}
                        />
                      </label>
                      {businessOboPreview && (
                        <div className="relative mt-2">
                          <img
                            src={businessOboPreview}
                            alt="OBO Preview"
                            className="w-full h-48 object-contain rounded-lg border border-gray-200/50 dark:border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBusinessOboFile(null);
                              setBusinessOboPreview(null);
                              setBusinessDetails({ ...businessDetails, obo_url: '' });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-gray-900 dark:text-white"
                            aria-label="Remove OBO image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">BFP (Bureau of Fire Protection) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/50 dark:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {businessBfpPreview || businessBfpFile ? 'Click to change image' : 'Click to upload image'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleBusinessBfpChange}
                          key={businessBfpPreview || 'business-bfp-input'}
                        />
                      </label>
                      {businessBfpPreview && (
                        <div className="relative mt-2">
                          <img
                            src={businessBfpPreview}
                            alt="BFP Preview"
                            className="w-full h-48 object-contain rounded-lg border border-gray-200/50 dark:border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setBusinessBfpFile(null);
                              setBusinessBfpPreview(null);
                              setBusinessDetails({ ...businessDetails, bfp_url: '' });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-gray-900 dark:text-white"
                            aria-label="Remove BFP image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {isMotorelaSelected && (
            <div className="space-y-4">
              <div className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Motorela Details</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="motorela-date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-date"
                      type="date"
                      value={motorelaDetails.date}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, date: e.target.value })}
                      className="input-field flex-1"
                      title="Select the application date"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-application-no" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Application Control No. <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-application-no"
                      type="text"
                      value={motorelaDetails.application_no}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, application_no: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the application control number assigned to this permit application"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-body-no" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Body No <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-body-no"
                      type="text"
                      value={motorelaDetails.body_no}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, body_no: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the body number of the motorela vehicle"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-chassis-no" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chassis No <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-chassis-no"
                      type="text"
                      value={motorelaDetails.chassis_no}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, chassis_no: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the chassis number (VIN) of the motorela vehicle"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-make" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Make <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <select
                      id="motorela-make"
                      value={motorelaDetails.make}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, make: e.target.value })}
                      className="input-field combo-role flex-1"
                      required
                    >
                      <option value="">Select the make/brand of the motorela vehicle</option>
                      <option value="Honda">Honda</option>
                      <option value="Yamaha">Yamaha</option>
                      <option value="Suzuki">Suzuki</option>
                      <option value="Kawasaki">Kawasaki</option>
                      <option value="Bajaj">Bajaj</option>
                      <option value="TVS">TVS</option>
                      <option value="Hero">Hero</option>
                      <option value="Kymco">Kymco</option>
                      <option value="Piaggio">Piaggio</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-motor-no" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Motor No <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-motor-no"
                      type="text"
                      value={motorelaDetails.motor_no}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, motor_no: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the motor/engine number of the motorela vehicle"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-route" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Route of Operation <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-route"
                      type="text"
                      value={motorelaDetails.route}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, route: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the route where the motorela will operate (e.g., Barangay A to Barangay B)"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-plate-no" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Plate No <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-plate-no"
                      type="text"
                      value={motorelaDetails.plate_no}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, plate_no: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the license plate number of the motorela vehicle"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-operator" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name of Operator <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-operator"
                      type="text"
                      value={motorelaDetails.operator}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, operator: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the full name of the motorela operator/owner"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-operator-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address (Operator) <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-operator-address"
                      type="text"
                      value={motorelaDetails.operator_address}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, operator_address: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the complete address of the motorela operator"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-contact" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Contact Number <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-contact"
                      type="text"
                      value={motorelaDetails.contact}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, contact: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the contact phone number of the operator"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-driver" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Name of Driver <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-driver"
                      type="text"
                      value={motorelaDetails.driver}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, driver: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the full name of the driver who will operate the motorela"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-driver-address" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address (Driver) <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-driver-address"
                      type="text"
                      value={motorelaDetails.driver_address}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, driver_address: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the complete address of the driver"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-cedula-no" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">CEDULA No. <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-cedula-no"
                      type="text"
                      value={motorelaDetails.cedula_no}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, cedula_no: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the Community Tax Certificate (CEDULA) number (optional)"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-place-issued" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Place of Issue <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-place-issued"
                      type="text"
                      value={motorelaDetails.place_issued}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, place_issued: e.target.value })}
                      className="input-field flex-1"
                      placeholder="Enter the place where the CEDULA was issued (optional)"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="motorela-date-issued" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Issue <span className="text-red-500 dark:text-red-400">*</span></label>
                  <div>
                    <input
                      id="motorela-date-issued"
                      type="date"
                      value={motorelaDetails.date_issued}
                      onChange={(e) => setMotorelaDetails({ ...motorelaDetails, date_issued: e.target.value })}
                      className="input-field flex-1"
                      title="Select the date when the CEDULA was issued (optional)"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-gray-200/50 dark:border-white/10 rounded-lg p-4 bg-gray-100/80 dark:bg-white/5 mt-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Hard Copy Attachments</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">CHO (City Health Office) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/50 dark:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {motorelaChoPreview || motorelaChoFile ? 'Click to change image' : 'Click to upload image'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleMotorelaChoChange}
                          key={motorelaChoPreview || 'motorela-cho-input'}
                        />
                      </label>
                      {motorelaChoPreview && (
                        <div className="relative mt-2">
                          <img
                            src={motorelaChoPreview}
                            alt="Motorela CHO Preview"
                            className="w-full h-48 object-contain rounded-lg border border-gray-200/50 dark:border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setMotorelaChoFile(null);
                              setMotorelaChoPreview(null);
                              setMotorelaDetails({ ...motorelaDetails, cho_url: '' });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-gray-900 dark:text-white"
                            aria-label="Remove Motorela CHO image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1">CENRO (City Environment and Natural Resources Office) <span className="text-red-500 dark:text-red-400">*</span></label>
                    <div className="space-y-2">
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-gray-100/80 dark:bg-white/5 hover:bg-gray-200/50 dark:bg-white/10 transition-colors">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400 mb-2" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {motorelaCenroPreview || motorelaCenroFile ? 'Click to change image' : 'Click to upload image'}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-500 mt-1">PNG, JPG, GIF up to 5MB</p>
                        </div>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={handleMotorelaCenroChange}
                          key={motorelaCenroPreview || 'motorela-cenro-input'}
                        />
                      </label>
                      {motorelaCenroPreview && (
                        <div className="relative mt-2">
                          <img
                            src={motorelaCenroPreview}
                            alt="Motorela CENRO Preview"
                            className="w-full h-48 object-contain rounded-lg border border-gray-200/50 dark:border-white/10"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setMotorelaCenroFile(null);
                              setMotorelaCenroPreview(null);
                              setMotorelaDetails({ ...motorelaDetails, cenro_url: '' });
                            }}
                            className="absolute top-2 right-2 p-1 bg-red-500/80 hover:bg-red-500 rounded-full text-gray-900 dark:text-white"
                            aria-label="Remove Motorela CENRO image"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-4">
            <button type="button" onClick={() => { setShowCreateModal(false); setIsEditing(false); setEditingPermitId(null); }} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {isEditing ? 'Save Changes' : 'Submit Application'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
