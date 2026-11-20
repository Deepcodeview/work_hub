import { HealthCheckResponse, ApiResult } from '@workhub/contracts';

export class WorkHubApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = 'http://localhost:4000') {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async getHealth(): Promise<HealthCheckResponse> {
    const res = await fetch(`${this.baseUrl}/api/v1/health`);
    if (!res.ok) {
      throw new Error(`Health check failed with status: ${res.status}`);
    }
    return (await res.json()) as HealthCheckResponse;
  }
}
