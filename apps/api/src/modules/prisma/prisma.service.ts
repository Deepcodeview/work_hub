import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@workhub/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    try {
      await this.$connect();
    } catch {
      // Allow startup even if db is temporarily unreachable in dev/test
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
