
"use server";

import { Client } from 'pg';
import type { QueryResultRow } from 'pg';

interface NodeSearchResult extends QueryResultRow {
  node_name: string;
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

export async function searchNodes(query: string): Promise<{ success: boolean; results?: NodeSearchResult[]; message?: string }> {
  if (!query.trim()) {
    return { success: true, results: [] };
  }

  const client = new Client(dbConfig);
  try {
    await client.connect();
    const searchQuery = `
      SELECT 
        node_name,
        ts_headline('pg_catalog.english', node_name, websearch_to_tsquery('pg_catalog.english', $1), 'HighlightAll=FALSE,StartSel=<mark>,StopSel=</mark>') as highlighted_name
      FROM spock.node
      WHERE to_tsvector('pg_catalog.english', node_name) @@ websearch_to_tsquery('pg_catalog.english', $1)
      ORDER BY ts_rank(to_tsvector('pg_catalog.english', node_name), websearch_to_tsquery('pg_catalog.english', $1)) DESC
      LIMIT 20;
    `;
    const res = await client.query<NodeSearchResult>(searchQuery, [query]);
    return { success: true, results: res.rows };
  } catch (error: any) {
    console.error('Search Error:', error);
    return { success: false, message: error.message || 'An error occurred during search.', results: [] };
  } finally {
    await client.end();
  }
}
