import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Test-Konfiguration
 * https://playwright.dev/docs/test-configuration
 */

export default defineConfig({
  testDir: './tests/e2e',
  /* Führe Dateien in Dateien parallel aus, aber Dateien selbst sequenziell */
  fullyParallel: false,
  /* Fehlgeschlagene Tests sofort beenden */
  forbidOnly: !!process.env.CI,
  /* Fehler beim Ausgehen von Tests auf stderr auslösen */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel workers on CI */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter */
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'junit.xml' }],
    ['list'],
  ],
  
  use: {
    /* Basis-URL für Tests verwenden */
    baseURL: 'file://' + __dirname + '/src',
    /* Sammle Spuren für jeden Test */
    trace: 'on-first-retry',
    /* Screenshots bei Fehlern */
    screenshot: 'only-on-failure',
    /* Video bei Fehlern */
    video: 'retain-on-failure',
  },

  /* Konfigurieren Sie Projekte für die wichtigsten Browser */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Web-Server ausführen während Tests */
  webServer: {
    command: 'npm start',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
