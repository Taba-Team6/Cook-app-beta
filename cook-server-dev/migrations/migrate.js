import mysql from "mysql2/promise";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigrations() {
  let connection;

  try {
    console.log("🔄 Starting migration...\n");

    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      multipleStatements: true,
    });

    const DB = process.env.DB_NAME;

    await connection.query(
      `CREATE DATABASE IF NOT EXISTS ${DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    await connection.query(`USE ${DB}`);

    console.log(`✅ Connected / Using DB: ${DB}`);

    const migrationFiles = readdirSync(__dirname)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    console.log(`📦 SQL files: ${migrationFiles.join(", ")}`);

    await connection.query("SET FOREIGN_KEY_CHECKS = 0");

    for (const file of migrationFiles) {
      console.log(`\n➡️ Executing: ${file}`);

      const sql = readFileSync(join(__dirname, file), "utf8");
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));

      for (const stmt of statements) {
        await connection.query(stmt);
      }

      console.log(`   ✔ Done: ${file}`);
    }

    await connection.query("SET FOREIGN_KEY_CHECKS = 1");

    console.log("\n🎉 Migration completed successfully!\n");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    console.error(err);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runMigrations();
