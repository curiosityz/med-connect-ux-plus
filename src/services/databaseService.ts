
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
  drug: string | null;
  claims: number | null;
  distance_miles: number | null;
  taxonomy_class: string | null;
  provider_credential_text: string | null;
  healthcare_provider_taxonomy_1_specialization: string | null;
  provider_business_practice_location_address_telephone_number: string | null;
}

interface FindPrescribersParams {
  medicationName: string;
  zipcode: string;
  searchRadius: number;
}

// Example of a Haversine distance calculation function in PL/pgSQL (PostgreSQL)
// This function does NOT rely on PostGIS geometry types.
// You would need to create this function in your database IF you choose to use it.
// The current implementation below embeds the Haversine calculation directly in the query.
/*
CREATE OR REPLACE FUNCTION public.calculate_haversine_distance(
    lat1 DOUBLE PRECISION,
    lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION,
    lon2 DOUBLE PRECISION,
    units TEXT DEFAULT 'miles' -- 'km' or 'miles'
)
RETURNS DOUBLE PRECISION AS $$
DECLARE
    R DOUBLE PRECISION;
    phi1 DOUBLE PRECISION;
    phi2 DOUBLE PRECISION;
    delta_phi DOUBLE PRECISION;
    delta_lambda DOUBLE PRECISION;
    a DOUBLE PRECISION;
    c DOUBLE PRECISION;
    distance DOUBLE PRECISION;
BEGIN
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

    -- Haversine formula using asin
    a := sin(delta_phi / 2.0)^2 +
         cos(phi1) * cos(phi2) *
         sin(delta_lambda / 2.0)^2;
    
    IF a < 0.0 THEN a := 0.0; END IF;
    IF a > 1.0 THEN a := 1.0; END IF;

    c := 2.0 * asin(sqrt(a)); -- More direct form
    -- c := 2.0 * atan2(sqrt(a), sqrt(1.0 - a)); -- Numerically stabler for small distances

    distance := R * c;

    RETURN distance;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_haversine_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, TEXT) IS
'Calculates the great-circle distance between two points (specified in decimal degrees) on Earth using the Haversine formula.
Parameters: lat1, lon1, lat2, lon2, units (''km'' for kilometers, ''miles'' for miles).
Returns distance in the specified units.';
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
    const zipCoordQuery = 'SELECT latitude, longitude FROM public.npi_addresses_usps WHERE zip_code = $1 LIMIT 1';
    const zipCoordRes = await client.query(zipCoordQuery, [zipcode]);

    if (zipCoordRes.rows.length === 0) {
      console.warn(`Coordinates not found for input zipcode: ${zipcode}`);
      throw new Error(`Could not find location data for zipcode ${zipcode}. Please ensure it's a valid 5-digit US zipcode present in the npi_addresses_usps table.`);
    }
    
    const rawInputZipLat = zipCoordRes.rows[0].latitude;
    const rawInputZipLon = zipCoordRes.rows[0].longitude;

    let parsedInputZipLat: number | null = null;
    let parsedInputZipLon: number | null = null;

    if (rawInputZipLat != null) {
        if (typeof rawInputZipLat === 'number') {
            parsedInputZipLat = rawInputZipLat;
        } else if (typeof rawInputZipLat === 'string') {
            parsedInputZipLat = parseFloat(rawInputZipLat);
            if (isNaN(parsedInputZipLat)) parsedInputZipLat = null;
        }
    }

    if (rawInputZipLon != null) {
        if (typeof rawInputZipLon === 'number') {
            parsedInputZipLon = rawInputZipLon;
        } else if (typeof rawInputZipLon === 'string') {
            parsedInputZipLon = parseFloat(rawInputZipLon);
            if (isNaN(parsedInputZipLon)) parsedInputZipLon = null;
        }
    }

    if (parsedInputZipLat == null || parsedInputZipLon == null) {
        console.error(
            `Invalid or non-numeric coordinates for input zipcode ${zipcode}. Latitude_raw: ${rawInputZipLat} (type: ${typeof rawInputZipLat}), Longitude_raw: ${rawInputZipLon} (type: ${typeof rawInputZipLon}). Parsed as: Lat: ${parsedInputZipLat}, Lon: ${parsedInputZipLon}. Please check the npi_addresses_usps table.`
        );
        throw new Error(
            `Location data for zipcode ${zipcode} is invalid or non-numeric. Ensure latitude and longitude are valid numbers in the npi_addresses_usps table.`
        );
    }


    // 2. Main query to find prescribers, calling the public.calculate_distance SQL function
    const query = `
      SELECT
        nd.npi,
        nd.provider_first_name,
        nd.provider_last_name_legal_name,
        na.provider_first_line_business_practice_location_address AS practice_address1,
        na.provider_second_line_business_practice_location_address AS practice_address2,
        na.provider_business_practice_location_address_city_name AS practice_city,
        na.provider_business_practice_location_address_state_name AS practice_state,
        SUBSTRING(na.provider_business_practice_location_address_postal_code FROM 1 FOR 5) AS practice_zip,
        COALESCE(np.drug_name, np.generic_name) AS drug,
        np.total_claim_count AS claims,
        nd.provider_credential_text,
        nd.healthcare_provider_taxonomy_1_specialization,
        nd.healthcare_provider_taxonomy_1_classification AS taxonomy_class,
        na.provider_business_practice_location_address_telephone_number,
        public.calculate_distance(
            $2, $3, -- input_zip_lat, input_zip_lon
            prescriber_geo.latitude, 
            prescriber_geo.longitude,
            'miles'
        ) AS distance_miles
      FROM
        public.npi_prescriptions np
      JOIN
        public.npi_details nd ON np.npi = nd.npi
      JOIN
        public.npi_addresses na ON np.npi = na.npi
      LEFT JOIN 
        public.npi_addresses_usps prescriber_geo ON SUBSTRING(na.provider_business_practice_location_address_postal_code FROM 1 FOR 5) = prescriber_geo.zip_code
      WHERE
        (np.drug_name ILIKE $1 OR np.generic_name ILIKE $1)
        AND prescriber_geo.latitude IS NOT NULL AND prescriber_geo.longitude IS NOT NULL 
      HAVING
        public.calculate_distance($2, $3, prescriber_geo.latitude, prescriber_geo.longitude, 'miles') <= $4
      ORDER BY
        distance_miles ASC
      LIMIT 200;
    `;
    
    const params = [
        `%${medicationName}%`, 
        parsedInputZipLat,      
        parsedInputZipLon,      
        searchRadius         
    ];
    
    const res = await client.query<PrescriberRecord>(query, params);
    return res.rows;

  } catch (error: any) {
    console.error("Error in findPrescribersInDB:", error);
    let userMessage = `Database query failed. Please check database connectivity, table structures (npi_prescriptions, npi_details, npi_addresses, npi_addresses_usps), and the 'public.calculate_distance' SQL function.`;
    if (error.message && typeof error.message === 'string') {
      if (error.message.startsWith("Location data for zipcode") && error.message.includes("is invalid or non-numeric")) {
        userMessage = error.message; // Use the more specific error message from the coordinate check
      } else if (error.message.startsWith("Could not find location data for zipcode")){
        userMessage = error.message; // Use the message if zipcode not found in npi_addresses_usps
      } else {
        userMessage += ` Original error: ${error.message}`;
      }
    }
    if (error.message && typeof error.message === 'string' && error.message.includes("column") && error.message.includes("does not exist")) {
        userMessage += `\n\nSpecific 'column does not exist' error detected. Please verify:
1.  The EXACT column name and casing in your PostgreSQL table using psql (e.g., \\d public.npi_addresses_usps). Unquoted names are stored as lowercase.
2.  Your .env file's PG_HOST, PG_DATABASE, PG_USER, PG_PORT, NEXT_DB_PASSWORD are correct and point to the database you are inspecting.
3.  The database user ('${dbConfig.user || 'unknown'}') has SELECT permissions on all involved tables and columns.`;
    }
    throw new Error(userMessage);
  } finally {
    if (client) {
      await client.end();
    }
  }
}

