const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const scheduleController = require('../controllers/scheduleController');

// Rotas protegidas (necessitam de autenticação)
router.get('/', authMiddleware, scheduleController.getUserSchedules);
router.post('/', authMiddleware, scheduleController.createSchedule);

// Rotas públicas
router.post('/public', scheduleController.createPublicSchedule);

module.exports = router;