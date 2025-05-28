
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
  drug: string | null;
  claims: number | null;
  distance_miles: number | null;
  // Note: phone_number, credentials, specialization are not returned by the SQL function
}

interface FindPrescribersParams {
  medicationName: string;
  zipcode: string;
  searchRadius: number;
}

export async function findPrescribersInDB({ medicationName, zipcode, searchRadius }: FindPrescribersParams): Promise<PrescriberRecord[]> {
  if (!medicationName || !zipcode || searchRadius == null || searchRadius <= 0) {
    return [];
  }

  const client = new Client(dbConfig);
  try {
    await client.connect();

    const query = 'SELECT * FROM public.find_prescribers_near_zip($1, $2, $3)';
    const params = [zipcode, `%${medicationName}%`, searchRadius];
    
    const res = await client.query<PrescriberRecord>(query, params);
    
    if (res.rows.length === 0) {
      // Check if the SQL function itself might have returned an error or specific condition as empty rows
      // For now, we just return the empty array. More specific error handling could be added if the SQL function provides it.
      console.log(`No prescribers found by SQL function find_prescribers_near_zip for medication "${medicationName}", zip "${zipcode}", radius ${searchRadius}.`);
    }
    return res.rows;

  } catch (error: any) {
    console.error('Error calling SQL function find_prescribers_near_zip:', error);

    if (error.message && error.message.includes("function public.find_prescribers_near_zip") && error.message.includes("does not exist")) {
        throw new Error(`Database query failed: The SQL function 'public.find_prescribers_near_zip' with matching argument types (text, text, numeric) is not defined in your database, or it is not accessible. Please ensure it has been created and the application's database user has permission to execute it. Details: ${error.message}`);
    }
     if (error.message && error.message.includes("Invalid unit")) {
        // This error might come from calculate_distance if it's called inside your SQL function
        throw new Error(`Database query failed: The 'calculate_distance' SQL function (likely called within 'find_prescribers_near_zip') was called with an invalid unit. Ensure it supports 'miles'. Details: ${error.message}`);
    }
    // A more generic error for other issues
    throw new Error(`Database query failed when calling 'find_prescribers_near_zip'. Please check database connectivity, function definition, and permissions. Original error: ${error.message}`);
  } finally {
    await client.end();
  }
}
