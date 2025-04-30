
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Check your .env file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
}
