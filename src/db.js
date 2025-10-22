const mariadb = require('mariadb');
// Adjust to your db
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'ticket_manager',
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


async function createTicket(title, description, customer_id) {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query(
      'INSERT INTO ticket (titel, beschreibung, kategorie_id, erstellt_von, erstellt_am) VALUES (?, ?, 1, 2, ?)',
      [title, description, new Date()]
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
    return user;
  } finally { 
    if (conn) conn.release();
  }
}


module.exports = { getTickets, createTicket };
