
'use server';

import { Client, type QueryResultRow } from 'pg';

// Ensure these environment variables are set in your .env or .env.local file
const dbConfig = {
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  database: process.env.PG_DATABASE,
  password: process.env.NEXT_DB_PASSWORD,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
  ssl: process.env.PG_SSLMODE === 'require'
    ? { rejectUnauthorized: false } // For production, prefer providing CA certs
    : undefined,
};

export interface PrescriberRecord extends QueryResultRow {
  prescriber_name: string;
  prescriber_address: string;
  prescriber_zipcode: string;
  medication_name_match: string;
}

interface FindPrescribersParams {
  medicationName: string;
  zipcode: string;
  searchAreaType: 'exact' | 'prefix3';
}

export async function findPrescribersInDB({ medicationName, zipcode, searchAreaType }: FindPrescribersParams): Promise<PrescriberRecord[]> {
  if (!medicationName || !zipcode) {
    return [];
  }
  if (searchAreaType === 'prefix3' && zipcode.length < 3) {
    // Should be caught by UI validation, but good to have a safeguard
    throw new Error("Zipcode must be at least 3 digits for prefix search.");
  }

  const client = new Client(dbConfig);
  try {
    await client.connect();
    
    let zipcodeCondition = 'na.provider_business_practice_location_address_postal_code = $2';
    let zipcodeQueryParam = zipcode;

    if (searchAreaType === 'prefix3') {
      zipcodeCondition = 'na.provider_business_practice_location_address_postal_code LIKE $2';
      zipcodeQueryParam = zipcode.substring(0, 3) + '%';
    }

    const query = `
      SELECT 
        TRIM(CONCAT(nd.provider_first_name, ' ', nd.provider_last_name_legal_name)) AS prescriber_name,
        TRIM(CONCAT(
            na.provider_first_line_business_practice_location_address,
            CASE 
                WHEN na.provider_second_line_business_practice_location_address IS NOT NULL AND na.provider_second_line_business_practice_location_address <> '' 
                THEN CONCAT(' ', na.provider_second_line_business_practice_location_address) 
                ELSE '' 
            END,
            ', ', na.provider_business_practice_location_address_city_name,
            ', ', na.provider_business_practice_location_address_state_name
        )) AS prescriber_address,
        na.provider_business_practice_location_address_postal_code AS prescriber_zipcode,
        np.drug_name AS medication_name_match
      FROM 
        public.npi_prescriptions np
      JOIN 
        public.npi_addresses na ON np.npi = na.npi
      JOIN 
        public.npi_details nd ON np.npi = nd.npi
      WHERE 
        (np.drug_name ILIKE $1 OR np.generic_name ILIKE $1)
        AND ${zipcodeCondition}
      LIMIT 50; 
    `;
    const res = await client.query<PrescriberRecord>(query, [`%${medicationName}%`, zipcodeQueryParam]);
    return res.rows;
  } catch (error: any) {
    console.error('Error finding prescribers:', error);
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await client.end();
  }
}
