/**
 * Proportional Bill Splitter
 * Distributes taxes and service charges proportionally to each person's spend.
 */

export interface SplitItem {
  id: string;
  name: string;
  items?: string;
  subtotal: number;
}

export interface SplitResult {
  id: string;
  name: string;
  items?: string;
  subtotal: number;
  taxShare: number;
  serviceShare: number;
  total: number;
}

export function calculateProportionalSplit(
  participants: SplitItem[],
  taxPercent: number = 0,
  servicePercent: number = 0,
  flatDiscount: number = 0
): {
  results: SplitResult[];
  subtotal: number;
  taxAmount: number;
  serviceAmount: number;
  grandTotal: number;
} {
  const subtotal = participants.reduce((acc, p) => acc + (p.subtotal || 0), 0);

  if (subtotal <= 0) {
    return {
      results: participants.map((p) => ({
        ...p,
        taxShare: 0,
        serviceShare: 0,
        total: 0,
      })),
      subtotal: 0,
      taxAmount: 0,
      serviceAmount: 0,
      grandTotal: 0,
    };
  }

  const effectiveSubtotal = Math.max(0, subtotal - flatDiscount);
  const taxAmount = Math.round((effectiveSubtotal * taxPercent) / 100);
  const serviceAmount = Math.round((effectiveSubtotal * servicePercent) / 100);
  const grandTotal = effectiveSubtotal + taxAmount + serviceAmount;

  const results: SplitResult[] = participants.map((p) => {
    const proportion = p.subtotal / subtotal;
    const pTax = Math.round(taxAmount * proportion);
    const pService = Math.round(serviceAmount * proportion);
    const pDiscount = Math.round(flatDiscount * proportion);
    const pTotal = Math.max(0, p.subtotal - pDiscount) + pTax + pService;

    return {
      id: p.id,
      name: p.name,
      items: p.items,
      subtotal: p.subtotal,
      taxShare: pTax,
      serviceShare: pService,
      total: pTotal,
    };
  });

  return {
    results,
    subtotal,
    taxAmount,
    serviceAmount,
    grandTotal,
  };
}
