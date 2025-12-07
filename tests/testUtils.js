/**
 * Test Utilities und Helper-Funktionen
 */

/**
 * Erstellt Mock-Daten für Tests
 */
class MockDataGenerator {
  static createUser(overrides = {}) {
    return {
      benutzer_id: 1,
      vorname: 'Max',
      nachname: 'Mustermann',
      email: 'max@test.com',
      passwort_hash: 'hashedPassword',
      rolle_id: 3,
      aktiv: true,
      ...overrides,
    };
  }

  static createTicket(overrides = {}) {
    return {
      ticket_id: 1,
      titel: 'Test Ticket',
      beschreibung: 'Test Description',
      kategorie_id: 1,
      erstellt_von: 1,
      zugewiesen_an: 2,
      erstellt_am: new Date(),
      status: 'offen',
      ...overrides,
    };
  }

  static createComment(overrides = {}) {
    return {
      kommentar_id: 1,
      ticket_id: 1,
      benutzer_id: 1,
      inhalt: 'Test comment',
      erstellt_am: new Date(),
      vorname: 'Max',
      nachname: 'Mustermann',
      rolle_name: 'User',
      ...overrides,
    };
  }

  static createRole(overrides = {}) {
    return {
      rolle_id: 3,
      name: 'User',
      ...overrides,
    };
  }

  static createMultipleUsers(count = 5) {
    return Array.from({ length: count }, (_, i) => this.createUser({
      benutzer_id: i + 1,
      email: `user${i + 1}@test.com`,
    }));
  }

  static createMultipleTickets(count = 10) {
    return Array.from({ length: count }, (_, i) => this.createTicket({
      ticket_id: i + 1,
      titel: `Ticket ${i + 1}`,
    }));
  }

  static createMultipleComments(ticketId, count = 3) {
    return Array.from({ length: count }, (_, i) => this.createComment({
      kommentar_id: i + 1,
      ticket_id: ticketId,
      benutzer_id: i + 1,
      inhalt: `Comment ${i + 1}`,
    }));
  }
}

/**
 * Database Test Helper
 */
class DatabaseTestHelper {
  constructor(pool) {
    this.pool = pool;
  }

  async clearTable(tableName) {
    let conn;
    try {
      conn = await this.pool.getConnection();
      await conn.query(`DELETE FROM ${tableName}`);
    } finally {
      if (conn) conn.release();
    }
  }

  async clearAllTables() {
    const tables = ['kommentar', 'ticket', 'benutzer', 'rolle'];
    for (const table of tables) {
      await this.clearTable(table);
    }
  }

  async seedDatabase() {
    // Beispiel-Implementierung für Test-Daten
    // Diese würde echte Daten in die Test-DB einfügen
  }

  async getTableRowCount(tableName) {
    let conn;
    try {
      conn = await this.pool.getConnection();
      const result = await conn.query(`SELECT COUNT(*) AS count FROM ${tableName}`);
      return result[0].count;
    } finally {
      if (conn) conn.release();
    }
  }
}

/**
 * Assertion Helpers
 */
const AssertionHelpers = {
  /**
   * Prüft ob Benutzer gültig ist
   */
  isValidUser(user) {
    return (
      user &&
      typeof user.benutzer_id === 'number' &&
      typeof user.vorname === 'string' &&
      typeof user.nachname === 'string' &&
      typeof user.email === 'string' &&
      user.email.includes('@')
    );
  },

  /**
   * Prüft ob Ticket gültig ist
   */
  isValidTicket(ticket) {
    return (
      ticket &&
      typeof ticket.ticket_id === 'number' &&
      typeof ticket.titel === 'string' &&
      typeof ticket.beschreibung === 'string' &&
      ticket.titel.length > 0
    );
  },

  /**
   * Prüft ob Kommentar gültig ist
   */
  isValidComment(comment) {
    return (
      comment &&
      typeof comment.kommentar_id === 'number' &&
      typeof comment.inhalt === 'string' &&
      comment.inhalt.length > 0
    );
  },

  /**
   * Prüft ob Email gültig ist
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Prüft ob Passwort stark genug ist
   */
  isStrongPassword(password) {
    return (
      password.length >= 8 &&
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /[0-9]/.test(password)
    );
  },
};

/**
 * Time Helper für asynchrone Tests
 */
const TimeHelpers = {
  /**
   * Wartet für angegebene Millisekunden
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  /**
   * Misst Execution-Zeit einer Funktion
   */
  async measureExecutionTime(fn) {
    const startTime = Date.now();
    const result = await fn();
    const duration = Date.now() - startTime;
    return { result, duration };
  },

  /**
   * Führt Funktion mit Timeout aus
   */
  async withTimeout(fn, timeoutMs) {
    return Promise.race([
      fn(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
      ),
    ]);
  },
};

module.exports = {
  MockDataGenerator,
  DatabaseTestHelper,
  AssertionHelpers,
  TimeHelpers,
};
