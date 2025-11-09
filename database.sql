-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.building_construction_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL,
  location text,
  scope_of_work text,
  occupancy_use text,
  lot_area numeric,
  floor_area numeric,
  cost_of_construction numeric,
  date_of_construction date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT building_construction_details_pkey PRIMARY KEY (id),
  CONSTRAINT building_construction_details_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id)
);
CREATE TABLE public.building_engineers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL,
  ctc_no text,
  ctc_date date,
  ctc_place text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT building_engineers_pkey PRIMARY KEY (id),
  CONSTRAINT building_engineers_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id)
);
CREATE TABLE public.building_inspectors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL,
  name text,
  address text,
  prc_no text,
  ptr_no text,
  issued_at text,
  validity date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT building_inspectors_pkey PRIMARY KEY (id),
  CONSTRAINT building_inspectors_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id)
);
CREATE TABLE public.building_permit_applicants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL,
  lastname text,
  firstname text,
  middle_initial text,
  tin text,
  ownership_form text,
  address text,
  ctc_no text,
  ctc_date date,
  ctc_place text,
  signature_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT building_permit_applicants_pkey PRIMARY KEY (id),
  CONSTRAINT building_permit_applicants_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id)
);
CREATE TABLE public.building_permit_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL UNIQUE,
  application_no text,
  bp_no text,
  applicant_id uuid,
  construction_id uuid,
  inspector_id uuid,
  engineer_id uuid,
  owner_signature_date date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT building_permit_details_pkey PRIMARY KEY (id),
  CONSTRAINT building_permit_details_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id),
  CONSTRAINT building_permit_details_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.building_permit_applicants(id),
  CONSTRAINT building_permit_details_construction_id_fkey FOREIGN KEY (construction_id) REFERENCES public.building_construction_details(id),
  CONSTRAINT building_permit_details_inspector_id_fkey FOREIGN KEY (inspector_id) REFERENCES public.building_inspectors(id),
  CONSTRAINT building_permit_details_engineer_id_fkey FOREIGN KEY (engineer_id) REFERENCES public.building_engineers(id)
);
CREATE TABLE public.business_employment (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL,
  total_employees integer,
  employees_in_lgu integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_employment_pkey PRIMARY KEY (id),
  CONSTRAINT business_employment_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id)
);
CREATE TABLE public.business_establishments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL,
  business_name text,
  nature_of_business text,
  business_address text,
  business_area text,
  business_activity_code text,
  line_of_business text,
  no_of_units integer,
  capitalization numeric,
  essential_sales numeric,
  non_essential_sales numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_establishments_pkey PRIMARY KEY (id),
  CONSTRAINT business_establishments_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id)
);
CREATE TABLE public.business_lessors (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL,
  lessor_name text,
  lessor_address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_lessors_pkey PRIMARY KEY (id),
  CONSTRAINT business_lessors_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id)
);
CREATE TABLE public.business_permit_details (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL UNIQUE,
  tax_year integer,
  control_no text,
  mode_of_payment text,
  application_type text,
  amendment text,
  org_type text,
  taxpayer_id uuid,
  establishment_id uuid,
  employment_id uuid,
  lessor_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_permit_details_pkey PRIMARY KEY (id),
  CONSTRAINT business_permit_details_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id),
  CONSTRAINT business_permit_details_taxpayer_id_fkey FOREIGN KEY (taxpayer_id) REFERENCES public.business_taxpayers(id),
  CONSTRAINT business_permit_details_establishment_id_fkey FOREIGN KEY (establishment_id) REFERENCES public.business_establishments(id),
  CONSTRAINT business_permit_details_employment_id_fkey FOREIGN KEY (employment_id) REFERENCES public.business_employment(id),
  CONSTRAINT business_permit_details_lessor_id_fkey FOREIGN KEY (lessor_id) REFERENCES public.business_lessors(id)
);
CREATE TABLE public.business_taxpayers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL,
  lastname text,
  firstname text,
  middlename text,
  tin text,
  ctc_no text,
  address text,
  phone text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT business_taxpayers_pkey PRIMARY KEY (id),
  CONSTRAINT business_taxpayers_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id)
);
CREATE TABLE public.motorela_permits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL UNIQUE,
  application_no text NOT NULL,
  date date NOT NULL,
  body_no text NOT NULL,
  chassis_no text NOT NULL,
  make text NOT NULL,
  motor_no text NOT NULL,
  route text NOT NULL,
  plate_no text NOT NULL,
  operator text NOT NULL,
  operator_address text NOT NULL,
  contact text NOT NULL,
  driver text NOT NULL,
  driver_address text NOT NULL,
  cedula_no text,
  place_issued text,
  date_issued date,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT motorela_permits_pkey PRIMARY KEY (id),
  CONSTRAINT motorela_permits_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id)
);
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid NOT NULL,
  amount numeric NOT NULL,
  payment_method text,
  payment_status text DEFAULT 'pending'::text,
  payment_reference text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id),
  CONSTRAINT payments_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id)
);
CREATE TABLE public.permit_audit (
  id integer NOT NULL DEFAULT nextval('permit_audit_id_seq'::regclass),
  permit_id uuid NOT NULL,
  action text NOT NULL,
  actor_id uuid,
  note text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permit_audit_pkey PRIMARY KEY (id),
  CONSTRAINT permit_audit_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id),
  CONSTRAINT permit_audit_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles(id)
);
CREATE TABLE public.permit_documents (
  id integer NOT NULL DEFAULT nextval('permit_documents_id_seq'::regclass),
  permit_id uuid,
  file_path text NOT NULL,
  file_name text,
  uploaded_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permit_documents_pkey PRIMARY KEY (id),
  CONSTRAINT permit_documents_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id)
);
CREATE TABLE public.permit_requirements (
  id integer NOT NULL DEFAULT nextval('permit_requirements_id_seq'::regclass),
  permit_type_id integer,
  requirement_text text NOT NULL,
  CONSTRAINT permit_requirements_pkey PRIMARY KEY (id),
  CONSTRAINT permit_requirements_permit_type_id_fkey FOREIGN KEY (permit_type_id) REFERENCES public.permit_types(id)
);
CREATE TABLE public.permit_types (
  id integer NOT NULL DEFAULT nextval('permit_types_id_seq'::regclass),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permit_types_pkey PRIMARY KEY (id)
);
CREATE TABLE public.permits (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  applicant_id uuid NOT NULL,
  permit_type_id integer NOT NULL,
  address text,
  details jsonb,
  status text NOT NULL DEFAULT 'pending'::text,
  admin_comment text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permits_pkey PRIMARY KEY (id),
  CONSTRAINT permits_applicant_id_fkey FOREIGN KEY (applicant_id) REFERENCES public.profiles(id),
  CONSTRAINT permits_permit_type_id_fkey FOREIGN KEY (permit_type_id) REFERENCES public.permit_types(id)
);
CREATE TABLE public.profiles (
  id uuid NOT NULL,
  role text NOT NULL DEFAULT 'citizen'::text CHECK (role = ANY (ARRAY['admin'::text, 'citizen'::text, 'client'::text, 'staff'::text])),
  created_at timestamp with time zone DEFAULT now(),
  username text,
  firstname text,
  middlename text,
  lastname text,
  gender text CHECK ((gender = ANY (ARRAY['male'::text, 'female'::text, 'other'::text])) OR gender IS NULL),
  birthdate date,
  contactnumber text,
  fulladdress text,
  email text,
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.uploaded_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  permit_id uuid,
  uploader_id uuid,
  category text,
  file_name text,
  file_ext text,
  mime_type text,
  size_bytes bigint,
  storage_bucket text NOT NULL DEFAULT 'permit-documents'::text,
  storage_path text NOT NULL,
  public_url text,
  checksum text,
  uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT uploaded_images_pkey PRIMARY KEY (id),
  CONSTRAINT uploaded_images_permit_id_fkey FOREIGN KEY (permit_id) REFERENCES public.permits(id),
  CONSTRAINT uploaded_images_uploader_id_fkey FOREIGN KEY (uploader_id) REFERENCES public.profiles(id)
);