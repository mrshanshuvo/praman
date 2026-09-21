import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  DiskHealthIndicator,
  HealthCheck,
  HealthCheckService,
  HealthIndicatorService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../common/decorators/public.decorator.js';
import { PrismaService } from '../../core/database/prisma.service.js';

@ApiTags('Health')
@Controller('healthz')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly indicatorService: HealthIndicatorService,
    private readonly memory: MemoryHealthIndicator,
    private readonly disk: DiskHealthIndicator,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({
    summary: 'Liveness & readiness probe',
    description:
      'Returns 200 when all checks pass, 503 otherwise. ' +
      'Suitable for k8s liveness/readiness probes.',
  })
  check() {
    return this.health.check([
      // ── Database connectivity ──────────────────────────────────────────
      // Uses the Prisma 8 ORM client to verify the DB connection is live.
      async () => {
        const indicator = this.indicatorService.check('database');
        try {
          await this.prisma.client.orm.public.User.first();
          return indicator.up();
        } catch {
          return indicator.down({ message: 'Database ping failed' });
        }
      },

      // ── Memory: heap must not exceed 512 MB ───────────────────────────
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),

      // ── Memory: RSS must not exceed 1 GB ─────────────────────────────
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),

      // ── Disk: at most 90% of disk space used ──────────────────────────
      () =>
        this.disk.checkStorage('disk', {
          path: process.platform === 'win32' ? 'C:\\' : '/',
          thresholdPercent: 0.9,
        }),
    ]);
  }
}
