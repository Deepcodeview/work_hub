/**
 * API Contract Conventions & Shared Types
 */

export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    cursor?: string;
    nextCursor?: string;
  };
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiErrorResponse;

export interface ServiceHealthStatus {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latencyMs?: number;
  message?: string;
}

export interface HealthCheckResponseData {
  appName: string;
  version: string;
  timestamp: string;
  environment: string;
  uptimeSeconds: number;
  services: {
    database: ServiceHealthStatus;
    redis: ServiceHealthStatus;
    storage: ServiceHealthStatus;
  };
}

export type HealthCheckResponse = ApiResponse<HealthCheckResponseData>;
