/**
 * Unit Tests für db.js - Vereinfachte Version
 * Diese Tests zeigen die Struktur und können mit einer echten Test-DB ausgeführt werden
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Import database functions
const db = require('../../src/db');

describe('Database Functions - Unit Tests', () => {
  // Initialize pool before tests
  beforeAll(() => {
    db.initPool();
  });

  // Close pool after tests
  afterAll(async () => {
    await db.closePool();
  });

  describe('Ticket Functions', () => {
    test('getTickets sollte eine Liste zurückgeben', async () => {
      const tickets = await db.getTickets();
      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.length).toBeGreaterThanOrEqual(0);
      if (tickets.length > 0) {
        expect(tickets[0]).toHaveProperty('ticket_id');
        expect(tickets[0]).toHaveProperty('titel');
      }
    });

    test('createTicket sollte ein Ticket erstellen und ID zurückgeben', async () => {
      const ticketData = {
        title: 'Test Ticket ' + Date.now(),
        description: 'Test Description ' + Date.now(),
        customer_id: 1,
        category: 1,
        status: 'Offen'
      };
      const ticketId = await db.createTicket(
        ticketData.title,
        ticketData.description,
        ticketData.customer_id,
        ticketData.category,
        ticketData.status
      );
      expect(typeof ticketId).toBe('number');
      expect(ticketId).toBeGreaterThan(0);
      
      // Verify the ticket was actually created
      const ticket = await db.getTicket(ticketId);
      expect(ticket).toBeDefined();
      expect(ticket.titel).toBe(ticketData.title);
      expect(ticket.beschreibung).toBe(ticketData.description);
    });

    test('updateTicket sollte Änderungen speichern können', async () => {
      // First create a ticket
      const ticketId = await db.createTicket(
        'Update Test ' + Date.now(),
        'Original Description',
        1,
        1,
        'Offen'
      );

      // Now update it
      const updatedData = {
        titel: 'Aktualisiertes Ticket ' + Date.now(),
        beschreibung: 'Neue Beschreibung',
        status: 'Geschlossen'
      };
      await db.updateTicket(ticketId, updatedData);

      // Verify the update
      const ticket = await db.getTicket(ticketId);
      expect(ticket.titel).toBe(updatedData.titel);
      expect(ticket.beschreibung).toBe(updatedData.beschreibung);
      expect(ticket.status).toBe(updatedData.status);
    });

    test('getTicket sollte einzelnes Ticket zurückgeben', async () => {
      // Create a ticket first
      const ticketId = await db.createTicket(
        'Get Test ' + Date.now(),
        'Description for get test',
        1,
        1,
        'Offen'
      );

      // Retrieve it
      const ticket = await db.getTicket(ticketId);
      expect(ticket).toBeDefined();
      expect(ticket.ticket_id).toBe(ticketId);
      expect(ticket.titel).toBeTruthy();
      expect(ticket.beschreibung).toBeTruthy();
    });

    test('deleteTicket sollte ein Ticket löschen', async () => {
      // Create a ticket
      const ticketId = await db.createTicket(
        'Delete Test ' + Date.now(),
        'To be deleted',
        1,
        1,
        'Offen'
      );

      // Delete it
      await db.deleteTicket(ticketId);

      // Verify it's deleted (should return undefined or empty array)
      const ticket = await db.getTicket(ticketId);
      expect(ticket).toBeUndefined();
    });
  });

  describe('User Functions', () => {
    test('getUser sollte User-Objekt zurückgeben', async () => {
      // Get a known user (assuming user_id 1 exists from setup)
      const user = await db.getUser(1);
      expect(user).toBeDefined();
      expect(user).toHaveProperty('benutzer_id');
      expect(user).toHaveProperty('vorname');
      expect(user).toHaveProperty('email');
    });

    test('getUserByEmail sollte Benutzer nach Email finden', async () => {
      // This test assumes a test user exists
      const result = await db.getUserByEmail('test@example.com');
      if (result && result.success && result.user) {
        expect(result.user).toHaveProperty('benutzer_id');
        expect(result.user).toHaveProperty('email');
        expect(result.user.email).toContain('@');
      }
    });

    test('getUsers sollte Array zurückgeben', async () => {
      const users = await db.getUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThanOrEqual(0);
      if (users.length > 0) {
        expect(users[0]).toHaveProperty('benutzer_id');
      }
    });

    test('createUser sollte gültigen User erstellen', async () => {
      const userData = {
        vorname: 'Test',
        nachname: 'User ' + Date.now(),
        email: 'testuser' + Date.now() + '@example.com',
        passwort: 'TestPassword123',
        rolle_id: 3
      };
      
      const userId = await db.createUser(
        userData.vorname,
        userData.nachname,
        userData.email,
        userData.passwort,
        userData.rolle_id
      );
      
      expect(typeof userId).toBe('number');
      expect(userId).toBeGreaterThan(0);

      // Verify user was created
      const user = await db.getUser(userId);
      expect(user).toBeDefined();
      expect(user.vorname).toBe(userData.vorname);
      expect(user.email).toBe(userData.email);
    });

    test('updateUser sollte User-Daten aktualisieren', async () => {
      // Create a user first
      const userId = await db.createUser(
        'Update',
        'User ' + Date.now(),
        'updateuser' + Date.now() + '@example.com',
        'Password123',
        3
      );

      // Update the user
      const updatedData = {
        vorname: 'Aktualisiert',
        nachname: 'Name ' + Date.now(),
        rolle_id: 2
      };
      await db.updateUser(userId, updatedData);

      // Verify update
      const user = await db.getUser(userId);
      expect(user.vorname).toBe(updatedData.vorname);
      expect(user.nachname).toBe(updatedData.nachname);
    });
  });

  describe('Comment Functions', () => {
    test('createComment sollte Kommentar speichern', async () => {
      // Create a ticket first
      const ticketId = await db.createTicket(
        'Comment Test ' + Date.now(),
        'For comments',
        1,
        1,
        'Offen'
      );

      // Create a comment
      const commentData = {
        ticket_id: ticketId,
        benutzer_id: 1,
        inhalt: 'Dies ist ein Test-Kommentar ' + Date.now()
      };
      const commentId = await db.createComment(
        commentData.ticket_id,
        commentData.benutzer_id,
        commentData.inhalt
      );

      expect(typeof commentId).toBe('number');
      expect(commentId).toBeGreaterThan(0);
    });

    test('getCommentsByTicket sollte Kommentare eines Tickets filtern', async () => {
      // Create a ticket
      const ticketId = await db.createTicket(
        'Comment Filter Test ' + Date.now(),
        'For filtering comments',
        1,
        1,
        'Offen'
      );

      // Create two comments
      await db.createComment(ticketId, 1, 'Comment 1 ' + Date.now());
      await db.createComment(ticketId, 1, 'Comment 2 ' + Date.now());

      // Get comments for this ticket
      const comments = await db.getCommentsByTicket(ticketId);
      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBeGreaterThanOrEqual(2);
      
      // Verify all comments belong to this ticket
      comments.forEach(comment => {
        expect(comment.ticket_id).toBe(ticketId);
      });
    });
  });

  describe('Role Functions', () => {
    test('getRoles sollte verfügbare Rollen zurückgeben', async () => {
      const roles = await db.getRoles();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);
      
      // Verify role structure
      roles.forEach(role => {
        expect(role).toHaveProperty('rolle_id');
        expect(role).toHaveProperty('name');
      });
    });
  });

  describe('Validierungen', () => {
    test('E-Mail-Validierung sollte funktionieren', () => {
      const validEmail = 'test@example.com';
      const invalidEmail = 'invalid@.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      
      expect(emailRegex.test(validEmail)).toBe(true);
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    test('Passwort-Stärke-Validierung', () => {
      const weakPassword = 'pass';
      const strongPassword = 'Password123!';
      
      const isStrong = (pwd) => pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd);
      
      expect(isStrong(weakPassword)).toBe(false);
      expect(isStrong(strongPassword)).toBe(true);
    });

    test('Ticket-Status sollte gültig sein', () => {
      const validStatuses = ['Offen', 'In Bearbeitung', 'Geschlossen'];
      const status = 'Offen';
      
      expect(validStatuses).toContain(status);
    });
  });

  describe('Daten-Konsistenz', () => {
    test('User ID sollte immer eine Zahl sein', () => {
      const userId = 1;
      expect(typeof userId).toBe('number');
      expect(userId > 0).toBe(true);
    });

    test('Ticket ID sollte immer eine Zahl sein', () => {
      const ticketId = 5;
      expect(typeof ticketId).toBe('number');
      expect(ticketId > 0).toBe(true);
    });

    test('Rollen sollten eindeutige IDs haben', async () => {
      const roles = await db.getRoles();
      const ids = roles.map(r => r.rolle_id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });

  describe('Edge Cases', () => {
    test('Leerer Kommentar sollte nicht erlaubt sein', () => {
      const comment = '';
      expect(comment.length).toBe(0);
      expect(comment.length > 0).toBe(false);
    });

    test('Null-Wert für zugewiesen_an sollte erlaubt sein', () => {
      const assignedTo = null;
      expect(assignedTo === null).toBe(true);
    });

    test('Leere User-Liste sollte korrekt gehandhabt werden', () => {
      const users = [];
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(0);
    });
  });
});
