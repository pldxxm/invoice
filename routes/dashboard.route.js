const express = require('express');
const router = express.Router();
const {verifyUser} = require('../lib/middleware');
const { showDashboard } = require('../controllers/dashboard.controller');

router.get('/', verifyUser, showDashboard);



module.exports = router;