import { supabase, Provider } from './supabase'; // Keep supabase import if needed elsewhere, but not for getSession here

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_BACKOFF_MS = 1000;
const DEFAULT_REQUEST_TIMEOUT_MS = 15000;

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

interface ApiClientOptions {
  baseUrl?: string;
  maxRetries?: number;
  initialBackoffMs?: number;
  timeoutMs?: number;
}

// ... (Keep interface definitions: SearchApiParams, PaginatedProvidersApiResponse, UserLocation) ...
export interface SearchApiParams {
  drugName: string;
  radiusMiles?: number;
  minClaims?: number;
  taxonomyClass?: string | null;
  sortBy?: 'distance' | 'claims' | 'name';
  zipCode: string;
  locationName?: string;
  acceptedInsurance?: string[];
  minRating?: number;
  cursor?: string | number;
  limit?: number;
}

export interface PaginatedProvidersApiResponse {
  data: Provider[];
  nextCursor: number | string | null;
  totalCount: number;
}

export interface UserLocation {
  id: string;
  name: string;
  zipCode: string;
  isPrimary?: boolean;
}


class ApiClient {
  private baseUrl: string;
  private maxRetries: number;
  private initialBackoffMs: number;
  private timeoutMs: number;

  constructor(options?: ApiClientOptions) {
    this.baseUrl = options?.baseUrl || import.meta.env.VITE_API_BASE_URL || '/api';
    if (this.baseUrl === '/api') {
        console.warn("VITE_API_BASE_URL not set, using relative path '/api'. This might not work correctly.");
    }
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.initialBackoffMs = options?.initialBackoffMs ?? DEFAULT_INITIAL_BACKOFF_MS;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  }

  // REMOVED getAuthHeaders method

  private async request<T>(
    method: string,
    endpoint: string,
    // Add optional token argument
    options?: { data?: unknown; token?: string | null; attempt?: number }
  ): Promise<T> {
    const { data, token, attempt = 1 } = options || {};

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    // Add Authorization header ONLY if token is provided
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn(`ApiClient: Making unauthenticated request to ${method} ${endpoint}`);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const config: RequestInit = {
      method,
      headers,
      signal: controller.signal,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      console.log(`API Request: ${method} ${url} (Token: ${token ? 'Yes' : 'No'})`);
      const response = await fetch(url, config);
      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorData: any = { message: `HTTP error ${response.status}` };
        try {
          const text = await response.text();
          try {
              errorData = JSON.parse(text);
              if (typeof errorData !== 'object' || errorData === null) {
                 errorData = { message: text || `HTTP error ${response.status}` };
              }
          } catch (parseError) {
              errorData = { message: text || `HTTP error ${response.status}` };
          }
        } catch (e) {
          errorData = { message: response.statusText || `HTTP error ${response.status}` };
        }

        const errorMessage = errorData?.message || errorData?.error?.message || `API request failed with status ${response.status}`;
        console.error(`API Error ${response.status} on attempt ${attempt} for ${url}: ${errorMessage}`, errorData);

        // Don't retry auth errors (401, 403)
        const shouldRetry = (response.status >= 500 || response.status === 0 || response.status === 408) && attempt < this.maxRetries;

        if (shouldRetry) {
          const backoffTime = this.initialBackoffMs * Math.pow(2, attempt - 1);
          console.log(`Retrying request to ${url} in ${backoffTime}ms (attempt ${attempt + 1}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          // Pass original options (including token and data) for retry
          return this.request<T>(method, endpoint, { ...options, attempt: attempt + 1 });
        }

        throw new ApiError(errorMessage, response.status, errorData);
      }

      const contentType = response.headers.get('content-type');
      if (response.status === 204 || !contentType) {
        return null as T;
      }

      if (contentType && contentType.includes('application/json')) {
        return await response.json() as T;
      }

      console.warn(`Unexpected content type: ${contentType}. Attempting to read as text.`);
      return await response.text() as unknown as T;

    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      let errorMessage = 'An unknown network error occurred during the API request.';
      let errorStatus = 0;

      if (error instanceof Error) {
          errorMessage = error.message;
          if (error.name === 'AbortError') {
              errorMessage = `Request timed out after ${this.timeoutMs}ms`;
              errorStatus = 408;
              console.warn(`Request to ${url} aborted due to timeout.`);
          }
      }

      console.error(`Network/fetch error for ${url} on attempt ${attempt}:`, errorMessage, error);

      const shouldRetryNetworkError = (error instanceof Error && error.name === 'AbortError' || !(error instanceof ApiError)) && attempt < this.maxRetries;

      if (shouldRetryNetworkError) {
        const backoffTime = this.initialBackoffMs * Math.pow(2, attempt - 1);
        console.log(`Retrying request to ${url} due to network/timeout error in ${backoffTime}ms (attempt ${attempt + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return this.request<T>(method, endpoint, { ...options, attempt: attempt + 1 });
      }

      throw new ApiError(errorMessage, errorStatus, error);
    }
  }

  // --- Update methods to accept optional token ---

  public get<T>(endpoint: string, token?: string | null): Promise<T> {
    return this.request<T>('GET', endpoint, { token });
  }

  public post<T>(endpoint: string, data: unknown, token?: string | null): Promise<T> {
    return this.request<T>('POST', endpoint, { data, token });
  }

  public put<T>(endpoint: string, data: unknown, token?: string | null): Promise<T> {
    return this.request<T>('PUT', endpoint, { data, token });
  }

  public delete<T>(endpoint: string, token?: string | null): Promise<T> {
    return this.request<T>('DELETE', endpoint, { token });
  }

  // --- Update specific API calls to accept token ---

  public async syncUser(userData: { supabase_user_id: string; email?: string }, token: string | null): Promise<{ success: boolean; message?: string; data?: any }> {
    return this.post<{ success: boolean; message?: string; data?: any }>('/sync-user', userData, token);
  }

  public async fetchUserMembership(userId: string, token: string | null): Promise<{ membershipTier: 'basic' | 'premium' | 'expert' | null; data?: any }> {
    // Ensure userId is passed correctly in the body
    return this.post<{ membershipTier: 'basic' | 'premium' | 'expert' | null; data?: any }>('/user-membership', { userId }, token);
  }

  public async findProviders(params: SearchApiParams, token: string | null): Promise<PaginatedProvidersApiResponse> {
    return this.post<PaginatedProvidersApiResponse>('/find-providers', params, token);
  }

  public async getDrugSuggestions(query: string, token?: string | null): Promise<string[]> {
    if (!query) return [];
    // Ensure this endpoint exists and works on the backend
    return this.get<string[]>(`/drug-suggestions?q=${encodeURIComponent(query)}`, token);
  }

  public async getProviderDetails(providerId: string, token: string | null): Promise<Provider> {
    return this.get<Provider>(`/providers/${providerId}`, token);
  }

  public async getUserLocations(token: string | null): Promise<UserLocation[]> {
    return this.get<UserLocation[]>('/user/locations', token);
  }

  public async addUserLocation(locationData: Omit<UserLocation, 'id' | 'isPrimary'>, token: string | null): Promise<UserLocation> {
    return this.post<UserLocation>('/user/locations', locationData, token);
  }

  public async deleteUserLocation(locationId: string, token: string | null): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/user/locations/${locationId}`, token);
  }

  public async setPrimaryLocation(locationId: string, token: string | null): Promise<{ success: boolean }> {
      return this.put<{ success: boolean }>(`/user/locations/${locationId}/set-primary`, {}, token);
  }
}

export const apiClient = new ApiClient();
