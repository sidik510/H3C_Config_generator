// backend/model/userModel.js
import db from "../config/db.js"; // Asumsikan db.js export koneksi MySQL dengan mysql2/promise

export const getUserByEmail = async (email) => {
  const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  return rows[0];
};

export const createUser = async (name, email, password, role) => {
  const [result] = await db.query(
    "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
    [name, email, password, role]
  );
  return result;
};
