const express = require("express");
const { Database } = require("@sqlitecloud/drivers");

//const connectionString = process.env.SQLITECLOUD_CONNECTION_STRING
const connectionString = "sqlitecloud://ccdw2ffidk.g6.sqlite.cloud:8860/AptAccounts.db?apikey=zicL36Va39puWbQs25FTr1PVyKlAGf4RyhbXJTGRtaY"
const app = express();

app.get("/albums", async (req, res) => {
  let db = null;
  try {
    db = new Database(connectionString)
    const result = await db.sql(`
           
            SELECT *
            FROM Mast1  where Id > 40
           `);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  } finally {
    db?.close();
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});