import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Prisma service for the Donation & Screening bounded context.
 *
 * Each bounded context gets its own PrismaClient instance so that
 * connection pooling and transaction scoping remain isolated per context.
 * In production both instances point to the same database - this is
 * intentional, as the isolation is at the aggregate/transaction level,
 * not at the database level.
 */
@Injectable()
export class DonationPrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    async onModuleInit(): Promise<void> {
        await this.$connect();
    }

    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
    }
}
