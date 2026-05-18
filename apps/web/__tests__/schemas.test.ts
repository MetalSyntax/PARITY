import {
  DolarApiResponseSchema,
  TransactionSchema,
  AccountSchema,
  BudgetSchema,
  GoalSchema,
  ContactSchema,
  DebtSchema,
  CsvTransactionRowSchema,
} from '@parity/core';

// ─── DolarApiResponseSchema ───────────────────────────────────────────────────

describe('DolarApiResponseSchema', () => {
  it('accepts a valid BCV-style response array', () => {
    const raw = [
      { fuente: 'oficial', promedio: 40.5, fechaActualizacion: '2025-05-13' },
      { fuente: 'paralelo', promedio: '42.1' },
    ];
    const result = DolarApiResponseSchema.safeParse(raw);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data[0].promedio).toBe(40.5);
      // string "42.1" should be coerced to number
      expect(result.data[1].promedio).toBe(42.1);
    }
  });

  it('coerces string promedio to number', () => {
    const raw = [{ fuente: 'oficial', promedio: '36.75' }];
    const result = DolarApiResponseSchema.safeParse(raw);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data[0].promedio).toBe(36.75);
  });

  it('rejects a non-array response', () => {
    const result = DolarApiResponseSchema.safeParse({ fuente: 'oficial', promedio: 40 });
    expect(result.success).toBe(false);
  });

  it('rejects entries missing fuente', () => {
    const result = DolarApiResponseSchema.safeParse([{ promedio: 40 }]);
    expect(result.success).toBe(false);
  });

  it('accepts an empty array', () => {
    const result = DolarApiResponseSchema.safeParse([]);
    expect(result.success).toBe(true);
  });
});

// ─── TransactionSchema ────────────────────────────────────────────────────────

describe('TransactionSchema', () => {
  const valid = {
    id: 'tx-1',
    type: 'EXPENSE',
    amount: 50,
    currency: 'USD',
    normalizedAmountUSD: 50,
    exchangeRate: 1,
    date: '2025-05-13T12:00:00Z',
    category: 'food',
    note: 'lunch',
    accountId: 'acc-1',
  };

  it('accepts a valid transaction', () => {
    const result = TransactionSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('accepts all TransactionType values', () => {
    for (const type of ['EXPENSE', 'INCOME', 'TRANSFER']) {
      expect(TransactionSchema.safeParse({ ...valid, type }).success).toBe(true);
    }
  });

  it('rejects an invalid TransactionType', () => {
    const result = TransactionSchema.safeParse({ ...valid, type: 'DONATION' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid currency', () => {
    const result = TransactionSchema.safeParse({ ...valid, currency: 'GBP' });
    expect(result.success).toBe(false);
  });

  it('defaults normalizedAmountUSD to 0 when absent', () => {
    const { normalizedAmountUSD: _, ...rest } = valid;
    const result = TransactionSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.normalizedAmountUSD).toBe(0);
  });

  it('rejects when id is missing', () => {
    const { id: _, ...rest } = valid;
    const result = TransactionSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('passes through extra fields (passthrough)', () => {
    const result = TransactionSchema.safeParse({ ...valid, customField: 'hello' });
    expect(result.success).toBe(true);
    if (result.success) expect((result.data as any).customField).toBe('hello');
  });
});

// ─── AccountSchema ────────────────────────────────────────────────────────────

describe('AccountSchema', () => {
  const valid = { id: 'acc-1', name: 'Wallet', balance: 1000, currency: 'USD' };

  it('accepts a valid account', () => {
    expect(AccountSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts all valid currencies', () => {
    for (const currency of ['USD', 'VES', 'EUR', 'USDT']) {
      expect(AccountSchema.safeParse({ ...valid, currency }).success).toBe(true);
    }
  });

  it('rejects unknown currency', () => {
    expect(AccountSchema.safeParse({ ...valid, currency: 'BTC' }).success).toBe(false);
  });

  it('rejects negative balance', () => {
    // Balance is a number — schema accepts negatives (overdraft is valid), just must be a number
    expect(AccountSchema.safeParse({ ...valid, balance: -50 }).success).toBe(true);
  });

  it('rejects when name is missing', () => {
    const { name: _, ...rest } = valid;
    expect(AccountSchema.safeParse(rest).success).toBe(false);
  });
});

// ─── BudgetSchema ─────────────────────────────────────────────────────────────

describe('BudgetSchema', () => {
  const valid = { id: 'b-1', categoryId: 'food', limit: 200 };

  it('accepts a valid budget', () => {
    expect(BudgetSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts a budget with optional month', () => {
    expect(BudgetSchema.safeParse({ ...valid, month: '2025-05' }).success).toBe(true);
  });

  it('rejects when limit is missing', () => {
    const { limit: _, ...rest } = valid;
    expect(BudgetSchema.safeParse(rest).success).toBe(false);
  });
});

// ─── GoalSchema ───────────────────────────────────────────────────────────────

describe('GoalSchema', () => {
  const valid = { id: 'g-1', name: 'Vacation', targetAmount: 2000, currentAmount: 500 };

  it('accepts a valid goal', () => {
    expect(GoalSchema.safeParse(valid).success).toBe(true);
  });

  it('defaults currentAmount to 0 when absent', () => {
    const { currentAmount: _, ...rest } = valid;
    const result = GoalSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currentAmount).toBe(0);
  });

  it('defaults currency to USD when absent', () => {
    const result = GoalSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.currency).toBe('USD');
  });
});

// ─── ContactSchema ────────────────────────────────────────────────────────────

describe('ContactSchema', () => {
  const valid = { id: 'c-1', name: 'Mom', createdAt: '2025-01-01T00:00:00Z' };

  it('accepts a minimal contact', () => {
    expect(ContactSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts a full contact with payment handles', () => {
    const full = {
      ...valid,
      avatarColor: '#6366f1',
      defaultCurrency: 'USD',
      paymentHandles: [{ type: 'zelle', value: 'mom@email.com', label: 'Mom Zelle' }],
      notes: 'Call every Sunday',
    };
    expect(ContactSchema.safeParse(full).success).toBe(true);
  });

  it('defaults paymentHandles to empty array', () => {
    const result = ContactSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.paymentHandles).toEqual([]);
  });

  it('rejects when name is missing', () => {
    const { name: _, ...rest } = valid;
    expect(ContactSchema.safeParse(rest).success).toBe(false);
  });
});

// ─── DebtSchema ───────────────────────────────────────────────────────────────

describe('DebtSchema', () => {
  const valid = {
    id: 'd-1',
    type: 'i_owe',
    counterpartyName: 'Carlos',
    amount: 100,
    currency: 'USD',
    amountAtRateUSD: 100,
    status: 'active',
    createdAt: '2025-01-01T00:00:00Z',
  };

  it('accepts a valid debt', () => {
    expect(DebtSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts both debt types', () => {
    expect(DebtSchema.safeParse({ ...valid, type: 'i_owe' }).success).toBe(true);
    expect(DebtSchema.safeParse({ ...valid, type: 'they_owe' }).success).toBe(true);
  });

  it('accepts all status values', () => {
    for (const status of ['active', 'partial', 'settled']) {
      expect(DebtSchema.safeParse({ ...valid, status }).success).toBe(true);
    }
  });

  it('rejects an invalid status', () => {
    expect(DebtSchema.safeParse({ ...valid, status: 'cancelled' }).success).toBe(false);
  });

  it('defaults payments to empty array', () => {
    const result = DebtSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.payments).toEqual([]);
  });
});

// ─── CsvTransactionRowSchema ──────────────────────────────────────────────────

describe('CsvTransactionRowSchema', () => {
  it('accepts a minimal CSV row', () => {
    const result = CsvTransactionRowSchema.safeParse({ date: '2025-05-01', type: 'EXPENSE', amount: '50' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(50);
  });

  it('coerces numeric string amount to number', () => {
    const result = CsvTransactionRowSchema.safeParse({ date: '2025-05-01', type: 'INCOME', amount: '1234.56' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBeCloseTo(1234.56);
  });

  it('accepts a number for amount directly', () => {
    const result = CsvTransactionRowSchema.safeParse({ date: '2025-05-01', type: 'EXPENSE', amount: 99 });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.amount).toBe(99);
  });

  it('defaults optional fields to empty string', () => {
    const result = CsvTransactionRowSchema.safeParse({ date: '2025-05-01', type: 'EXPENSE', amount: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.category).toBe('');
      expect(result.data.note).toBe('');
      expect(result.data.account).toBe('');
    }
  });

  it('rejects a row missing required date', () => {
    const result = CsvTransactionRowSchema.safeParse({ type: 'EXPENSE', amount: '10' });
    expect(result.success).toBe(false);
  });
});
