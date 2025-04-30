
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
