import { supabase, Provider } from './supabase';

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_BACKOFF_MS = 1000;
const DEFAULT_REQUEST_TIMEOUT_MS = 15000; // 15 seconds timeout per request attempt

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
  timeoutMs?: number; // Allow overriding timeout
}

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
  id: string; // Changed to string to match backend response alias
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
    this.baseUrl = options?.baseUrl || '/api';
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.initialBackoffMs = options?.initialBackoffMs ?? DEFAULT_INITIAL_BACKOFF_MS;
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    // Shorten timeout for getting session to avoid blocking request
    const sessionPromise = supabase.auth.getSession();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Get session timed out")), 2000)); // 2s timeout for session

    let session = null;
    try {
        const { data } = await Promise.race([sessionPromise, timeoutPromise]) as { data: { session: any } };
        session = data.session;
    } catch (e) {
        console.warn("Failed or timed out getting Supabase session for auth header:", e);
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  }

  private async request<T>(
    method: string,
    endpoint: string,
    data?: unknown,
    attempt: number = 1
  ): Promise<T> {
    const headers = await this.getAuthHeaders(); // Fetch headers first

    // AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    const config: RequestInit = {
      method,
      headers,
      signal: controller.signal, // Assign AbortController's signal
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, config);
      clearTimeout(timeoutId); // Clear timeout if fetch resolves/rejects

      if (!response.ok) {
        let errorData: any = { message: `HTTP error ${response.status}` };
        try {
          // Try to parse JSON, but handle non-JSON responses gracefully
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
        console.error(`API Error ${response.status} on attempt ${attempt}: ${errorMessage}`, errorData);

        const shouldRetry = (response.status >= 500 || response.status === 0) && attempt < this.maxRetries;

        if (shouldRetry) {
          const backoffTime = this.initialBackoffMs * Math.pow(2, attempt - 1);
          console.log(`Retrying request to ${url} in ${backoffTime}ms (attempt ${attempt + 1}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          return this.request<T>(method, endpoint, data, attempt + 1); // Recursive call for retry
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
      clearTimeout(timeoutId); // Clear timeout if fetch throws an error (e.g., network error, abort)

      if (error instanceof ApiError) {
        throw error; // Re-throw ApiError directly
      }

      let errorMessage = 'An unknown network error occurred during the API request.';
      let errorStatus = 0; // Use 0 for network/unknown errors

      if (error instanceof Error) {
          errorMessage = error.message;
          if (error.name === 'AbortError') {
              errorMessage = `Request timed out after ${this.timeoutMs}ms`;
              errorStatus = 408; // Request Timeout status
              console.warn(`Request to ${url} aborted due to timeout.`);
          }
      }

      console.error(`Network/fetch error for ${url} on attempt ${attempt}:`, errorMessage, error);

      // Retry only for specific network errors or timeouts if desired, and within retry limits
      const shouldRetryNetworkError = (error instanceof Error && error.name === 'AbortError' || !(error instanceof ApiError)) && attempt < this.maxRetries;

      if (shouldRetryNetworkError) {
        const backoffTime = this.initialBackoffMs * Math.pow(2, attempt - 1);
        console.log(`Retrying request to ${url} due to network/timeout error in ${backoffTime}ms (attempt ${attempt + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return this.request<T>(method, endpoint, data, attempt + 1);
      }

      // If not retrying, throw a consistent ApiError
      throw new ApiError(errorMessage, errorStatus, error);
    }
  }

  public get<T>(endpoint: string): Promise<T> {
    return this.request<T>('GET', endpoint);
  }

  public post<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>('POST', endpoint, data);
  }

  public put<T>(endpoint: string, data: unknown): Promise<T> {
    return this.request<T>('PUT', endpoint, data);
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>('DELETE', endpoint);
  }

  // --- Auth & User ---
  public async syncUser(userData: { supabase_user_id: string; email?: string }): Promise<{ success: boolean; message?: string; data?: any }> {
    return this.post<{ success: boolean; message?: string; data?: any }>('/sync-user', userData);
  }

  public async fetchUserMembership(userId: string): Promise<{ membershipTier: 'basic' | 'premium' | 'expert' | null; data?: any }> {
    return this.post<{ membershipTier: 'basic' | 'premium' | 'expert' | null; data?: any }>('/user-membership', { userId });
  }

  // --- Provider Search & Details ---
  public async findProviders(params: SearchApiParams): Promise<PaginatedProvidersApiResponse> {
    return this.post<PaginatedProvidersApiResponse>('/find-providers', params);
  }

  public async getDrugSuggestions(query: string): Promise<string[]> {
    if (!query) return [];
    return this.get<string[]>(`/drug-suggestions?q=${encodeURIComponent(query)}`);
  }

  public async getProviderDetails(providerId: string): Promise<Provider> {
    return this.get<Provider>(`/providers/${providerId}`);
  }

  // --- User Location Management ---
  public async getUserLocations(): Promise<UserLocation[]> {
    return this.get<UserLocation[]>('/user/locations');
  }

  public async addUserLocation(locationData: Omit<UserLocation, 'id' | 'isPrimary'>): Promise<UserLocation> {
    return this.post<UserLocation>('/user/locations', locationData);
  }

  public async deleteUserLocation(locationId: string): Promise<{ success: boolean }> {
    return this.delete<{ success: boolean }>(`/user/locations/${locationId}`);
  }

  public async setPrimaryLocation(locationId: string): Promise<{ success: boolean }> {
      return this.put<{ success: boolean }>(`/user/locations/${locationId}/set-primary`, {});
  }
}

export const apiClient = new ApiClient();
