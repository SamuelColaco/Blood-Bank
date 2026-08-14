import { beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';

export const testDatabaseUrl = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

if (!testDatabaseUrl) {
    throw new Error('TEST_DATABASE_URL or DATABASE_URL must be set for integration tests');
}

export const prisma = new PrismaClient({
    datasources: {
        db: {
            url: testDatabaseUrl,
        },
    },
});

beforeAll(async () => {
    await prisma.$connect();
});

afterAll(async () => {
    await prisma.$disconnect();
});

beforeEach(async () => {
    // Clean tables in reverse dependency order to avoid FK violations.
    await prisma.transportTemperatureReading.deleteMany();
    await prisma.transportContainer.deleteMany();
    await prisma.outboxEvent.deleteMany();
    await prisma.hospitalRequest.deleteMany();
    await prisma.hospital.deleteMany();
    await prisma.bloodComponent.deleteMany();
    await prisma.bloodBag.deleteMany();
    await prisma.equipment.deleteMany();
    await prisma.tenant.deleteMany();
});
