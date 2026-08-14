import { Body, Controller, Get, Param, Post, Put, Query } from '@nestjs/common';
import { RegisterBloodBagUseCase } from '../../application/use-cases/register-blood-bag/register-blood-bag.use-case';
import { SeparateComponentUseCase } from '../../application/use-cases/separate-component/separate-component.use-case';
import { RegisterEquipmentUseCase } from '../../application/use-cases/register-equipment/register-equipment.use-case';
import { IrradiateComponentUseCase } from '../../application/use-cases/irradiate-component/irradiate-component.use-case';
import { LeukoreduceComponentUseCase } from '../../application/use-cases/leukoreduce-component/leukoreduce-component.use-case';
import { RecordTemperatureReadingUseCase } from '../../application/use-cases/record-temperature-reading/record-temperature-reading.use-case';
import { UpdateTenantSettingsUseCase } from '../../application/use-cases/update-tenant-settings/update-tenant-settings.use-case';
import { GetStockSummaryQuery } from '../../application/queries/get-stock-summary/get-stock-summary.query';
import { GetNearExpiryComponentsQuery } from '../../application/queries/get-near-expiry-components/get-near-expiry-components.query';
import { GetDiscardCausesBreakdownQuery } from '../../application/queries/get-discard-causes-breakdown/get-discard-causes-breakdown.query';
import { GetComponentDetailQuery } from '../../application/queries/get-component-detail/get-component-detail.query';
import { GetComponentTimelineQuery } from '../../application/queries/get-component-timeline/get-component-timeline.query';
import { ListEquipmentQuery } from '../../application/queries/list-equipment/list-equipment.query';
import { GetTemperatureHistoryQuery } from '../../application/queries/get-temperature-history/get-temperature-history.query';
import { GetTenantSettingsQuery } from '../../application/queries/get-tenant-settings/get-tenant-settings.query';
import { GetHemoprodReportQuery } from '../../application/queries/get-hemoprod-report/get-hemoprod-report.query';
import { GetDiscardRootCauseReportQuery } from '../../application/queries/get-discard-root-cause-report/get-discard-root-cause-report.query';
import { registerBloodBagSchema } from '../dtos/register-blood-bag.dto';
import { separateComponentSchema } from '../dtos/separate-component.dto';
import { registerEquipmentSchema } from '../dtos/register-equipment.dto';
import { recordTemperatureReadingSchema, updateTenantSettingsSchema } from '../dtos/inventory.dto';

function toDays(value?: string): number | undefined {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function toDate(value?: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * HTTP entry points for the Inventory bounded context. Deliberately thin:
 * every request is validated against a zod schema and handed straight to a
 * use case (write) or a read query - no business logic lives here.
 */
@Controller('inventory')
export class InventoryController {
  constructor(
    private readonly registerBloodBagUseCase: RegisterBloodBagUseCase,
    private readonly separateComponentUseCase: SeparateComponentUseCase,
    private readonly registerEquipmentUseCase: RegisterEquipmentUseCase,
    private readonly irradiateComponentUseCase: IrradiateComponentUseCase,
    private readonly leukoreduceComponentUseCase: LeukoreduceComponentUseCase,
    private readonly recordTemperatureReadingUseCase: RecordTemperatureReadingUseCase,
    private readonly updateTenantSettingsUseCase: UpdateTenantSettingsUseCase,
    private readonly getStockSummaryQuery: GetStockSummaryQuery,
    private readonly getNearExpiryComponentsQuery: GetNearExpiryComponentsQuery,
    private readonly getDiscardCausesBreakdownQuery: GetDiscardCausesBreakdownQuery,
    private readonly getComponentDetailQuery: GetComponentDetailQuery,
    private readonly getComponentTimelineQuery: GetComponentTimelineQuery,
    private readonly listEquipmentQuery: ListEquipmentQuery,
    private readonly getTemperatureHistoryQuery: GetTemperatureHistoryQuery,
    private readonly getTenantSettingsQuery: GetTenantSettingsQuery,
    private readonly getHemoprodReportQuery: GetHemoprodReportQuery,
    private readonly getDiscardRootCauseReportQuery: GetDiscardRootCauseReportQuery,
  ) { }

  // ---- Write ----

  @Post('blood-bags')
  async registerBloodBag(@Body() body: unknown) {
    const input = registerBloodBagSchema.parse(body);
    return this.registerBloodBagUseCase.execute(input);
  }

  @Post('blood-bags/separate')
  async separateComponent(@Body() body: unknown) {
    const input = separateComponentSchema.parse(body);
    return this.separateComponentUseCase.execute(input);
  }

  @Post('equipment')
  async registerEquipment(@Body() body: unknown) {
    const input = registerEquipmentSchema.parse(body);
    return this.registerEquipmentUseCase.execute(input);
  }

  @Post('blood-components/:id/irradiate')
  async irradiateComponent(@Param('id') id: string) {
    return this.irradiateComponentUseCase.execute({ componentId: id });
  }

  @Post('blood-components/:id/leukoreduce')
  async leukoreduceComponent(@Param('id') id: string) {
    return this.leukoreduceComponentUseCase.execute({ componentId: id });
  }

  @Post('equipment/:id/temperature-reading')
  async recordTemperatureReading(@Param('id') id: string, @Body() body: unknown) {
    const input = recordTemperatureReadingSchema.parse(body);
    return this.recordTemperatureReadingUseCase.execute({ equipmentId: id, ...input });
  }

  @Put('tenant-settings')
  async updateTenantSettings(@Query('tenantId') tenantId: string, @Body() body: unknown) {
    const input = updateTenantSettingsSchema.parse(body);
    return this.updateTenantSettingsUseCase.execute(tenantId, input);
  }

  // ---- Read ----

  @Get('stock/summary')
  async getStockSummary(@Query('tenantId') tenantId: string) {
    return this.getStockSummaryQuery.execute({ tenantId });
  }

  @Get('stock/near-expiry')
  async getNearExpiry(
    @Query('tenantId') tenantId: string,
    @Query('withinDays') withinDays?: string,
  ) {
    return this.getNearExpiryComponentsQuery.execute({ tenantId, withinDays: toDays(withinDays) ?? 5 });
  }

  @Get('stock/discard-causes')
  async getDiscardCauses(
    @Query('tenantId') tenantId: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.getDiscardCausesBreakdownQuery.execute({ tenantId, days: toDays(period), from: toDate(from), to: toDate(to) });
  }

  @Get('blood-components/:id')
  async getComponentDetail(@Param('id') id: string, @Query('tenantId') tenantId: string) {
    return this.getComponentDetailQuery.execute({ tenantId, componentId: id });
  }

  @Get('blood-components/:id/events')
  async getComponentTimeline(@Param('id') id: string) {
    return this.getComponentTimelineQuery.execute({ aggregateId: id });
  }

  @Get('equipment')
  async listEquipment(@Query('tenantId') tenantId: string) {
    return this.listEquipmentQuery.execute({ tenantId });
  }

  @Get('equipment/:id/temperature-readings')
  async getTemperatureHistory(@Param('id') id: string, @Query('from') from?: string, @Query('to') to?: string) {
    return this.getTemperatureHistoryQuery.execute({ equipmentId: id, from: toDate(from), to: toDate(to) });
  }

  @Get('tenant-settings')
  async getTenantSettings(@Query('tenantId') tenantId: string) {
    return this.getTenantSettingsQuery.execute({ tenantId });
  }

  @Get('reports/hemoprod')
  async getHemoprodReport(
    @Query('tenantId') tenantId: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.getHemoprodReportQuery.execute({ tenantId, days: toDays(period), from: toDate(from), to: toDate(to) });
  }

  @Get('reports/discard-root-cause')
  async getDiscardRootCause(
    @Query('tenantId') tenantId: string,
    @Query('period') period?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.getDiscardRootCauseReportQuery.execute({ tenantId, days: toDays(period), from: toDate(from), to: toDate(to) });
  }
}
