export class ExchangeService {
  // Mock rates. In production, fetch from an API like Fixer or CurrencyLayer
  private static rates: Record<string, number> = {
    'NGN': 1,
    'USD': 1500, // 1 USD = 1500 NGN
    'GBP': 1900,
    'EUR': 1600
  };

  /**
   * Converts an amount from one currency to another
   */
  static convert(amount: number, from: string, to: string): number {
    if (from === to) return amount;

    const fromRate = this.rates[from] || 1;
    const toRate = this.rates[to] || 1;

    // Convert to NGN (base) then to target
    const inBase = amount * fromRate;
    return inBase / toRate;
  }

  static getRate(currency: string): number {
    return this.rates[currency] || 1;
  }
}
