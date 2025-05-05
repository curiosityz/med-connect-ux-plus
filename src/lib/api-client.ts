// Assuming supabase client is initialized and exported from './supabase'
import { supabase } from './supabase';

// API configuration
// Ensure this points to your running Node.js backend server
const API_BASE_URL = 'http://31.220.104.20:3001'; // Or http://localhost:3001 if running locally

// --- Interfaces (Type Definitions) ---

// Matches the expected output structure from the PostgreSQL function
export interface ProviderSearchResult {
  npi: number;
  provider_first_name: string;
  provider_last_name_legal_name: string;
  taxonomy_class: string;
  practice_address1: string;
  practice_address2?: string | null; // Allow null as well as undefined
  practice_city: string;
  practice_state: string;
  practice_zip: string;
  // Include other columns returned by the function if needed:
  // provider_credential_text?: string;
  // practice_phone?: string;
  // mailing_address1?: string | null;
  // mailing_city?: string;
  // claims_state?: string;
  drug: string;
  claims: number;
  distance_miles: string; // PostgreSQL returns numeric as string sometimes
}

// Matches the structure expected for user location data
export interface UserLocation {
  // Assuming Supabase API returns these field names for your user_locations table
  user_location_id: number; // Assuming SERIAL primary key was used
  user_id: string;          // Supabase User ID (UUID)
  location_name: string;
  zip_code: string;
  is_primary: boolean;
  created_at: string;     // ISO timestamp string
}

// Parameters for the main provider search API call
export interface ProviderSearchParams {
  drugName: string;
  radiusMiles?: number;
  minClaims?: number;
  taxonomyClass?: string;
  sortBy?: 'distance' | 'claims';
  locationName?: string; // Sent if Premium tier
  zipCode?: string;      // Sent if Expert tier
}

// Structure for the user profile data, especially the tier
// Adjust field names based on your ACTUAL Supabase profiles/app_users table
export interface UserProfile {
  id?: string; // Supabase user UUID (might be included in profile data)
  membership_tier: 'basic' | 'premium' | 'expert';
  email?: string; // Optional
  // Add other relevant fields from your Supabase profiles table
}


// --- Helper Function ---

// Get current session token from Supabase Auth
const getAuthToken = async (): Promise<string | null> => {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Error getting Supabase session:", error);
    return null;
  }
  // Return null if no session or token found
  return data.session?.access_token ?? null;
};


// --- API Functions ---

/**
 * Fetches the current user's profile (including membership tier)
 * from your backend API.
 */
export const fetchUserProfile = async (): Promise<UserProfile | null> => {
  const token = await getAuthToken();
  // No token likely means user not logged in, handle appropriately upstream
  if (!token) {
      console.log("fetchUserProfile: No auth token found, user likely not logged in.");
      return null; // Or throw new Error('Authentication required');
  }

  const endpoint = `${API_BASE_URL}/api/profile`; // Example endpoint
  console.log(`Fetching user profile from ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json' // Good practice even for GET
      }
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: Failed to fetch user profile`;
       try {
         const errorData = await response.json();
         errorMessage = errorData.error || errorMessage;
       } catch (e) { /* Ignore if error body isn't JSON */ }
       console.error('Error response fetching profile:', response.status, errorMessage);
      throw new Error(errorMessage);
    }

    const data: UserProfile = await response.json();
    console.log('User profile fetched successfully:', data);
    // Ensure tier exists, default if needed, or let hook handle it
    if (!data?.membership_tier) {
         console.warn("Fetched profile data missing 'membership_tier'.");
         // Optionally return a default or throw an error depending on requirements
         // return { ...data, membership_tier: 'basic' };
    }
    return data;

  } catch (error) {
    console.error('Error fetching user profile:', error);
    // Re-throw the error so react-query handles it
    throw error;
  }
};


/**
 * Fetches the current user's saved locations from your backend API.
 */
export const fetchUserLocations = async (): Promise<UserLocation[]> => {
  const token = await getAuthToken();
  if (!token) throw new Error('Authentication required'); // Need auth to get locations

  const endpoint = `${API_BASE_URL}/api/user-locations`; // Example endpoint
  console.log(`Fetching user locations from ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
       let errorMessage = `Error ${response.status}: Failed to fetch locations`;
       try {
         const errorData = await response.json();
         errorMessage = errorData.error || errorMessage;
       } catch (e) { /* Ignore if error body isn't JSON */ }
       console.error('Error response fetching locations:', response.status, errorMessage);
      throw new Error(errorMessage);
    }

    const data: UserLocation[] = await response.json();
    console.log('Locations fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};


/**
 * Calls the backend API to find providers based on search criteria.
 */
export const findProviders = async (params: ProviderSearchParams): Promise<ProviderSearchResult[]> => {
  const token = await getAuthToken();
  // Allow potentially unauthenticated searches if your API supports it?
  // Or throw error if required:
  if (!token) throw new Error('Authentication required');

  const endpoint = `${API_BASE_URL}/api/find-providers`;
  console.log(`Searching providers at ${endpoint} with params:`, params);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`, // Send token even if API allows anon later
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params) // Send search params in the body
    });

    if (!response.ok) {
      let errorMessage = `Error ${response.status}: Failed to find providers`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) { /* Ignore if error body isn't JSON */ }
      console.error('Error response finding providers:', response.status, errorMessage);
      throw new Error(errorMessage);
    }

    const data: ProviderSearchResult[] = await response.json();
    console.log(`Found ${data.length} providers for ${params.drugName}`);
    return data;
  } catch (error) {
    console.error('Error finding providers:', error);
    throw error;
  }
};
