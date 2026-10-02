/**
 * The tab's data shapes. These match the JSON contract of the original
 * Kotlin/Ktor backend, so the in-browser SnackTabService is a drop-in swap.
 *
 * NOTE: `amount` / `owed` are STRINGS, not numbers. Money is held as exact
 * decimal strings (and BigInt cents inside the service) because JS numbers are
 * floats. Parse with `money()` only for display.
 */
export interface TabEntry {
  id: string;
  who: string;
  item: string;
  amount: string;       // decimal string, e.g. "4.25"
  createdAt: string;    // ISO-8601, e.g. "2026-07-21T10:06:23Z"
}

export interface CreateTabEntryRequest {
  who: string;
  item: string;
  amount: string;
}

export interface PersonTotal {
  who: string;
  owed: string;
}

export interface TabSummary {
  totals: PersonTotal[];
  grandTotal: string;
  note: string;
}

/** Format a decimal-string amount as USD for display only. */
export function money(amount: string): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format(Number(amount));
}
