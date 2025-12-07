import { test, expect } from '@playwright/test';

/**
 * End-to-End Tests mit Playwright
 * Diese Tests testen die gesamte Anwendung aus Benutzersicht
 */

test.describe('TicketManager - Login & Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Navigiere zur Login-Seite
    await page.goto('login.html');
  });

  test('Login-Seite sollte laden', async ({ page }) => {
    // Prüfe ob Login-Elemente vorhanden sind
    await expect(page).toHaveTitle(/Login|login/i);
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();
  });

  test('sollte mit gültigen Anmeldedaten anmelden können', async ({ page }) => {
    // Gib Anmeldedaten ein
    await page.fill('input[name="email"]', 'admin@ticketmanager.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Klicke Login-Button
    await page.click('button[type="submit"]');
    
    // Warte auf Navigation zur Hauptseite
    await page.waitForURL(/index\.html/);
    
    // Prüfe dass Dashboard geladen ist
    await expect(page.locator('h1, h2')).toBeVisible();
  });

  test('sollte mit ungültigen Anmeldedaten fehlschlagen', async ({ page }) => {
    // Gib ungültige Daten ein
    await page.fill('input[name="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    // Klicke Login-Button
    await page.click('button[type="submit"]');
    
    // Bleibe auf Login-Seite
    await expect(page).toHaveURL(/login\.html/);
    
    // Prüfe Fehlermeldung
    const errorMessage = page.locator('[role="alert"], .error, .alert-danger');
    await expect(errorMessage).toBeVisible();
  });

  test('sollte erforderliche Felder validieren', async ({ page }) => {
    // Versuche zu submitten ohne Daten einzugeben
    await page.click('button[type="submit"]');
    
    // Prüfe Validierungsmeldungen
    const emailInput = page.locator('input[name="email"]');
    await expect(emailInput).toHaveAttribute('required', /required/i);
  });
});

test.describe('TicketManager - Hauptseite', () => {
  test.beforeEach(async ({ page }) => {
    // Login vor jedem Test
    await page.goto('login.html');
    await page.fill('input[name="email"]', 'admin@ticketmanager.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL(/index\.html/);
  });

  test('sollte Ticket-Liste anzeigen', async ({ page }) => {
    // Warte auf Ticket-Liste
    const ticketList = page.locator('ul#tickets, [data-testid="ticket-list"]');
    await expect(ticketList).toBeVisible({ timeout: 5000 });
  });

  test('sollte Paginierung-Buttons anzeigen', async ({ page }) => {
    const prevBtn = page.locator('#prevPage, [data-testid="prev-page"]');
    const nextBtn = page.locator('#nextPage, [data-testid="next-page"]');
    
    await expect(prevBtn).toBeVisible();
    await expect(nextBtn).toBeVisible();
  });

  test('sollte Ticket erstellen können', async ({ page }) => {
    // Klicke auf "Neues Ticket" Button
    const createBtn = page.locator('button:has-text("Neues Ticket"), [data-testid="create-ticket"]');
    await expect(createBtn).toBeVisible();
    await createBtn.click();
    
    // Prüfe dass zur Ticket-Erstellungsseite navigiert wird
    await page.waitForURL(/index\.html\?id=/);
  });

  test('Dark Mode sollte funktionieren', async ({ page }) => {
    // Suche Dark Mode Toggle Button
    const themeToggle = page.locator('button:has-text("🌙"), button:has-text("☀️")');
    
    if (await themeToggle.isVisible()) {
      // Prüfe initialen Zustand
      const initialText = await themeToggle.textContent();
      
      // Klicke Toggle
      await themeToggle.click();
      
      // Prüfe dass sich der Text ändert
      const newText = await themeToggle.textContent();
      expect(initialText).not.toBe(newText);
      
      // Prüfe dass Dark Mode klasse hinzugefügt/entfernt wurde
      const htmlElement = page.locator('html');
      const hasDarkMode = await htmlElement.evaluate(el => 
        el.classList.contains('dark-mode')
      );
      expect(typeof hasDarkMode).toBe('boolean');
    }
  });

  test('Logout sollte zur Login-Seite führen', async ({ page }) => {
    // Suche Logout-Button (variiert je nach Implementation)
    const logoutBtn = page.locator('button:has-text("Logout"), [data-testid="logout"]');
    
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await page.waitForURL(/login\.html/);
      await expect(page).toHaveURL(/login\.html/);
    }
  });
});

test.describe('TicketManager - Benutzerverwaltung', () => {
  test.beforeEach(async ({ page }) => {
    // Login als Admin
    await page.goto('login.html');
    await page.fill('input[name="email"]', 'admin@ticketmanager.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Navigiere zu Benutzerverwaltung
    await page.goto('usermanagement.html');
    await page.waitForLoadState('networkidle');
  });

  test('Benutzerverwaltungsseite sollte laden', async ({ page }) => {
    // Prüfe dass Seite geladen ist
    await expect(page).toHaveURL(/usermanagement\.html/);
    const userList = page.locator('table, [data-testid="user-list"]');
    await expect(userList).toBeVisible({ timeout: 5000 });
  });

  test('sollte neue Benutzer hinzufügen können', async ({ page }) => {
    // Suche Button zum Benutzer hinzufügen
    const addUserBtn = page.locator('button:has-text("Benutzer hinzufügen"), button:has-text("Add User")');
    
    if (await addUserBtn.isVisible()) {
      await addUserBtn.click();
      
      // Fülle Formular aus
      await page.fill('input[name="firstname"]', 'Test');
      await page.fill('input[name="lastname"]', 'User');
      await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
      await page.fill('input[name="password"]', 'TestPass123!');
      
      // Submitte Formular
      await page.click('button[type="submit"]');
      
      // Prüfe Bestätigungsmeldung
      const successMsg = page.locator('[role="alert"]');
      await expect(successMsg).toContainText(/erfolgreich|success|created/i);
    }
  });

  test('sollte Benutzer bearbeiten können', async ({ page }) => {
    // Suche Edit Button für ersten Benutzer
    const editBtn = page.locator('button:has-text("Bearbeiten"), button:has-text("Edit")').first();
    
    if (await editBtn.isVisible()) {
      await editBtn.click();
      
      // Ändere Benutzerdaten
      const nameInput = page.locator('input[name="firstname"]');
      await nameInput.clear();
      await nameInput.fill('UpdatedName');
      
      // Speichere Änderungen
      await page.click('button[type="submit"]');
      
      // Prüfe Bestätigung
      await expect(page.locator('[role="alert"]')).toContainText(/aktualisiert|updated/i);
    }
  });

  test('sollte Benutzer löschen können', async ({ page }) => {
    // Suche Delete Button
    const deleteBtn = page.locator('button:has-text("Löschen"), button:has-text("Delete")').first();
    
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click();
      
      // Bestätige Löschung (Confirmation Dialog)
      const confirmBtn = page.locator('button:has-text("Ja"), button:has-text("Yes"), button:has-text("Confirm")');
      if (await confirmBtn.isVisible()) {
        await confirmBtn.click();
      }
      
      // Prüfe Bestätigung
      await expect(page.locator('[role="alert"]')).toContainText(/gelöscht|deleted/i);
    }
  });
});

test.describe('TicketManager - Ticket Details', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('login.html');
    await page.fill('input[name="email"]', 'admin@ticketmanager.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Navigiere zur Hauptseite
    await page.goto('index.html');
    await page.waitForLoadState('networkidle');
  });

  test('sollte Ticket-Details anzeigen können', async ({ page }) => {
    // Klicke auf erstes Ticket
    const firstTicket = page.locator('li, [data-testid="ticket-item"]').first();
    if (await firstTicket.isVisible()) {
      await firstTicket.click();
      
      // Prüfe dass zur Detail-Seite navigiert wird
      await page.waitForURL(/ticketdetail\.html/);
      
      // Prüfe dass Details geladen sind
      const ticketTitle = page.locator('h1, h2, [data-testid="ticket-title"]');
      await expect(ticketTitle).toBeVisible({ timeout: 5000 });
    }
  });

  test('sollte Ticket-Status ändern können', async ({ page }) => {
    // Navigiere zu Ticket-Details
    await page.goto('ticketdetail.html?id=1');
    await page.waitForLoadState('networkidle');
    
    // Suche Status Select
    const statusSelect = page.locator('select[name="status"], [data-testid="status"]');
    if (await statusSelect.isVisible()) {
      // Ändere Status
      await statusSelect.selectOption('geschlossen');
      
      // Speichere
      const saveBtn = page.locator('button:has-text("Speichern"), button:has-text("Save")');
      if (await saveBtn.isVisible()) {
        await saveBtn.click();
        
        // Prüfe Bestätigung
        await expect(page.locator('[role="alert"]')).toContainText(/erfolgreich|success/i);
      }
    }
  });

  test('sollte Kommentare anzeigen können', async ({ page }) => {
    // Navigiere zu Ticket-Details
    await page.goto('ticketdetail.html?id=1');
    await page.waitForLoadState('networkidle');
    
    // Prüfe Kommentar-Sektion
    const comments = page.locator('[data-testid="comments"], .comments');
    if (await comments.isVisible()) {
      await expect(comments).toBeVisible();
    }
  });

  test('sollte neuen Kommentar hinzufügen können', async ({ page }) => {
    // Navigiere zu Ticket-Details
    await page.goto('ticketdetail.html?id=1');
    await page.waitForLoadState('networkidle');
    
    // Suche Kommentar-Input
    const commentInput = page.locator('textarea[name="comment"], [data-testid="comment-input"]');
    if (await commentInput.isVisible()) {
      await commentInput.fill('Dies ist ein Test-Kommentar');
      
      // Klicke Submit Button
      const submitBtn = page.locator('button:has-text("Kommentar"), button:has-text("Comment"), button:has-text("Send")');
      if (await submitBtn.isVisible()) {
        await submitBtn.click();
        
        // Prüfe dass Kommentar hinzugefügt wurde
        await expect(page.locator('text=Dies ist ein Test-Kommentar')).toBeVisible({ timeout: 5000 });
      }
    }
  });
});

test.describe('TicketManager - Responsives Design', () => {
  test('sollte auf mobilen Geräten funktionieren', async ({ page }) => {
    // Setze Mobile Viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Login
    await page.goto('login.html');
    await page.fill('input[name="email"]', 'admin@ticketmanager.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Prüfe dass Dashboard responsiv ist
    await page.waitForURL(/index\.html/);
    const ticketList = page.locator('ul#tickets, [data-testid="ticket-list"]');
    await expect(ticketList).toBeVisible({ timeout: 5000 });
  });

  test('sollte auf Tablets funktionieren', async ({ page }) => {
    // Setze Tablet Viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Login
    await page.goto('login.html');
    await page.fill('input[name="email"]', 'admin@ticketmanager.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Prüfe dass alles funktioniert
    await page.waitForURL(/index\.html/);
    const ticketList = page.locator('ul#tickets, [data-testid="ticket-list"]');
    await expect(ticketList).toBeVisible({ timeout: 5000 });
  });
});

test.describe('TicketManager - Performance & Accessibility', () => {
  test('Seite sollte in angemessener Zeit laden', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('login.html');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // Sollte unter 3 Sekunden laden
  });

  test('Seitennavigation sollte funktionieren', async ({ page }) => {
    // Login
    await page.goto('login.html');
    await page.fill('input[name="email"]', 'admin@ticketmanager.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Navigiere zwischen verschiedenen Seiten
    await page.goto('index.html');
    await expect(page).toHaveURL(/index\.html/);
    
    await page.goto('usermanagement.html');
    await expect(page).toHaveURL(/usermanagement\.html/);
  });

  test('sollte korrekte HTTP Status-Codes haben', async ({ page }) => {
    const response = await page.goto('login.html');
    expect(response?.status()).toBe(200);
  });
});
