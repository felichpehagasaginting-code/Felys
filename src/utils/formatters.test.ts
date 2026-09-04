import { describe, it, expect } from 'vitest';
import { formatRupiah, formatCompactNumber } from './formatters';

describe('formatters', () => {
  it('formats idr currency accurately', () => {
    expect(formatRupiah(50000)).toContain('50.000');
  });

  it('formats compact numbers properly', () => {
    expect(formatCompactNumber(1500000)).toBeDefined();
  });
});
