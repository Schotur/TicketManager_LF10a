const mariadb = require('mariadb');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function resetDatabase() {
  let conn;
  try {
    // Connect without specifying database first
    conn = await mariadb.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true
    });

    // Drop database if exists
    await conn.query(`DROP DATABASE IF EXISTS ${process.env.DB_NAME}`);
    console.log(`Database ${process.env.DB_NAME} dropped`);

    // Create database
    await conn.query(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Database ${process.env.DB_NAME} created`);

    conn.end();

    // Reconnect to the new database
    conn = await mariadb.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      multipleStatements: true
    });

    // Read table creation script and remove USE statement
    const tableCreatorPath = path.join(__dirname, 'resources', 'tablecreater.sql');
    let tableCreatorSQL = fs.readFileSync(tableCreatorPath, 'utf8');
    tableCreatorSQL = tableCreatorSQL.replace(/CREATE DATABASE.*?;[\r\n]*/gs, '').replace(/USE.*?;[\r\n]*/gs, '');
    await conn.query(tableCreatorSQL);
    console.log('Tables created');

    // Read and execute insert data script
    const insertDataPath = path.join(__dirname, 'resources', 'insertdata.sql');
    let insertDataSQL = fs.readFileSync(insertDataPath, 'utf8');
    insertDataSQL = insertDataSQL.replace(/CREATE DATABASE.*?;[\r\n]*/gs, '').replace(/USE.*?;[\r\n]*/gs, '');
    await conn.query(insertDataSQL);
    console.log('Data inserted');

    conn.end();
    console.log('Database reset successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting database:', err);
    process.exit(1);
  }
}

resetDatabase();
