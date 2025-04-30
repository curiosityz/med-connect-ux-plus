
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
