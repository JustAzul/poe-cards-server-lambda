import { ExactItemMatcher } from './exact-item.matcher';
import { ExactCurrencyMatcher } from './exact-currency.matcher';

export { ExactItemMatcher } from './exact-item.matcher';
export { ExactCurrencyMatcher } from './exact-currency.matcher';

// Singleton instances following existing pattern
export const exactItemMatcher = new ExactItemMatcher();
export const exactCurrencyMatcher = new ExactCurrencyMatcher();
