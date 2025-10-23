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

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));
  // mainWindow.webContents.openDevTools(); // optional
}

app.whenReady().then(() => {
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

// Neues Ticket erstellen
ipcMain.handle('tickets:create', async (event, ticket) => {
  try {
    const id = await db.createTicket(ticket.title, ticket.description, ticket.customer_id, ticket.category, ticket.status);
    return { success: true, id };
  } catch (err) {
    console.error('DB createTicket error', err);
    return { success: false, error: err.message };
  }
});

// Kommentar anlegen
ipcMain.handle('comments:create', async (event, comment) => {
  try {
    const id = await db.createComment(comment.ticket_id, comment.author_id, comment.message);
    return { success: true, id };
  } catch (err) {
    console.error('DB createComment error', err);
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
