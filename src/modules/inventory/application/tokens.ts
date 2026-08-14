/**
 * Dependency injection tokens for the Inventory module. Using symbols
 * (instead of concrete classes) keeps use cases depending only on the
 * domain-layer interfaces, never on a specific infrastructure
 * implementation.
 */
export const BLOOD_BAG_REPOSITORY = Symbol('IBloodBagRepository');
export const BLOOD_COMPONENT_REPOSITORY = Symbol('IBloodComponentRepository');
export const EQUIPMENT_REPOSITORY = Symbol('IEquipmentRepository');
export const OUTBOX_EVENT_WRITER = Symbol('IOutboxEventWriter');
export const TRANSACTION_RUNNER = Symbol('ITransactionRunner');
export const TENANT_SETTINGS_REPOSITORY = Symbol('ITenantSettingsRepository');
export const TENANT_SETTINGS_WRITER = Symbol('ITenantSettingsWriter');

// ---- Read (query) port tokens ----
// Screen-facing read contracts, implemented straight against Prisma (never
// through the aggregates). See SDD "Endpoints de API Faltando" §2.1.
export const STOCK_SUMMARY_QUERY = Symbol('IStockSummaryQuery');
export const NEAR_EXPIRY_COMPONENTS_QUERY = Symbol('INearExpiryComponentsQuery');
export const DISCARD_CAUSES_BREAKDOWN_QUERY = Symbol('IDiscardCausesBreakdownQuery');
export const COMPONENT_DETAIL_QUERY = Symbol('IComponentDetailQuery');
export const COMPONENT_TIMELINE_QUERY = Symbol('IComponentTimelineQuery');
export const LIST_EQUIPMENT_QUERY = Symbol('IListEquipmentQuery');
export const TEMPERATURE_HISTORY_QUERY = Symbol('ITemperatureHistoryQuery');
export const TENANT_SETTINGS_QUERY = Symbol('ITenantSettingsQuery');
export const HEMOPROD_REPORT_QUERY = Symbol('IHemoprodReportQuery');
export const DISCARD_ROOT_CAUSE_REPORT_QUERY = Symbol('IDiscardRootCauseReportQuery');
