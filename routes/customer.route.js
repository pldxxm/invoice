const express = require('express');
const router = express.Router();
const {verifyUser} = require('../lib/middleware')
const {getCreateCustomer,createCustomer,showCustomers,validateCustomer,editCustomer,updateCustomer,deleteCustomer} = require('../controllers/customer.controller');

router.get('/', verifyUser,showCustomers);
router.get('/create', verifyUser,getCreateCustomer);
router.post('/create', [verifyUser,validateCustomer],createCustomer);
router.get('/:id/edit', verifyUser,editCustomer);
router.post('/:id/edit', [verifyUser,validateCustomer],updateCustomer);
router.post('/:id/delete', verifyUser,deleteCustomer);

module.exports = router;