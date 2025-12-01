const express = require('express');
const router = express.Router();
const controller = require('../controllers/matchController');

// CRUD routes
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', controller.create);
router.post('/accept-request', controller.acceptRequest);
router.patch('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;

