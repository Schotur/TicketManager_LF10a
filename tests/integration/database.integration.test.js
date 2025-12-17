const { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } = require('@jest/globals');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const db = require('../../src/db');

/**
 * Integration Tests für Datenbank-Operationen
 * Diese Tests verwenden eine echte MariaDB Datenbank
 */

describe('Database Integration Tests', () => {
  let testData = {};

  beforeAll(async () => {
    // Initialize the database pool
    db.initPool();
    console.log('Integration Tests Setup - Pool initialized');
  });

  afterAll(async () => {
    // Close the pool after all tests
    await db.closePool();
    console.log('Integration Tests Cleanup - Pool closed');
  });

  describe('Ticket Operationen', () => {
    beforeEach(async () => {
      // Create a fresh user for each test
      testData.userId = await db.createUser(
        'TestUser',
        'IntegrationTest' + Date.now(),
        'testuser' + Date.now() + '@test.com',
        'TestPass123',
        3
      );
    });

    afterEach(async () => {
      // Cleanup test data
      testData = {};
    });

    it('sollte ein Ticket erstellen und abrufen können', async () => {
      const ticketId = await db.createTicket(
        'Integration Test Ticket',
        'Test Description',
        testData.userId,
        1,
        'Offen'
      );
      expect(ticketId).toBeGreaterThan(0);

      const ticket = await db.getTicket(ticketId);
      expect(ticket).toBeDefined();
      expect(ticket.titel).toBe('Integration Test Ticket');
      expect(ticket.beschreibung).toBe('Test Description');
      expect(ticket.status).toBe('Offen');
    });

    it('sollte ein Ticket aktualisieren können', async () => {
      const ticketId = await db.createTicket(
        'Original Title',
        'Original Description',
        testData.userId,
        1,
        'Offen'
      );

      await db.updateTicket(ticketId, {
        titel: 'Updated Title',
        beschreibung: 'Updated Description',
        kategorie: 1,
        status: 'In Bearbeitung',
        zugewiesen_an: null
      });

      const ticket = await db.getTicket(ticketId);
      expect(ticket.titel).toBe('Updated Title');
      expect(ticket.beschreibung).toBe('Updated Description');
      expect(ticket.status).toBe('In Bearbeitung');
    });

    it('sollte ein Ticket löschen können', async () => {
      const ticketId = await db.createTicket(
        'To Delete',
        'This will be deleted',
        testData.userId,
        1,
        'Offen'
      );

      await db.deleteTicket(ticketId);
      const ticket = await db.getTicket(ticketId);
      expect(ticket).toBeNull();
    });

    it('sollte Tickets nach Ersteller filtern können', async () => {
      const timestamp = Date.now();
      const ticket1Id = await db.createTicket(
        'User Ticket 1 ' + timestamp,
        'Desc 1',
        testData.userId,
        1,
        'Offen'
      );
      const ticket2Id = await db.createTicket(
        'User Ticket 2 ' + timestamp,
        'Desc 2',
        testData.userId,
        1,
        'Offen'
      );

      // Give database time to propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      const userTickets = await db.getTicketsByCreator(testData.userId);
      expect(Array.isArray(userTickets)).toBe(true);
      expect(userTickets.length).toBeGreaterThan(0);
      
      const foundTickets = userTickets.filter(t => Number(t.ticket_id) === Number(ticket1Id) || Number(t.ticket_id) === Number(ticket2Id));
      expect(foundTickets.length).toBeGreaterThanOrEqual(2);
    });

    it('sollte Tickets nach zugewiesen_an filtern können', async () => {
      const assignedUserId = await db.createUser(
        'AssignedUser',
        'Test' + Date.now(),
        'assigned' + Date.now() + '@test.com',
        'Pass123',
        3
      );

      const timestamp = Date.now();
      const ticketId = await db.createTicket(
        'Assigned Ticket ' + timestamp,
        'Assigned to user',
        testData.userId,
        1,
        'Offen',
        assignedUserId
      );

      // Give database time to propagate
      await new Promise(resolve => setTimeout(resolve, 100));

      const assignedTickets = await db.getAssignedTickets(assignedUserId);
      expect(Array.isArray(assignedTickets)).toBe(true);
      expect(assignedTickets.length).toBeGreaterThan(0);
      
      const found = assignedTickets.find(t => Number(t.ticket_id) === Number(ticketId));
      expect(found).toBeDefined();
      expect(Number(found.zugewiesen_an)).toBe(Number(assignedUserId));
    });
  });

  describe('Benutzer Operationen', () => {
    it('sollte einen Benutzer erstellen und abrufen können', async () => {
      const email = 'integration' + Date.now() + '@test.com';
      const userId = await db.createUser(
        'Max',
        'Mustermann',
        email,
        'TestPassword123',
        3
      );
      expect(userId).toBeGreaterThan(0);

      const user = await db.getUser(userId);
      expect(user).toBeDefined();
      expect(user.email).toBe(email);
      expect(user.vorname).toBe('Max');
    });

    it('sollte einen Benutzer nach Email finden können', async () => {
      const email = 'findme' + Date.now() + '@test.com';
      const userId = await db.createUser(
        'Anna',
        'Schmidt',
        email,
        'TestPassword123',
        2
      );

      const result = await db.getUserByEmail(email);
      expect(result).toBeDefined();
      expect(result.vorname).toBe('Anna');
    });

    it('sollte einen Benutzer aktualisieren können', async () => {
      const email = 'update' + Date.now() + '@test.com';
      const userId = await db.createUser(
        'Max',
        'Mustermann',
        email,
        'TestPassword123',
        3
      );

      // Fetch the user first to get all fields
      const user = await db.getUser(userId);
      
      await db.updateUser(
        userId,
        'Maxim',
        'NewName',
        user.email,
        user.passwort_hash,
        user.rolle_id,
        user.aktiv
      );

      const updated = await db.getUser(userId);
      expect(updated.vorname).toBe('Maxim');
      expect(updated.nachname).toBe('NewName');
    });

    it('sollte alle Benutzer abrufen können', async () => {
      const users = await db.getUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBeGreaterThan(0);

      // Verify user structure
      users.forEach(user => {
        expect(user).toHaveProperty('benutzer_id');
        expect(user).toHaveProperty('email');
      });
    });
  });

  describe('Kommentar Operationen', () => {
    let testTicketId;
    let testUserId;

    beforeEach(async () => {
      testUserId = await db.createUser(
        'CommentUser',
        'Test' + Date.now(),
        'comment' + Date.now() + '@test.com',
        'Pass123',
        3
      );
      testTicketId = await db.createTicket(
        'Comment Test Ticket',
        'For comments',
        testUserId,
        1,
        'Offen'
      );
    });

    it('sollte einen Kommentar erstellen können', async () => {
      const commentId = await db.createComment(
        testTicketId,
        testUserId,
        'Test Kommentar ' + Date.now()
      );
      expect(['number', 'bigint']).toContain(typeof commentId);
      expect(commentId).toBeGreaterThan(0);
    });

    it('sollte Kommentare für ein Ticket abrufen können', async () => {
      await db.createComment(testTicketId, testUserId, 'Kommentar 1');
      await db.createComment(testTicketId, testUserId, 'Kommentar 2');

      const comments = await db.getCommentsByTicket(testTicketId);
      expect(Array.isArray(comments)).toBe(true);
      expect(comments.length).toBeGreaterThanOrEqual(2);

      comments.forEach(comment => {
        expect(Number(comment.ticket_id)).toBe(Number(testTicketId));
      });
    });

    it('sollte Kommentare mit Benutzerinformationen abrufen', async () => {
      await db.createComment(testTicketId, testUserId, 'Test Kommentar mit Info');
      const comments = await db.getCommentsByTicket(testTicketId);

      expect(comments.length).toBeGreaterThan(0);
      const comment = comments[0];
      expect(comment).toHaveProperty('inhalt');
      expect(comment).toHaveProperty('benutzer_id');
    });
  });

  describe('Rollen', () => {
    it('sollte alle verfügbaren Rollen abrufen können', async () => {
      const roles = await db.getRoles();
      expect(Array.isArray(roles)).toBe(true);
      expect(roles.length).toBeGreaterThan(0);

      // Verify expected roles exist
      const roleNames = roles.map(r => r.name);
      expect(roleNames).toContain('Admin');
      expect(roleNames).toContain('Support');
      expect(roleNames).toContain('Benutzer');
    });
  });

  describe('Home Tickets nach Rolle', () => {
    let adminUserId;
    let supportUserId;
    let regularUserId;

    beforeEach(async () => {
      // Create users with different roles
      adminUserId = await db.createUser(
        'Admin',
        'User' + Date.now(),
        'admin' + Date.now() + '@test.com',
        'Pass123',
        1
      );
      supportUserId = await db.createUser(
        'Support',
        'User' + Date.now(),
        'support' + Date.now() + '@test.com',
        'Pass123',
        2
      );
      regularUserId = await db.createUser(
        'Regular',
        'User' + Date.now(),
        'regular' + Date.now() + '@test.com',
        'Pass123',
        3
      );
    });

    it('Admin sollte zugewiesene Tickets sehen', async () => {
      // Create a ticket assigned to admin
      await db.createTicket(
        'Admin Task',
        'Assigned to admin',
        regularUserId,
        1,
        'Offen',
        adminUserId
      );

      const tickets = await db.getHomeTickets(adminUserId, 1);
      expect(Array.isArray(tickets)).toBe(true);
      // Admin should see assigned tickets
      tickets.forEach(ticket => {
        expect(Number(ticket.zugewiesen_an)).toBe(Number(adminUserId));
      });
    });

    it('Support sollte zugewiesene Tickets sehen', async () => {
      // Create a ticket assigned to support
      await db.createTicket(
        'Support Task',
        'Assigned to support',
        regularUserId,
        1,
        'Offen',
        supportUserId
      );

      const tickets = await db.getHomeTickets(supportUserId, 2);
      expect(Array.isArray(tickets)).toBe(true);
      // Support should see assigned tickets
      tickets.forEach(ticket => {
        expect(Number(ticket.zugewiesen_an)).toBe(Number(supportUserId));
      });
    });

    it('Normal User sollte erstellte Tickets sehen', async () => {
      // Create a ticket by regular user
      await db.createTicket(
        'User Ticket',
        'Created by regular user',
        regularUserId,
        1,
        'Offen'
      );

      const tickets = await db.getHomeTickets(regularUserId, 3);
      expect(Array.isArray(tickets)).toBe(true);
      // Regular user should see created tickets
      tickets.forEach(ticket => {
        expect(Number(ticket.erstellt_von)).toBe(Number(regularUserId));
      });
    });
  });

  describe('Performance Tests', () => {
    it('sollte alle Tickets effizient abrufen können', async () => {
      const startTime = Date.now();
      const tickets = await db.getTickets();
      const duration = Date.now() - startTime;

      expect(Array.isArray(tickets)).toBe(true);
      expect(duration).toBeLessThan(2000); // Should take less than 2 seconds
    });

    it('sollte gefilterte Tickets schnell abrufen', async () => {
      const userId = await db.createUser(
        'PerfUser',
        'Test' + Date.now(),
        'perf' + Date.now() + '@test.com',
        'Pass123',
        3
      );

      // Create a ticket assigned to this user
      await db.createTicket(
        'Performance Test',
        'Testing speed',
        1,
        1,
        'Offen',
        userId
      );

      const startTime = Date.now();
      const tickets = await db.getAssignedTickets(userId);
      const duration = Date.now() - startTime;

      expect(Array.isArray(tickets)).toBe(true);
      expect(duration).toBeLessThan(1000); // Should take less than 1 second
    });
  });
});
