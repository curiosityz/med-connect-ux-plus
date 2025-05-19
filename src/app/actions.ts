
"use server";

import type { QueryResultRow } from 'pg';
import { Client } from 'pg';

interface TableSearchResult extends QueryResultRow {
  table_name: string;
  highlighted_name: string;
}

// Ensure these environment variables are set in your .env.local file
const dbConfig = {
  host: process.env.PG_HOST,
  user: process.env.PG_USER,
  database: process.env.PG_DATABASE,
  password: process.env.NEXT_DB_PASSWORD,
  port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
  ssl: process.env.PG_SSLMODE === 'require'
    ? { rejectUnauthorized: false } // NOTE: For production, prefer providing CA certs and setting rejectUnauthorized to true.
    : undefined,
};

export async function testConnection(): Promise<{ success: boolean; message: string; data?: any }> {
  const client = new Client(dbConfig);
  try {
    await client.connect();
    const res = await client.query('SELECT NOW() as now');
    return { success: true, message: 'Connection successful!', data: res.rows[0] };
  } catch (error: any) {
    console.error('Connection Test Error:', error);
    return { success: false, message: error.message || 'Failed to connect to the database.' };
  } finally {
    await client.end();
  }
}

export async function searchTables(query: string): Promise<{ success: boolean; results?: TableSearchResult[]; message?: string }> {
  if (!query.trim()) {
    return { success: true, results: [] };
  }

  const client = new Client(dbConfig);
  try {
    await client.connect();
    // Search for table names in information_schema.tables
    // Exclude common system schemas and 'spock' schema
    const searchQuery = `
      SELECT 
        table_name,
        ts_headline('pg_catalog.english', table_name, websearch_to_tsquery('pg_catalog.english', $1), 'StartSel=<mark>,StopSel=</mark>,HighlightAll=FALSE') as highlighted_name
      FROM information_schema.tables
      WHERE 
        table_schema NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'spock')
        AND to_tsvector('pg_catalog.english', table_name) @@ websearch_to_tsquery('pg_catalog.english', $1)
      ORDER BY ts_rank(to_tsvector('pg_catalog.english', table_name), websearch_to_tsquery('pg_catalog.english', $1)) DESC
      LIMIT 20;
    `;
    const res = await client.query<TableSearchResult>(searchQuery, [query]);
    return { success: true, results: res.rows };
  } catch (error: any) {
    console.error('Search Tables Error:', error);
    return { success: false, message: error.message || 'An error occurred during table search.', results: [] };
  } finally {
    await client.end();
  }
}

