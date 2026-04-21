const express = require('express');
const agentController = require('../controllers/agentController');

const router = express.Router();

router.post('/chat', agentController.chat);

module.exports = router;
