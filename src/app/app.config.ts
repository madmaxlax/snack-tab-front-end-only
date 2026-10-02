import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';

/** Root DI providers for the standalone app. No HttpClient: the tab lives in the browser. */
export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
  ],
};
