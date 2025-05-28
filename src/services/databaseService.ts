
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
  phone_number: string | null;
  credentials: string | null;
  specialization: string | null;
  drug_name: string | null; // Renamed from 'drug' to match direct selection
  total_claim_count: number | null; // Renamed from 'claims'
}

interface FindPrescribersParams {
  medicationName: string;
  zipcode: string;
  searchAreaType: 'exact' | 'prefix3';
}

export async function findPrescribersInDB({ medicationName, zipcode, searchAreaType }: FindPrescribersParams): Promise<PrescriberRecord[]> {
  if (!medicationName || !zipcode || !searchAreaType) {
    return [];
  }

  const client = new Client(dbConfig);
  try {
    await client.connect();

    let params: any[] = [];
    let paramIndex = 1;
    let whereClauses: string[] = [];

    whereClauses.push(`(np.drug_name ILIKE $${paramIndex} OR np.generic_name ILIKE $${paramIndex++})`);
    params.push(`%${medicationName}%`);

    if (searchAreaType === 'exact') {
      whereClauses.push(`na.provider_business_practice_location_address_postal_code = $${paramIndex++}`);
      params.push(zipcode);
    } else if (searchAreaType === 'prefix3') {
      // Expects a 5-digit zipcode from which to derive the prefix
      if (zipcode.length >= 3) {
        whereClauses.push(`LEFT(na.provider_business_practice_location_address_postal_code, 3) = $${paramIndex++}`);
        params.push(zipcode.substring(0, 3));
      } else {
        // Fallback for very short zipcodes, though UI should prevent this.
        whereClauses.push(`na.provider_business_practice_location_address_postal_code = $${paramIndex++}`);
        params.push(zipcode);
      }
    }

    const query = `
      SELECT
        nd.npi,
        nd.provider_first_name,
        nd.provider_last_name_legal_name,
        na.provider_first_line_business_practice_location_address AS practice_address1,
        na.provider_second_line_business_practice_location_address AS practice_address2,
        na.provider_business_practice_location_address_city_name AS practice_city,
        na.provider_business_practice_location_address_state_name AS practice_state,
        na.provider_business_practice_location_address_postal_code AS practice_zip,
        na.provider_business_practice_location_address_telephone_number AS phone_number,
        nd.provider_credential_text AS credentials,
        nd.healthcare_provider_taxonomy_1_specialization AS specialization,
        np.drug_name,
        np.total_claim_count
      FROM public.npi_prescriptions np
      JOIN public.npi_addresses na ON np.npi = na.npi
      JOIN public.npi_details nd ON np.npi = nd.npi
      WHERE ${whereClauses.join(' AND ')}
      ORDER BY np.total_claim_count DESC NULLS LAST, nd.provider_last_name_legal_name, nd.provider_first_name
      LIMIT 50;
    `;
    
    const res = await client.query<PrescriberRecord>(query, params);
    return res.rows;

  } catch (error: any) {
    console.error('Error querying database for prescribers:', error);
    let userMessage = "An unexpected error occurred while searching for prescribers. Please check database connectivity and table structures (npi_prescriptions, npi_addresses, npi_details).";
    if (error.message) {
      userMessage += ` Original error: ${error.message}`;
    }
    throw new Error(userMessage);
  } finally {
    await client.end();
  }
}
