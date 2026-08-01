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
