
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
  password: process.env.PG_PASSWORD,
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
    // It's good practice to use a specific dictionary, e.g., 'english'
    // HighlightAll=TRUE might be too aggressive for long text, but fine for node_name
    // Using 'simple' dictionary for broader matching without stemming, if 'english' is too restrictive or not configured.
    // Or use 'pg_catalog.english' for built-in english.
    const searchQuery = `
      SELECT 
        node_name,
        ts_headline('pg_catalog.english', node_name, websearch_to_tsquery('pg_catalog.english', $1), 'HighlightAll=FALSE,StartSel=<mark class=\"bg-accent/30 rounded px-1\">,StopSel=</mark>') as highlighted_name
      FROM spock.node
      WHERE to_tsvector('pg_catalog.english', node_name) @@ websearch_to_tsquery('pg_catalog.english', $1)
      ORDER BY ts_rank(to_tsvector('pg_catalog.english', node_name), websearch_to_tsquery('pg_catalog.english', $1)) DESC
      LIMIT 20;
    `;
    const res = await client.query<NodeSearchResult>(searchQuery, [query]);
    return { success: true, results: res.rows };
  } catch (error: any) {
    console.error('Search Error:', error);
    // Check for common errors, like relation not found
     if (error.message.includes('relation "spock.node" does not exist')) {
      return { success: false, message: 'The table "spock.node" was not found. Please ensure it exists.' };
    }
    if (error.message.includes('text search configuration')) {
       return { success: false, message: 'Text search configuration error. Please check PostgreSQL setup.'};
    }
    return { success: false, message: error.message || 'Failed to perform search.' };
  } finally {
    await client.end();
  }
}
