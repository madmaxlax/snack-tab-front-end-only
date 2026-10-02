import { Injectable } from '@angular/core';
import { Observable, defer, of, throwError } from 'rxjs';
import {
  CreateTabEntryRequest,
  PersonTotal,
  TabEntry,
  TabSummary,
} from './snack-tab.models';

/**
 * The snack tab, run entirely in the browser. This replaces the Kotlin/Ktor
 * backend of the full-stack version, which was itself only an in-memory store.
 * The public API (four Observable methods) is unchanged, so components did not
 * have to change. Data resets on page reload, as the backend reset on restart.
 *
 * Money stays exact: amounts are held as BigInt cents and only become decimal
 * strings at the edge. `0.10 + 0.20` is `0.30` here, never `0.30000000000000004`.
 */
@Injectable({ providedIn: 'root' })
export class SnackTabService {
  private readonly store = new Map<string, TabEntry>();
  /** Monotonic counter so entries created in the same millisecond still sort. */
  private seq = 0;
  private readonly order = new Map<string, number>();

  constructor() {
    seedTheTab(this);
  }

  /** The whole tab, newest first. */
  list(): Observable<TabEntry[]> {
    return defer(() => of(this.sorted()));
  }

  /** Validate, stamp the fields the "server" owns, store. */
  add(request: CreateTabEntryRequest): Observable<TabEntry> {
    return defer(() => {
      try {
        return of(this.addSync(request));
      } catch (e) {
        return throwError(() => e);
      }
    });
  }

  /** Settle up: remove the entry from the tab. */
  settle(id: string): Observable<void> {
    return defer(() => {
      if (!this.store.delete(id)) {
        return throwError(() => new Error(`No tab entry with id '${id}'.`));
      }
      this.order.delete(id);
      return of(undefined);
    });
  }

  /** Who owes what: total per person, highest first, plus a grand total. */
  summary(): Observable<TabSummary> {
    return defer(() => {
      const byPerson = new Map<string, bigint>();
      for (const e of this.store.values()) {
        byPerson.set(e.who, (byPerson.get(e.who) ?? 0n) + toCents(e.amount));
      }
      const ranked = [...byPerson.entries()].sort((a, b) =>
        a[1] === b[1] ? 0 : a[1] > b[1] ? -1 : 1,
      );
      const totals: PersonTotal[] = ranked.map(([who, cents]) => ({
        who,
        owed: fromCents(cents),
      }));
      const grand = ranked.reduce((sum, [, cents]) => sum + cents, 0n);
      return of({
        totals,
        grandTotal: fromCents(grand),
        note: totals.length
          ? `${totals[0].who} has the largest tab right now.`
          : 'The tab is currently empty.',
      });
    });
  }

  /** Synchronous core of `add`. Throws `Error` with a user-facing message. */
  addSync(request: CreateTabEntryRequest): TabEntry {
    const who = request.who?.trim() ?? '';
    const item = request.item?.trim() ?? '';
    if (!who) throw new Error("'who' is required.");
    if (!item) throw new Error("'item' is required.");
    const cents = parseAmount(request.amount);
    if (cents <= 0n) throw new Error("'amount' must be greater than zero.");

    const entry: TabEntry = {
      id: crypto.randomUUID(),
      who,
      item,
      amount: fromCents(cents),
      createdAt: new Date().toISOString(),
    };
    this.store.set(entry.id, entry);
    this.order.set(entry.id, this.seq++);
    return entry;
  }

  private sorted(): TabEntry[] {
    return [...this.store.values()].sort(
      (a, b) => this.order.get(b.id)! - this.order.get(a.id)!,
    );
  }
}

/** Parse a decimal string like "4.25" into cents. Rejects floats-in-disguise. */
export function parseAmount(raw: string): bigint {
  const s = (raw ?? '').trim().replace(/^\$/, '');
  const m = /^(-)?(\d+)(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) {
    if (/^-?\d+\.\d{3,}$/.test(s)) {
      throw new Error("'amount' can have at most two decimal places.");
    }
    throw new Error("'amount' must be a number, like 4.25.");
  }
  const cents = BigInt(m[2]) * 100n + BigInt((m[3] ?? '').padEnd(2, '0'));
  return m[1] ? -cents : cents;
}

function toCents(amount: string): bigint {
  return parseAmount(amount);
}

/** Cents back to a two-decimal string, e.g. 850n -> "8.50". */
export function fromCents(cents: bigint): string {
  const sign = cents < 0n ? '-' : '';
  const abs = cents < 0n ? -cents : cents;
  return `${sign}${abs / 100n}.${(abs % 100n).toString().padStart(2, '0')}`;
}

/** Pre-load the tab with the same sample purchases the backend used. */
function seedTheTab(service: SnackTabService): void {
  (
    [
      ['Priya', 'Afternoon Espresso', '3.50'],
      ['Dave', 'Kombucha', '4.25'],
      ['Dave', 'Kombucha (again)', '4.25'],
      ['Marcus', 'Sleeve of Oreos', '5.00'],
      ['Priya', 'Kettle Chips', '2.75'],
      ['Lena', 'Trail Mix', '3.00'],
    ] as const
  ).forEach(([who, item, amount]) => service.addSync({ who, item, amount }));
}
