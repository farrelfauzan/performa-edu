import { Controller } from '@nestjs/common';
import { HealthService } from './health.service';
import {
  AuthServiceHealthCheckResponse,
  AuthServiceHealthCheckResponse_ServingStatus,
  AuthServiceHealthControllerMethods,
  AuthServiceHealthMonitorControllerMethods,
} from '@performa-edu/proto-types/auth-service-health';

@Controller()
@AuthServiceHealthControllerMethods()
@AuthServiceHealthMonitorControllerMethods()
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  async check(): Promise<AuthServiceHealthCheckResponse> {
    try {
      const result = await this.healthService.checkHealth();

      return {
        status: AuthServiceHealthCheckResponse_ServingStatus.SERVING,
        details: this.formatDetails(result),
      };
    } catch (error) {
      return {
        status: AuthServiceHealthCheckResponse_ServingStatus.NOT_SERVING,
        details: {
          error: error.message,
          timestamp: Date.now().toString(),
        },
      };
    }
  }

  async watch(): Promise<AuthServiceHealthCheckResponse> {
    // For gRPC streaming health checks
    // This is a simplified implementation
    return this.check();
  }

  // Additional endpoints for different health check types
  async checkLiveness(): Promise<AuthServiceHealthCheckResponse> {
    try {
      const result = await this.healthService.checkLiveness();
      return {
        status: AuthServiceHealthCheckResponse_ServingStatus.SERVING,
        details: this.formatDetails(result),
      };
    } catch (error) {
      return {
        status: AuthServiceHealthCheckResponse_ServingStatus.NOT_SERVING,
        details: { error: error.message },
      };
    }
  }

  async checkReadiness(): Promise<AuthServiceHealthCheckResponse> {
    try {
      const result = await this.healthService.checkReadiness();
      return {
        status: AuthServiceHealthCheckResponse_ServingStatus.SERVING,
        details: this.formatDetails(result),
      };
    } catch (error) {
      return {
        status: AuthServiceHealthCheckResponse_ServingStatus.NOT_SERVING,
        details: { error: error.message },
      };
    }
  }

  private formatDetails(result: any): { [key: string]: string } {
    const details: { [key: string]: string } = {};

    if (result.details) {
      Object.keys(result.details).forEach((key) => {
        const value = result.details[key];
        if (typeof value === 'object') {
          details[key] = JSON.stringify(value);
        } else {
          details[key] = String(value);
        }
      });
    }

    return details;
  }
}
