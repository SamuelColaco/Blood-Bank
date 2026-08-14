import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { BloodType, AboGroup, RhFactor } from '../../../../shared/domain/blood-type.vo';
import { SpecialProcessing } from '../../../../shared/domain/special-processing.vo';
import { AvailableComponentMatch } from '../../../../shared/domain/ports/available-components-query.port';
import { ITransactionScope } from '../../../../shared/domain/transaction-scope.port';
import { HospitalRequest } from '../../domain/entities/hospital-request.entity';
import { HospitalRequestStatus } from '../../domain/enums/hospital-request-status.enum';
import { Urgency } from '../../domain/enums/urgency.enum';
import { IHospitalRequestRepository } from '../../domain/repositories/hospital-request.repository';
import { OverrideLogEntry } from '../../domain/value-objects/override-log-entry.vo';
import { PrismaService } from '../../../../modules/inventory/infrastructure/persistence/prisma.service';
import { PrismaTransactionRunner } from '../../../../modules/inventory/infrastructure/persistence/prisma-transaction-runner';

/* eslint-disable @typescript-eslint/no-explicit-any */

/** @internal: maps the shortlist (AvailableComponentMatch[]) to/from the persisted Json column. */
function shortlistToJson(list: AvailableComponentMatch[]): Prisma.InputJsonValue {
  return list.map((m) => ({
    componentId: m.componentId,
    componentType: m.componentType,
    bloodType: {
      aboGroup: m.bloodType.aboGroup,
      rhFactor: m.bloodType.rhFactor,
      extendedPhenotype: m.bloodType.extendedPhenotype ?? null,
    },
    specialProcessing: {
      isIrradiated: m.specialProcessing.isIrradiated,
      isLeukoreduced: m.specialProcessing.isLeukoreduced,
    },
    expiresAt: m.expiresAt.toISOString(),
  }));
}

/** @internal */
function jsonToShortlist(value: any): AvailableComponentMatch[] {
  return (value ?? []).map((m: any) => ({
    componentId: m.componentId,
    componentType: m.componentType,
    bloodType: BloodType.create(
      m.bloodType.aboGroup as AboGroup,
      m.bloodType.rhFactor as RhFactor,
      m.bloodType.extendedPhenotype ?? undefined,
    ),
    specialProcessing: SpecialProcessing.create(
      m.specialProcessing.isIrradiated,
      m.specialProcessing.isLeukoreduced,
    ),
    expiresAt: new Date(m.expiresAt),
  }));
}

/** @internal */
function overrideLogToJson(list: OverrideLogEntry[]): Prisma.InputJsonValue {
  return list.map((e) => ({
    previousComponentId: e.previousComponentId,
    chosenComponentId: e.chosenComponentId,
    reason: e.reason,
    at: e.at.toISOString(),
  }));
}

/** @internal */
function jsonToOverrideLog(value: any): OverrideLogEntry[] {
  return (value ?? []).map((e: any) =>
    OverrideLogEntry.restore(
      e.previousComponentId,
      e.chosenComponentId,
      e.reason ?? null,
      new Date(e.at),
    ),
  );
}

/**
 * Prisma implementation of IHospitalRequestRepository. Only maps between
 * the aggregate and its row - every business rule stays in HospitalRequest.
 */
@Injectable()
export class HospitalRequestPrismaRepository implements IHospitalRequestRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionRunner: PrismaTransactionRunner,
  ) { }

  async findById(id: string): Promise<HospitalRequest | null> {
    const row = await this.prisma.hospitalRequest.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async findByIdForUpdate(id: string, scope?: ITransactionScope): Promise<HospitalRequest | null> {
    // No optimistic/row locking in this setup; fetch through the client when a scope is active.
    const client = scope
      ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
      : this.prisma;
    const row = await client.hospitalRequest.findUnique({ where: { id } });
    return row ? this.toDomain(row) : null;
  }

  async save(request: HospitalRequest, scope?: ITransactionScope): Promise<void> {
    const client = scope
      ? this.transactionRunner.getTransactionClient(scope) ?? this.prisma
      : this.prisma;

    const requestedBloodType = request.requestedBloodType;
    const data = {
      tenantId: request.tenantId,
      hospitalId: request.hospitalId,
      requestedAboGroup: requestedBloodType.aboGroup,
      requestedRhFactor: requestedBloodType.rhFactor,
      requestedExtendedPhenotype: requestedBloodType.extendedPhenotype ?? null,
      requiredIsIrradiated: request.requiredSpecialProcessing?.isIrradiated ?? false,
      requiredIsLeukoreduced: request.requiredSpecialProcessing?.isLeukoreduced ?? false,
      urgency: request.urgency,
      status: request.status,
      linkedComponentId: request.linkedComponentId,
      shortlist: shortlistToJson(request.shortlist),
      crossmatchReference: request.crossmatchReference,
      crossmatchConfirmedBy: request.crossmatchConfirmedBy,
      crossmatchConfirmedRole: request.crossmatchConfirmedRole,
      awaitingPickConfirmation: request.awaitingPickConfirmation,
      overrideLog: overrideLogToJson(request.overrideLog),
      rejectionReason: request.rejectionReason,
      cancellationReason: request.cancellationReason,
    };

    await client.hospitalRequest.upsert({
      where: { id: request.id },
      create: { id: request.id, ...data },
      update: data,
    });
  }

  private toDomain(row: any): HospitalRequest {
    return HospitalRequest.restore({
      id: row.id,
      tenantId: row.tenantId,
      hospitalId: row.hospitalId,
      requestedBloodType: BloodType.create(
        row.requestedAboGroup as AboGroup,
        row.requestedRhFactor as RhFactor,
        row.requestedExtendedPhenotype ?? undefined,
      ),
      requiredSpecialProcessing: SpecialProcessing.create(
        row.requiredIsIrradiated,
        row.requiredIsLeukoreduced,
      ),
      urgency: row.urgency as Urgency,
      status: row.status as HospitalRequestStatus,
      linkedComponentId: row.linkedComponentId,
      shortlist: jsonToShortlist(row.shortlist),
      crossmatchReference: row.crossmatchReference,
      crossmatchConfirmedBy: row.crossmatchConfirmedBy,
      crossmatchConfirmedRole: row.crossmatchConfirmedRole,
      awaitingPickConfirmation: row.awaitingPickConfirmation,
      overrideLog: jsonToOverrideLog(row.overrideLog),
      rejectionReason: row.rejectionReason,
      cancellationReason: row.cancellationReason,
    });
  }
}

