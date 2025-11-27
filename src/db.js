const mariadb = require('mariadb');
require('dotenv').config();
// Use connection values from .env (fallback to previous defaults)
const pool = mariadb.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ,
  connectionLimit: 5
});

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


module.exports = { getTickets, createTicket, getUser, getUserByEmail };