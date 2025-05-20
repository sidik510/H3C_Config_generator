import pool from "../config/db.js";

const dashboardModel = {
  // Menyimpan konfigurasi ke dalam database
  saveConfig: async (configData, ports) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const {
      user_id,
      device_type,
      hostname,
      dhcp_enable_global,
      vlan_id,
      vlan_ip,
      vlan_subnet,
      vlan_network,
      dhcp_range_start,
      dhcp_range_end,
      dhcp_gateway,
      dns_option,
      custom_dns,
      config_text,
      config_hash,
    } = configData;

    // Simpan konfigurasi
    const configQuery = `
      INSERT INTO configs 
      (user_id, device_type, hostname, dhcp_enable_global, 
      vlan_id, vlan_ip, vlan_subnet, vlan_network,
      dhcp_range_start, dhcp_range_end, dhcp_gateway, dns_option,
      custom_dns, config_text, config_hash) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const [configResult] = await connection.execute(configQuery, [
      user_id,
      device_type,
      hostname,
      dhcp_enable_global,
      vlan_id,
      vlan_ip,
      vlan_subnet,
      vlan_network,
      dhcp_range_start,
      dhcp_range_end,
      dhcp_gateway,
      dns_option,
      custom_dns,
      config_text,
      config_hash,
    ]);

    const config_id = configResult.insertId;

    // Simpan ports jika ada
    if (Array.isArray(ports) && ports.length > 0) {
      const values = [];
      const placeholders = [];

      for (const port of ports) {
        const port_id = port.port_id || "";
        const port_mode = port.port_mode || "access";
        const port_poe = port.port_poe ? 1 : 0;

        placeholders.push("(?, ?, ?, ?)");
        values.push(config_id, port_id, port_mode, port_poe);
      }

      const portsQuery = `
        INSERT INTO ports (config_id, port_id, port_mode, port_poe)
        VALUES ${placeholders.join(", ")}
      `;

      await connection.execute(portsQuery, values);
    }

    await connection.commit();

    return { id: config_id, ...configData };
  } catch (error) {
    await connection.rollback();
    console.error("Transaction failed:", error);
    throw error;
  } finally {
    connection.release();
  }
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
  if (!configId || !userId) {
    throw new Error("Missing configId or userId");
  }

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

  getConfigByHash: async (hash) => {
    const query = `
    SELECT * FROM configs 
    WHERE config_hash = ? AND is_deleted = 0
    LIMIT 1
  `;
    const [rows] = await pool.execute(query, [hash]);
    return rows[0]; // karena LIMIT 1
  },
};

export default dashboardModel;
