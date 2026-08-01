import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Thin wrapper around PrismaClient so it can be injected through NestJS's
 * DI container and its connection lifecycle managed alongside the app.
 * Nothing in the domain or application layers ever imports this directly -
 * only the infrastructure adapters below do.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
