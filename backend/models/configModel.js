const db = require('../config/db');

const saveConfig = (data, callback) => {
  const { user_id, device_type, hostname, ip, vlan, config_text } = data;
  const query = `INSERT INTO configs (user_id, device_type, hostname, ip_address, vlan, config_text) VALUES (?, ?, ?, ?, ?, ?)`;

  db.query(query, [user_id, device_type, hostname, ip, vlan, config_text], callback);
};

module.exports = {
  saveConfig
};
