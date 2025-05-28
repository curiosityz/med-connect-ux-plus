
'use server';

import { Client, type QueryResultRow } from 'pg';

const dbConfig = {
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  database: process.env.PG_DATABASE,
  password: process.env.NEXT_DB_PASSWORD,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
  ssl: process.env.PG_SSLMODE === 'require'
    ? { rejectUnauthorized: false }
    : undefined,
};

export interface PrescriberRecord extends QueryResultRow {
  npi: bigint;
  provider_first_name: string | null;
  provider_last_name_legal_name: string | null;
  practice_address1: string | null;
  practice_address2: string | null;
  practice_city: string | null;
  practice_state: string | null;
  practice_zip: string | null;
  drug: string | null; // Matched medication name
  claims: number | null; // Corresponds to total_claim_count for confidence
  distance_miles: number | null;
  taxonomy_class: string | null; // New field from the refined SQL function
  // The SQL function also returns credentials and specialization implicitly if they are part of the underlying tables it queries
  // Ensure these are aliased correctly in the SQL function if needed by the flow
  provider_credential_text?: string | null; // Assuming SQL function might pass this through from npi_details
  healthcare_provider_taxonomy_1_specialization?: string | null; // Assuming SQL function might pass this through
  provider_business_practice_location_address_telephone_number?: string | null; // Assuming SQL function might pass this through
}

interface FindPrescribersParams {
  medicationName: string;
  zipcode: string;
  searchRadius: number;
}

export async function findPrescribersInDB({ medicationName, zipcode, searchRadius }: FindPrescribersParams): Promise<PrescriberRecord[]> {
  if (!medicationName || !zipcode || searchRadius == null) {
    console.warn("Missing medication name, zipcode, or search radius.");
    return [];
  }
  if (!/^\d{5}$/.test(zipcode)) {
    throw new Error("Invalid zipcode format. Must be 5 digits.");
  }

  const client = new Client(dbConfig);
  try {
    await client.connect();

    const query = `
      SELECT * 
      FROM public.find_prescribers_near_zip_refined($1, $2, $3, $4, $5, $6);
    `;
    // Parameters: p_zip_code, p_drug_name, p_radius_miles, p_min_claims, p_taxonomy_class, p_sort_by
    const params = [
        zipcode,            // $1: p_zip_code
        medicationName,     // $2: p_drug_name
        searchRadius,       // $3: p_radius_miles
        0,                  // $4: p_min_claims (default)
        null,               // $5: p_taxonomy_class (default)
        'distance'          // $6: p_sort_by (default)
    ];
    
    const res = await client.query<PrescriberRecord>(query, params);
    return res.rows;

  } catch (error: any) {
    console.error("Error calling find_prescribers_near_zip_refined SQL function:", error);
    let userMessage = `Database query failed when calling 'find_prescribers_near_zip_refined'. Please check database connectivity, function definition, and permissions.`;
    if (error.message && typeof error.message === 'string') {
      userMessage += ` Original error: ${error.message}`;
    }
    throw new Error(userMessage);
  } finally {
    if (client) {
      await client.end();
    }
  }
}
