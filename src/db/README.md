
# MedConnect Database Setup

This document outlines the database structure for the MedConnect application and how to set it up in Supabase.

## Database Schema

The database consists of three main tables:

1. `providers` - Healthcare providers information
2. `medications` - Medication information
3. `provider_medications` - Junction table for the many-to-many relationship between providers and medications

## Setting up in Supabase

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of the `schema.sql` file and run it

## NPI Database Integration

For integrating the large NPI database (12GB), you'll need to:

1. Parse and filter the CSV data to extract only the columns you need
2. Upload the data in batches to avoid timeout issues
3. Create appropriate indexes for efficient queries

### Recommended Fields from NPI Dataset

From the extensive fields list, here are the most relevant ones to include:

- NPI (Primary identifier)
- Entity Type Code
- Provider Organization Name
- Provider Last Name
- Provider First Name
- Provider Middle Name
- Provider Credential Text
- Provider Business Practice Location Address fields
- Provider Business Practice Location Address City Name
- Provider Business Practice Location Address State Name
- Provider Business Practice Location Address Postal Code
- Provider Business Practice Location Address Telephone Number
- Provider Sex Code
- Healthcare Provider Taxonomy Code fields (for specialties)
- Provider License Number fields

### Simplified Schema for Large Dataset

For handling the large NPI database efficiently, consider creating a separate `npi_providers` table with only the most essential fields, and then link it to your main `providers` table.

## Data Import Strategy

For importing the 12GB dataset:
1. Process the CSV file to extract only needed columns
2. Split into smaller batches
3. Use the Supabase Storage to temporarily store processed CSV files
4. Create an Edge Function to handle batch imports
5. Consider setting up a scheduled job for regular updates

## Important Considerations

- Set appropriate RLS (Row Level Security) policies
- Create efficient indexes for search fields
- Consider using Supabase Functions for complex data processing
- For the physicians.csv data, create a separate table and link it to the NPI data via the Prscrbr_NPI field
