// backend/model/userModel.js
import pool from "../config/db.js";

const userModel = {
  createUser: async (userData) => {
    const { name, email, password, role } = userData;

    const query = `
    INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [name, email, password, role]);
    return result;
  },
  
  getUserByEmail: async (email) => {
    const query = `
    SELECT * FROM users WHERE email = ?
    `;
    const [rows] = await pool.execute(query, [email]);
    return rows[0];
  },

};
export default userModel;
