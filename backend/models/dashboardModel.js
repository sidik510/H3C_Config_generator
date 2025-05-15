import pool from "../config/db.js";

const dashboardModel = {
  // Menyimpan konfigurasi ke dalam database
  saveConfig: async (configData) => {
    const { user_id, device_type, hostname, config_text, config_hash } =
      configData;
    const query = `
      INSERT INTO configs 
      (user_id, device_type, hostname, config_text, config_hash) 
      VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await pool.execute(query, [
      user_id,
      device_type,
      hostname,
      config_text,
      config_hash,
    ]);
    return { id: result.insertId, ...configData };
  },

  // Mendapatkan riwayat konfigurasi berdasarkan user_id
  getConfigHistory: async (userId) => {
    const query = `
      SELECT id, device_type, hostname, config_text, created_at 
      FROM configs 
      WHERE user_id = ? AND is_deleted = 0 
      ORDER BY created_at DESC
    `;
    const [rows] = await pool.execute(query, [userId]);
    return rows;
  },

  // Menghapus konfigurasi berdasarkan id
  deleteConfig: async (configId, userId) => {
    const query = `
      UPDATE configs 
      SET is_deleted = 1 
      WHERE id = ? AND user_id = ?
    `;
    const [result] = await pool.execute(query, [configId, userId]);
    return result.affectedRows;
  },

  // Menampilkan riwayat yang dihapus
  getDeletedHistory: async (userId) => {
    const query = `
    SELECT id, device_type, hostname, config_text, created_at 
    FROM configs 
    WHERE user_id = ? AND is_deleted = 1 
    ORDER BY created_at DESC
  `;
    const [rows] = await pool.execute(query, [userId]);
    return rows;
  },

  // mengembalikan riwayat
  restoreConfig: async (configId, userId) => {
    const query = `
    UPDATE configs 
    SET is_deleted = 0 
    WHERE id = ? AND user_id = ?
  `;
    const [result] = await pool.execute(query, [configId, userId]);
    return result.affectedRows;
  },
};

export default dashboardModel;
