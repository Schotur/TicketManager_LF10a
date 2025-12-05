const db = require('./src/db');
require('dotenv').config();

async function testDb() {
  // Initialize the pool
  require('./src/db').autoSetup().then(async () => {
    try {
      // Test getHomeTickets for user_id = 3 (Benutzer), rolle_id = 3
      console.log('\n=== Testing getHomeTickets for User (rolle_id=3, user_id=3) ===');
      const userTickets = await db.getHomeTickets(3, 3);
      console.log(`Found ${userTickets.length} tickets for user 3:`);
      userTickets.forEach((t, i) => {
        console.log(`${i+1}. [${t.ticket_id}] ${t.titel} (status: ${t.status}, erstellt_von: ${t.erstellt_von})`);
      });

      // Test getHomeTickets for admin_id = 1 (Admin), rolle_id = 1
      console.log('\n=== Testing getHomeTickets for Admin (rolle_id=1, user_id=1) ===');
      const adminTickets = await db.getHomeTickets(1, 1);
      console.log(`Found ${adminTickets.length} tickets for admin 1:`);
      adminTickets.forEach((t, i) => {
        console.log(`${i+1}. [${t.ticket_id}] ${t.titel} (status: ${t.status}, zugewiesen_an: ${t.zugewiesen_an})`);
      });

      // Test getTickets (all)
      console.log('\n=== Testing getTickets (all tickets) ===');
      const allTickets = await db.getTickets();
      console.log(`Found ${allTickets.length} total tickets`);
      allTickets.forEach((t, i) => {
        console.log(`${i+1}. [${t.ticket_id}] ${t.titel}`);
      });

      db.pool.end();
    } catch (error) {
      console.error('Error:', error);
      process.exit(1);
    }
  });
}

testDb();
