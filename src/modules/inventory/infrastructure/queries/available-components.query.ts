import { Injectable } from '@nestjs/common';
import { BloodType, AboGroup, RhFactor } from '../../../../shared/domain/blood-type.vo';
import {
  AvailableComponentCriteria,
  AvailableComponentMatch,
  IAvailableComponentsQuery,
} from '../../../../shared/domain/ports/available-components-query.port';
import { SpecialProcessing } from '../../../../shared/domain/special-processing.vo';
import { ComponentStatus } from '../../domain/enums/component-status.enum';
import { PrismaService } from '../persistence/prisma.service';

/**
 * Inventory-side implementation of the shared IAvailableComponentsQuery
 * port. This is a READ-ONLY query: it never mutates an aggregate and holds
 * no buiness rule beyond filtering/sorting already-stored stock. The
 * Distribuição context depends on the contract in shared/domain, not on
 * this adapter or the BloodComponent repository - SDD Fase 3, section 2.
 */
@Injectable()
export class AvailableComponentsQuery implements IAvailableComponentsQuery {
  constructor(private readonly prisma: PrismaService) { }

  async findCompatible(criteria: AvailableComponentCriteria): Promise<AvailableComponentMatch[]> {
    const now = new Date();
    const required = criteria.requiredSpecialProcessing;

    const rows = await this.prisma.bloodComponent.findMany({
      where: {
        tenantId: criteria.tenantId,
        status: ComponentStatus.STORED,
        isUnderReevaluation: false,
        expiresAt: { gt: now },
        ...(required?.isIrradiated ? { isIrradiated: true } : {}),
        ...(required?.isLeukoreduced ? { isLeukoreduced: true } : {}),
      },
    });

    const matches: AvailableComponentMatch[] = [];
    for (const row of rows) {
      const bloodType = BloodType.create(
        row.aboGroup as AboGroup,
        row.rhFactor as RhFactor,
        row.extendedPhenotype ?? undefined,
      );
      if (!BloodType.isCompatible(bloodType, criteria.requestedBloodType)) {
        continue;
      }
      if (!BloodType.hasRequiredPhenotype(bloodType, criteria.requestedBloodType.extendedPhenotype)) {
        continue;
      }
      matches.push({
        componentId: row.id,
        componentType: row.componentType,
        bloodType,
        specialProcessing: SpecialProcessing.create(row.isIrradiated, row.isLeukoreduced),
        expiresAt: row.expiresAt,
      });
    }

    // Nearest-to-expiry first - the priority for EMERGENCY (SDD Fase 3, UC-02).
    matches.sort((a, b) => a.expiresAt.getTime() - b.expiresAt.getTime());
    return matches;
  }
}
