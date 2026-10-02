import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SnackTabService } from './core/snack-tab.service';
import { TabEntry, TabSummary, money } from './core/snack-tab.models';

/**
 * The whole (small) app: shows the tab, the per-person summary, and a form to add
 * a snack. State is held in signals; the template reads them reactively. We depend
 * on SnackTabService, which keeps the tab in memory in the browser.
 */
@Component({
  selector: 'app-root',
  imports: [FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  private readonly service = inject(SnackTabService);

  // --- reactive state ---
  protected readonly entries = signal<TabEntry[]>([]);
  protected readonly summary = signal<TabSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<string | null>(null);

  // --- add-form fields (two-way bound via ngModel) ---
  protected who = '';
  protected item = '';
  protected amount = '';

  // expose the money formatter to the template
  protected readonly money = money;

  ngOnInit(): void {
    this.reload();
  }

  /** Refresh both the tab and the per-person summary. */
  protected reload(): void {
    this.loading.set(true);
    this.error.set(null);

    this.service.list().subscribe({
      next: (entries) => {
        this.entries.set(entries);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load the tab.');
        this.loading.set(false);
      },
    });

    this.service.summary().subscribe({
      next: (summary) => this.summary.set(summary),
      error: () => {/* the tab error above already covers the failure banner */},
    });
  }

  /** Add the current form values to the tab, then refresh. */
  protected addSnack(): void {
    if (!this.who.trim() || !this.item.trim() || !this.amount.trim()) {
      this.error.set('Please fill in who, what, and how much.');
      return;
    }
    this.service.add({ who: this.who, item: this.item, amount: this.amount }).subscribe({
      next: () => {
        this.who = '';
        this.item = '';
        this.amount = '';
        this.reload();
      },
      error: (err) => {
        this.error.set(err instanceof Error ? err.message : 'Could not add that entry.');
      },
    });
  }

  /** Settle (delete) an entry, then refresh. */
  protected settle(entry: TabEntry): void {
    this.service.settle(entry.id).subscribe({
      next: () => this.reload(),
      error: () => this.error.set('Could not settle that entry.'),
    });
  }
}
