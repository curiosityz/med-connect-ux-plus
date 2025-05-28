
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
  distance_miles?: number | null;
}

interface FindPrescribersParams {
  medicationName: string;
  zipcode: string;
  searchRadius: number;
}

/*
  IMPORTANT: You will need to create a SQL function in your database
  for the Haversine distance calculation. This function should NOT depend on PostGIS.
  Below is an example of how such a function could be defined in PostgreSQL,
  using an asin-based Haversine formula:

  CREATE OR REPLACE FUNCTION public.calculate_haversine_distance(
      lat1 DOUBLE PRECISION,
      lon1 DOUBLE PRECISION,
      lat2 DOUBLE PRECISION,
      lon2 DOUBLE PRECISION,
      units TEXT DEFAULT 'miles' -- 'miles' or 'km'
  )
  RETURNS DOUBLE PRECISION AS $$
  DECLARE
      R_km DOUBLE PRECISION := 6371.0;    -- Earth radius in kilometers
      R_miles DOUBLE PRECISION := 3958.8; -- Earth radius in miles
      R_selected DOUBLE PRECISION;

      delta_lat_rad DOUBLE PRECISION;
      delta_lon_rad DOUBLE PRECISION;
      lat1_rad DOUBLE PRECISION;
      lat2_rad DOUBLE PRECISION;
      a DOUBLE PRECISION;
      c DOUBLE PRECISION;
      distance DOUBLE PRECISION;
  BEGIN
      IF lower(units) = 'km' THEN
          R_selected := R_km;
      ELSIF lower(units) = 'miles' THEN
          R_selected := R_miles;
      ELSE
          RAISE EXCEPTION 'Invalid unit: %. Supported units are "km" or "miles".', units;
      END IF;

      lat1_rad := radians(lat1);
      lat2_rad := radians(lat2);
      delta_lat_rad := radians(lat2 - lat1);
      delta_lon_rad := radians(lon2 - lon1);

      -- Haversine formula 'a' component
      a := sin(delta_lat_rad / 2.0) * sin(delta_lat_rad / 2.0) +
           cos(lat1_rad) * cos(lat2_rad) *
           sin(delta_lon_rad / 2.0) * sin(delta_lon_rad / 2.0);

      -- Ensure 'a' is within valid range for asin (0 to 1) due to potential floating point inaccuracies
      IF a < 0.0 THEN
          a := 0.0;
      ELSIF a > 1.0 THEN
          a := 1.0;
      END IF;

      -- Central angle 'c' using asin
      c := 2.0 * asin(sqrt(a));

      distance := R_selected * c;

      -- Round to 1 decimal place (matches frontend display formatting)
      RETURN round(CAST(distance AS numeric), 1);
  END;
  $$ LANGUAGE plpgsql IMMUTABLE;

  COMMENT ON FUNCTION public.calculate_haversine_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) IS
  'Calculates the great-circle distance between two points (specified in decimal degrees) on Earth using an asin-based Haversine formula. Does NOT use PostGIS.
  Parameters: lat1, lon1, lat2, lon2, units (''km'' for kilometers, ''miles'' for miles).
  Returns distance in the specified units, rounded to one decimal place.';
*/

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
      throw new Error(`No coordinates found for zipcode ${zipcode}. Please check the zipcode or ensure it exists in the 'npi_addresses_usps' table with 'latitude' and 'longitude' columns.`);
    }
    const inputLat = parseFloat(geoRes.rows[0].latitude);
    const inputLon = parseFloat(geoRes.rows[0].longitude);

    if (isNaN(inputLat) || isNaN(inputLon)) {
        throw new Error(`Invalid coordinates for zipcode ${zipcode} in 'npi_addresses_usps' table (latitude: ${geoRes.rows[0].latitude}, longitude: ${geoRes.rows[0].longitude}). Ensure these columns are numeric.`);
    }

    // 2. Find prescribers, calling the Haversine distance function
    const query = `
      SELECT
        nd.npi,
        nd.provider_first_name,
        nd.provider_last_name_legal_name,
        na.provider_first_line_business_practice_location_address AS practice_address1,
        na.provider_second_line_business_practice_location_address AS practice_address2,
        na.provider_business_practice_location_address_city_name AS practice_city,
        na.provider_business_practice_location_address_state_name AS practice_state,
        LEFT(na.provider_business_practice_location_address_postal_code, 5) AS practice_zip,
        na.provider_business_practice_location_address_telephone_number AS phone_number,
        nd.provider_credential_text AS credentials,
        nd.healthcare_provider_taxonomy_1_specialization AS specialization,
        np.drug_name,
        np.total_claim_count,
        public.calculate_haversine_distance(
            $2, -- inputLat
            $3, -- inputLon
            prescriber_geo.latitude,
            prescriber_geo.longitude,
            'miles'
        ) AS distance_miles
      FROM public.npi_prescriptions np
      JOIN public.npi_addresses na ON np.npi = na.npi
      JOIN public.npi_details nd ON np.npi = nd.npi
      LEFT JOIN public.npi_addresses_usps prescriber_geo ON LEFT(na.provider_business_practice_location_address_postal_code, 5) = prescriber_geo.zip_code
      WHERE (np.drug_name ILIKE $1 OR np.generic_name ILIKE $1)
        AND prescriber_geo.latitude IS NOT NULL AND prescriber_geo.longitude IS NOT NULL
      HAVING public.calculate_haversine_distance(
                $2, $3,
                prescriber_geo.latitude, prescriber_geo.longitude,
                'miles'
            ) <= $4
      ORDER BY distance_miles ASC NULLS LAST, total_claim_count DESC NULLS LAST, provider_last_name_legal_name, provider_first_name
      LIMIT 50;
    `;
    // Parameters: $1=medicationName (with wildcards), $2=inputLat, $3=inputLon, $4=searchRadius
    const params = [`%${medicationName}%`, inputLat, inputLon, searchRadius];
    const res = await client.query<PrescriberRecord>(query, params);
    return res.rows;

  } catch (error: any) {
    console.error('Error querying database for prescribers with radius search:', error);
    let userMessage = "An unexpected error occurred while searching for prescribers with radius.";

    if (error.message && typeof error.message === 'string') {
        if (error.message.includes("column") && error.message.includes("does not exist")) {
            userMessage = `Database query failed: ${error.message}. Please verify the exact column names (e.g., 'latitude', 'longitude', 'zip_code' in 'public.npi_addresses_usps') and casing in your database schema using 'psql \\d public.npi_addresses_usps'. Also, double-check your .env connection settings and database user permissions. Ensure column names in the SQL query (like prescriber_geo.latitude) match your schema.`;
        } else if (error.message.includes("No coordinates found")) {
            userMessage = error.message;
        } else if (error.message.includes("Invalid coordinates")) {
            userMessage = error.message;
        } else if (error.message.includes("function public.calculate_haversine_distance") && error.message.includes("does not exist")) {
            userMessage = "Database query failed: The required 'public.calculate_haversine_distance' SQL function was not found. Please ensure it is created in your database as per the example in databaseService.ts and that the application's database user has EXECUTE permission on it.";
        } else {
            userMessage = `Database query error: ${error.message}. Check database connectivity, table structures, user permissions, and SQL function definitions.`;
        }
    }
    throw new Error(userMessage);
  } finally {
    if (client) {
      await client.end();
    }
  }
}
    
