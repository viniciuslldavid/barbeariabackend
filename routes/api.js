const express = require('express');
const router = express.Router({ strict: false });
const userController = require('../controllers/userController');
const serviceController = require('../controllers/serviceController');
const barberController = require('../controllers/barberController');
const scheduleController = require('../controllers/scheduleController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

console.log('Registrando rotas no backend'); // Log para depuração

// Rotas públicas
router.post('/register', userController.register);
router.post('/login', userController.login);
router.get('/services', serviceController.getServices);
router.get('/barbers', barberController.getBarbers);
router.get('/available-times', scheduleController.getAvailableTimes);

// Novo endpoint para agendamento público (sem autenticação)
router.post('/public/schedules', scheduleController.createPublicSchedule);

// Rotas protegidas (usuário logado)
router.get('/users/profile', authMiddleware, userController.getProfile);
router.post('/schedules', authMiddleware, scheduleController.createSchedule);
router.get('/schedules', authMiddleware, scheduleController.getUserSchedules);

// Rotas de administrador
router.get('/admin/schedules', authMiddleware, adminMiddleware, scheduleController.getAllSchedules);
router.post('/admin/schedules/update-status', authMiddleware, adminMiddleware, scheduleController.updateScheduleStatus);
router.post('/admin/barbers', authMiddleware, adminMiddleware, scheduleController.createBarber);
router.post('/admin/services', authMiddleware, adminMiddleware, scheduleController.createService);

module.exports = router;