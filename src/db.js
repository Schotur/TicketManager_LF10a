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


async function createTicket(title, description, customer_id, category, status) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      'INSERT INTO ticket (titel, beschreibung, kategorie_id, erstellt_von, erstellt_am, status) VALUES (?, ?, ?, ?, ?, ?)',
      [title, description, category, customer_id, new Date(), status]
    );
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
      'UPDATE ticket SET titel = ?, beschreibung = ?, kategorie_id = ?, status = ? WHERE ticket_id = ?',
      [updatedData.titel, updatedData.beschreibung, updatedData.kategorie, updatedData.status, ticket_id]
    );
    return true;
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

    // 3. Tabellen erzeugen (immer sicherheitshalber)
    await runSqlFile('tablecreater.sql');

    // 4. Prüfen, ob bereits Daten existieren
    const hasUsers = await tableHasData('users');

    if (!hasUsers) {
      console.log("Keine Daten gefunden -> füge Testdaten ein ...");
      await runSqlFile('insertdata.sql');
    } else {
      console.log("Daten bereits vorhanden -> überspringe Testdaten");
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
    console.log(`Führe SQL Datei aus: ${file}`);
    await conn.query(sql);
    console.log(`Erfolgreich ausgeführt: ${file}`);
  } catch (err) {
    console.error(`Fehler beim Ausführen von ${file}`, err);
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

module.exports = { getTickets, getTicket, createTicket, updateTicket, getUser, getUserByEmail, pool, autoSetup };