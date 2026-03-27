import { formatAmount } from '../utils/formatUtils';
import { Currency } from '../types';

describe('formatUtils', () => {
  it('should format USD amounts correctly', () => {
    const result = formatAmount(100, 40, Currency.USD, true, 2);
    // Might contain locale-specific formatting like "100.00" or "100,00", we test for $100
    expect(result.replace(/,/g, '.')).toMatch(/^\$100\.00$/);
  });

  it('should format VES amounts correctly', () => {
    const result = formatAmount(100, 40.5, Currency.VES, true, 2);
    // 100 * 40.5 = 4050
    expect(result.replace(/,/g, '.')).toMatch(/^Bs4\.?050\.00$/); 
  });

  it('should hide balance when isBalanceVisible is false', () => {
    const result = formatAmount(100, 40, Currency.USD, false);
    expect(result).toBe('******');
  });
});
