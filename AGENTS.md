# Snack Tab, front-end only

Angular 22 SPA port of the Office Snack Tab demo. No backend. Hosted on GitHub Pages at https://snacktab.bcgxdemos.com. Repo: `madmaxlax/snack-tab-front-end-only` (personal account, public).

## Where things are

| Need | Look at |
| --- | --- |
| All business logic and seed data | `src/app/core/snack-tab.service.ts` |
| Data shapes and `money()` formatter | `src/app/core/snack-tab.models.ts` |
| The single component | `src/app/app.ts`, `app.html`, `app.css` |
| Deploy pipeline | `.github/workflows/deploy.yml` |

## Rules

- Money is exact. Amounts are decimal strings outside the service and BigInt cents inside it. Never sum with `Number()`.
- `SnackTabService` keeps the Observable API of the old HTTP service. Components should not know whether a backend exists.
- Built with base href `/` because it is served from the custom domain root. If the custom domain is dropped, build with `--base-href /snack-tab-front-end-only/`.
- Run `npx ng test --watch=false` before pushing. CI runs the same.

## Origin

Copied 2026-10-01 from `main` of the full-stack snack-tab-demo (commit `61653b2`). The later filter-chips feature branch was not included. No git history was carried over.
