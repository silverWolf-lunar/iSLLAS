import {
  ApiResponse,
  PaginatedResponse,
  Parcel,
  ParcelDetail,
  CreateParcelRequest,
  UpdateParcelRequest,
  ParcelStatusTransitionRequest,
  ParcelSearchParams,
  Application,
  ApplicationDetail,
  CreateApplicationRequest,
  ApplicationTransitionRequest,
  Lease,
  LeaseDetail,
  RecommendationRequest,
  RecommendationResponse,
  UserProfile,
  SyncChangesResponse,
  SyncPushRequest,
  SyncPushResponse,
} from '@sllas/contracts';

export interface ApiClientConfig {
  baseUrl: string;
  getAuthToken?: () => Promise<string | null> | string | null;
  onUnauthorized?: () => void;
  fetchFn?: typeof fetch;
}

export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>,
    public readonly correlationId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class SllasApiClient {
  private readonly baseUrl: string;
  private readonly getAuthToken?: () => Promise<string | null> | string | null;
  private readonly onUnauthorized?: () => void;
  private readonly fetchFn: typeof fetch;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, '');
    this.getAuthToken = config.getAuthToken;
    this.onUnauthorized = config.onUnauthorized;
    this.fetchFn = config.fetchFn || fetch.bind(globalThis);
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.getAuthToken) {
      const token = await this.getAuthToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await this.fetchFn(url, {
      ...options,
      headers,
      credentials: 'include', // Support HTTP-only cookies
    });

    if (response.status === 401 && this.onUnauthorized) {
      this.onUnauthorized();
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok) {
      const code = payload?.error?.code || 'UNKNOWN_ERROR';
      const message = payload?.error?.message || response.statusText;
      const details = payload?.error?.details;
      const correlationId = payload?.correlationId;
      throw new ApiError(response.status, code, message, details, correlationId);
    }

    return payload as ApiResponse<T>;
  }

  // ─── Auth & Profile ───

  async getMe(): Promise<ApiResponse<UserProfile>> {
    return this.request<UserProfile>('/api/v1/auth/me');
  }

  // ─── Land Parcels ───

  async listParcels(filter?: ParcelSearchParams): Promise<ApiResponse<PaginatedResponse<Parcel>>> {
    const params = new URLSearchParams();
    if (filter) {
      Object.entries(filter).forEach(([k, v]) => {
        if (v !== undefined && v !== null) params.append(k, String(v));
      });
    }
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<PaginatedResponse<Parcel>>(`/api/v1/parcels${query}`);
  }

  async getParcel(id: string): Promise<ApiResponse<ParcelDetail>> {
    return this.request<ParcelDetail>(`/api/v1/parcels/${id}`);
  }

  async createParcel(data: CreateParcelRequest, idempotencyKey?: string): Promise<ApiResponse<Parcel>> {
    return this.request<Parcel>('/api/v1/parcels', {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      body: JSON.stringify(data),
    });
  }

  async updateParcel(id: string, data: UpdateParcelRequest): Promise<ApiResponse<Parcel>> {
    return this.request<Parcel>(`/api/v1/parcels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async transitionParcelStatus(
    id: string,
    transition: ParcelStatusTransitionRequest,
  ): Promise<ApiResponse<Parcel>> {
    return this.request<Parcel>(`/api/v1/parcels/${id}/status`, {
      method: 'POST',
      body: JSON.stringify(transition),
    });
  }

  // ─── Applications ───

  async listApplications(cursor?: string, limit?: number): Promise<ApiResponse<PaginatedResponse<Application>>> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<PaginatedResponse<Application>>(`/api/v1/applications${query}`);
  }

  async getApplication(id: string): Promise<ApiResponse<ApplicationDetail>> {
    return this.request<ApplicationDetail>(`/api/v1/applications/${id}`);
  }

  async createApplication(
    data: CreateApplicationRequest,
    idempotencyKey?: string,
  ): Promise<ApiResponse<Application>> {
    return this.request<Application>('/api/v1/applications', {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      body: JSON.stringify(data),
    });
  }

  async transitionApplicationStatus(
    id: string,
    transition: ApplicationTransitionRequest,
  ): Promise<ApiResponse<Application>> {
    return this.request<Application>(`/api/v1/applications/${id}/transitions`, {
      method: 'POST',
      body: JSON.stringify(transition),
    });
  }

  // ─── Leases ───

  async listLeases(cursor?: string, limit?: number): Promise<ApiResponse<PaginatedResponse<Lease>>> {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    if (limit) params.append('limit', String(limit));
    const query = params.toString() ? `?${params.toString()}` : '';
    return this.request<PaginatedResponse<Lease>>(`/api/v1/leases${query}`);
  }

  async getLease(id: string): Promise<ApiResponse<LeaseDetail>> {
    return this.request<LeaseDetail>(`/api/v1/leases/${id}`);
  }

  // ─── Recommendations ───

  async getRecommendations(req: RecommendationRequest): Promise<ApiResponse<RecommendationResponse>> {
    return this.request<RecommendationResponse>('/api/v1/recommendations/run', {
      method: 'POST',
      body: JSON.stringify(req),
    });
  }

  // ─── Offline Sync ───

  async syncChanges(sinceCursor?: string): Promise<ApiResponse<SyncChangesResponse>> {
    const query = sinceCursor ? `?cursor=${encodeURIComponent(sinceCursor)}` : '';
    return this.request<SyncChangesResponse>(`/api/v1/sync/changes${query}`);
  }

  async pushOfflineChanges(data: SyncPushRequest, idempotencyKey?: string): Promise<ApiResponse<SyncPushResponse>> {
    return this.request<SyncPushResponse>('/api/v1/sync/push', {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      body: JSON.stringify(data),
    });
  }
}
