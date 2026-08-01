import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';

/**
 * Application bootstrap. Runs on Fastify (not the NestJS default of
 * Express) for lower latency and memory footprint - relevant given the
 * expected volume of hospital-facing endpoints and real-time stock
 * dashboards described in ARQUITETURA.md.
 */
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  await app.listen(3000, '0.0.0.0');
}

bootstrap();
