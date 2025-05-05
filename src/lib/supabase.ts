
import { createClient } from '@supabase/supabase-js';

// Get environment variables or use fallback values for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wqyxytnggxzodbpalytf.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxeXh5dG5nZ3h6b2RicGFseXRmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYwMjExNjIsImV4cCI6MjA2MTU5NzE2Mn0.Mgyp2C0xAN31luazkIpUd27u2uo8MzlPWn2HyEMsSmQ';

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Check if we have valid credentials and log a warning if not
if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('Missing Supabase environment variables. Using fallback values for development only.');
  console.warn('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment.');
}

// Database types based on your schemas
export type Provider = {
  id: string;
  npi: string;
  name: string;
  first_name?: string;
  last_name?: string;
  title: string;
  specialties: string[];
  city?: string;
  state?: string;
  location: string;
  rating: number;
  review_count: number;
  availability: string;
  image_url?: string;
  bio?: string;
  created_at?: string;
  npi_provider_detail?: NpiProviderDetail; // Reference to NpiProviderDetail
}

export type Medication = {
  id: string;
  name: string;
  generic_name: string;
  category: string;
  description: string;
  provider_count: number;
  created_at?: string;
}

export type ProviderMedication = {
  provider_id: string;
  medication_id: string;
  created_at?: string;
}

// Arkansas provider data type
export type ArkansasProvider = {
  id?: number;
  prscrbr_npi: string;
  prscrbr_last_org_name: string;
  prscrbr_first_name: string;
  prscrbr_city: string;
  prscrbr_state_abrvtn: string;
  prscrbr_state_fips: string;
  prscrbr_type: string;
  prscrbr_type_src: string;
  brnd_name: string;
  gnrc_name: string;
  tot_clms: number;
  tot_30day_fills: number;
  tot_day_suply: number;
  tot_drug_cst: number;
  tot_benes: number;
  ge65_sprsn_flag: string | null;
  ge65_tot_clms: number | null;
  ge65_tot_30day_fills: number | null;
  ge65_tot_drug_cst: number | null;
  ge65_tot_day_suply: number | null;
  ge65_bene_sprsn_flag: string | null;
  ge65_tot_benes: number | null;
}

// NPI provider details type
export type NpiProviderDetail = {
  id?: number;
  npi: string;
  entity_type_code: string;
  provider_organization_name?: string;
  provider_last_name?: string;
  provider_first_name?: string;
  provider_middle_name?: string;
  provider_credential_text?: string;
  provider_business_practice_location_address_city_name?: string;
  provider_business_practice_location_address_state_name?: string;
  provider_business_practice_location_address_postal_code?: string;
  provider_business_practice_location_address_telephone_number?: string;
  provider_sex_code?: string;
  healthcare_provider_taxonomy_code_1?: string;
  provider_license_number_1?: string;
  provider_license_number_state_code_1?: string;
  provider_id?: string; // Foreign key reference to Provider
}

// New NPI Details type
export type NpiDetail = {
  id?: number;
  npi: string;
  provider_first_name?: string;
  provider_last_name_legal_name?: string;
  last_update_date?: string;
  npi_deactivation_date?: string;
  npi_deactivation_reason_code?: string;
  npi_deactivation_reason_code_name?: string;
  npi_reactivation_date?: string;
  provider_credential_text?: string;
  provider_enumeration_date?: string;
  healthcare_provider_taxonomy_1_classification?: string;
  healthcare_provider_taxonomy_1_definition?: string;
  healthcare_provider_taxonomy_1_grouping?: string;
  healthcare_provider_taxonomy_1_notes?: string;
  healthcare_provider_taxonomy_1_specialization?: string;
}

// NPI Address type
export type NpiAddress = {
  id?: number;
  npi: string;
  provider_first_line_business_mailing_address?: string;
  provider_second_line_business_mailing_address?: string;
  provider_business_mailing_address_city_name?: string;
  provider_business_mailing_address_postal_code?: string;
  provider_business_mailing_address_state_name?: string;
  provider_business_mailing_address_telephone_number?: string;
  provider_first_line_business_practice_location_address?: string;
  provider_second_line_business_practice_location_address?: string;
  provider_business_practice_location_address_postal_code?: string;
  provider_business_practice_location_address_city_name?: string;
  provider_business_practice_location_address_state_name?: string;
  provider_business_practice_location_address_telephone_number?: string;
  authorized_official_last_name?: string;
  authorized_official_telephone_number?: string;
}

// NPI Prescription type
export type NpiPrescription = {
  id?: number;
  npi: string;
  drug_name: string;
  generic_name?: string;
  total_claim_count: number;
  state?: string;
}
