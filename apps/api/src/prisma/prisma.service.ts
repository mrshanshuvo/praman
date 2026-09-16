import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { db } from './db.js';

export type DatabaseClient = typeof db;

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public readonly client: DatabaseClient = db;

  async onModuleInit() {
    this.logger.log('Connecting to Prisma 8 Postgres database...');
    await this.client.connect();
    this.logger.log('Connected to Prisma 8 Postgres database successfully.');
  }

  async onModuleDestroy() {
    this.logger.log('Closing Prisma 8 Postgres database connection...');
    await this.client.close();
  }
}
