/**
 * Thrown when a business rule is violated inside the domain layer
 * (e.g. an invalid state transition). This is distinct from generic
 * runtime errors so the application layer can translate it into the
 * correct HTTP status code (typically 422 Unprocessable Entity) without
 * the domain layer knowing anything about HTTP.
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
