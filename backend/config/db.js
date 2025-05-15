import mysql from "mysql2/promise";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: __dirname + "/../.env" });

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

try {
  const conn = await pool.getConnection();
  console.log("✅ Connected to MySQL database h3c_config_automator");
  conn.release();
} catch (err) {
  console.error("❌ Error connecting to MySQL:", err.message);
}

export default pool;

