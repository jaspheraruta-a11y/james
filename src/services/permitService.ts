import { supabase } from './supabaseClient';
import type { Permit, PermitType, PermitDocument, DashboardStats } from '../types';
import { notificationService } from './notificationService';

export const permitService = {
  async getPermitTypes(): Promise<PermitType[]> {
    const { data, error } = await supabase
      .from('permit_types')
      .select('*')
      .order('title');

    if (error) throw error;
    return data || [];
  },

  async createPermit(permitData: {
    permit_type_id: number;
    address: string;
    details: Record<string, any>;
  }): Promise<Permit> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('permits')
      .insert([
        {
          applicant_id: user.id,
          ...permitData,
          status: 'pending',
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // If this is a motorela permit, also insert into motorela_permits table
    if (data && permitData.details?.motorela) {
      const motorelaData = permitData.details.motorela;
      const { error: motorelaError } = await supabase
        .from('motorela_permits')
        .insert([
          {
            permit_id: data.id,
            application_no: motorelaData.application_no || '',
            date: motorelaData.date || null,
            body_no: motorelaData.body_no || '',
            chassis_no: motorelaData.chassis_no || '',
            make: motorelaData.make || '',
            motor_no: motorelaData.motor_no || '',
            route: motorelaData.route || '',
            plate_no: motorelaData.plate_no || '',
            operator: motorelaData.operator || '',
            operator_address: motorelaData.operator_address || '',
            contact: motorelaData.contact || '',
            driver: motorelaData.driver || '',
            driver_address: motorelaData.driver_address || '',
            cedula_no: motorelaData.cedula_no || null,
            place_issued: motorelaData.place_issued || null,
            date_issued: motorelaData.date_issued || null,
          },
        ]);

      if (motorelaError) {
        console.error('Error inserting motorela permit:', motorelaError);
      }
    }

    // If this is a building permit, also insert into building permit tables
    if (data && permitData.details?.building_permit) {
      const buildingData = permitData.details.building_permit;
      
      try {
        // Insert applicant details
        const { data: applicantData, error: applicantError } = await supabase
          .from('building_permit_applicants')
          .insert([
            {
              permit_id: data.id,
              lastname: buildingData.applicant_lastname || '',
              firstname: buildingData.applicant_firstname || '',
              middle_initial: buildingData.applicant_mi || '',
              tin: buildingData.applicant_tin || '',
              ownership_form: buildingData.ownership_form || '',
              address: buildingData.address || '',
              ctc_no: buildingData.applicant_ctc_no || '',
              ctc_date: buildingData.applicant_ctc_date || null,
              ctc_place: buildingData.applicant_ctc_place || '',
              signature_date: buildingData.applicant_signature_date || null,
            },
          ])
          .select()
          .single();

        if (applicantError) throw applicantError;

        // Insert construction details
        const { data: constructionData, error: constructionError } = await supabase
          .from('building_construction_details')
          .insert([
            {
              permit_id: data.id,
              location: buildingData.construction_location || '',
              scope_of_work: buildingData.scope_of_work || '',
              occupancy_use: buildingData.occupancy_use || '',
              lot_area: buildingData.lot_area ? parseFloat(buildingData.lot_area) : null,
              floor_area: buildingData.floor_area ? parseFloat(buildingData.floor_area) : null,
              cost_of_construction: buildingData.cost_of_construction ? parseFloat(buildingData.cost_of_construction) : null,
              date_of_construction: buildingData.date_of_construction || null,
            },
          ])
          .select()
          .single();

        if (constructionError) throw constructionError;

        // Insert inspector details
        const { data: inspectorData, error: inspectorError } = await supabase
          .from('building_inspectors')
          .insert([
            {
              permit_id: data.id,
              name: buildingData.inspector_name || '',
              address: buildingData.inspector_address || '',
              prc_no: buildingData.prc_no || '',
              ptr_no: buildingData.ptr_no || '',
              issued_at: buildingData.inspector_issued_at || '',
              validity: buildingData.inspector_validity || null,
            },
          ])
          .select()
          .single();

        if (inspectorError) throw inspectorError;

        // Insert engineer details
        const { data: engineerData, error: engineerError } = await supabase
          .from('building_engineers')
          .insert([
            {
              permit_id: data.id,
              ctc_no: buildingData.engineer_ctc_no || '',
              ctc_date: buildingData.engineer_ctc_date || null,
              ctc_place: buildingData.engineer_ctc_place || '',
            },
          ])
          .select()
          .single();

        if (engineerError) throw engineerError;

        // Insert building permit details with references
        const { error: buildingDetailsError } = await supabase
          .from('building_permit_details')
          .insert([
            {
              permit_id: data.id,
              application_no: buildingData.application_no || '',
              bp_no: buildingData.bp_no || '',
              applicant_id: applicantData.id,
              construction_id: constructionData.id,
              inspector_id: inspectorData.id,
              engineer_id: engineerData.id,
              owner_signature_date: buildingData.owner_signature_date || null,
            },
          ]);

        if (buildingDetailsError) {
          console.error('Error inserting building permit details:', buildingDetailsError);
        }
        
        // Insert uploaded image metadata if file was uploaded
        if (permitData.details?.uploaded_file_metadata) {
          const fileMetadata = permitData.details.uploaded_file_metadata;
          const { error: imageError } = await supabase
            .from('uploaded_images')
            .insert([
              {
                permit_id: data.id,
                uploader_id: data.applicant_id,
                category: fileMetadata.category || 'proof_of_ownership',
                file_name: fileMetadata.file_name,
                file_ext: fileMetadata.file_ext,
                mime_type: fileMetadata.mime_type,
                size_bytes: fileMetadata.size_bytes,
                storage_bucket: 'permit-documents',
                storage_path: fileMetadata.storage_path,
                public_url: fileMetadata.public_url,
              },
            ]);
          
          if (imageError) {
            console.error('Error inserting uploaded image metadata:', imageError);
          }
        }
      } catch (err) {
        console.error('Error inserting building permit data:', err);
      }
    }

    // If this is a business permit, also insert into business permit tables
    if (data && permitData.details?.business_permit) {
      const businessData = permitData.details.business_permit;
      
      try {
        // Insert taxpayer details
        const { data: taxpayerData, error: taxpayerError } = await supabase
          .from('business_taxpayers')
          .insert([
            {
              permit_id: data.id,
              lastname: businessData.tax_payer_lastname || '',
              firstname: businessData.tax_payer_firstname || '',
              middlename: businessData.tax_payer_middlename || '',
              tin: businessData.tin || '',
              ctc_no: businessData.ctc_no || '',
              address: businessData.owner_address || '',
              phone: businessData.phone || '',
              email: businessData.email || '',
            },
          ])
          .select()
          .single();

        if (taxpayerError) throw taxpayerError;

        // Insert establishment details
        const { data: establishmentData, error: establishmentError } = await supabase
          .from('business_establishments')
          .insert([
            {
              permit_id: data.id,
              business_name: businessData.business_name || '',
              nature_of_business: businessData.nature_of_business || '',
              business_address: businessData.business_address || '',
              business_area: businessData.business_area || '',
              business_activity_code: businessData.business_activity_code || '',
              line_of_business: businessData.line_of_business || '',
              no_of_units: businessData.no_of_units ? parseInt(businessData.no_of_units) : null,
              capitalization: businessData.capitalization ? parseFloat(businessData.capitalization) : null,
              essential_sales: businessData.essential_sales ? parseFloat(businessData.essential_sales) : null,
              non_essential_sales: businessData.non_essential_sales ? parseFloat(businessData.non_essential_sales) : null,
            },
          ])
          .select()
          .single();

        if (establishmentError) throw establishmentError;

        // Insert employment details
        const { data: employmentData, error: employmentError } = await supabase
          .from('business_employment')
          .insert([
            {
              permit_id: data.id,
              total_employees: businessData.total_employees ? parseInt(businessData.total_employees) : null,
              employees_in_lgu: businessData.employees_in_lgu ? parseInt(businessData.employees_in_lgu) : null,
            },
          ])
          .select()
          .single();

        if (employmentError) throw employmentError;

        // Insert lessor details (optional)
        let lessorId = null;
        if (businessData.lessor_name || businessData.lessor_address) {
          const { data: lessorData, error: lessorError } = await supabase
            .from('business_lessors')
            .insert([
              {
                permit_id: data.id,
                lessor_name: businessData.lessor_name || '',
                lessor_address: businessData.lessor_address || '',
              },
            ])
            .select()
            .single();

          if (lessorError) {
            console.error('Error inserting lessor details:', lessorError);
          } else {
            lessorId = lessorData.id;
          }
        }

        // Insert business permit details with references
        const { error: businessDetailsError } = await supabase
          .from('business_permit_details')
          .insert([
            {
              permit_id: data.id,
              tax_year: businessData.tax_year ? parseInt(businessData.tax_year) : null,
              control_no: businessData.control_no || '',
              mode_of_payment: businessData.mode_of_payment || '',
              application_type: businessData.application_type || '',
              amendment: businessData.amendment || '',
              org_type: businessData.org_type || '',
              taxpayer_id: taxpayerData.id,
              establishment_id: establishmentData.id,
              employment_id: employmentData.id,
              lessor_id: lessorId,
            },
          ]);

        if (businessDetailsError) {
          console.error('Error inserting business permit details:', businessDetailsError);
        }
      } catch (err) {
        console.error('Error inserting business permit data:', err);
      }
    }

    return data;
  },

  async getUserPermits(userId: string): Promise<Permit[]> {
    const { data, error } = await supabase
      .from('permits')
      .select(`
        *,
        permit_type:permit_types(*)
      `)
      .eq('applicant_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAllPermits(): Promise<Permit[]> {
    const { data, error } = await supabase
      .from('permits')
      .select(`
        *,
        permit_type:permit_types(*),
        applicant:profiles(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getApprovedPermits(): Promise<Permit[]> {
    const { data, error } = await supabase
      .from('permits')
      .select(`
        *,
        permit_type:permit_types(*),
        applicant:profiles(*),
        payments(*),
        uploaded_images(*)
      `)
      .eq('status', 'approved')
      .order('updated_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((permit: any) => {
      const { uploaded_images, ...rest } = permit;

      return {
        ...rest,
        payments: permit.payments || [],
        uploadedImages: uploaded_images || [],
      } as Permit;
    });
  },

  async getPermitById(permitId: string): Promise<any> {
    // Get base permit data
    const { data: permit, error: permitError } = await supabase
      .from('permits')
      .select(`
        *,
        permit_type:permit_types(*),
        applicant:profiles(*)
      `)
      .eq('id', permitId)
      .single();

    if (permitError) throw permitError;
    if (!permit) throw new Error('Permit not found');

    // Get documents
    const { data: documents } = await supabase
      .from('permit_documents')
      .select('*')
      .eq('permit_id', permitId)
      .order('uploaded_at', { ascending: false });

    // Get payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('permit_id', permitId)
      .order('created_at', { ascending: false });

    // Get audit trail
    const { data: auditTrail } = await supabase
      .from('permit_audit')
      .select(`
        *,
        actor:profiles(*)
      `)
      .eq('permit_id', permitId)
      .order('created_at', { ascending: false });

    // Get motorela permit data if applicable
    const { data: motorelaData } = await supabase
      .from('motorela_permits')
      .select('*')
      .eq('permit_id', permitId)
      .maybeSingle();

    // Get building permit data if applicable
    let buildingPermitData = null;
    const { data: buildingDetails } = await supabase
      .from('building_permit_details')
      .select(`
        *,
        applicant:building_permit_applicants(*),
        construction:building_construction_details!construction_id(*),
        inspector:building_inspectors!inspector_id(*),
        engineer:building_engineers!engineer_id(*)
      `)
      .eq('permit_id', permitId)
      .maybeSingle();

    if (buildingDetails) {
      buildingPermitData = buildingDetails;
      
      // If construction join didn't work, fetch it separately
      if (buildingDetails.construction_id && (!buildingDetails.construction || (Array.isArray(buildingDetails.construction) && buildingDetails.construction.length === 0))) {
        const { data: constructionData } = await supabase
          .from('building_construction_details')
          .select('*')
          .eq('id', buildingDetails.construction_id)
          .maybeSingle();
        
        if (constructionData) {
          buildingPermitData.construction = constructionData;
        }
      }
      
      // If inspector join didn't work, fetch it separately
      if (buildingDetails.inspector_id && (!buildingDetails.inspector || (Array.isArray(buildingDetails.inspector) && buildingDetails.inspector.length === 0))) {
        const { data: inspectorData } = await supabase
          .from('building_inspectors')
          .select('*')
          .eq('id', buildingDetails.inspector_id)
          .maybeSingle();
        
        if (inspectorData) {
          buildingPermitData.inspector = inspectorData;
        }
      }
      
      // If engineer join didn't work, fetch it separately
      if (buildingDetails.engineer_id && (!buildingDetails.engineer || (Array.isArray(buildingDetails.engineer) && buildingDetails.engineer.length === 0))) {
        const { data: engineerData } = await supabase
          .from('building_engineers')
          .select('*')
          .eq('id', buildingDetails.engineer_id)
          .maybeSingle();
        
        if (engineerData) {
          buildingPermitData.engineer = engineerData;
        }
      }
      
      // If applicant join didn't work, fetch it separately
      if (buildingDetails.applicant_id && (!buildingDetails.applicant || (Array.isArray(buildingDetails.applicant) && buildingDetails.applicant.length === 0))) {
        const { data: applicantData } = await supabase
          .from('building_permit_applicants')
          .select('*')
          .eq('id', buildingDetails.applicant_id)
          .maybeSingle();
        
        if (applicantData) {
          buildingPermitData.applicant = applicantData;
        }
      }
    } else {
      // If no building_permit_details record exists, try to get construction details directly from permit_id
      // This handles cases where data might be stored differently
      const { data: constructionData } = await supabase
        .from('building_construction_details')
        .select('*')
        .eq('permit_id', permitId)
        .maybeSingle();
      
      if (constructionData) {
        // Create a minimal buildingPermitData object with construction details
        buildingPermitData = {
          construction: constructionData,
        };
      }
    }

    // Get business permit data if applicable
    let businessPermitData = null;
    const { data: businessDetails } = await supabase
      .from('business_permit_details')
      .select(`
        *,
        taxpayer:business_taxpayers(*),
        establishment:business_establishments(*),
        employment:business_employment(*),
        lessor:business_lessors(*)
      `)
      .eq('permit_id', permitId)
      .maybeSingle();

    if (businessDetails) {
      businessPermitData = businessDetails;
    }

    // Get uploaded images
    const { data: uploadedImages } = await supabase
      .from('uploaded_images')
      .select('*')
      .eq('permit_id', permitId)
      .order('uploaded_at', { ascending: false });

    return {
      ...permit,
      documents: documents || [],
      payments: payments || [],
      auditTrail: auditTrail || [],
      motorelaData,
      buildingPermitData,
      businessPermitData,
      uploadedImages: uploadedImages || [],
    };
  },

  async updatePermit(
    permitId: string,
    permitData: {
      permit_type_id: number;
      address: string;
      details: Record<string, any>;
    }
  ): Promise<Permit> {
    const { data, error } = await supabase
      .from('permits')
      .update({
        ...permitData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', permitId)
      .select()
      .single();

    if (error) throw error;

    // If this is a motorela permit, also update or insert into motorela_permits table
    if (data && permitData.details?.motorela) {
      const motorelaData = permitData.details.motorela;
      
      // Check if motorela_permits record exists
      const { data: existingMotorela } = await supabase
        .from('motorela_permits')
        .select('id')
        .eq('permit_id', permitId)
        .maybeSingle();

      const motorelaRecord = {
        permit_id: permitId,
        application_no: motorelaData.application_no || '',
        date: motorelaData.date || null,
        body_no: motorelaData.body_no || '',
        chassis_no: motorelaData.chassis_no || '',
        make: motorelaData.make || '',
        motor_no: motorelaData.motor_no || '',
        route: motorelaData.route || '',
        plate_no: motorelaData.plate_no || '',
        operator: motorelaData.operator || '',
        operator_address: motorelaData.operator_address || '',
        contact: motorelaData.contact || '',
        driver: motorelaData.driver || '',
        driver_address: motorelaData.driver_address || '',
        cedula_no: motorelaData.cedula_no || null,
        place_issued: motorelaData.place_issued || null,
        date_issued: motorelaData.date_issued || null,
      };

      if (existingMotorela) {
        // Update existing record
        const { error: motorelaError } = await supabase
          .from('motorela_permits')
          .update(motorelaRecord)
          .eq('permit_id', permitId);

        if (motorelaError) {
          console.error('Error updating motorela permit:', motorelaError);
        }
      } else {
        // Insert new record
        const { error: motorelaError } = await supabase
          .from('motorela_permits')
          .insert([motorelaRecord]);

        if (motorelaError) {
          console.error('Error inserting motorela permit:', motorelaError);
        }
      }
    }

    // If this is a building permit, also update or insert into building permit tables
    if (data && permitData.details?.building_permit) {
      const buildingData = permitData.details.building_permit;
      
      try {
        // Check and update/insert applicant - using permit_id to find existing record
        const { data: existingApplicant } = await supabase
          .from('building_permit_applicants')
          .select('id')
          .eq('permit_id', permitId)
          .maybeSingle();

        let applicantId: string;
        if (existingApplicant) {
          // Update existing applicant
          const { data: updatedApplicant, error: applicantError } = await supabase
            .from('building_permit_applicants')
            .update({
              lastname: buildingData.applicant_lastname || '',
              firstname: buildingData.applicant_firstname || '',
              middle_initial: buildingData.applicant_mi || '',
              tin: buildingData.applicant_tin || '',
              ownership_form: buildingData.ownership_form || '',
              address: buildingData.address || '',
              ctc_no: buildingData.applicant_ctc_no || '',
              ctc_date: buildingData.applicant_ctc_date || null,
              ctc_place: buildingData.applicant_ctc_place || '',
              signature_date: buildingData.applicant_signature_date || null,
            })
            .eq('id', existingApplicant.id)
            .select('id')
            .single();
          
          if (applicantError) throw applicantError;
          applicantId = updatedApplicant.id;
        } else {
          // Insert new applicant
          const { data: newApplicant, error: applicantError } = await supabase
            .from('building_permit_applicants')
            .insert([
              {
                permit_id: permitId,
                lastname: buildingData.applicant_lastname || '',
                firstname: buildingData.applicant_firstname || '',
                middle_initial: buildingData.applicant_mi || '',
                tin: buildingData.applicant_tin || '',
                ownership_form: buildingData.ownership_form || '',
                address: buildingData.address || '',
                ctc_no: buildingData.applicant_ctc_no || '',
                ctc_date: buildingData.applicant_ctc_date || null,
                ctc_place: buildingData.applicant_ctc_place || '',
                signature_date: buildingData.applicant_signature_date || null,
              },
            ])
            .select('id')
            .single();
          
          if (applicantError) throw applicantError;
          applicantId = newApplicant.id;
        }

        // Check and update/insert construction details
        const { data: existingConstruction } = await supabase
          .from('building_construction_details')
          .select('id')
          .eq('permit_id', permitId)
          .maybeSingle();

        let constructionId: string;
        if (existingConstruction) {
          const { data: updatedConstruction, error: constructionError } = await supabase
            .from('building_construction_details')
            .update({
              location: buildingData.construction_location || '',
              scope_of_work: buildingData.scope_of_work || '',
              occupancy_use: buildingData.occupancy_use || '',
              lot_area: buildingData.lot_area ? parseFloat(buildingData.lot_area) : null,
              floor_area: buildingData.floor_area ? parseFloat(buildingData.floor_area) : null,
              cost_of_construction: buildingData.cost_of_construction ? parseFloat(buildingData.cost_of_construction) : null,
              date_of_construction: buildingData.date_of_construction || null,
            })
            .eq('id', existingConstruction.id)
            .select('id')
            .single();
          
          if (constructionError) throw constructionError;
          constructionId = updatedConstruction.id;
        } else {
          const { data: newConstruction, error: constructionError } = await supabase
            .from('building_construction_details')
            .insert([
              {
                permit_id: permitId,
                location: buildingData.construction_location || '',
                scope_of_work: buildingData.scope_of_work || '',
                occupancy_use: buildingData.occupancy_use || '',
                lot_area: buildingData.lot_area ? parseFloat(buildingData.lot_area) : null,
                floor_area: buildingData.floor_area ? parseFloat(buildingData.floor_area) : null,
                cost_of_construction: buildingData.cost_of_construction ? parseFloat(buildingData.cost_of_construction) : null,
                date_of_construction: buildingData.date_of_construction || null,
              },
            ])
            .select('id')
            .single();
          
          if (constructionError) throw constructionError;
          constructionId = newConstruction.id;
        }

        // Check and update/insert inspector
        const { data: existingInspector } = await supabase
          .from('building_inspectors')
          .select('id')
          .eq('permit_id', permitId)
          .maybeSingle();

        let inspectorId: string;
        if (existingInspector) {
          const { data: updatedInspector, error: inspectorError } = await supabase
            .from('building_inspectors')
            .update({
              name: buildingData.inspector_name || '',
              address: buildingData.inspector_address || '',
              prc_no: buildingData.prc_no || '',
              ptr_no: buildingData.ptr_no || '',
              issued_at: buildingData.inspector_issued_at || '',
              validity: buildingData.inspector_validity || null,
            })
            .eq('id', existingInspector.id)
            .select('id')
            .single();
          
          if (inspectorError) throw inspectorError;
          inspectorId = updatedInspector.id;
        } else {
          const { data: newInspector, error: inspectorError } = await supabase
            .from('building_inspectors')
            .insert([
              {
                permit_id: permitId,
                name: buildingData.inspector_name || '',
                address: buildingData.inspector_address || '',
                prc_no: buildingData.prc_no || '',
                ptr_no: buildingData.ptr_no || '',
                issued_at: buildingData.inspector_issued_at || '',
                validity: buildingData.inspector_validity || null,
              },
            ])
            .select('id')
            .single();
          
          if (inspectorError) throw inspectorError;
          inspectorId = newInspector.id;
        }

        // Check and update/insert engineer
        const { data: existingEngineer } = await supabase
          .from('building_engineers')
          .select('id')
          .eq('permit_id', permitId)
          .maybeSingle();

        let engineerId: string;
        if (existingEngineer) {
          const { data: updatedEngineer, error: engineerError } = await supabase
            .from('building_engineers')
            .update({
              ctc_no: buildingData.engineer_ctc_no || '',
              ctc_date: buildingData.engineer_ctc_date || null,
              ctc_place: buildingData.engineer_ctc_place || '',
            })
            .eq('id', existingEngineer.id)
            .select('id')
            .single();
          
          if (engineerError) throw engineerError;
          engineerId = updatedEngineer.id;
        } else {
          const { data: newEngineer, error: engineerError } = await supabase
            .from('building_engineers')
            .insert([
              {
                permit_id: permitId,
                ctc_no: buildingData.engineer_ctc_no || '',
                ctc_date: buildingData.engineer_ctc_date || null,
                ctc_place: buildingData.engineer_ctc_place || '',
              },
            ])
            .select('id')
            .single();
          
          if (engineerError) throw engineerError;
          engineerId = newEngineer.id;
        }

        // Update or insert building_permit_details (has UNIQUE constraint on permit_id)
        const { data: existingBuildingDetails } = await supabase
          .from('building_permit_details')
          .select('id')
          .eq('permit_id', permitId)
          .maybeSingle();

        if (existingBuildingDetails) {
          const { error: buildingDetailsError } = await supabase
            .from('building_permit_details')
            .update({
              application_no: buildingData.application_no || '',
              bp_no: buildingData.bp_no || '',
              applicant_id: applicantId,
              construction_id: constructionId,
              inspector_id: inspectorId,
              engineer_id: engineerId,
              owner_signature_date: buildingData.owner_signature_date || null,
            })
            .eq('permit_id', permitId);

          if (buildingDetailsError) throw buildingDetailsError;
        } else {
          const { error: buildingDetailsError } = await supabase
            .from('building_permit_details')
            .insert([
              {
                permit_id: permitId,
                application_no: buildingData.application_no || '',
                bp_no: buildingData.bp_no || '',
                applicant_id: applicantId,
                construction_id: constructionId,
                inspector_id: inspectorId,
                engineer_id: engineerId,
                owner_signature_date: buildingData.owner_signature_date || null,
              },
            ]);

          if (buildingDetailsError) throw buildingDetailsError;
        }
        
        // Insert uploaded image metadata if new file was uploaded
        if (permitData.details?.uploaded_file_metadata) {
          const fileMetadata = permitData.details.uploaded_file_metadata;
          
          // Get the current user ID for uploader_id
          const { data: { user } } = await supabase.auth.getUser();
          
          const { error: imageError } = await supabase
            .from('uploaded_images')
            .insert([
              {
                permit_id: permitId,
                uploader_id: user?.id,
                category: fileMetadata.category || 'proof_of_ownership',
                file_name: fileMetadata.file_name,
                file_ext: fileMetadata.file_ext,
                mime_type: fileMetadata.mime_type,
                size_bytes: fileMetadata.size_bytes,
                storage_bucket: 'permit-documents',
                storage_path: fileMetadata.storage_path,
                public_url: fileMetadata.public_url,
              },
            ]);
          
          if (imageError) {
            console.error('Error inserting uploaded image metadata:', imageError);
          }
        }
      } catch (err) {
        console.error('Error updating building permit data:', err);
        throw err;
      }
    }

    // If this is a business permit, also update or insert into business permit tables
    if (data && permitData.details?.business_permit) {
      const businessData = permitData.details.business_permit;
      
      // Check if business permit details exist
      const { data: existingBusinessDetails, error: checkBusinessError } = await supabase
        .from('business_permit_details')
        .select('taxpayer_id, establishment_id, employment_id, lessor_id')
        .eq('permit_id', permitId)
        .maybeSingle();

      if (existingBusinessDetails && !checkBusinessError) {
        // Update existing records
        const { error: taxpayerError } = await supabase
          .from('business_taxpayers')
          .update({
            lastname: businessData.tax_payer_lastname || '',
            firstname: businessData.tax_payer_firstname || '',
            middlename: businessData.tax_payer_middlename || '',
            tin: businessData.tin || '',
            ctc_no: businessData.ctc_no || '',
            address: businessData.owner_address || '',
            phone: businessData.phone || '',
            email: businessData.email || '',
          })
          .eq('id', existingBusinessDetails.taxpayer_id);

        if (taxpayerError) {
          console.error('Error updating business taxpayer:', taxpayerError);
        }

        const { error: establishmentError } = await supabase
          .from('business_establishments')
          .update({
            business_name: businessData.business_name || '',
            nature_of_business: businessData.nature_of_business || '',
            business_address: businessData.business_address || '',
            business_area: businessData.business_area || '',
            business_activity_code: businessData.business_activity_code || '',
            line_of_business: businessData.line_of_business || '',
            no_of_units: businessData.no_of_units ? parseInt(businessData.no_of_units) : null,
            capitalization: businessData.capitalization ? parseFloat(businessData.capitalization) : null,
            essential_sales: businessData.essential_sales ? parseFloat(businessData.essential_sales) : null,
            non_essential_sales: businessData.non_essential_sales ? parseFloat(businessData.non_essential_sales) : null,
          })
          .eq('id', existingBusinessDetails.establishment_id);

        if (establishmentError) {
          console.error('Error updating business establishment:', establishmentError);
        }

        const { error: employmentError } = await supabase
          .from('business_employment')
          .update({
            total_employees: businessData.total_employees ? parseInt(businessData.total_employees) : null,
            employees_in_lgu: businessData.employees_in_lgu ? parseInt(businessData.employees_in_lgu) : null,
          })
          .eq('id', existingBusinessDetails.employment_id);

        if (employmentError) {
          console.error('Error updating business employment:', employmentError);
        }

        // Update lessor if exists
        if (existingBusinessDetails.lessor_id) {
          const { error: lessorError } = await supabase
            .from('business_lessors')
            .update({
              lessor_name: businessData.lessor_name || '',
              lessor_address: businessData.lessor_address || '',
            })
            .eq('id', existingBusinessDetails.lessor_id);

          if (lessorError) {
            console.error('Error updating business lessor:', lessorError);
          }
        } else if (businessData.lessor_name || businessData.lessor_address) {
          // Insert new lessor
          const { data: lessorData, error: lessorError } = await supabase
            .from('business_lessors')
            .insert([
              {
                permit_id: permitId,
                lessor_name: businessData.lessor_name || '',
                lessor_address: businessData.lessor_address || '',
              },
            ])
            .select()
            .single();

          if (lessorError) {
            console.error('Error inserting business lessor:', lessorError);
          } else if (lessorData) {
            const { error: updateError } = await supabase
              .from('business_permit_details')
              .update({ lessor_id: lessorData.id })
              .eq('permit_id', permitId);

            if (updateError) {
              console.error('Error updating business permit details with lessor:', updateError);
            }
          }
        }

        // Update business permit details
        const { error: businessDetailsError } = await supabase
          .from('business_permit_details')
          .update({
            tax_year: businessData.tax_year ? parseInt(businessData.tax_year) : null,
            control_no: businessData.control_no || '',
            mode_of_payment: businessData.mode_of_payment || '',
            application_type: businessData.application_type || '',
            amendment: businessData.amendment || '',
            org_type: businessData.org_type || '',
          })
          .eq('permit_id', permitId);

        if (businessDetailsError) {
          console.error('Error updating business permit details:', businessDetailsError);
        }
      } else {
        // Insert new records
        const { data: taxpayerData, error: taxpayerError } = await supabase
          .from('business_taxpayers')
          .insert([
            {
              permit_id: permitId,
              lastname: businessData.tax_payer_lastname || '',
              firstname: businessData.tax_payer_firstname || '',
              middlename: businessData.tax_payer_middlename || '',
              tin: businessData.tin || '',
              ctc_no: businessData.ctc_no || '',
              address: businessData.owner_address || '',
              phone: businessData.phone || '',
              email: businessData.email || '',
            },
          ])
          .select()
          .single();

        if (taxpayerError) {
          console.error('Error inserting business taxpayer:', taxpayerError);
        } else {
          const { data: establishmentData, error: establishmentError } = await supabase
            .from('business_establishments')
            .insert([
              {
                permit_id: permitId,
                business_name: businessData.business_name || '',
                nature_of_business: businessData.nature_of_business || '',
                business_address: businessData.business_address || '',
                business_area: businessData.business_area || '',
                business_activity_code: businessData.business_activity_code || '',
                line_of_business: businessData.line_of_business || '',
                no_of_units: businessData.no_of_units ? parseInt(businessData.no_of_units) : null,
                capitalization: businessData.capitalization ? parseFloat(businessData.capitalization) : null,
                essential_sales: businessData.essential_sales ? parseFloat(businessData.essential_sales) : null,
                non_essential_sales: businessData.non_essential_sales ? parseFloat(businessData.non_essential_sales) : null,
              },
            ])
            .select()
            .single();

          if (establishmentError) {
            console.error('Error inserting business establishment:', establishmentError);
          } else {
            const { data: employmentData, error: employmentError } = await supabase
              .from('business_employment')
              .insert([
                {
                  permit_id: permitId,
                  total_employees: businessData.total_employees ? parseInt(businessData.total_employees) : null,
                  employees_in_lgu: businessData.employees_in_lgu ? parseInt(businessData.employees_in_lgu) : null,
                },
              ])
              .select()
              .single();

            if (employmentError) {
              console.error('Error inserting business employment:', employmentError);
            } else {
              let lessorId = null;
              if (businessData.lessor_name || businessData.lessor_address) {
                const { data: lessorData, error: lessorError } = await supabase
                  .from('business_lessors')
                  .insert([
                    {
                      permit_id: permitId,
                      lessor_name: businessData.lessor_name || '',
                      lessor_address: businessData.lessor_address || '',
                    },
                  ])
                  .select()
                  .single();

                if (lessorError) {
                  console.error('Error inserting business lessor:', lessorError);
                } else if (lessorData) {
                  lessorId = lessorData.id;
                }
              }

              const { error: businessDetailsError } = await supabase
                .from('business_permit_details')
                .insert([
                  {
                    permit_id: permitId,
                    tax_year: businessData.tax_year ? parseInt(businessData.tax_year) : null,
                    control_no: businessData.control_no || '',
                    mode_of_payment: businessData.mode_of_payment || '',
                    application_type: businessData.application_type || '',
                    amendment: businessData.amendment || '',
                    org_type: businessData.org_type || '',
                    taxpayer_id: taxpayerData.id,
                    establishment_id: establishmentData.id,
                    employment_id: employmentData.id,
                    lessor_id: lessorId,
                  },
                ]);

              if (businessDetailsError) {
                console.error('Error inserting business permit details:', businessDetailsError);
              }
            }
          }
        }
      }
    }

    return data;
  },

  async updatePermitStatus(
    permitId: string,
    status: string,
    adminComment?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('permits')
      .update({
        status,
        admin_comment: adminComment,
        updated_at: new Date().toISOString(),
      })
      .eq('id', permitId);

    if (error) throw error;

    // If permit is approved, check if payment is completed and send notification
    if (status === 'approved') {
      // Add a small delay to ensure database transaction is committed
      // Then send notification (fire and forget to avoid blocking approval)
      (async () => {
        try {
          // Wait a bit to ensure database transaction is committed
          await new Promise(resolve => setTimeout(resolve, 500));
          await this.checkAndSendPermitReadyNotification(permitId);
        } catch (err) {
          console.error('Failed to send notification after approval:', err);
        }
      })();
    }

    // If permit is rejected, send rejection notification
    if (status === 'rejected') {
      // Add a small delay to ensure database transaction is committed
      // Then send notification (fire and forget to avoid blocking rejection)
      (async () => {
        try {
          // Wait a bit to ensure database transaction is committed
          await new Promise(resolve => setTimeout(resolve, 500));
          await this.sendRejectionNotification(permitId, adminComment);
        } catch (err) {
          console.error('Failed to send notification after rejection:', err);
        }
      })();
    }
  },

  /**
   * Check if permit is approved AND payment is completed, then send notification with GCash QR code
   */
  async checkAndSendPermitReadyNotification(permitId: string): Promise<void> {
    console.log(`[Notification] Starting notification check for permit ${permitId}`);
    try {
      // Get permit details - retry up to 3 times if status check fails (handles race condition)
      let permit = null;
      let retries = 3;
      
      while (retries > 0) {
        try {
          permit = await this.getPermitById(permitId);
          console.log(`[Notification] Permit fetched, status: ${permit?.status}, applicant_id: ${permit?.applicant_id}`);
          
          // If permit is found and status is approved, break
          if (permit && permit.status === 'approved') {
            console.log(`[Notification] Permit status confirmed as approved`);
            break;
          }
          
          // If permit not found, throw error
          if (!permit) {
            throw new Error(`Permit ${permitId} not found`);
          }
          
          // If status is not approved yet, wait a bit and retry (handles race condition)
          retries--;
          if (retries > 0) {
            console.log(`[Notification] Status not approved yet, retrying... (${retries} retries left)`);
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (fetchError) {
          console.error(`[Notification] Error fetching permit on retry:`, fetchError);
          retries--;
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 300));
          } else {
            throw fetchError;
          }
        }
      }
      
      // Final check - if still not found after retries, log and return
      if (!permit) {
        console.error(`[Notification] Failed to fetch permit ${permitId} after all retries`);
        return;
      }

      // Check if status is approved (even if retries didn't confirm it, we know it was just approved)
      if (permit.status !== 'approved') {
        console.warn(`[Notification] Permit ${permitId} status is ${permit.status}, but proceeding with notification anyway since it was just approved`);
      }

      // Check if there are any payments and if at least one is completed
      const payments = permit.payments || [];
      console.log(`[Notification] Found ${payments.length} payment(s) for permit ${permitId}`);
      const hasCompletedPayment = payments.some(
        (payment: any) => payment.payment_status === 'completed'
      );
      console.log(`[Notification] Has completed payment: ${hasCompletedPayment}`);

      // Get Gcash QR code URL (you can configure this path)
      const gcashQrCodeUrl = '/images/gcash-qr-code.png'; // Update this path to your actual QR code image
      const permitTypeTitle = permit.permit_type?.title || 'Permit';

      // Send notification based on payment status
      // Always send notification when permit is approved, regardless of payment status
      if (!permit.applicant_id) {
        console.error(`[Notification] Permit ${permitId} has no applicant_id, cannot send notification`);
        return;
      }

      console.log(`[Notification] Preparing to send notification to user ${permit.applicant_id}`);

      if (hasCompletedPayment) {
        // Payment is completed - permit is ready
        try {
          const notification = await notificationService.sendNotification(
            permit.applicant_id,
            permitId,
            'Permit Ready',
            `Your ${permitTypeTitle} application has been approved and payment is completed. Your permit is ready to receive. Please use the GCash QR code below for reference.`,
            'permit_ready',
            gcashQrCodeUrl
          );
          console.log(`[Notification] ✅ Successfully sent: Permit Ready for permit ${permitId} to user ${permit.applicant_id}`, notification);
        } catch (notifError) {
          console.error(`[Notification] ❌ Failed to send Permit Ready notification:`, notifError);
          throw notifError;
        }
      } else {
        // Payment not completed - payment required
        try {
          const notification = await notificationService.sendNotification(
            permit.applicant_id,
            permitId,
            'Application Approved',
            `Your ${permitTypeTitle} application has been approved. Please complete your payment using the GCash QR code below to proceed with your permit.`,
            'payment_required',
            gcashQrCodeUrl
          );
          console.log(`[Notification] ✅ Successfully sent: Payment Required for permit ${permitId} to user ${permit.applicant_id}`, notification);
        } catch (notifError) {
          console.error(`[Notification] ❌ Failed to send Payment Required notification:`, notifError);
          throw notifError;
        }
      }
    } catch (error) {
      // Log error but don't throw - notification failure shouldn't break the approval process
      console.error('[Notification] ❌ Error sending permit ready notification:', error);
      console.error('[Notification] Error details:', {
        permitId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Also log if it's a Supabase error with more details
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('[Notification] Supabase error code:', (error as any).code);
        console.error('[Notification] Supabase error details:', (error as any).details);
        console.error('[Notification] Supabase error hint:', (error as any).hint);
      }
    }
  },

  /**
   * Send a rejection notification to the applicant
   */
  async sendRejectionNotification(permitId: string, adminComment?: string): Promise<void> {
    console.log(`[Notification] Starting rejection notification for permit ${permitId}`);
    try {
      // Get permit details
      const permit = await this.getPermitById(permitId);
      
      if (!permit) {
        console.error(`[Notification] Permit ${permitId} not found`);
        return;
      }

      if (!permit.applicant_id) {
        console.error(`[Notification] Permit ${permitId} has no applicant_id, cannot send notification`);
        return;
      }

      const permitTypeTitle = permit.permit_type?.title || 'Permit';
      
      // Construct rejection message
      let message = `Your ${permitTypeTitle} application has been rejected.`;
      if (adminComment) {
        message += ` Reason: ${adminComment}`;
      }
      message += ' Please review your application and resubmit if necessary.';

      console.log(`[Notification] Preparing to send rejection notification to user ${permit.applicant_id}`);

      // Send rejection notification
      const notification = await notificationService.sendNotification(
        permit.applicant_id,
        permitId,
        'Application Rejected',
        message,
        'application_rejected',
        null
      );
      
      console.log(`[Notification] ✅ Successfully sent rejection notification for permit ${permitId} to user ${permit.applicant_id}`, notification);
    } catch (error) {
      // Log error but don't throw - notification failure shouldn't break the rejection process
      console.error('[Notification] ❌ Error sending rejection notification:', error);
      console.error('[Notification] Error details:', {
        permitId,
        adminComment,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      
      // Also log if it's a Supabase error with more details
      if (error && typeof error === 'object' && 'code' in error) {
        console.error('[Notification] Supabase error code:', (error as any).code);
        console.error('[Notification] Supabase error details:', (error as any).details);
        console.error('[Notification] Supabase error hint:', (error as any).hint);
      }
    }
  },

  /**
   * Update payment status and check if notification should be sent
   * This can be called when payment status is updated to 'completed'
   */
  async updatePaymentStatus(
    paymentId: string,
    status: 'pending' | 'completed' | 'failed',
    paymentReference?: string
  ): Promise<void> {
    const updateData: any = {
      payment_status: status,
    };

    if (paymentReference) {
      updateData.payment_reference = paymentReference;
    }

    const { error: updateError } = await supabase
      .from('payments')
      .update(updateData)
      .eq('id', paymentId);

    if (updateError) throw updateError;

    // If payment is completed, get the permit and check if it's approved
    if (status === 'completed') {
      const { data: payment } = await supabase
        .from('payments')
        .select('permit_id')
        .eq('id', paymentId)
        .single();

      if (payment) {
        await this.checkAndSendPermitReadyNotification(payment.permit_id);
      }
    }
  },

  async deletePermit(permitId: string): Promise<void> {
    try {
      // Delete business permit related records first (in correct order due to foreign keys)
      const { data: businessDetails } = await supabase
        .from('business_permit_details')
        .select('taxpayer_id, establishment_id, employment_id, lessor_id')
        .eq('permit_id', permitId)
        .maybeSingle();

      if (businessDetails) {
        // Delete business_permit_details first (it references other tables)
        await supabase
          .from('business_permit_details')
          .delete()
          .eq('permit_id', permitId);

        // Delete the referenced records
        if (businessDetails.taxpayer_id) {
          await supabase
            .from('business_taxpayers')
            .delete()
            .eq('id', businessDetails.taxpayer_id);
        }
        if (businessDetails.establishment_id) {
          await supabase
            .from('business_establishments')
            .delete()
            .eq('id', businessDetails.establishment_id);
        }
        if (businessDetails.employment_id) {
          await supabase
            .from('business_employment')
            .delete()
            .eq('id', businessDetails.employment_id);
        }
        if (businessDetails.lessor_id) {
          await supabase
            .from('business_lessors')
            .delete()
            .eq('id', businessDetails.lessor_id);
        }
      }

      // Delete building permit related records
      const { data: buildingDetails } = await supabase
        .from('building_permit_details')
        .select('applicant_id, construction_id, inspector_id, engineer_id')
        .eq('permit_id', permitId)
        .maybeSingle();

      if (buildingDetails) {
        // Delete building_permit_details first
        await supabase
          .from('building_permit_details')
          .delete()
          .eq('permit_id', permitId);

        // Delete the referenced records
        if (buildingDetails.applicant_id) {
          await supabase
            .from('building_permit_applicants')
            .delete()
            .eq('id', buildingDetails.applicant_id);
        }
        if (buildingDetails.construction_id) {
          await supabase
            .from('building_construction_details')
            .delete()
            .eq('id', buildingDetails.construction_id);
        }
        if (buildingDetails.inspector_id) {
          await supabase
            .from('building_inspectors')
            .delete()
            .eq('id', buildingDetails.inspector_id);
        }
        if (buildingDetails.engineer_id) {
          await supabase
            .from('building_engineers')
            .delete()
            .eq('id', buildingDetails.engineer_id);
        }
      }

      // Delete motorela permit related records
      await supabase
        .from('motorela_permits')
        .delete()
        .eq('permit_id', permitId);

      // Delete other related records
      await supabase
        .from('permit_documents')
        .delete()
        .eq('permit_id', permitId);

      await supabase
        .from('payments')
        .delete()
        .eq('permit_id', permitId);

      await supabase
        .from('permit_audit')
        .delete()
        .eq('permit_id', permitId);

      // Finally, delete the permit itself
      const { error } = await supabase
        .from('permits')
        .delete()
        .eq('id', permitId);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting permit:', error);
      throw error;
    }
  },

  async uploadDocument(permitId: string, file: File): Promise<PermitDocument> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${permitId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('permit-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('permit-documents')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('permit_documents')
      .insert([
        {
          permit_id: permitId,
          file_path: publicUrl,
          file_name: file.name,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getPermitDocuments(permitId: string): Promise<PermitDocument[]> {
    const { data, error } = await supabase
      .from('permit_documents')
      .select('*')
      .eq('permit_id', permitId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async rejectDocument(documentId: number, rejectionReason: string, rejectedBy: string): Promise<void> {
    const { error } = await supabase
      .from('permit_documents')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason,
        rejected_at: new Date().toISOString(),
        rejected_by: rejectedBy,
      })
      .eq('id', documentId);

    if (error) throw error;
  },

  async approveDocument(documentId: number): Promise<void> {
    const { error } = await supabase
      .from('permit_documents')
      .update({
        status: 'approved',
        rejection_reason: null,
        rejected_at: null,
        rejected_by: null,
      })
      .eq('id', documentId);

    if (error) throw error;
  },

  async getDashboardStats(): Promise<DashboardStats> {
    const [usersResult, permitsResult, paymentsResult] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('permits').select('*'),
      supabase.from('payments').select('*', { count: 'exact', head: true }),
    ]);

    const permits = permitsResult.data || [];

    return {
      totalUsers: usersResult.count || 0,
      totalPermits: permits.length,
      totalPayments: paymentsResult.count || 0,
      pendingPermits: permits.filter(p => p.status === 'pending').length,
      approvedPermits: permits.filter(p => p.status === 'approved').length,
      rejectedPermits: permits.filter(p => p.status === 'rejected').length,
    };
  },
};
