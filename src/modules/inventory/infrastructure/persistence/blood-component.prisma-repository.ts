import { Injectable } from '@nestjs/common';
import { BloodComponent } from '../../domain/entities/blood-component.entity';
import { ComponentStatus } from '../../domain/enums/component-status.enum';
import { ComponentType } from '../../domain/enums/component-type.enum';
import { IBloodComponentRepository } from '../../domain/repositories/blood-component.repository';
import { ITransactionScope } from '../../domain/ports/transaction-scope.port';
import { AboGroup, BloodType, RhFactor } from '../../domain/value-objects/blood-type.vo';
import { Reservation, ReservationKind } from '../../domain/value-objects/reservation.vo';
import { ValidityPeriod } from '../../domain/value-objects/validity-period.vo';
import { PrismaService } from './prisma.service';
import { PrismaTransactionRunner } from './prisma-transaction-runner';

// Prisma's generated row type isn't imported directly here to keep this
// file readable; `any` below is intentionally narrow-scoped to the
// mapping function only.
/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Prisma implementation of IBloodComponentRepository - the main
 * transactional repository of the Inventory bounded context. Like the
 * other adapters, it only maps between the aggregate and its row; every
 * business rule stays in BloodComponent itself.
 */
@Injectable()
export class BloodComponentPrismaRepository implements IBloodComponentRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionRunner: PrismaTransactionRunner,
  ) { }

  async findById(id: string): Promise<BloodComponent | null> {
    const row = await this.prisma.bloodComponent.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findStoredInEquipment(equipmentId: string): Promise<BloodComponent[]> {
    const rows = await this.prisma.bloodComponent.findMany({
      where: { equipmentId, status: ComponentStatus.STORED },
    });
    return rows.map((row: any) => this.toDomain(row));
  }

  async save(component: BloodComponent, scope?: ITransactionScope): Promise<void> {
    const client = scope
      ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
      : this.prisma;

    await client.bloodComponent.upsert({
      where: { id: component.id },
      create: {
        id: component.id,
        tenantId: component.tenantId,
        bloodBagId: component.bloodBagId,
        equipmentId: component.equipmentId,
        componentType: component.componentType,
        aboGroup: component.bloodType.aboGroup,
        rhFactor: component.bloodType.rhFactor,
        extendedPhenotype: component.bloodType.extendedPhenotype ?? null,
        status: component.status,
        collectedAt: component.validityPeriod.collectedAt,
        expiresAt: component.validityPeriod.expiresAt,
        isUnderReevaluation: component.isUnderReevaluation,
        reservedBy: component.reservation?.requestedBy ?? null,
        reservationKind: component.reservation?.kind ?? null,
        reservationExpiresAt: component.reservation?.expiresAt ?? null,
      },
      update: {
        status: component.status,
        equipmentId: component.equipmentId,
        isUnderReevaluation: component.isUnderReevaluation,
        reservedBy: component.reservation?.requestedBy ?? null,
        reservationKind: component.reservation?.kind ?? null,
        reservationExpiresAt: component.reservation?.expiresAt ?? null,
      },
    });
  }

  private toDomain(row: any): BloodComponent {
    const bloodType = BloodType.create(
      row.aboGroup as AboGroup,
      row.rhFactor as RhFactor,
      row.extendedPhenotype ?? undefined,
    );

    const validityPeriod = ValidityPeriod.restore(row.collectedAt, row.expiresAt);

    const reservation =
      row.reservedBy && row.reservationKind && row.reservationExpiresAt
        ? Reservation.restore(row.reservedBy, row.reservationKind as ReservationKind, row.reservationExpiresAt)
        : null;

    return BloodComponent.restore({
      id: row.id,
      tenantId: row.tenantId,
      bloodBagId: row.bloodBagId,
      componentType: row.componentType as ComponentType,
      bloodType,
      validityPeriod,
      status: row.status as ComponentStatus,
      isUnderReevaluation: row.isUnderReevaluation,
      reservation,
      equipmentId: row.equipmentId,
    });
  }
}
