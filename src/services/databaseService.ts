
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
  drug_name: string | null;
  total_claim_count: number | null;
  distance_miles?: number | null; // Added distance
}

interface FindPrescribersParams {
  medicationName: string;
  zipcode: string;
  searchRadius: number; // Changed from searchAreaType
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

    // 1. Get coordinates for the input zipcode
    const geoQuery = 'SELECT latitude, longitude FROM public.npi_addresses_usps WHERE zip_code = $1 LIMIT 1';
    const geoRes = await client.query(geoQuery, [zipcode]);

    if (geoRes.rows.length === 0) {
      throw new Error(`No coordinates found for zipcode ${zipcode}. Please check the zipcode or ensure it exists in 'npi_addresses_usps' table.`);
    }
    const inputLat = parseFloat(geoRes.rows[0].latitude);
    const inputLon = parseFloat(geoRes.rows[0].longitude);

    if (isNaN(inputLat) || isNaN(inputLon)) {
        throw new Error(`Invalid coordinates for zipcode ${zipcode} in 'npi_addresses_usps' table (latitude: ${geoRes.rows[0].latitude}, longitude: ${geoRes.rows[0].longitude}).`);
    }


    // 2. Find prescribers within radius, calculating distance directly
    // Using unquoted column names (latitude, longitude, zip_code) for npi_addresses_usps as per previous resolution
    const query = `
      WITH PrescriberData AS (
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
          np.total_claim_count,
          prescriber_geo.latitude as prescriber_lat,
          prescriber_geo.longitude as prescriber_lon
        FROM public.npi_prescriptions np
        JOIN public.npi_addresses na ON np.npi = na.npi
        JOIN public.npi_details nd ON np.npi = nd.npi
        LEFT JOIN public.npi_addresses_usps prescriber_geo ON LEFT(na.provider_business_practice_location_address_postal_code, 5) = prescriber_geo.zip_code -- Join on 5-digit zip
        WHERE (np.drug_name ILIKE $1 OR np.generic_name ILIKE $1)
          AND prescriber_geo.latitude IS NOT NULL AND prescriber_geo.longitude IS NOT NULL -- Ensure prescribers have geo data
      )
      SELECT
        *,
        (3958.8 * acos(
          cos(radians($2)) * cos(radians(PrescriberData.prescriber_lat)) *
          cos(radians(PrescriberData.prescriber_lon) - radians($3)) +
          sin(radians($2)) * sin(radians(PrescriberData.prescriber_lat))
        )) AS distance_miles
      FROM PrescriberData
      HAVING (3958.8 * acos(
                cos(radians($2)) * cos(radians(PrescriberData.prescriber_lat)) *
                cos(radians(PrescriberData.prescriber_lon) - radians($3)) +
                sin(radians($2)) * sin(radians(PrescriberData.prescriber_lat))
              )) <= $4
      ORDER BY distance_miles ASC NULLS LAST, total_claim_count DESC NULLS LAST, provider_last_name_legal_name, provider_first_name
      LIMIT 50;
    `;
    // Parameters: $1=medicationName, $2=inputLat, $3=inputLon, $4=searchRadius
    const params = [`%${medicationName}%`, inputLat, inputLon, searchRadius];
    const res = await client.query<PrescriberRecord>(query, params);
    return res.rows;

  } catch (error: any) {
    console.error('Error querying database for prescribers with radius search:', error);
    let userMessage = "An unexpected error occurred while searching for prescribers with radius.";

    if (error.message.includes("column") && error.message.includes("does not exist")) {
         userMessage = `Database query failed: ${error.message}. Please verify the exact column names (e.g., 'latitude', 'longitude', 'zip_code' in 'public.npi_addresses_usps') and casing in your database schema using 'psql \\d public.npi_addresses_usps'. Also, double-check your .env connection settings and database user permissions.`;
    } else if (error.message.includes("No coordinates found")) {
        userMessage = error.message;
    } else if (error.message.includes("Invalid coordinates")) {
        userMessage = error.message;
    } else {
        userMessage = `Database query error: ${error.message}. Check database connectivity and table structures.`;
    }
    throw new Error(userMessage);
  } finally {
    await client.end();
  }
}
