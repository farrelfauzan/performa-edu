import { Injectable } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  HealthCheckResult,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '@performa-edu/libs';

@Injectable()
export class HealthService {
  constructor(
    private health: HealthCheckService,
    private prisma: PrismaService
  ) {}

  @HealthCheck()
  async checkHealth(): Promise<HealthCheckResult> {
    return this.health.check([
      // Check Prisma connection
      () => this.checkPrismaHealth(),

      // Check memory usage
      () => this.checkMemoryHealth(),
    ]);
  }

  @HealthCheck()
  async checkLiveness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Basic service availability check
      () => this.checkServiceHealth(),
    ]);
  }

  @HealthCheck()
  async checkReadiness(): Promise<HealthCheckResult> {
    return this.health.check([
      // Prisma readiness
      () => this.checkPrismaHealth(),
    ]);
  }

  private async checkPrismaHealth(): Promise<HealthIndicatorResult> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        prisma: {
          status: 'up',
          message: 'Prisma connection is healthy',
        },
      };
    } catch (error) {
      throw new Error(`Prisma connection failed: ${error.message}`);
    }
  }

  private async checkServiceHealth(): Promise<HealthIndicatorResult> {
    return {
      service: {
        status: 'up',
        uptime: process.uptime(),
        timestamp: Date.now(),
        message: 'Auth service is running',
      },
    };
  }

  private async checkMemoryHealth(): Promise<HealthIndicatorResult> {
    const used = process.memoryUsage();
    const heapUsedMB = Math.round((used.heapUsed / 1024 / 1024) * 100) / 100;
    const heapTotalMB = Math.round((used.heapTotal / 1024 / 1024) * 100) / 100;

    const isHealthy = heapUsedMB < 500; // Consider unhealthy if using more than 500MB

    if (!isHealthy) {
      throw new Error(`High memory usage: ${heapUsedMB}MB`);
    }

    return {
      memory: {
        status: 'up',
        heapUsed: `${heapUsedMB}MB`,
        heapTotal: `${heapTotalMB}MB`,
        rss: `${Math.round((used.rss / 1024 / 1024) * 100) / 100}MB`,
      },
    };
  }

  // Method to update gRPC health status
  setGrpcHealthStatus(
    service: string,
    status: 'SERVING' | 'NOT_SERVING' | 'UNKNOWN'
  ) {
    // This will be used by the gRPC health implementation
    return { service, status };
  }
}
