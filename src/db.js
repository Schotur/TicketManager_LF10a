const mariadb = require('mariadb');
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'root',
  password: '12345',
  database: 'ticket_manager',
  connectionLimit: 5
});

async function getTickets() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM tickets");
    return rows;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = { getTickets };
