
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
  prescriber_name: string;
  prescriber_address: string;
  prescriber_zipcode: string;
  medication_name_match: string;
  distance: number; // Distance in miles
}

interface FindPrescribersParams {
  medicationName: string;
  zipcode: string; // User's input zipcode
  searchRadius: number; // Radius in miles
}

export async function findPrescribersInDB({ medicationName, zipcode, searchRadius }: FindPrescribersParams): Promise<PrescriberRecord[]> {
  if (!medicationName || !zipcode || searchRadius == null || searchRadius <=0) {
    return [];
  }

  const client = new Client(dbConfig);
  try {
    await client.connect();

    // 1. Get lat/lon for the input zipcode
    const geoInputZipQuery = await client.query(
      'SELECT latitude, longitude FROM public.npi_addresses_usps WHERE zip_code = $1 LIMIT 1',
      [zipcode]
    );

    if (geoInputZipQuery.rows.length === 0) {
      console.warn(`No coordinates found for input zipcode: ${zipcode}`);
      // Consider returning a specific message to the flow if the input zipcode is not found
      return [];
    }
    const inputLat = geoInputZipQuery.rows[0].latitude;
    const inputLon = geoInputZipQuery.rows[0].longitude;

    // 2. Find prescribers within the radius
    const query = `
      WITH PrescriberBase AS (
        SELECT 
          nd.npi,
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
          LEFT(na.provider_business_practice_location_address_postal_code, 5) AS prescriber_zipcode,
          np.drug_name AS medication_name_match,
          prescriber_geo.latitude AS prescriber_lat,
          prescriber_geo.longitude AS prescriber_lon
        FROM 
          public.npi_prescriptions np
        JOIN 
          public.npi_details nd ON np.npi = nd.npi
        JOIN 
          public.npi_addresses na ON np.npi = na.npi
        LEFT JOIN
          public.npi_addresses_usps prescriber_geo ON LEFT(na.provider_business_practice_location_address_postal_code, 5) = prescriber_geo.zip_code
        WHERE 
          (np.drug_name ILIKE $1 OR np.generic_name ILIKE $1) 
          AND prescriber_geo.latitude IS NOT NULL AND prescriber_geo.longitude IS NOT NULL
      )
      SELECT
        pb.prescriber_name,
        pb.prescriber_address,
        pb.prescriber_zipcode,
        pb.medication_name_match,
        calculate_distance($2, $3, pb.prescriber_lat, pb.prescriber_lon, 'miles') AS distance
      FROM PrescriberBase pb
      WHERE 
        calculate_distance($2, $3, pb.prescriber_lat, pb.prescriber_lon, 'miles') <= $4
      ORDER BY distance ASC
      LIMIT 50;
    `;
    
    const res = await client.query<PrescriberRecord>(query, [`%${medicationName}%`, inputLat, inputLon, searchRadius]);
    return res.rows;
  } catch (error: any) {
    console.error('Error finding prescribers with radius search:', error);
    if (error.message && error.message.includes("function calculate_distance") && error.message.includes("does not exist")) {
        throw new Error(`Database query failed: The 'calculate_distance' SQL function is not defined in your database, or it is not accessible. Please ensure it has been created and the application's database user has permission to execute it. Details: ${error.message}`);
    }
     if (error.message && error.message.includes("Invalid unit")) {
        throw new Error(`Database query failed: The 'calculate_distance' SQL function was called with an invalid unit. Ensure it supports 'miles'. Details: ${error.message}`);
    }
    throw new Error(`Database query failed: ${error.message}`);
  } finally {
    await client.end();
  }
}
