import { Injectable, Logger, type OnModuleDestroy, type OnModuleInit } from '@nestjs/common';
import { createDatabaseClient, db, type DatabaseClient } from './db.js';

export type { DatabaseClient };

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  private _client: DatabaseClient = db;

  get client(): DatabaseClient {
    return this._client;
  }

  async onModuleInit() {
    this.logger.log('Connecting to Prisma 8 Postgres database...');
    this._client = createDatabaseClient();
    await this._client.connect();
    this.logger.log('Connected to Prisma 8 Postgres database successfully.');
  }

  async onModuleDestroy() {
    this.logger.log('Closing Prisma 8 Postgres database connection...');
    try {
      await this._client.close();
    } catch {
      // Ignored if already closed
    }
  }
}
