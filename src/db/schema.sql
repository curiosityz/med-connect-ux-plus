
-- Create providers table
CREATE TABLE providers (
  id TEXT PRIMARY KEY,
  npi TEXT NOT NULL,
  name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  title TEXT,
  specialties TEXT[] DEFAULT '{}',
  location TEXT,
  city TEXT,
  state TEXT,
  rating NUMERIC(3, 1),
  review_count INTEGER DEFAULT 0,
  availability TEXT,
  image_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create medications table
CREATE TABLE medications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  category TEXT,
  description TEXT,
  provider_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create junction table for many-to-many relationship between providers and medications
CREATE TABLE provider_medications (
  provider_id TEXT REFERENCES providers(id) ON DELETE CASCADE,
  medication_id TEXT REFERENCES medications(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (provider_id, medication_id)
);

-- Add indexes for better query performance
CREATE INDEX idx_providers_name ON providers USING gin (name gin_trgm_ops);
CREATE INDEX idx_providers_specialties ON providers USING gin (specialties);
CREATE INDEX idx_medications_name ON medications USING gin (name gin_trgm_ops);
CREATE INDEX idx_medications_generic_name ON medications USING gin (generic_name gin_trgm_ops);

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create RLS policies
-- Enable Row Level Security
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_medications ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read access on providers" 
  ON providers FOR SELECT USING (true);

CREATE POLICY "Allow public read access on medications" 
  ON medications FOR SELECT USING (true);

CREATE POLICY "Allow public read access on provider_medications" 
  ON provider_medications FOR SELECT USING (true);

-- Only allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert on providers" 
  ON providers FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on providers" 
  ON providers FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on providers" 
  ON providers FOR DELETE USING (auth.role() = 'authenticated');

-- Similar policies for medications and junction table
CREATE POLICY "Allow authenticated insert on medications" 
  ON medications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on medications" 
  ON medications FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on medications" 
  ON medications FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on provider_medications" 
  ON provider_medications FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on provider_medications" 
  ON provider_medications FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on provider_medications" 
  ON provider_medications FOR DELETE USING (auth.role() = 'authenticated');

-- Create npi_providers table
CREATE TABLE npi_providers (
  id SERIAL PRIMARY KEY,
  npi TEXT NOT NULL,
  entity_type_code TEXT,
  provider_organization_name TEXT,
  provider_last_name TEXT,
  provider_first_name TEXT,
  provider_middle_name TEXT,
  provider_credential_text TEXT,
  provider_business_practice_location_address_city_name TEXT,
  provider_business_practice_location_address_state_name TEXT,
  provider_business_practice_location_address_postal_code TEXT,
  provider_business_practice_location_address_telephone_number TEXT,
  provider_sex_code TEXT,
  healthcare_provider_taxonomy_code_1 TEXT,
  provider_license_number_1 TEXT,
  provider_license_number_state_code_1 TEXT,
  provider_id TEXT REFERENCES providers(id) ON DELETE CASCADE
);

-- Create table for NPI detailed information
CREATE TABLE npi_details (
  id SERIAL PRIMARY KEY,
  npi TEXT UNIQUE NOT NULL,
  provider_first_name TEXT,
  provider_last_name_legal_name TEXT,
  last_update_date DATE,
  npi_deactivation_date DATE,
  npi_deactivation_reason_code TEXT,
  npi_deactivation_reason_code_name TEXT,
  npi_reactivation_date DATE,
  provider_credential_text TEXT,
  provider_enumeration_date DATE,
  healthcare_provider_taxonomy_1_classification TEXT,
  healthcare_provider_taxonomy_1_definition TEXT,
  healthcare_provider_taxonomy_1_grouping TEXT,
  healthcare_provider_taxonomy_1_notes TEXT,
  healthcare_provider_taxonomy_1_specialization TEXT
);

-- Create table for NPI address information
CREATE TABLE npi_addresses (
  id SERIAL PRIMARY KEY,
  npi TEXT NOT NULL REFERENCES npi_details(npi) ON DELETE CASCADE,
  provider_first_line_business_mailing_address TEXT,
  provider_second_line_business_mailing_address TEXT,
  provider_business_mailing_address_city_name TEXT,
  provider_business_mailing_address_postal_code TEXT,
  provider_business_mailing_address_state_name TEXT,
  provider_business_mailing_address_telephone_number TEXT,
  provider_first_line_business_practice_location_address TEXT,
  provider_second_line_business_practice_location_address TEXT,
  provider_business_practice_location_address_postal_code TEXT,
  provider_business_practice_location_address_city_name TEXT,
  provider_business_practice_location_address_state_name TEXT,
  provider_business_practice_location_address_telephone_number TEXT,
  authorized_official_last_name TEXT,
  authorized_official_telephone_number TEXT
);

-- Create table for prescription data by state
CREATE TABLE npi_prescriptions (
  id SERIAL PRIMARY KEY,
  npi TEXT NOT NULL,
  drug_name TEXT NOT NULL,
  generic_name TEXT,
  total_claim_count INTEGER,
  state TEXT,
  CONSTRAINT unique_npi_drug_state UNIQUE (npi, drug_name, state)
);

-- Create indexes for the new tables
CREATE INDEX idx_npi_details_npi ON npi_details(npi);
CREATE INDEX idx_npi_addresses_npi ON npi_addresses(npi);
CREATE INDEX idx_npi_prescriptions_npi ON npi_prescriptions(npi);
CREATE INDEX idx_npi_prescriptions_drug ON npi_prescriptions(drug_name);
CREATE INDEX idx_npi_prescriptions_generic ON npi_prescriptions(generic_name);
CREATE INDEX idx_npi_prescriptions_state ON npi_prescriptions(state);

-- Create RLS policies for new tables
ALTER TABLE npi_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE npi_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE npi_prescriptions ENABLE ROW LEVEL SECURITY;

-- Allow public read access on new tables
CREATE POLICY "Allow public read access on npi_details" 
  ON npi_details FOR SELECT USING (true);

CREATE POLICY "Allow public read access on npi_addresses" 
  ON npi_addresses FOR SELECT USING (true);

CREATE POLICY "Allow public read access on npi_prescriptions" 
  ON npi_prescriptions FOR SELECT USING (true);

-- Only allow authenticated users to insert/update/delete on new tables
CREATE POLICY "Allow authenticated insert on npi_details" 
  ON npi_details FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on npi_details" 
  ON npi_details FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on npi_details" 
  ON npi_details FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on npi_addresses" 
  ON npi_addresses FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on npi_addresses" 
  ON npi_addresses FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on npi_addresses" 
  ON npi_addresses FOR DELETE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated insert on npi_prescriptions" 
  ON npi_prescriptions FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated update on npi_prescriptions" 
  ON npi_prescriptions FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated delete on npi_prescriptions" 
  ON npi_prescriptions FOR DELETE USING (auth.role() = 'authenticated');
