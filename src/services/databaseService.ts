
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

// Helper function to robustly parse a value to a number
const valueAsNumber = (val: any): number | null => {
    if (val === null || typeof val === 'undefined') return null; // handles null or undefined
    if (typeof val === 'number') {
        return Number.isNaN(val) ? null : val; // handles primitive numbers, including NaN
    }
    // For strings or other types (like Decimal objects from some DB drivers that stringify to numbers)
    const num = parseFloat(String(val)); // String(val) is key for objects
    return Number.isNaN(num) ? null : num;
};


export async function findPrescribersInDB({ medicationName, zipcode, searchRadius }: FindPrescribersParams): Promise<PrescriberRecord[]> {
  if (!medicationName || !zipcode || searchRadius == null) {
    console.warn("Missing medication name, zipcode, or search radius.");
    return [];
  }
  if (!/^\d{5}$/.test(zipcode)) {
    // This check is good, but the action layer also does it.
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

    const parsedInputZipLat = valueAsNumber(rawInputZipLat);
    const parsedInputZipLon = valueAsNumber(rawInputZipLon);
    
    if (parsedInputZipLat === null || parsedInputZipLon === null) {
        console.error(
            `Failed to parse coordinates for input zipcode ${zipcode}. ` +
            `Raw Latitude: ${rawInputZipLat} (type: ${typeof rawInputZipLat}), Parsed Latitude: ${parsedInputZipLat}. ` +
            `Raw Longitude: ${rawInputZipLon} (type: ${typeof rawInputZipLon}), Parsed Longitude: ${parsedInputZipLon}. ` +
            `Please check the npi_addresses_usps table for valid numeric coordinates.`
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
        userMessage = error.message; 
      } else if (error.message.startsWith("Could not find location data for zipcode")){
        userMessage = error.message; 
      } else if (error.message.includes("column") && error.message.includes("does not exist")) {
           userMessage += ` Original error: ${error.message}.\n\nSpecific 'column does not exist' error detected. Please verify:\n1. The EXACT column name and casing in your PostgreSQL table using psql (e.g., \\d public.your_table_name). Unquoted names are usually stored as lowercase.\n2. Your .env file's PG_HOST, PG_DATABASE, PG_USER, PG_PORT, NEXT_DB_PASSWORD are correct and point to the database you are inspecting.\n3. The database user ('${dbConfig.user || 'unknown'}') has SELECT permissions on all involved tables and columns.`;
      } else {
        userMessage += ` Original error: ${error.message}`;
      }
    }
    throw new Error(userMessage);
  } finally {
    if (client) {
      await client.end();
    }
  }
}
