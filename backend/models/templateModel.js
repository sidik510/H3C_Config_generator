const db = require('../config/db');

// Ambil semua template
function getAllTemplates(callback) {
  const sql = 'SELECT * FROM templates';
  db.query(sql, (err, results) => {
    if (err) return callback(err, null);
    callback(null, results);
  });
}

// Ambil template berdasarkan device_type dan config_name
function getTemplateByTypeAndName(device_type, config_name, callback) {
  const sql = 'SELECT * FROM templates WHERE device_type = ? AND config_name = ? LIMIT 1';
  db.query(sql, [device_type, config_name], (err, results) => {
    if (err) return callback(err, null);
    callback(null, results[0]);
  });
}

module.exports = {
  getAllTemplates,
  getTemplateByTypeAndName
};
