const fs = require('fs');
const path = require('path');
const mariadb = require('mariadb');
require('dotenv').config();

let pool = null; // Pool wird später initialisiert

/** Verbindet sich ohne DB, nur für CREATE DATABASE */
async function connectWithoutDatabase() {
  return mariadb.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
  });
}

/** Initialisiert den Pool, nachdem die DB existiert */
function initPool() {
  pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,   // ticket_manager
    port: process.env.DB_PORT ,
    multipleStatements: true,
    connectionLimit: 5
  });
}


// Use connection values from .env (fallback to previous defaults) - alternative Pool setup
/*
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ,
  multipleStatements: true,
  connectionLimit: 5
});
*/

async function getTickets() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM ticket");
    return rows;
  } finally {
    if (conn) conn.release();
  }
}

// Get tickets assigned to a user (for Admin and Support)
async function getAssignedTickets(user_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT * FROM ticket WHERE zugewiesen_an = ?",
      [user_id]
    );
    return rows;
  } finally {
    if (conn) conn.release();
  }
}

// Get tickets created by a user (for normal users)
async function getTicketsByCreator(user_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT * FROM ticket WHERE erstellt_von = ?",
      [user_id]
    );
    return rows;
  } finally {
    if (conn) conn.release();
  }
}

// Get tickets for home page: assigned tickets OR created by user
async function getHomeTickets(user_id, role_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    // Admin/Support: see assigned tickets
    // Users: see tickets they created
    let query;
    let params;
    
    if (role_id === 1 || role_id === 2) { // Admin=1, Support=2
      query = "SELECT * FROM ticket WHERE zugewiesen_an = ?";
      params = [user_id];
    } else { // User=3
      query = "SELECT * FROM ticket WHERE erstellt_von = ?";
      params = [user_id];
    }
    
    const rows = await conn.query(query, params);
    return rows;
  } finally {
    if (conn) conn.release();
  }
}


async function createTicket(title, description, customer_id, category, status, assigned_to = null) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO ticket (titel, beschreibung, kategorie_id, erstellt_von, zugewiesen_an, erstellt_am, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, description, category, customer_id, assigned_to, new Date(), status]
    );
    return result.insertId;
  } finally {
    if (conn) conn.release();
  }
}

async function getUser(user_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const user = await conn.query('SELECT * FROM benutzer WHERE benutzer_id = ?', [user_id]);
    return user[0];
  } finally { 
    if (conn) conn.release();
  }
}

async function getUserByEmail(email) {
  let conn;
  try {
    conn = await pool.getConnection();
    const user = await conn.query('SELECT * FROM benutzer WHERE email = ?', [email]);
    if(user.length === 0) {
      return null;
    }
    return user[0];
  } finally { 
    if (conn) conn.release();
  }
}

async function getTicket(ticket_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const ticket = await conn.query('SELECT * FROM ticket WHERE ticket_id = ?', [ticket_id]);
    return ticket[0] || null;
  } finally {
    if (conn) conn.release();
  }
}

async function updateTicket(ticket_id, updatedData) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      'UPDATE ticket SET titel = ?, beschreibung = ?, kategorie_id = ?, status = ?, zugewiesen_an = ? WHERE ticket_id = ?',
      [updatedData.titel, updatedData.beschreibung, updatedData.kategorie, updatedData.status, updatedData.zugewiesen_an, ticket_id]
    );
    return true;
  } finally {
    if (conn) conn.release();
  }
}

async function deleteTicket(ticket_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      'DELETE FROM ticket WHERE ticket_id = ?',
      [ticket_id]
    );
    return true;
  } finally {
    if (conn) conn.release();
  }
}

async function getUsers() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT b.*, r.name as rolle_name FROM benutzer b JOIN rolle r ON b.rolle_id = r.rolle_id');
    return rows;
  } finally {
    if (conn) conn.release();
  }
}

async function createUser(vorname, nachname, email, passwort_hash, rolle_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO benutzer (vorname, nachname, email, passwort_hash, rolle_id, aktiv) VALUES (?, ?, ?, ?, ?, ?)',
      [vorname, nachname, email, passwort_hash, rolle_id, true]
    );
    return result.insertId;
  } finally {
    if (conn) conn.release();
  }
}

async function updateUser(user_id, vorname, nachname, email, passwort_hash, rolle_id, aktiv) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      'UPDATE benutzer SET vorname = ?, nachname = ?, email = ?, passwort_hash = ?, rolle_id = ?, aktiv = ? WHERE benutzer_id = ?',
      [vorname, nachname, email, passwort_hash, rolle_id, aktiv, user_id]
    );
    return true;
  } finally {
    if (conn) conn.release();
  }
}

async function deleteUser(user_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query('DELETE FROM benutzer WHERE benutzer_id = ?', [user_id]);
    return true;
  } finally {
    if (conn) conn.release();
  }
}

async function getRoles() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM rolle');
    return rows;
  } finally {
    if (conn) conn.release();
  }
}

// Automatisches Setup der Datenbank und Tabellen
async function autoSetup() {
  try {
    console.log("Starte Auto-Setup ...");

    // 1. Datenbank erstellen falls nötig
    let conn = await connectWithoutDatabase();
    await conn.query(`CREATE DATABASE IF NOT EXISTS  ${process.env.DB_NAME}`);
    conn.end();

    console.log(`Datenbank ${process.env.DB_NAME} existiert oder wurde erstellt.`);

    // Initialisiere den Pool jetzt, wo die DB existiert
    initPool();

    // Prüfen ob Tabellen existierten und Tabellen erzeugen, falls nicht
    const hasTables = await tableExists('rolle');
    if(!hasTables){
      console.log("Keine Tabellen gefunden -> erstelle Tabellen");
      await runSqlFile('tablecreater.sql');  
    }else{
      console.log("Tabellen bereits vorhanden -> ueberspringe erstellen Tabellen")
    }
    

    // 4. Prüfen, ob bereits Daten existieren
    const hasUsers = await tableHasData('benutzer');

    if (!hasUsers) {
      console.log("Keine Daten gefunden -> fuege Testdaten ein ...");
      await runSqlFile('insertdata.sql');
    } else {
      console.log("Daten bereits vorhanden -> ueberspringe Testdaten");
    }

    console.log("Auto-Setup abgeschlossen");
  } catch (err) {
    console.error("Auto-Setup Fehler:", err);
  }
}

// Hilfsfunktion zum Ausführen von SQL-Dateien - für Setup-Skripte
async function runSqlFile(file) {
  const conn = await pool.getConnection();
  try {
    const filePath = path.join(__dirname, '..', 'resources', file);
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log(`Fuehre SQL Datei aus: ${file}`);
    await conn.query(sql);
    console.log(`Erfolgreich ausgefuehrt: ${file}`);
  } catch (err) {
    console.error(`Fehler beim Ausfuehren von ${file}`, err);
  } finally {
    conn.release();
  }
}

// Prüft, ob es Daten gibt
async function tableHasData(table) {
  const conn = await pool.getConnection();
  try {
    const result = await conn.query(`SELECT COUNT(*) AS c FROM ${table};`);
    return result[0].c > 0;
  } catch (err) {
    return false; // Falls Tabelle nicht existiert
  } finally {
    conn.release();
  }
}

// Prüfe ob Tabelle existiert
async function tableExists(tableName) {
   const conn = await pool.getConnection();

  const rows = await conn.query(
    "SELECT COUNT(*) AS c FROM information_schema.tables WHERE table_schema = ? AND table_name = ?",
    [process.env.DB_NAME, tableName]
  );

  conn.release();
  return rows[0].c > 0;  // true = Tabelle existiert

   // Variante 2 mit MariaDB eigenen Funktion SHOW TABLES LIKE
  /*
  const conn = await pool.getConnection();
  const rows = await conn.query(`SHOW TABLES LIKE ?`, [tableName]);
  conn.release();
  return rows.length > 0;
  */
}

// Kommentar erstellen
async function createComment(ticket_id, benutzer_id, inhalt) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'INSERT INTO kommentar (ticket_id, benutzer_id, inhalt, erstellt_am) VALUES (?, ?, ?, ?)',
      [ticket_id, benutzer_id, inhalt, new Date()]
    );
    return result.insertId;
  } finally {
    if (conn) conn.release();
  }
}

// Kommentare für ein Ticket holen (mit Benutzer- und Rolleninformationen)
async function getCommentsByTicket(ticket_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const comments = await conn.query(
      `SELECT k.kommentar_id, k.ticket_id, k.benutzer_id, k.inhalt, k.erstellt_am, 
              b.vorname, b.nachname, r.name as rolle_name
       FROM kommentar k
       JOIN benutzer b ON k.benutzer_id = b.benutzer_id
       JOIN rolle r ON b.rolle_id = r.rolle_id
       WHERE k.ticket_id = ?
       ORDER BY k.erstellt_am DESC`,
      [ticket_id]
    );
    return comments;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = { getTickets, getAssignedTickets, getTicketsByCreator, getHomeTickets, getTicket, createTicket, updateTicket, deleteTicket, getUser, getUserByEmail, getUsers, createUser, updateUser, deleteUser, getRoles, createComment, getCommentsByTicket, pool, autoSetup };