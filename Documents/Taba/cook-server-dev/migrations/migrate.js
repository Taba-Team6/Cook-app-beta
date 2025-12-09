import mysql from "mysql2/promise";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 001_create_tables.sql 파일 전체 내용을 읽어오는 헬퍼 함수
function get001Sql() {
    const filePath = join(__dirname, '001_create_tables.sql');
    try {
        return readFileSync(filePath, "utf8");
    } catch (e) {
        console.error("Critical Error: 001_create_tables.sql 파일을 찾거나 읽을 수 없습니다.");
        throw e;
    }
}

async function runMigrations() {
    let connection;

    try {
        console.log("🔄 Starting migration...\n");

        // 1. 초기 연결
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            multipleStatements: true, // 여러 SQL 구문 허용
        });

        const DB = process.env.DB_NAME;

        // ===============================================
        // [강력 초기화] 데이터베이스 싹 제거 후 다시 생성하는 로직
        // ===============================================
        console.log(`\n🚨 Initializing Database: ${DB}`);
        await connection.query(`DROP DATABASE IF EXISTS ${DB}`);
        await connection.query(
            `CREATE DATABASE ${DB} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
        );
        console.log(`✅ Database ${DB} dropped and recreated.`);
        // ===============================================

        await connection.query(`USE ${DB}`);
        console.log(`✅ Connected / Using DB: ${DB}`);

        // 2. 001_create_tables.sql 파일의 내용을 직접 실행하여 테이블 생성 보장
        console.log(`\n➡️ Executing 001_create_tables.sql (Critical step)`);
        
        const sql001 = get001Sql();
        // 001.sql은 DROP과 CREATE를 모두 포함하므로, multipleStatements를 통해 통째로 실행합니다.
        await connection.query(sql001);
        console.log(`   ✔ Done: 001_create_tables.sql`);
        
        // 3. 나머지 마이그레이션 파일 순차 실행 (002, 003, 004, 005...)
        const migrationFiles = readdirSync(__dirname)
            .filter((f) => f.endsWith(".sql") && f !== '001_create_tables.sql')
            .sort();

        console.log(`📦 SQL files remaining: ${migrationFiles.join(", ")}`);
        
        await connection.query("SET FOREIGN_KEY_CHECKS = 0"); // 001에서 이미 했지만 안전을 위해 다시 설정

        for (const file of migrationFiles) {
            console.log(`\n➡️ Executing: ${file}`);

            const sql = readFileSync(join(__dirname, file), "utf8");
            // 세미콜론 분리 없이 통째로 쿼리를 날립니다. (View나 복잡한 로직 안정성 향상)
            await connection.query(sql);

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