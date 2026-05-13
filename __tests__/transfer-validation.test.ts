import { TransferSchema } from '../views/TransferView';

describe('TransferSchema (react-hook-form zod resolver)', () => {
  const valid = {
    fromId: 'acc-1',
    toId: 'acc-2',
    amount: '100',
    fee: '',
    category: 'transfer',
  };

  // ─── valid cases ──────────────────────────────────────────────────────────

  it('accepts a valid transfer', () => {
    const result = TransferSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('defaults fee to empty string when absent', () => {
    const { fee: _, ...rest } = valid;
    const result = TransferSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.fee).toBe('');
  });

  it('defaults category to "transfer" when absent', () => {
    const { category: _, ...rest } = valid;
    const result = TransferSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.category).toBe('transfer');
  });

  it('accepts a decimal amount string', () => {
    expect(TransferSchema.safeParse({ ...valid, amount: '49.99' }).success).toBe(true);
  });

  it('accepts a fee value', () => {
    expect(TransferSchema.safeParse({ ...valid, fee: '2.50' }).success).toBe(true);
  });

  // ─── same-account refine ──────────────────────────────────────────────────

  it('rejects when fromId === toId', () => {
    const result = TransferSchema.safeParse({ ...valid, fromId: 'acc-1', toId: 'acc-1' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const toIdError = result.error.issues.find(i => i.path.includes('toId'));
      expect(toIdError?.message).toMatch(/same account/i);
    }
  });

  // ─── amount validation ────────────────────────────────────────────────────

  it('rejects empty amount string', () => {
    const result = TransferSchema.safeParse({ ...valid, amount: '' });
    expect(result.success).toBe(false);
  });

  it('rejects amount = "0"', () => {
    const result = TransferSchema.safeParse({ ...valid, amount: '0' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const amtError = result.error.issues.find(i => i.path.includes('amount'));
      expect(amtError?.message).toMatch(/must be/i);
    }
  });

  it('rejects negative amounts', () => {
    expect(TransferSchema.safeParse({ ...valid, amount: '-50' }).success).toBe(false);
  });

  it('rejects non-numeric amount strings', () => {
    expect(TransferSchema.safeParse({ ...valid, amount: 'abc' }).success).toBe(false);
  });

  // ─── required fields ──────────────────────────────────────────────────────

  it('rejects when fromId is empty', () => {
    expect(TransferSchema.safeParse({ ...valid, fromId: '' }).success).toBe(false);
  });

  it('rejects when toId is empty', () => {
    // Note: empty string satisfies the same-account refine but fails min(1)
    expect(TransferSchema.safeParse({ ...valid, toId: '' }).success).toBe(false);
  });

  it('rejects when fromId is missing', () => {
    const { fromId: _, ...rest } = valid;
    expect(TransferSchema.safeParse(rest).success).toBe(false);
  });
});
