/**
 * Dependency injection tokens for the Distribuição module. Symbol tokens
 * keep use cases dependent only on domain ports, never on a concrete
 * infrastructure implementation.
 */

export const HOSPITAL_REPOSITORY = Symbol('IHospitalRepository');
export const HOSPITAL_REQUEST_REPOSITORY = Symbol('IHospitalRequestRepository');
export const TRANSPORT_CONTAINER_REPOSITORY = Symbol('ITransportContainerRepository');
export const OUTBOX_EVENT_WRITER = Symbol('IOutboxEventWriter');
export const TRANSACTION_RUNNER = Symbol('ITransactionRunner');
