
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
    ? { rejectUnauthorized: false } // For production, prefer providing CA certs
    : undefined,
};

export interface PrescriberRecord extends QueryResultRow {
  prescriber_name: string;
  prescriber_address: string;
  prescriber_zipcode: string;
  medication_name_match: string;
}

interface FindPrescribersParams {
  medicationName: string;
  zipcode: string;
}

export async function findPrescribersInDB({ medicationName, zipcode }: FindPrescribersParams): Promise<PrescriberRecord[]> {
  if (!medicationName || !zipcode) {
    return [];
  }

  const client = new Client(dbConfig);
  try {
    await client.connect();
    // This query assumes you have tables:
    // prescribers (id, name, address, zipcode)
    // medications (id, name)
    // prescriptions (prescriber_id, medication_id)
    // It performs a case-insensitive search for medication name and an exact match for zipcode.
    const query = `
      SELECT 
        p.name AS prescriber_name,
        p.address AS prescriber_address,
        p.zipcode AS prescriber_zipcode,
        m.name AS medication_name_match
      FROM 
        prescribers p
      JOIN 
        prescriptions presc ON p.id = presc.prescriber_id
      JOIN 
        medications m ON presc.medication_id = m.id
      WHERE 
        m.name ILIKE $1 
        AND p.zipcode = $2
      LIMIT 50; 
    `;
    // Using ILIKE for case-insensitive partial match on medication name.
    // Add more specific FTS or exact matching if needed.
    const res = await client.query<PrescriberRecord>(query, [`%${medicationName}%`, zipcode]);
    return res.rows;
  } catch (error: any) {
    console.error('Error finding prescribers:', error);
    // In a real app, you might throw the error or return a more specific error object
    return []; 
  } finally {
    await client.end();
  }
}
