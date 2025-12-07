# TicketManager - Test Suite

Dieses Projekt enthält umfassende Unit-Tests, Integrationstests und End-to-End-Tests für die TicketManager-Anwendung.

## Test-Struktur

```
tests/
├── unit/                          # Unit-Tests
│   └── db.test.js                # Tests für Database-Funktionen
├── integration/                   # Integrationstests
│   ├── database.integration.test.js      # DB-Integration Tests
│   └── renderer.integration.test.js      # UI-Integration Tests
├── e2e/                           # End-to-End-Tests
│   └── ticketmanager.spec.js      # Vollständige User-Flows
└── testUtils.js                   # Gemeinsame Test-Utilities
```

## Installation

### Abhängigkeiten
Alle notwendigen Test-Abhängigkeiten wurden bereits installiert:

- **Jest**: Unit- und Integrationstests
- **Playwright**: End-to-End-Tests
- **jest-mock-extended**: Mock-Utilities für Jest
- **supertest**: HTTP-Testing (optional)

```bash
npm install
```

## Test-Befehle

### Unit-Tests ausführen
```bash
npm run test:unit
```

Unit-Tests mit Code-Coverage:
```bash
npm run test:coverage
```

Watch-Modus (Tests bei Änderungen automatisch ausführen):
```bash
npm run test:watch
```

### Integrationstests ausführen
```bash
npm run test:integration
```

### End-to-End-Tests ausführen
```bash
# Standard E2E-Tests (headless)
npm run test:e2e

# Mit UI (interaktiv)
npm run test:e2e:ui

# Debug-Modus (mit Inspector)
npm run test:e2e:debug
```

### Alle Tests ausführen
```bash
npm run test:all
```

## Unit-Tests (db.js)

Die Unit-Tests befinden sich in `tests/unit/db.test.js` und testen alle Funktionen der `src/db.js`:

### Getestete Funktionen:

#### Ticket-Operationen
- ✅ `getTickets()` - Alle Tickets abrufen
- ✅ `getAssignedTickets(user_id)` - Zugewiesene Tickets
- ✅ `getTicketsByCreator(user_id)` - Von Benutzer erstellte Tickets
- ✅ `getHomeTickets(user_id, role_id)` - Home-Dashboard Tickets
- ✅ `getTicket(ticket_id)` - Einzelnes Ticket abrufen
- ✅ `createTicket(...)` - Neues Ticket erstellen
- ✅ `updateTicket(ticket_id, data)` - Ticket aktualisieren
- ✅ `deleteTicket(ticket_id)` - Ticket löschen

#### Benutzer-Operationen
- ✅ `getUser(user_id)` - Benutzer abrufen
- ✅ `getUserByEmail(email)` - Benutzer nach Email suchen
- ✅ `getUsers()` - Alle Benutzer abrufen
- ✅ `createUser(...)` - Neuen Benutzer erstellen
- ✅ `updateUser(...)` - Benutzer aktualisieren
- ✅ `deleteUser(user_id)` - Benutzer löschen

#### Rollen
- ✅ `getRoles()` - Alle Rollen abrufen

#### Kommentare
- ✅ `createComment(...)` - Kommentar erstellen
- ✅ `getCommentsByTicket(ticket_id)` - Kommentare abrufen

### Beispiel Unit-Test:
```javascript
it('sollte alle Tickets abrufen', async () => {
  const mockTickets = [
    { ticket_id: 1, titel: 'Ticket 1' },
    { ticket_id: 2, titel: 'Ticket 2' }
  ];
  mockConnection.query.mockResolvedValueOnce(mockTickets);

  const result = await db.getTickets();

  expect(result).toEqual(mockTickets);
  expect(mockConnection.release).toHaveBeenCalled();
});
```

## Integrationstests

### Database Integration Tests (`database.integration.test.js`)
Testen die Interaktion zwischen mehreren Datenbank-Funktionen:

- **Ticket-Operationen**: CRUD-Operationen mit komplexeren Szenarien
- **Benutzer-Operationen**: Benutzerverwaltung und Validierungen
- **Kommentar-Operationen**: Kommentare für Tickets
- **Rollen-Management**: Rollenbasierte Zugriffskontrolle
- **Home Tickets nach Rolle**: Unterschiedliche Ticket-Anzeigen je Rolle
- **Datenbank-Konsistenz**: Integritätschecks
- **Performance-Tests**: Ausführungszeitmessungen

### Renderer Integration Tests (`renderer.integration.test.js`)
Testen Frontend-Funktionalität und UI-Interaktionen:

- Dark Mode Funktionalität
- Ticket-Verwaltung im UI
- Benutzerverwaltung im UI
- Login-Flow
- Ticket-Details-Ansicht
- Rollenbeschränkungen im UI

## End-to-End-Tests (Playwright)

Die E2E-Tests befinden sich in `tests/e2e/ticketmanager.spec.js` und testen die gesamte Anwendung aus Benutzer-Perspektive.

### Test-Suites:

#### 1. **Login & Authentication**
- ✅ Login-Seite sollte laden
- ✅ Anmeldung mit gültigen Anmeldedaten
- ✅ Fehlschlag bei ungültigen Anmeldedaten
- ✅ Formularvalidierung
- ✅ Logout-Funktionalität

#### 2. **Hauptseite (Dashboard)**
- ✅ Ticket-Liste anzeigen
- ✅ Paginierung
- ✅ Neue Tickets erstellen
- ✅ Dark Mode Toggle
- ✅ Logout-Funktion

#### 3. **Benutzerverwaltung**
- ✅ Benutzerverwaltungsseite laden
- ✅ Neue Benutzer hinzufügen
- ✅ Benutzer bearbeiten
- ✅ Benutzer löschen

#### 4. **Ticket-Details**
- ✅ Ticket-Details anzeigen
- ✅ Status ändern
- ✅ Kommentare anzeigen
- ✅ Kommentare hinzufügen

#### 5. **Responsives Design**
- ✅ Mobiles Layout (375x667)
- ✅ Tablet Layout (768x1024)

#### 6. **Performance & Accessibility**
- ✅ Seitenlade-Zeit messen
- ✅ HTTP Status-Codes prüfen

### Beispiel E2E-Test:
```javascript
test('sollte mit gültigen Anmeldedaten anmelden können', async ({ page }) => {
  await page.goto('login.html');
  await page.fill('input[name="email"]', 'admin@ticketmanager.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForURL(/index\.html/);
  await expect(page.locator('h1, h2')).toBeVisible();
});
```

## Playwright Konfiguration

Die Playwright-Konfiguration (`playwright.config.js`) enthält:

- **Browser**: Chrome, Firefox, Safari
- **Viewports**: Desktop, Mobile, Tablet
- **Screenshots**: Bei Fehlern
- **Videos**: Bei Fehlschlag
- **Traces**: Für Debugging
- **Reporter**: HTML, JUnit XML, Console

### Playwright UI starten
```bash
npm run test:e2e:ui
```

### Reports anzeigen
Nach der Ausführung:
```bash
npx playwright show-report
```

## Test-Utilities

Die Datei `tests/testUtils.js` enthält hilfreiche Funktionen:

### MockDataGenerator
Erstellt Mock-Daten für Tests:
```javascript
const { MockDataGenerator } = require('./testUtils');

const user = MockDataGenerator.createUser({ vorname: 'Max' });
const tickets = MockDataGenerator.createMultipleTickets(10);
```

### AssertionHelpers
Validierungs-Helper:
```javascript
const { AssertionHelpers } = require('./testUtils');

expect(AssertionHelpers.isValidEmail('test@example.com')).toBe(true);
expect(AssertionHelpers.isStrongPassword('Password123')).toBe(true);
```

### TimeHelpers
Timing-Utilities:
```javascript
const { TimeHelpers } = require('./testUtils');

// Execution-Zeit messen
const { result, duration } = await TimeHelpers.measureExecutionTime(async () => {
  return await db.getTickets();
});

// Mit Timeout ausführen
await TimeHelpers.withTimeout(async () => {
  return await db.getTickets();
}, 5000);
```

## Jest Konfiguration

Die Konfiguration (`jest.config.js`) enthält:

- **testEnvironment**: 'node' (für Node.js Apps)
- **collectCoverage**: Code-Coverage-Reports
- **testMatch**: Pattern für Test-Dateien
- **clearMocks**: Mocks werden vor jedem Test geleert
- **testTimeout**: 10 Sekunden

### Coverage Report anzeigen
```bash
npm run test:coverage
```

## Best Practices für Tests

### 1. Unit-Tests
- Teste nur eine Funktion pro Test
- Verwende Mocks für externe Abhängigkeiten
- Teste Fehlerbehandlung
- Teste Edge-Cases

```javascript
it('sollte null zurückgeben, wenn Benutzer nicht existiert', async () => {
  mockConnection.query.mockResolvedValueOnce([]);
  const result = await db.getUser(999);
  expect(result).toBeUndefined();
});
```

### 2. Integrationstests
- Teste Zusammenspiel mehrerer Komponenten
- Verwende echte oder In-Memory-Datenbanken
- Teste komplexe Workflows
- Teste Datenbank-Constraints

### 3. E2E-Tests
- Teste komplette User-Flows
- Teste verschiedene Browser und Viewports
- Teste Fehlerbehandlung und Validierung
- Verwende sprechende Selektoren

```javascript
// Gut
await page.click('button:has-text("Login")');

// Besser (mit data-testid)
await page.click('[data-testid="login-button"]');
```

## Debugging

### Jest Debugging
```bash
# Mit Node Inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Mit Chrome DevTools
# Chrome DevTools öffnen: chrome://inspect
```

### Playwright Debugging
```bash
# Debug-Modus mit Inspector
npm run test:e2e:debug

# Mit Trace-Datei öffnen
npx playwright show-trace trace.zip
```

## CI/CD Integration

Für GitHub Actions oder andere CI/CD-Systeme:

```yaml
- name: Run Tests
  run: npm run test:all

- name: Upload Coverage
  uses: codecov/codecov-action@v3
```

## Fehlerbehebung

### Jest Tests schlagen fehl
1. Stelle sicher, dass alle Mocks korrekt konfiguriert sind
2. Prüfe auf Timing-Probleme (async/await)
3. Cleane Jest Cache: `jest --clearCache`

### Playwright Tests schlagen fehl
1. Nutze `npm run test:e2e:ui` für Debugging
2. Prüfe auf Selector-Probleme
3. Erhöhe Timeouts bei langsamen Systemen
4. Prüfe Browser-Installation: `npx playwright install`

### Timeout Fehler
- Erhöhe `testTimeout` in `jest.config.js` oder `playwright.config.js`
- Prüfe auf unauflösliche Promises
- Nutze `test.setTimeout()` für einzelne Tests

## Kontakt & Support

Bei Fragen zu Tests: Siehe Jest und Playwright Dokumentation
- Jest: https://jestjs.io/docs/getting-started
- Playwright: https://playwright.dev/

---

**Letztes Update**: Dezember 2025
