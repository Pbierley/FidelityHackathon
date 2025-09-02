const { MongoClient } = require("mongodb");
require("dotenv").config();

const uri = process.env.MONGO_URI;
console.log("Here bro", uri);
const client = new MongoClient(uri);
const DB_NAME = process.env.DB_NAME;

let db;

async function connectToDB() {
  if (!db) {
    await client.connect();
    db = client.db(DB_NAME);
    console.log("db - ", db);
  }
  return db;
}

module.exports = { connectToDB };
