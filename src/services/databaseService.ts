
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
  distance: number;
  phone_number?: string;
  credentials?: string;
  specialization?: string;
  total_claim_count?: number;
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

    // 1. Get lat/lon for the input zipcode
    // Using unquoted column names as per user's error log and schema.
    const geoInputZipQuery = await client.query(
      'SELECT latitude, longitude FROM public.npi_addresses_usps WHERE zip_code = $1 LIMIT 1',
      [zipcode]
    );

    if (geoInputZipQuery.rows.length === 0) {
      console.warn(`No coordinates found for input zipcode: ${zipcode} in 'public.npi_addresses_usps'.`);
      throw new Error(`Could not find latitude/longitude for the input zipcode ${zipcode} in the 'public.npi_addresses_usps' table. Please ensure this zipcode exists and has coordinate data. The query used was: 'SELECT latitude, longitude FROM public.npi_addresses_usps WHERE zip_code = ${zipcode} LIMIT 1'. Check that 'latitude', 'longitude', and 'zip_code' columns exist with these exact (case-insensitive) names.`);
    }
    
    const inputLat = geoInputZipQuery.rows[0].latitude;
    const inputLon = geoInputZipQuery.rows[0].longitude;

    if (typeof inputLat !== 'number' || typeof inputLon !== 'number' || isNaN(inputLat) || isNaN(inputLon)) {
        console.error(`Invalid or missing coordinates for input zipcode ${zipcode}: lat=${inputLat}, lon=${inputLon}`);
        throw new Error(`Coordinates for input zipcode ${zipcode} are invalid, not numbers, or missing from 'public.npi_addresses_usps'. Expected numeric values. Retrieved lat: ${inputLat}, lon: ${inputLon}.`);
    }

    // 2. Find prescribers within the radius
    // Using unquoted column names for prescriber_geo as well.
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
          na.provider_business_practice_location_address_telephone_number AS phone_number,
          nd.provider_credential_text AS credentials,
          nd.healthcare_provider_taxonomy_1_specialization AS specialization,
          np.drug_name AS medication_name_match,
          np.total_claim_count,
          prescriber_geo.latitude AS prescriber_lat,   -- unquoted
          prescriber_geo.longitude AS prescriber_lon  -- unquoted
        FROM 
          public.npi_prescriptions np
        JOIN 
          public.npi_details nd ON np.npi = nd.npi
        JOIN 
          public.npi_addresses na ON np.npi = na.npi
        LEFT JOIN
          public.npi_addresses_usps prescriber_geo ON LEFT(na.provider_business_practice_location_address_postal_code, 5) = prescriber_geo.zip_code -- unquoted
        WHERE 
          (np.drug_name ILIKE $1 OR np.generic_name ILIKE $1) 
          AND prescriber_geo.latitude IS NOT NULL AND prescriber_geo.longitude IS NOT NULL -- unquoted
      )
      SELECT
        pb.prescriber_name,
        pb.prescriber_address,
        pb.prescriber_zipcode,
        pb.phone_number,
        pb.credentials,
        pb.specialization,
        pb.medication_name_match,
        pb.total_claim_count,
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
    
    const columnMissingMatch = error.message.match(/column "([^"]+)" does not exist|column ([^ ]+) does not exist/i);
    if (columnMissingMatch) {
        const missingColumn = columnMissingMatch[1] || columnMissingMatch[2];
        let detailedMessage = `Database query failed: PostgreSQL reports that column "${missingColumn}" does not exist IN THE CONTEXT OF THE CURRENT QUERY.\n\n`;
        detailedMessage += `This usually means one of the following for the table 'public.npi_addresses_usps':\n`;
        detailedMessage += `1. WRONG DATABASE/SCHEMA: The application (using host: '${dbConfig.host}', database: '${dbConfig.database}', user: '${dbConfig.user}') is NOT connecting to the database you are inspecting. Double and triple-check ALL PG_* environment variables in your .env file(s) (.env, .env.local, etc.) used by Next.js for this environment.\n\n`;
        detailedMessage += `2. COLUMN NAMING/CASING: You've confirmed the column is lowercase 'latitude'. The query uses unquoted 'latitude', which PostgreSQL folds to lowercase. This should match if the column was created unquoted or quoted as lowercase. If it was created with different casing AND quotes (e.g., "Latitude"), the query would need to match that exact casing with quotes.\n   COMMAND TO VERIFY IN PSQL (connected to the *actual* app database): \\d public.npi_addresses_usps\n   Inspect the output carefully for the exact spelling and casing of '${missingColumn}'.\n\n`;
        detailedMessage += `3. PERMISSIONS: The database user '${dbConfig.user || 'UNKNOWN (check PG_USER in .env)'}' might LACK SELECT permission on the 'public.npi_addresses_usps' table OR specifically on the '${missingColumn}' column. This can appear as a "column does not exist" error.\n   Grant permissions: GRANT SELECT ON public.npi_addresses_usps TO "${dbConfig.user}"; (and potentially on specific columns if needed).\n\n`;
        detailedMessage += `4. TYPO IN QUERY (Less likely if previously working): The query itself might have a typo referring to '${missingColumn}' where it's used with 'public.npi_addresses_usps'. Current query references it as unquoted lowercase, which should be correct for an unquoted lowercase column definition.\n\n`;
        detailedMessage += `Original PostgreSQL error: ${error.message}`;
        throw new Error(detailedMessage);
    }
    throw new Error(`Database query failed. Please check database connectivity, query syntax, and table/column definitions. Original error: ${error.message}`);
  } finally {
    await client.end();
  }
}

// Example of how to create the calculate_distance function in PostgreSQL:
/*
-- Drop the function if it already exists to avoid errors on re-creation
DROP FUNCTION IF EXISTS public.calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT);

CREATE OR REPLACE FUNCTION public.calculate_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION,
    units TEXT DEFAULT 'km' -- Default unit is kilometers
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    R DOUBLE PRECISION;              -- Radius of the Earth
    phi1 DOUBLE PRECISION;           -- Latitude 1 in radians
    phi2 DOUBLE PRECISION;           -- Latitude 2 in radians
    delta_phi DOUBLE PRECISION;      -- Difference in latitude
    delta_lambda DOUBLE PRECISION;   -- Difference in longitude
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
    distance DOUBLE PRECISION;
BEGIN
    -- Select Earth's radius based on the desired units
    IF lower(units) = 'km' THEN
        R := 6371.0; -- Radius in kilometers
    ELSIF lower(units) = 'miles' THEN
        R := 3958.8; -- Radius in miles
    ELSE
        RAISE EXCEPTION 'Invalid unit: %. Supported units are "km" or "miles".', units;
    END IF;

    phi1 := radians(lat1);
    phi2 := radians(lat2);
    delta_phi := radians(lat2 - lat1);
    delta_lambda := radians(lon2 - lon1);

    a := sin(delta_phi / 2.0) * sin(delta_phi / 2.0) +
         cos(phi1) * cos(phi2) *
         sin(delta_lambda / 2.0) * sin(delta_lambda / 2.0);

    IF a < 0.0 THEN
        a := 0.0;
    ELSIF a > 1.0 THEN
        a := 1.0;
    END IF;
    
    c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a));
    distance := R * c;
    RETURN distance;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) IS
'Calculates the great-circle distance between two points (specified in decimal degrees) on Earth using the Haversine formula.
Parameters: lat1, lon1, lat2, lon2, units (''km'' for kilometers, ''miles'' for miles).
Returns distance in the specified units.';
*/
