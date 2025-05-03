const configModel = require('../models/configModel');

const saveConfig = (req, res) => {
  const { user_id, device_type, hostname, ip, vlan, config_text } = req.body;

  if (!user_id || !device_type || !hostname || !ip || !config_text) {
    return res.status(400).json({ error: 'Data tidak lengkap' });
  }

  configModel.saveConfig(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: 'Gagal menyimpan konfigurasi' });
    res.status(201).json({ message: 'Konfigurasi disimpan ke database' });
  });
};

const db = require('../config/db');

const getConfigsByUser = (req, res) => {
  const user_id = req.params.user_id;

  db.query(
    'SELECT * FROM configs WHERE user_id = ? ORDER BY created_at DESC',
    [user_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Gagal mengambil data' });
      res.json(results);
    }
  );
};

module.exports = {
  saveConfig,
  getConfigsByUser
};
