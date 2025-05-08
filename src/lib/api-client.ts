import { supabase, Provider } from './supabase';

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_INITIAL_BACKOFF_MS = 1000;

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
  cursor?: string | number; // Can be offset (number) or actual cursor (string)
  limit?: number;
}

// Define the paginated response structure matching the backend
export interface PaginatedProvidersApiResponse {
  data: Provider[];
  nextCursor: number | string | null; // Backend uses offset (number) currently
  totalCount: number;
}


class ApiClient {
  private baseUrl: string;
  private maxRetries: number;
  private initialBackoffMs: number;

  constructor(options?: ApiClientOptions) {
    this.baseUrl = options?.baseUrl || '/api';
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.initialBackoffMs = options?.initialBackoffMs ?? DEFAULT_INITIAL_BACKOFF_MS;
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
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
    const headers = await this.getAuthHeaders();
    const config: RequestInit = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
      config.body = JSON.stringify(data);
    }

    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        let errorData: any = { message: `HTTP error ${response.status}` };
        try {
          const responseBody = await response.clone().json();
          errorData = responseBody;
        } catch (e) {
          errorData = { message: response.statusText || `HTTP error ${response.status}` };
        }

        const errorMessage = errorData?.message || errorData?.error?.message || `API request failed with status ${response.status}`;
        console.error(`API Error ${response.status} on attempt ${attempt}: ${errorMessage}`, errorData);

        const shouldRetry =
          (response.status >= 500 || response.status === 0) &&
          attempt < this.maxRetries;

        if (shouldRetry) {
          const backoffTime = this.initialBackoffMs * Math.pow(2, attempt - 1);
          console.log(`Retrying request to ${url} in ${backoffTime}ms (attempt ${attempt + 1}/${this.maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          return this.request<T>(method, endpoint, data, attempt + 1);
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
      if (error instanceof ApiError) {
        throw error;
      }

      console.error(`Network or other error during API request to ${url} on attempt ${attempt}:`, error);

      if (attempt < this.maxRetries) {
        const backoffTime = this.initialBackoffMs * Math.pow(2, attempt - 1);
        console.log(`Retrying request to ${url} due to network/other error in ${backoffTime}ms (attempt ${attempt + 1}/${this.maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
        return this.request<T>(method, endpoint, data, attempt + 1);
      }

      const message = error instanceof Error ? error.message : 'An unknown network error occurred during the API request.';
      throw new ApiError(message, 0, error);
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

  public async syncUser(userData: { supabase_user_id: string; email?: string }): Promise<{ success: boolean; message?: string; data?: any }> {
    return this.post<{ success: boolean; message?: string; data?: any }>('/sync-user', userData);
  }

  public async fetchUserMembership(userId: string): Promise<{ membershipTier: 'basic' | 'premium' | 'expert' | null; data?: any }> {
    return this.post<{ membershipTier: 'basic' | 'premium' | 'expert' | null; data?: any }>('/user-membership', { userId });
  }

  // Updated method signature
  public async findProviders(params: SearchApiParams): Promise<PaginatedProvidersApiResponse> {
    return this.post<PaginatedProvidersApiResponse>('/find-providers', params);
  }

  // Method for drug suggestions
  public async getDrugSuggestions(query: string): Promise<string[]> {
    if (!query) return [];
    return this.get<string[]>(`/drug-suggestions?q=${encodeURIComponent(query)}`);
  }
}

export const apiClient = new ApiClient();
