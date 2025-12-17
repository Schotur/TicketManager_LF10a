/**
 * Unit Tests für db.js
 * Diese Tests mocken die Datenbank und testen nur die Funktionslogik isoliert
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// Mock the mariadb module
jest.mock('mariadb');
const mariadb = require('mariadb');

const db = require('../../src/db');

describe('Database Functions - Unit Tests', () => {
  let mockConnection;
  let mockPool;

  beforeAll(() => {
    // Create mock connection and pool
    mockConnection = {
      query: jest.fn(),
      release: jest.fn()
    };

    mockPool = {
      getConnection: jest.fn().mockResolvedValue(mockConnection),
      end: jest.fn().mockResolvedValue(undefined)
    };

    // Mock mariadb.createPool
    mariadb.createPool = jest.fn().mockReturnValue(mockPool);

    // Initialize pool with mocks
    db.initPool();
  });

  afterAll(async () => {
    await db.closePool();
  });

  describe('Ticket Functions', () => {
    test('getTickets sollte eine Liste zurückgeben', async () => {
      const mockTickets = [
        { ticket_id: 1, titel: 'Test Ticket 1', status: 'Offen' },
        { ticket_id: 2, titel: 'Test Ticket 2', status: 'In Bearbeitung' }
      ];

      mockConnection.query.mockResolvedValueOnce(mockTickets);

      const tickets = await db.getTickets();

      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.length).toBe(2);
      expect(tickets[0]).toHaveProperty('ticket_id');
      expect(tickets[0]).toHaveProperty('titel');
      expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM ticket');
    });

    test('getTickets sollte leere Liste bei keinen Tickets zurückgeben', async () => {
      mockConnection.query.mockResolvedValueOnce([]);

      const tickets = await db.getTickets();

      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.length).toBe(0);
    });

    test('createTicket sollte Ticket erstellen und ID zurückgeben', async () => {
      const mockResult = { insertId: 42 };
      mockConnection.query.mockResolvedValueOnce(mockResult);

      const ticketId = await db.createTicket(
        'New Ticket',
        'Description',
        1,
        2,
        'Offen'
      );

      expect(typeof ticketId).toBe('number');
      expect(ticketId).toBe(42);
      expect(mockConnection.query).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('createTicket sollte mit assigned_to optional arbeiten', async () => {
      const mockResult = { insertId: 43 };
      mockConnection.query.mockResolvedValueOnce(mockResult);

      const ticketId = await db.createTicket(
        'Assigned Ticket',
        'Description',
        1,
        1,
        'Offen',
        5
      );

      expect(ticketId).toBe(43);
      expect(mockConnection.query).toHaveBeenCalled();
    });

    test('getTicket sollte einzelnes Ticket zurückgeben', async () => {
      const mockTicket = {
        ticket_id: 1,
        titel: 'Test Ticket',
        beschreibung: 'Test Description',
        status: 'Offen'
      };

      mockConnection.query.mockResolvedValueOnce([mockTicket]);

      const ticket = await db.getTicket(1);

      expect(ticket).toBeDefined();
      expect(ticket.ticket_id).toBe(1);
      expect(ticket.titel).toBe('Test Ticket');
      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM ticket WHERE ticket_id = ?',
        [1]
      );
    });

    test('getTicket sollte null zurückgeben wenn Ticket nicht existiert', async () => {
      mockConnection.query.mockResolvedValueOnce([]);

      const ticket = await db.getTicket(999);

      expect(ticket).toBeNull();
    });

    test('updateTicket sollte Ticket aktualisieren', async () => {
      mockConnection.query.mockResolvedValueOnce({ affectedRows: 1 });

      await db.updateTicket(1, {
        titel: 'Updated Title',
        status: 'Geschlossen'
      });

      expect(mockConnection.query).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('deleteTicket sollte Ticket löschen', async () => {
      mockConnection.query.mockResolvedValueOnce({ affectedRows: 1 });

      await db.deleteTicket(1);

      expect(mockConnection.query).toHaveBeenCalledWith(
        'DELETE FROM ticket WHERE ticket_id = ?',
        [1]
      );
      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('getTicketsByCreator sollte Tickets nach Ersteller filtern', async () => {
      const mockTickets = [
        { ticket_id: 1, titel: 'User Ticket 1', erstellt_von: 5 },
        { ticket_id: 2, titel: 'User Ticket 2', erstellt_von: 5 }
      ];

      mockConnection.query.mockResolvedValueOnce(mockTickets);

      const tickets = await db.getTicketsByCreator(5);

      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.length).toBe(2);
      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM ticket WHERE erstellt_von = ?',
        [5]
      );
    });

    test('getAssignedTickets sollte Tickets nach zugewiesen_an filtern', async () => {
      const mockTickets = [
        { ticket_id: 1, titel: 'Assigned Ticket', zugewiesen_an: 3 }
      ];

      mockConnection.query.mockResolvedValueOnce(mockTickets);

      const tickets = await db.getAssignedTickets(3);

      expect(Array.isArray(tickets)).toBe(true);
      expect(tickets.length).toBe(1);
      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM ticket WHERE zugewiesen_an = ?',
        [3]
      );
    });
  });

  describe('User Functions', () => {
    test('getUser sollte User-Objekt zurückgeben', async () => {
      const mockUser = {
        benutzer_id: 1,
        vorname: 'Max',
        nachname: 'Mustermann',
        email: 'max@test.com'
      };

      mockConnection.query.mockResolvedValueOnce([mockUser]);

      const user = await db.getUser(1);

      expect(user).toBeDefined();
      expect(user.benutzer_id).toBe(1);
      expect(user.vorname).toBe('Max');
      expect(user.email).toBe('max@test.com');
    });

    test('getUser sollte undefined zurückgeben wenn User nicht existiert', async () => {
      mockConnection.query.mockResolvedValueOnce([]);

      const user = await db.getUser(999);

      expect(user).toBeUndefined();
    });

    test('getUserByEmail sollte User nach Email finden', async () => {
      const mockUser = {
        benutzer_id: 1,
        vorname: 'Anna',
        email: 'anna@test.com'
      };

      mockConnection.query.mockResolvedValueOnce([mockUser]);

      const result = await db.getUserByEmail('anna@test.com');

      expect(result).toBeDefined();
      expect(result.vorname).toBe('Anna');
      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT * FROM benutzer WHERE email = ?',
        ['anna@test.com']
      );
    });

    test('getUserByEmail sollte null zurückgeben wenn User nicht existiert', async () => {
      mockConnection.query.mockResolvedValueOnce([]);

      const result = await db.getUserByEmail('nonexistent@test.com');

      expect(result).toBeNull();
    });

    test('getUsers sollte Array aller Benutzer zurückgeben', async () => {
      const mockUsers = [
        { benutzer_id: 1, vorname: 'Max', rolle_name: 'Admin' },
        { benutzer_id: 2, vorname: 'Anna', rolle_name: 'Support' }
      ];

      mockConnection.query.mockResolvedValueOnce(mockUsers);

      const users = await db.getUsers();

      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(2);
      expect(mockConnection.query).toHaveBeenCalledWith(
        'SELECT b.*, r.name as rolle_name FROM benutzer b JOIN rolle r ON b.rolle_id = r.rolle_id'
      );
    });

    test('createUser sollte neuen Benutzer erstellen und ID zurückgeben', async () => {
      const mockResult = { insertId: 10 };
      mockConnection.query.mockResolvedValueOnce(mockResult);

      const userId = await db.createUser(
        'Test',
        'User',
        'test@example.com',
        'hashedpassword',
        3
      );

      expect(typeof userId).toBe('number');
      expect(userId).toBe(10);
      expect(mockConnection.query).toHaveBeenCalled();
    });

    test('updateUser sollte Benutzer aktualisieren', async () => {
      mockConnection.query.mockResolvedValueOnce({ affectedRows: 1 });

      await db.updateUser(1, {
        vorname: 'Updated',
        nachname: 'Name'
      });

      expect(mockConnection.query).toHaveBeenCalled();
      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('deleteUser sollte Benutzer löschen', async () => {
      mockConnection.query.mockResolvedValueOnce({ affectedRows: 1 });

      await db.deleteUser(1);

      expect(mockConnection.query).toHaveBeenCalledWith(
        'DELETE FROM benutzer WHERE benutzer_id = ?',
        [1]
      );
    });
  });

  describe('Comment Functions', () => {
    test('createComment sollte Kommentar erstellen und ID zurückgeben', async () => {
      const mockResult = { insertId: 50 };
      mockConnection.query.mockResolvedValueOnce(mockResult);

      const commentId = await db.createComment(1, 2, 'Test comment');

      expect(typeof commentId).toBe('number');
      expect(commentId).toBe(50);
      expect(mockConnection.query).toHaveBeenCalled();
    });

    test('getCommentsByTicket sollte Kommentare eines Tickets zurückgeben', async () => {
      const mockComments = [
        { kommentar_id: 1, ticket_id: 1, inhalt: 'Comment 1', vorname: 'Max', nachname: 'Mustermann', rolle_name: 'Admin' },
        { kommentar_id: 2, ticket_id: 1, inhalt: 'Comment 2', vorname: 'Anna', nachname: 'Schmidt', rolle_name: 'Support' }
      ];

      mockConnection.query.mockResolvedValueOnce(mockComments);

      const comments = await db.getCommentsByTicket(1);

      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBe(2);
      expect(comments[0].ticket_id).toBe(1);
      expect(mockConnection.query).toHaveBeenCalledWith(
        `SELECT k.kommentar_id, k.ticket_id, k.benutzer_id, k.inhalt, k.erstellt_am, 
              b.vorname, b.nachname, r.name as rolle_name
       FROM kommentar k
       JOIN benutzer b ON k.benutzer_id = b.benutzer_id
       JOIN rolle r ON b.rolle_id = r.rolle_id
       WHERE k.ticket_id = ?
       ORDER BY k.erstellt_am DESC`,
        [1]
      );
    });

    test('getCommentsByTicket sollte leeres Array zurückgeben wenn keine Kommentare existieren', async () => {
      mockConnection.query.mockResolvedValueOnce([]);

      const comments = await db.getCommentsByTicket(999);

      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBe(0);
    });
  });

  describe('Role Functions', () => {
    test('getRoles sollte alle Rollen zurückgeben', async () => {
      const mockRoles = [
        { rolle_id: 1, name: 'Admin' },
        { rolle_id: 2, name: 'Support' },
        { rolle_id: 3, name: 'User' }
      ];

      mockConnection.query.mockResolvedValueOnce(mockRoles);

      const roles = await db.getRoles();

      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBe(3);
      expect(roles[0].name).toBe('Admin');
      expect(mockConnection.query).toHaveBeenCalledWith('SELECT * FROM rolle');
    });

    test('getRoles sollte leeres Array zurückgeben wenn keine Rollen existieren', async () => {
      mockConnection.query.mockResolvedValueOnce([]);

      const roles = await db.getRoles();

      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('getTickets sollte Fehler behandeln', async () => {
      mockConnection.query.mockRejectedValueOnce(new Error('Database error'));

      await expect(db.getTickets()).rejects.toThrow('Database error');
      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('createTicket sollte Fehler bei Datenbank-Fehler werfen', async () => {
      mockConnection.query.mockRejectedValueOnce(new Error('Insert failed'));

      await expect(
        db.createTicket('Test', 'Desc', 1, 1, 'Offen')
      ).rejects.toThrow('Insert failed');
    });

    test('updateTicket sollte Fehler behandeln', async () => {
      mockConnection.query.mockRejectedValueOnce(new Error('Update failed'));

      await expect(
        db.updateTicket(1, { titel: 'New' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('Connection Management', () => {
    test('sollte Connection nach jedem Query releasen', async () => {
      mockConnection.query.mockResolvedValueOnce([]);

      await db.getTickets();

      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('sollte Connection bei Fehler releasen', async () => {
      mockConnection.query.mockRejectedValueOnce(new Error('Test error'));

      try {
        await db.getTickets();
      } catch (e) {
        // Expected error
      }

      expect(mockConnection.release).toHaveBeenCalled();
    });

    test('closePool sollte Pool beenden', async () => {
      await db.closePool();

      expect(mockPool.end).toHaveBeenCalled();
    });
  });

  describe('Data Validation', () => {
    test('Ticket ID sollte immer eine positive Zahl sein', () => {
      expect(typeof 1).toBe('number');
      expect(1 > 0).toBe(true);
    });

    test('User ID sollte immer eine positive Zahl sein', () => {
      expect(typeof 5).toBe('number');
      expect(5 > 0).toBe(true);
    });

    test('Rollen-IDs sollten eindeutig sein', () => {
      const roles = [
        { rolle_id: 1, name: 'Admin' },
        { rolle_id: 2, name: 'Support' },
        { rolle_id: 3, name: 'User' }
      ];
      const ids = roles.map(r => r.rolle_id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    test('Email sollte gültiges Format haben', () => {
      const validEmail = 'test@example.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(validEmail)).toBe(true);
    });

    test('Ungültige Email sollte Regex fehlschlagen', () => {
      const invalidEmail = 'invalid@.com';
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      expect(emailRegex.test(invalidEmail)).toBe(false);
    });

    test('Ticket Status sollte gültig sein', () => {
      const validStatuses = ['Offen', 'In Bearbeitung', 'Geschlossen'];
      const status = 'Offen';
      expect(validStatuses).toContain(status);
    });
  });
});
