const express = require('express');
const router = express.Router();
const configController = require('../controllers/configController');
const checkAuth = require('../middleware/authMiddleware');

router.post('/save', configController.saveConfig);
router.get('/history/:user_id', configController.getConfigsByUser);
router.post('/save', checkAuth, configController.saveConfig);
router.get('/history/:user_id', checkAuth, configController.getConfigsByUser);

module.exports = router;
