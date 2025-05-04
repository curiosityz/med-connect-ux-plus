
import { supabase } from './supabase';

// API configuration
const API_BASE_URL = 'http://31.220.104.20:3001';

// Interface for the API response
export interface ProviderSearchResult {
  npi: number;
  provider_first_name: string;
  provider_last_name_legal_name: string;
  taxonomy_class: string;
  practice_address1: string;
  practice_address2?: string;
  practice_city: string;
  practice_state: string;
  practice_zip: string;
  drug: string;
  claims: number;
  distance_miles: string;
}

export interface UserLocation {
  id: string;
  user_id: string;
  location_name: string;
  zip_code: string;
  is_primary: boolean;
}

export interface ProviderSearchParams {
  drugName: string;
  radiusMiles?: number;
  minClaims?: number;
  taxonomyClass?: string;
  sortBy?: 'distance' | 'claims';
  locationName?: string;
  zipCode?: string;
}

// Get current session token
const getAuthToken = async (): Promise<string | null> => {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
};

// Fetch user's saved locations
export const fetchUserLocations = async (): Promise<UserLocation[]> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}/api/user-locations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch locations');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw error;
  }
};

// Find providers based on search criteria
export const findProviders = async (params: ProviderSearchParams): Promise<ProviderSearchResult[]> => {
  try {
    const token = await getAuthToken();
    if (!token) throw new Error('Authentication required');

    const response = await fetch(`${API_BASE_URL}/api/find-providers`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(params)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error ${response.status}: Failed to find providers`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error finding providers:', error);
    throw error;
  }
};
