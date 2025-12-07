const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
require('dotenv').config();
const db = require('./src/db');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'login.html'));
  // mainWindow.webContents.openDevTools(); // optional
}

app.whenReady().then(async () => {
  await db.autoSetup(); // Datenbank-Setup ausführen
  createWindow();

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit when all windows closed (except mac typical behavior)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

/* ---------- IPC Handlers (sichere Endpoints) ---------- */

// Tickets holen
ipcMain.handle('tickets:getAll', async () => {
  try {
    const rows = await db.getTickets();
    return { success: true, data: rows };
  } catch (err) {
    console.error('DB getTickets error', err);
    return { success: false, error: err.message };
  }
});

// Zugewiesene Tickets für einen Benutzer holen (Admin/Support)
ipcMain.handle('tickets:getAssigned', async (event, user_id) => {
  try {
    const rows = await db.getAssignedTickets(user_id);
    return { success: true, data: rows };
  } catch (err) {
    console.error('DB getAssignedTickets error', err);
    return { success: false, error: err.message };
  }
});

// Von einem Benutzer erstellte Tickets holen (normale Benutzer)
ipcMain.handle('tickets:getByCreator', async (event, user_id) => {
  try {
    const rows = await db.getTicketsByCreator(user_id);
    return { success: true, data: rows };
  } catch (err) {
    console.error('DB getTicketsByCreator error', err);
    return { success: false, error: err.message };
  }
});

// Startseite Tickets: zugewiesen (Admin/Support) ODER erstellt (User)
ipcMain.handle('tickets:getHome', async (event, user_id, role_id) => {
  try {
    const rows = await db.getHomeTickets(user_id, role_id);
    return { success: true, data: rows };
  } catch (err) {
    console.error('DB getHomeTickets error', err);
    return { success: false, error: err.message };
  }
});

// Neues Ticket erstellen
ipcMain.handle('tickets:create', async (event, ticket) => {
  try {
    const id = await db.createTicket(ticket.title, ticket.description, ticket.customer_id, ticket.category, ticket.status, ticket.assigned_to);
    return { success: true, id };
  } catch (err) {
    console.error('DB createTicket error', err);
    return { success: false, error: err.message };
  }
});

// Kommentar anlegen
ipcMain.handle('comments:create', async (event, comment) => {
  try {
    const id = await db.createComment(comment.ticket_id, comment.benutzer_id, comment.inhalt);
    return { success: true, id };
  } catch (err) {
    console.error('DB createComment error', err);
    return { success: false, error: err.message };
  }
});

// Kommentare für ein Ticket holen
ipcMain.handle('comments:getByTicket', async (event, ticket_id) => {
  try {
    const comments = await db.getCommentsByTicket(ticket_id);
    return { success: true, data: comments };
  } catch (err) {
    console.error('DB getCommentsByTicket error', err);
    return { success: false, error: err.message };
  }
});

// Usernamen bekommen
ipcMain.handle('user:get', async (event, user_id) => {
  try {
    const user = await db.getUser(user_id)
    return { success: true, user };
  } catch (err) {
    console.error('DB createComment error', err);
    return { success: false, error: err.message };
  }
});

// Benutzer per E-Mail holen
ipcMain.handle('user:getByEmail', async (event, email) => {
  try {
    const user = await db.getUserByEmail(email);
    return { success: true, user };
  } catch (err) {
    console.error('DB getUserByEmail error', err);
    return { success: false, error: err.message };
  }
});

// Ticket nach ID holen
ipcMain.handle('ticket:getById', async (event, ticket_id) => {
  try {
    const ticket = await db.getTicket(ticket_id);
    if (!ticket) {
      return { success: false, error: 'Ticket nicht gefunden' };
    }
    return { success: true, data: ticket };
  } catch (err) {
    console.error('DB getTicket error', err);
    return { success: false, error: err.message };
  }
});

// Ticket aktualisieren
ipcMain.handle('ticket:update', async (event, ticket_id, updatedData) => {
  try {
    await db.updateTicket(ticket_id, updatedData);
    return { success: true };
  } catch (err) {
    console.error('DB updateTicket error', err);
    return { success: false, error: err.message };
  }
});

// Ticket löschen
ipcMain.handle('ticket:delete', async (event, ticket_id) => {
  try {
    await db.deleteTicket(ticket_id);
    return { success: true };
  } catch (err) {
    console.error('DB deleteTicket error', err);
    return { success: false, error: err.message };
  }
});

// Alle Benutzer holen
ipcMain.handle('users:getAll', async () => {
  try {
    const rows = await db.getUsers();
    return { success: true, data: rows };
  } catch (err) {
    console.error('DB getUsers error', err);
    return { success: false, error: err.message };
  }
});

// Neuen Benutzer erstellen
ipcMain.handle('user:create', async (event, userData) => {
  try {
    const id = await db.createUser(userData.vorname, userData.nachname, userData.email, userData.passwort_hash, userData.rolle_id);
    return { success: true, id };
  } catch (err) {
    console.error('DB createUser error', err);
    return { success: false, error: err.message };
  }
});

// Benutzer aktualisieren
ipcMain.handle('user:update', async (event, user_id, userData) => {
  try {
    await db.updateUser(user_id, userData.vorname, userData.nachname, userData.email, userData.passwort_hash, userData.rolle_id, userData.aktiv);
    return { success: true };
  } catch (err) {
    console.error('DB updateUser error', err);
    return { success: false, error: err.message };
  }
});

// Benutzer löschen
ipcMain.handle('user:delete', async (event, user_id) => {
  try {
    await db.deleteUser(user_id);
    return { success: true };
  } catch (err) {
    console.error('DB deleteUser error', err);
    return { success: false, error: err.message };
  }
});

// Rollen holen
ipcMain.handle('roles:getAll', async () => {
  try {
    const rows = await db.getRoles();
    return { success: true, data: rows };
  } catch (err) {
    console.error('DB getRoles error', err);
    return { success: false, error: err.message };
  }
});
