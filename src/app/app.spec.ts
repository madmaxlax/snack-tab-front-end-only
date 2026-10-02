import { TestBed } from '@angular/core/testing';
import { App } from './app';

/** Component test against the real in-browser SnackTabService. */
describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [App] }).compileComponents();
  });

  it('renders the header and the seeded tab', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('h1')?.textContent).toContain('Office Snack Tab');
    expect(el.querySelectorAll('.tab-list li').length).toBe(6);
    expect(el.querySelector('.grand')?.textContent).toContain('$22.75');
  });
});
