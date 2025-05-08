// This file previously contained mock data and functions for development.
// It is now deprecated as the application should fetch real data from the API.

// Keeping interface definitions if they are used elsewhere,
// but ideally these should align with types derived from the API/DB schema (e.g., in supabase.ts or api-client.ts)

export interface Medication {
  id: string;
  name: string;
  genericName: string;
  category: string;
  description: string;
  providerCount: number; // This might need to be calculated differently with real data
}

// Note: The primary Provider type should be imported from '@/lib/supabase'
// export interface Provider { ... } // Removed local definition
