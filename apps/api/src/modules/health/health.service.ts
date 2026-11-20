import { Injectable } from '@nestjs/common';
import { HealthCheckResponse, ServiceHealthStatus } from '@workhub/contracts';
import { PrismaService } from '../prisma/prisma.service';
import Redis from 'ioredis';

@Injectable()
export class HealthService {
  private startTime = Date.now();

  constructor(private readonly prisma: PrismaService) {}

  async checkHealth(): Promise<HealthCheckResponse> {
    const dbStatus = await this.checkDatabase();
    const redisStatus = await this.checkRedis();
    const storageStatus = await this.checkStorage();

    return {
      success: true,
      data: {
        appName: 'WorkHub API',
        version: '0.1.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
        services: {
          database: dbStatus,
          redis: redisStatus,
          storage: storageStatus,
        },
      },
    };
  }

  private async checkDatabase(): Promise<ServiceHealthStatus> {
    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        status: 'unhealthy',
        message: err.message || 'Database connection error',
        latencyMs: Date.now() - start,
      };
    }
  }

  private async checkRedis(): Promise<ServiceHealthStatus> {
    const start = Date.now();
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    try {
      const client = new Redis(redisUrl, {
        connectTimeout: 2000,
        maxRetriesPerRequest: 1,
        lazyConnect: true,
      });
      await client.connect();
      await client.ping();
      await client.quit();
      return {
        status: 'healthy',
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        status: 'unhealthy',
        message: err.message || 'Redis connection error',
        latencyMs: Date.now() - start,
      };
    }
  }

  private async checkStorage(): Promise<ServiceHealthStatus> {
    const endpoint = process.env.STORAGE_ENDPOINT || 'http://localhost:9000';
    return {
      status: 'healthy',
      message: `Configured for ${endpoint}`,
    };
  }
}
