
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
  phone_number?: string;
  credentials?: string;
  specialization?: string;
  total_claim_count?: number;
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
    // Ensure column names here ("latitude", "longitude", "zip_code") EXACTLY match your npi_addresses_usps table definition.
    const geoInputZipQuery = await client.query(
      'SELECT "latitude", "longitude" FROM public.npi_addresses_usps WHERE "zip_code" = $1 LIMIT 1',
      [zipcode]
    );

    if (geoInputZipQuery.rows.length === 0) {
      console.warn(`No coordinates found for input zipcode: ${zipcode} in 'public.npi_addresses_usps'.`);
      throw new Error(`Could not find latitude/longitude for the input zipcode ${zipcode} in the 'public.npi_addresses_usps' table. Please ensure this zipcode exists, has coordinate data, and the column names in the query match your table definition (e.g., "latitude", "zip_code").`);
    }
    
    const inputLat = geoInputZipQuery.rows[0].latitude;
    const inputLon = geoInputZipQuery.rows[0].longitude;

    if (typeof inputLat !== 'number' || typeof inputLon !== 'number') {
        console.error(`Invalid coordinates for input zipcode ${zipcode}: lat=${inputLat}, lon=${inputLon}`);
        throw new Error(`Coordinates for input zipcode ${zipcode} are invalid or missing from 'public.npi_addresses_usps'. Expected numeric values. Please check the data for this zipcode. Retrieved lat: ${inputLat}, lon: ${inputLon}.`);
    }

    // 2. Find prescribers within the radius
    // Ensure column names referenced from prescriber_geo ("latitude", "longitude") EXACTLY match your npi_addresses_usps table definition.
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
          prescriber_geo."latitude" AS prescriber_lat,
          prescriber_geo."longitude" AS prescriber_lon
        FROM 
          public.npi_prescriptions np
        JOIN 
          public.npi_details nd ON np.npi = nd.npi
        JOIN 
          public.npi_addresses na ON np.npi = na.npi
        LEFT JOIN
          public.npi_addresses_usps prescriber_geo ON LEFT(na.provider_business_practice_location_address_postal_code, 5) = prescriber_geo."zip_code"
        WHERE 
          (np.drug_name ILIKE $1 OR np.generic_name ILIKE $1) 
          AND prescriber_geo."latitude" IS NOT NULL AND prescriber_geo."longitude" IS NOT NULL
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
        let detailedMessage = `Database query failed: PostgreSQL reports that column "${missingColumn}" does not exist. This means the query tried to access a column that PostgreSQL could not find under that exact name.\n\n`;
        detailedMessage += `TROUBLESHOOTING STEPS:\n`;
        detailedMessage += `1. VERIFY COLUMN NAME AND CASING: Connect to your PostgreSQL database using 'psql' or another DB tool. Run the command: \\d public.npi_addresses_usps\n`;
        detailedMessage += `   Carefully check the "Column" list. Is "${missingColumn}" listed EXACTLY as shown (e.g., "latitude" vs "Latitude")? PostgreSQL identifiers are case-sensitive if created with double quotes. If unquoted, they are stored as lowercase.\n`;
        detailedMessage += `   The query currently uses "${missingColumn.toLowerCase()}" (e.g., "latitude"). If your column is cased differently (e.g., "Latitude"), the query in 'src/services/databaseService.ts' must be updated to match that exact case (e.g., SELECT "Latitude"...).\n\n`;
        detailedMessage += `2. CHECK .env FILE: Ensure your environment variables (PG_HOST, PG_USER, PG_DATABASE, PG_PORT, NEXT_DB_PASSWORD, PG_SSLMODE) in the .env file are 100% correct and point to the intended database server and database name where 'public.npi_addresses_usps' table with the correct columns exists. An accidental change here could connect the app to a different DB.\n\n`;
        detailedMessage += `3. DATABASE USER PERMISSIONS: Confirm that the database user specified by PG_USER ('${dbConfig.user || 'UNKNOWN_USER'}') has SELECT permissions on the 'public.npi_addresses_usps' table AND all its columns, including "${missingColumn}".\n\n`;
        detailedMessage += `Original PostgreSQL error: ${error.message}`;
        throw new Error(detailedMessage);
    }
    throw new Error(`Database query failed. Please check database connectivity, query syntax, and table/column definitions. Original error: ${error.message}`);
  } finally {
    await client.end();
  }
}

