import { firstValueFrom } from 'rxjs';
import { SnackTabService, fromCents, parseAmount } from './snack-tab.service';

describe('SnackTabService', () => {
  let service: SnackTabService;

  beforeEach(() => {
    service = new SnackTabService();
  });

  it('seeds six entries, newest first', async () => {
    const entries = await firstValueFrom(service.list());
    expect(entries.length).toBe(6);
    expect(entries[0].item).toBe('Trail Mix');
    expect(entries[5].item).toBe('Afternoon Espresso');
  });

  it('adds an entry to the top of the tab', async () => {
    const created = await firstValueFrom(
      service.add({ who: ' You ', item: ' Cookie ', amount: '1.5' }),
    );
    expect(created).toMatchObject({ who: 'You', item: 'Cookie', amount: '1.50' });
    const entries = await firstValueFrom(service.list());
    expect(entries[0].id).toBe(created.id);
  });

  it.each([
    [{ who: '', item: 'x', amount: '1' }, "'who' is required."],
    [{ who: 'a', item: ' ', amount: '1' }, "'item' is required."],
    [{ who: 'a', item: 'x', amount: '0' }, "'amount' must be greater than zero."],
    [{ who: 'a', item: 'x', amount: '-1' }, "'amount' must be greater than zero."],
    [{ who: 'a', item: 'x', amount: 'abc' }, "'amount' must be a number, like 4.25."],
    [{ who: 'a', item: 'x', amount: '1.005' }, "'amount' can have at most two decimal places."],
  ])('rejects %o', async (req, message) => {
    await expect(firstValueFrom(service.add(req))).rejects.toThrow(message);
  });

  it('errors when settling an unknown id', async () => {
    await expect(firstValueFrom(service.settle('nope'))).rejects.toThrow("No tab entry with id 'nope'.");
  });

  it('settles an entry', async () => {
    const [top] = await firstValueFrom(service.list());
    await firstValueFrom(service.settle(top.id));
    expect((await firstValueFrom(service.list())).length).toBe(5);
  });

  it('summarizes per person, highest first, with exact totals', async () => {
    const s = await firstValueFrom(service.summary());
    expect(s.totals[0]).toEqual({ who: 'Dave', owed: '8.50' });
    expect(s.totals.map((t) => t.who)).toEqual(['Dave', 'Priya', 'Marcus', 'Lena']);
    expect(s.grandTotal).toBe('22.75');
    expect(s.note).toBe('Dave has the largest tab right now.');
  });

  it('keeps money exact: 0.10 + 0.20 is 0.30', async () => {
    await firstValueFrom(service.add({ who: 'Zed', item: 'a', amount: '0.10' }));
    await firstValueFrom(service.add({ who: 'Zed', item: 'b', amount: '0.20' }));
    const s = await firstValueFrom(service.summary());
    expect(s.totals.find((t) => t.who === 'Zed')?.owed).toBe('0.30');
  });

  it('reports an empty tab', async () => {
    for (const e of await firstValueFrom(service.list())) {
      await firstValueFrom(service.settle(e.id));
    }
    const s = await firstValueFrom(service.summary());
    expect(s).toEqual({ totals: [], grandTotal: '0.00', note: 'The tab is currently empty.' });
  });

  it('converts cents both ways', () => {
    expect(parseAmount('$4.25')).toBe(425n);
    expect(fromCents(5n)).toBe('0.05');
  });
});
