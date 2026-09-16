import { Controller, Get } from '@nestjs/common';
import type { HealthCheck } from '@praman/schemas';
import { HealthCheckSchema } from '@praman/schemas';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth(): HealthCheck {
    const healthData: HealthCheck = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '0.0.1',
      service: 'api',
    };
    return HealthCheckSchema.parse(healthData);
  }
}
