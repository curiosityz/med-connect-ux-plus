'use server';

import { Client, type QueryResultRow } from 'pg';
import fs from 'fs';
import path from 'path';

const dbConfig = {
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  database: process.env.PG_DATABASE,
  password: process.env.NEXT_DB_PASSWORD,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
  ssl: process.env.PG_SSLMODE === 'require'
    ? {
        rejectUnauthorized: true, // Enforce certificate validation
        ca: process.env.PG_SSL_CA_CONTENT
          ? process.env.PG_SSL_CA_CONTENT.replace(/\\n/g, '\n') // Use content if available
          : (process.env.PG_SSL_CA_PATH
              ? fs.readFileSync(path.resolve(process.env.PG_SSL_CA_PATH)).toString() // Fallback to path
              : undefined),
      }
    : undefined,
};

// --- BEGIN DIAGNOSTIC LOGGING ---
if (dbConfig.ssl) {
  console.log("DatabaseService: PG_SSLMODE=", process.env.PG_SSLMODE);
  console.log("DatabaseService: SSL config applied:", JSON.stringify({
    rejectUnauthorized: dbConfig.ssl.rejectUnauthorized,
    ca_content_present: !!process.env.PG_SSL_CA_CONTENT,
    ca_path_present: !!process.env.PG_SSL_CA_PATH,
    ca_loaded_length: dbConfig.ssl.ca ? dbConfig.ssl.ca.length : 0,
    ca_loaded_start: dbConfig.ssl.ca ? dbConfig.ssl.ca.substring(0, 30) : 'N/A',
    ca_loaded_end: dbConfig.ssl.ca ? dbConfig.ssl.ca.substring(dbConfig.ssl.ca.length - 30) : 'N/A'
  }));
} else {
  console.log("DatabaseService: SSL not configured (PG_SSLMODE is not 'require')");
}
// --- END DIAGNOSTIC LOGGING ---

export interface PrescriberRecord extends QueryResultRow {
  npi: bigint; // NPI is crucial for unique identification
  provider_first_name: string | null;
  provider_last_name_legal_name: string | null;
  provider_credential_text: string | null;
  healthcare_provider_taxonomy_1_specialization: string | null;
  taxonomy_class: string | null;
  provider_business_practice_location_address_telephone_number: string | null;
  practice_address1: string | null;
  practice_address2: string | null;
  practice_city: string | null;
  practice_state: string | null;
  practice_zip: string | null;
  matched_medications: string[];
  total_claims_for_matched_meds: number | null;
  distance_miles: number | null;
}

interface FindPrescribersParams {
  medicationNames: string[];
  zipcode: string;
  searchRadius: number;
}

const valueAsNumber = (val: any): number | null => {
    if (val === null || typeof val === 'undefined') return null;
    if (typeof val === 'number') {
        return Number.isNaN(val) ? null : val;
    }
    // Attempt to convert to string first, then parseFloat
    const strVal = String(val);
    const num = parseFloat(strVal);
    return Number.isNaN(num) ? null : num;
};


export async function findPrescribersInDB({ medicationNames, zipcode, searchRadius }: FindPrescribersParams): Promise<PrescriberRecord[]> {
  if (!medicationNames || medicationNames.length === 0 || !zipcode || searchRadius == null) {
    console.warn("Missing medication names, zipcode, or search radius.");
    return [];
  }
  if (!/^\d{5}$/.test(zipcode)) {
    throw new Error("Invalid zipcode format. Must be 5 digits.");
  }

  const client = new Client(dbConfig);
  try {
    await client.connect();

    const zipCoordQuery = 'SELECT latitude, longitude FROM public.npi_addresses_usps WHERE zip_code = $1 LIMIT 1';
    const zipCoordRes = await client.query(zipCoordQuery, [zipcode]);

    if (zipCoordRes.rows.length === 0) {
      throw new Error(`Could not find location data for zipcode ${zipcode}. Please ensure it's a valid 5-digit US zipcode present in the npi_addresses_usps table.`);
    }

    const rawInputZipLat = zipCoordRes.rows[0].latitude;
    const rawInputZipLon = zipCoordRes.rows[0].longitude;

    const parsedInputZipLat = valueAsNumber(rawInputZipLat);
    const parsedInputZipLon = valueAsNumber(rawInputZipLon);

    if (parsedInputZipLat === null || parsedInputZipLon === null) {
        const errorMessage = `Location data for zipcode ${zipcode} is invalid or incomplete (latitude/longitude are missing, null, or not numbers). Please check the npi_addresses_usps table. Raw Latitude: ${rawInputZipLat} (type: ${typeof rawInputZipLat}), Parsed Latitude: ${parsedInputZipLat}. Raw Longitude: ${rawInputZipLon} (type: ${typeof rawInputZipLon}), Parsed Longitude: ${parsedInputZipLon}.`;
        console.error(errorMessage);
        throw new Error(errorMessage);
    }

    // This is an example function. You MUST create this function in your PostgreSQL database.
    // It should take lat1, lon1, lat2, lon2, units (e.g., 'miles') and return distance.
    // Ensure it does NOT use PostGIS geometry types if PostGIS is unavailable.
    /*
      CREATE OR REPLACE FUNCTION public.calculate_distance(
          lat1 DOUBLE PRECISION,
          lon1 DOUBLE PRECISION,
          lat2 DOUBLE PRECISION,
          lon2 DOUBLE PRECISION,
          units TEXT DEFAULT 'miles'
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
      BEGIN
          IF lower(units) = 'miles' THEN
              R := 3958.8; -- Radius in miles
          ELSIF lower(units) = 'km' THEN
              R := 6371.0; -- Radius in kilometers
          ELSE
              RAISE EXCEPTION 'Invalid unit: %. Supported units are "miles" or "km".', units;
          END IF;

          phi1 := radians(lat1);
          phi2 := radians(lat2);
          delta_phi := radians(lat2 - lat1);
          delta_lambda := radians(lon2 - lon1);

          -- Using asin variant of Haversine
          a := sin(delta_phi / 2.0)^2 + cos(phi1) * cos(phi2) * sin(delta_lambda / 2.0)^2;
          
          -- Ensure 'a' is within valid range for asin
          IF a < 0.0 THEN a := 0.0; END IF;
          IF a > 1.0 THEN a := 1.0; END IF;

          c := 2.0 * asin(sqrt(a)); -- this is 2 * atan2(sqrt(a), sqrt(1-a)) for small angles
          
          RETURN R * c;
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    */

    const query = `
      WITH input_zip_coords AS (
          SELECT $2::double precision AS latitude, $3::double precision AS longitude
      ), PrescriberBase AS (
          SELECT
              nd.npi,
              nd.provider_first_name,
              nd.provider_last_name_legal_name,
              nd.provider_credential_text,
              nd.healthcare_provider_taxonomy_1_specialization,
              nd.healthcare_provider_taxonomy_1_classification AS taxonomy_class,
              na.provider_business_practice_location_address_telephone_number,
              na.provider_first_line_business_practice_location_address AS practice_address1,
              na.provider_second_line_business_practice_location_address AS practice_address2,
              na.provider_business_practice_location_address_city_name AS practice_city,
              na.provider_business_practice_location_address_state_name AS practice_state,
              SUBSTRING(na.provider_business_practice_location_address_postal_code FROM 1 FOR 5) AS practice_zip,
              LOWER(COALESCE(np.drug_name, np.generic_name)) as matched_drug_lower,
              COALESCE(np.drug_name, np.generic_name) as matched_drug_display,
              np.total_claim_count,
              prescriber_geo.latitude as prescriber_lat,
              prescriber_geo.longitude as prescriber_lon,
              (SELECT latitude FROM input_zip_coords) AS input_lat,
              (SELECT longitude FROM input_zip_coords) AS input_lon
          FROM
              public.npi_details nd
          JOIN
              public.npi_addresses na ON nd.npi = na.npi
          JOIN
              public.npi_prescriptions np ON nd.npi = np.npi
          LEFT JOIN
              public.npi_addresses_usps prescriber_geo ON SUBSTRING(na.provider_business_practice_location_address_postal_code FROM 1 FOR 5) = prescriber_geo.zip_code
          WHERE
              EXISTS (
                  SELECT 1 FROM unnest($1::text[]) AS search_med
                  WHERE LOWER(COALESCE(np.drug_name, np.generic_name)) ILIKE ('%' || LOWER(TRIM(search_med)) || '%')
              )
              AND prescriber_geo.latitude IS NOT NULL AND prescriber_geo.longitude IS NOT NULL -- Ensure prescriber has valid coordinates
      )
      SELECT
          pm.npi,
          pm.provider_first_name,
          pm.provider_last_name_legal_name,
          pm.provider_credential_text,
          pm.healthcare_provider_taxonomy_1_specialization,
          pm.taxonomy_class,
          pm.provider_business_practice_location_address_telephone_number,
          pm.practice_address1,
          pm.practice_address2,
          pm.practice_city,
          pm.practice_state,
          pm.practice_zip,
          ARRAY_AGG(DISTINCT pm.matched_drug_display ORDER BY pm.matched_drug_display) AS matched_medications,
          SUM(pm.total_claim_count) AS total_claims_for_matched_meds,
          public.calculate_distance(pm.input_lat, pm.input_lon, pm.prescriber_lat, pm.prescriber_lon, 'miles') AS distance_miles
      FROM
          PrescriberBase pm
      GROUP BY
          pm.npi, pm.provider_first_name, pm.provider_last_name_legal_name, pm.provider_credential_text,
          pm.healthcare_provider_taxonomy_1_specialization, pm.taxonomy_class, pm.provider_business_practice_location_address_telephone_number,
          pm.practice_address1, pm.practice_address2, pm.practice_city, pm.practice_state, pm.practice_zip,
          pm.input_lat, pm.input_lon, pm.prescriber_lat, pm.prescriber_lon 
          -- Important: All non-aggregated selected columns must be in GROUP BY
          -- Including coordinates used by the calculate_distance in HAVING
      HAVING
          COUNT(DISTINCT pm.matched_drug_lower) = (
              SELECT COUNT(DISTINCT LOWER(TRIM(s_med))) FROM unnest($1::text[]) AS s_med WHERE TRIM(s_med) <> ''
          )
          AND public.calculate_distance(pm.input_lat, pm.input_lon, pm.prescriber_lat, pm.prescriber_lon, 'miles') <= $4
      ORDER BY
          distance_miles ASC
      LIMIT 200;
    `;

    const params = [
        medicationNames,        // $1: array of medication names
        parsedInputZipLat,      // $2: input zipcode latitude
        parsedInputZipLon,      // $3: input zipcode longitude
        searchRadius            // $4: search radius
    ];

    const res = await client.query<PrescriberRecord>(query, params);
    console.log("Database query returned:", res.rows.length, "rows."); // Added log
    return res.rows;

  } catch (error: any) {
    console.error("Error in findPrescribersInDB:", error);
    let userMessage = `Database query failed. Please check database connectivity, table structures (npi_prescriptions, npi_details, npi_addresses, npi_addresses_usps), and the 'public.calculate_distance' SQL function.`;

    if (error.message && typeof error.message === 'string') {
      if (error.message.startsWith("Location data for zipcode") && (error.message.includes("is invalid or non-numeric") || error.message.includes("is invalid or incomplete"))) {
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

// Payment status types
export type PaymentStatus = 'none' | 'pending' | 'completed' | 'failed';

export interface UserPayment {
  user_id: string;
  plan: string;
  status: PaymentStatus;
  payment_id: string;
  updated_at: Date;
}

// Store or update user payment status
export async function upsertUserPayment(paymentData: {
  user_id: string;
  plan: string;
  status: string;
  payment_id: string;
  amount?: number; // Optional: if not provided, will be NULL in DB or skipped if column disallows NULL without default
  currency?: string; // Optional: defaults to 'USD' or as per DB default
}): Promise<void> {
  const { user_id, plan, status, payment_id, amount, currency = 'USD' } = paymentData;
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const query = `
      INSERT INTO app_schema.user_payments (user_id, plan_type, status, payment_id, amount, currency, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      ON CONFLICT (user_id, payment_id) 
      DO UPDATE SET 
        plan_type = EXCLUDED.plan_type, 
        status = EXCLUDED.status, 
        amount = EXCLUDED.amount, 
        currency = EXCLUDED.currency, 
        updated_at = NOW()
      RETURNING id; 
    `;
    // Ensure amount is passed correctly, defaulting to null if undefined
    const params = [user_id, plan, status, payment_id, amount === undefined ? null : amount, currency];
    await client.query(query, params);
    console.log(`Upserted payment for user ${user_id}, payment_id ${payment_id} with status ${status} into app_schema.user_payments`);
  } catch (error) {
    console.error('Error in upsertUserPayment:', error);
    throw new Error('Failed to update user payment information in the database.');
  } finally {
    await client.end();
  }
}

// Retrieve the latest payment status for a user
export async function getUserPayment(user_id: string): Promise<UserPayment | null> {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    // Ensure we query the correct table `app_schema.user_payments`
    const query = `
      SELECT user_id, plan_type as plan, status, payment_id, updated_at 
      FROM app_schema.user_payments  -- Querying the correct schema and table
      WHERE user_id = $1
      ORDER BY updated_at DESC
      LIMIT 1;
    `;
    const res = await client.query(query, [user_id]);
    if (res.rows.length > 0) {
      const row = res.rows[0];
      return {
        user_id: row.user_id,
        plan: row.plan,
        status: row.status as PaymentStatus,
        payment_id: row.payment_id,
        updated_at: new Date(row.updated_at),
      };
    }
    return null;
  } catch (error) {
    console.error('Error in getUserPayment:', error);
    // Avoid throwing generic error, let caller handle null or specific error scenarios.
    // Consider if specific error types or messages are needed for the caller.
    return null; // Or rethrow if the caller needs to know about the DB error explicitly
  } finally {
    await client.end();
  }
}
