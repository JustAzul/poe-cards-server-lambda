/**
 * Trust Validation - Business rules for price data reliability
 * Value object representing validation result with optional reason
 */
export class TrustValidation {
  readonly isValid: boolean;

  readonly reason?: string;

  constructor(data: { isValid: boolean; reason?: string }) {
    this.isValid = data.isValid;
    this.reason = data.reason;
  }

  /**
   * Factory method: Create valid validation result
   */
  static valid(): TrustValidation {
    return new TrustValidation({ isValid: true });
  }

  /**
   * Factory method: Create invalid validation result with reason
   */
  static invalid(reason: string): TrustValidation {
    return new TrustValidation({ isValid: false, reason });
  }

  equals(other: TrustValidation): boolean {
    return this.isValid === other.isValid
      && this.reason === other.reason;
  }
}
