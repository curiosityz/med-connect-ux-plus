
# MedConnect Database Setup

This document outlines the database structure for the MedConnect application and how to set it up in Supabase.

## Database Schema

The database consists of several key tables:

### Original Tables
1. `providers` - Healthcare providers information
2. `medications` - Medication information
3. `provider_medications` - Junction table for the many-to-many relationship between providers and medications
4. `npi_providers` - Basic NPI provider details

### New Tables
5. `npi_details` - Comprehensive NPI provider details including taxonomy, specialization
6. `npi_addresses` - Provider address and contact information
7. `npi_prescriptions` - Medication prescription data by provider and state

## Setting up in Supabase

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of the `schema.sql` file and run it

## Data Import Strategy

For the three main data sets:

### 1. NPI Provider Details
This file contains provider name, healthcare taxonomy, specialization, enumeration, etc. with fields:
- npi_optimized.npi
- provider_first_name
- last_update_date
- npi_deactivation_date
- npi_deactivation_reason_code
- npi_deactivation_reason_code_name
- npi_reactivation_date
- provider_credential_text
- provider_enumeration_date
- provider_first_name
- provider_last_name_legal_name
- healthcare_provider_taxonomy_1_classification
- healthcare_provider_taxonomy_1_definition
- healthcare_provider_taxonomy_1_grouping
- healthcare_provider_taxonomy_1_notes
- healthcare_provider_taxonomy_1_specialization

### 2. NPI Provider Addresses
This file contains prescriber addresses and phone numbers with fields:
- npi_optimized.npi
- provider_first_line_business_mailing_address
- provider_second_line_business_mailing_address
- provider_business_mailing_address_city_name
- provider_business_mailing_address_postal_code
- provider_business_mailing_address_state_name
- provider_business_mailing_address_telephone_number
- provider_first_line_business_practice_location_address
- provider_second_line_business_practice_location_address
- provider_business_practice_location_address_postal_code
- provider_business_practice_location_address_city_name
- provider_business_practice_location_address_state_name
- provider_business_practice_location_address_telephone_number
- authorized_official_last_name
- authorized_official_telephone_number

### 3. State Prescription Data
State-specific files containing drug prescriptions by NPI with fields:
- npi
- drug_name
- generic_name
- total_claim_count

## Importing Large Datasets

For importing large datasets (like the 12GB NPI dataset), consider these strategies:

1. **Batch Processing**: Split the data into smaller chunks and import them incrementally
2. **ETL Pipeline**:
   - Extract data from source files
   - Transform to match the database schema
   - Load into Supabase tables

3. **Using Supabase Storage**:
   - Upload CSV files to Supabase Storage
   - Process using Edge Functions
   - Import into database tables

4. **Direct Import**:
   - For smaller files, use the Supabase UI to import CSV data
   - For larger files, use psql command line tool with \COPY command

## Recommended Indexing Strategy

The schema includes optimized indexes for:
- All NPI fields (for quick provider lookups)
- Drug names and generic names (for medication searches)
- State fields (for geographic filtering)

## RLS Policies

Row Level Security (RLS) policies are set up to:
- Allow public read access to all tables
- Restrict write operations to authenticated users

## Data Joining Strategy

The data model is designed for efficient queries that join:
1. Provider details with their specializations
2. Provider addresses and contact information
3. Prescription data showing which medications each provider prescribes
