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

// ---- Read (query) port tokens ----
// Screen-facing read contracts for Distribuição. See SDD "Endpoints de API
// Faltando" §3.
export const HOSPITAL_REQUEST_DETAIL_QUERY = Symbol('IHospitalRequestDetailQuery');
export const LIST_HOSPITAL_REQUESTS_QUERY = Symbol('IListHospitalRequestsQuery');
