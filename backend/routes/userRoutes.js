const express = require('express');
const router = express.Router();
const controller = require('../controllers/userController');

// Auth routes
router.post('/login', controller.login);

// CRUD routes
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;

