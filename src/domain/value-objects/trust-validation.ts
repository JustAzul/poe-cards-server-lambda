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

  // TODO: reshape for Supabase schema when LoadAdapter is implemented
  /**
   * Convert to plain object for serialization
   */
  toPlain(): Record<string, unknown> {
    return {
      isValid: this.isValid,
      ...(this.reason && { reason: this.reason }),
    };
  }
}
