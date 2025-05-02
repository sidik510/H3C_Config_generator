const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');

// Endpoint untuk generate konfigurasi
router.post('/generate-config', configController.generateConfig);

module.exports = router;
