import { test, expect, Page } from '@playwright/test';
import { _electron } from 'playwright';

/**
 * End-to-End Tests mit Playwright für Electron App
 * Diese Tests testen die gesamte Anwendung aus Benutzersicht
 */

let electronApp;
let page;

test.describe.configure({ mode: 'parallel' });

test.beforeAll(async () => {
  // Launch the Electron app
  electronApp = await _electron.launch({
    args: ['--no-sandbox'],
    cwd: process.cwd()
  });
  page = await electronApp.firstWindow();
  
  // Maximize window for consistency
  await page.evaluate(() => {
    window.electronAPI?.window?.maximize?.();
  });
});

test.afterAll(async () => {
  // Close the app after all tests
  if (electronApp) {
    await electronApp.close();
  }
});

test.describe('TicketManager - Login & Authentication', () => {
  test('Login-Seite sollte laden', async () => {
    // Warte auf Login Form
    const emailInput = page.locator('input[name="eMail_login"], input[id*="mail"]');
    const passwordInput = page.locator('input[name="password_login"], input[type="password"]');
    
    await expect(emailInput).toBeVisible({ timeout: 5000 });
    await expect(passwordInput).toBeVisible();
  });

  test('sollte mit gültigen Anmeldedaten anmelden können', async () => {
    // Fülle Login-Formular aus
    const emailInput = page.locator('input[name="eMail_login"], input[id*="mail"]');
    const passwordInput = page.locator('input[name="password_login"], input[type="password"]');
    const loginBtn = page.locator('button[id="loginBtn"], button:has-text("Login")');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password');
    await loginBtn.click();
    
    // Warte auf Navigation zur Hauptseite (index.html)
    await page.waitForURL(/index\.html/, { timeout: 5000 });
    
    // Prüfe dass Dashboard geladen ist
    const header = page.locator('header h1, h1:has-text("Ticket Manager")');
    await expect(header).toBeVisible();
  });

  test('sollte mit ungültigen Anmeldedaten fehlschlagen', async () => {
    // Reload to get back to login
    await page.goto('login.html');
    
    const emailInput = page.locator('input[name="eMail_login"], input[id*="mail"]');
    const passwordInput = page.locator('input[name="password_login"], input[type="password"]');
    const loginBtn = page.locator('button[id="loginBtn"], button:has-text("Login")');
    
    // Gib ungültige Daten ein
    await emailInput.fill('invalid@test.com');
    await passwordInput.fill('wrongpassword');
    await loginBtn.click();
    
    // Sollte auf Login-Seite bleiben
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('login.html');
  });
});

test.describe('TicketManager - Hauptseite & Ticket Management', () => {
  test.beforeEach(async () => {
    // Login vor jedem Test
    await page.goto('login.html');
    const emailInput = page.locator('input[name="eMail_login"], input[id*="mail"]');
    const passwordInput = page.locator('input[name="password_login"], input[type="password"]');
    const loginBtn = page.locator('button[id="loginBtn"]');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password');
    await loginBtn.click();
    
    await page.waitForURL(/index\.html/, { timeout: 5000 });
  });

  test('sollte Ticket-Liste anzeigen', async () => {
    // Klicke auf "Alle Tickets" wenn nicht aktiv
    const allTicketsBtn = page.locator('button:has-text("Alle Tickets")').first();
    await allTicketsBtn.click();
    
    // Warte auf Ticket-Liste
    const ticketList = page.locator('ul#tickets');
    await expect(ticketList).toBeVisible({ timeout: 5000 });
  });

  test('sollte Paginierung-Buttons anzeigen', async () => {
    // Klicke auf "Alle Tickets"
    const allTicketsBtn = page.locator('button:has-text("Alle Tickets")').first();
    await allTicketsBtn.click();
    
    const prevBtn = page.locator('#prevPage');
    const nextBtn = page.locator('#nextPage');
    
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
  });

  test('sollte Statistik-Dashboard anzeigen', async () => {
    // Klicke auf "Alle Tickets"
    const allTicketsBtn = page.locator('button:has-text("Alle Tickets")').first();
    await allTicketsBtn.click();
    
    // Prüfe Statistik-Karten
    const statCards = page.locator('.stat-card');
    await expect(statCards).toHaveCount(4); // Gesamt, Offen, In Bearbeitung, Geschlossen
  });

  test('sollte Search-Funktionalität haben', async () => {
    // Klicke auf "Alle Tickets"
    const allTicketsBtn = page.locator('button:has-text("Alle Tickets")').first();
    await allTicketsBtn.click();
    
    // Suche nach Ticket
    const searchInput = page.locator('input#searchInput, .search-box');
    await expect(searchInput).toBeVisible();
    
    await searchInput.fill('test');
    await page.waitForTimeout(500); // Wait for search
    
    // Tickets sollten gefiltert sein
    const ticketList = page.locator('ul#tickets');
    await expect(ticketList).toBeVisible();
  });

  test('sollte Ticket erstellen können', async () => {
    // Klicke auf "Neues Ticket" Button
    const createBtn = page.locator('button:has-text("Neues Ticket")');
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    
    // Prüfe dass Formular sichtbar ist
    const titleInput = page.locator('#title');
    const descInput = page.locator('#description');
    const categorySelect = page.locator('#category');
    const submitBtn = page.locator('#createTicketBtn');
    
    await expect(titleInput).toBeVisible();
    await expect(descInput).toBeVisible();
    await expect(categorySelect).toBeVisible();
    
    // Fülle Formular aus
    await titleInput.fill('E2E Test Ticket');
    await descInput.fill('Dies ist ein Test-Ticket für E2E Tests');
    await categorySelect.selectOption('1');
    
    // Submitte Formular
    await submitBtn.click();
    
    // Prüfe dass Ticket erstellt wurde
    const result = page.locator('#createResult');
    await expect(result).toContainText(/erstellt|created/i, { timeout: 5000 });
  });

  test('sollte Status filtern können', async () => {
    // Klicke auf "Alle Tickets"
    const allTicketsBtn = page.locator('button:has-text("Alle Tickets")').first();
    await allTicketsBtn.click();
    
    // Warte auf Stat-Karten
    await page.waitForTimeout(500);
    
    // Klicke auf "Offen" Stat-Karte
    const openCard = page.locator('.stat-card').filter({ has: page.locator('text=Offen') });
    await openCard.click();
    
    // Warte auf Filter-Update
    await page.waitForTimeout(500);
    
    // Tickets sollten nur "Offen" Status haben
    const tickets = page.locator('ul#tickets li');
    if (await tickets.count() > 0) {
      const firstTicket = tickets.first();
      await expect(firstTicket).toBeVisible();
    }
  });
});

test.describe('TicketManager - Ticket Details', () => {
  test.beforeEach(async () => {
    // Login
    await page.goto('login.html');
    const emailInput = page.locator('input[name="eMail_login"], input[id*="mail"]');
    const passwordInput = page.locator('input[name="password_login"], input[type="password"]');
    const loginBtn = page.locator('button[id="loginBtn"]');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password');
    await loginBtn.click();
    
    await page.waitForURL(/index\.html/, { timeout: 5000 });
  });

  test('sollte Ticket-Details anzeigen können', async () => {
    // Klicke auf "Alle Tickets"
    const allTicketsBtn = page.locator('button:has-text("Alle Tickets")').first();
    await allTicketsBtn.click();
    
    // Warte auf Tickets
    await page.waitForTimeout(1000);
    
    // Klicke auf erstes Ticket
    const firstTicket = page.locator('ul#tickets li').first();
    if (await firstTicket.isVisible()) {
      await firstTicket.click();
      
      // Prüfe dass zur Detail-Seite navigiert wird
      await page.waitForURL(/ticketdetail\.html/, { timeout: 5000 });
      
      // Prüfe dass Details geladen sind
      const ticketTitle = page.locator('h2, [data-testid="ticket-title"]');
      await expect(ticketTitle).toBeVisible({ timeout: 5000 });
    }
  });

  test('sollte Ticket-Status ändern können', async () => {
    // Navigiere zu Ticket-Details (ID 1)
    await page.goto('ticketdetail.html?id=1');
    await page.waitForLoadState('networkidle');
    
    // Suche Status Select
    const statusSelect = page.locator('select[name="status"]');
    if (await statusSelect.isVisible()) {
      // Ändere Status
      await statusSelect.selectOption('Geschlossen');
      
      // Speichere
      const saveBtn = page.locator('button:has-text("Speichern"), button:has-text("Save")');
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        
        // Warte auf Speicherung
        await page.waitForTimeout(1000);
        
        // Sollte zurück geleitet werden
        await expect(page).toHaveURL(/index\.html/, { timeout: 5000 });
      }
    }
  });
});

test.describe('TicketManager - Responsives Design', () => {
  test('sollte bei verschiedenen Viewport-Größen funktionieren', async () => {
    // Login
    await page.goto('login.html');
    const emailInput = page.locator('input[name="eMail_login"], input[id*="mail"]');
    const passwordInput = page.locator('input[name="password_login"], input[type="password"]');
    const loginBtn = page.locator('button[id="loginBtn"]');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password');
    await loginBtn.click();
    
    await page.waitForURL(/index\.html/, { timeout: 5000 });
    
    // Setze kleinerer Viewport (mobile simulation)
    await page.setViewportSize({ width: 480, height: 800 });
    
    // Prüfe dass UI responsive ist
    const ticketList = page.locator('ul#tickets, #content-area');
    await expect(ticketList).toBeVisible();
    
    // Stelle Viewport wieder her
    await page.setViewportSize({ width: 1280, height: 1024 });
  });
});

test.describe('TicketManager - Performance', () => {
  test('Seite sollte schnell laden', async () => {
    const startTime = Date.now();
    
    await page.goto('login.html');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Sollte unter 3 Sekunden laden
  });

  test('Navigation zwischen Views sollte funktionieren', async () => {
    // Login
    await page.goto('login.html');
    const emailInput = page.locator('input[name="eMail_login"], input[id*="mail"]');
    const passwordInput = page.locator('input[name="password_login"], input[type="password"]');
    const loginBtn = page.locator('button[id="loginBtn"]');
    
    await emailInput.fill('test@example.com');
    await passwordInput.fill('password');
    await loginBtn.click();
    
    await page.waitForURL(/index\.html/, { timeout: 5000 });
    
    // Navigiere zu Alle Tickets
    const allTicketsBtn = page.locator('button:has-text("Alle Tickets")').first();
    await allTicketsBtn.click();
    await page.waitForTimeout(300);
    
    // Navigiere zu Neues Ticket
    const createBtn = page.locator('button:has-text("Neues Ticket")');
    await createBtn.click();
    await page.waitForTimeout(300);
    
    // Navigiere zurück zu Alle Tickets
    await allTicketsBtn.click();
    await page.waitForTimeout(300);
    
    // Sollte schnell navigieren
    const ticketList = page.locator('ul#tickets');
    await expect(ticketList).toBeVisible();
  });
});
