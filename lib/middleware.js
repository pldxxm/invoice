const { body, validationResult } = require('express-validator');

const verifyUser = (req, res, next) => {
    if (!req.session.userId) return res.redirect('/api/user/login');
    console.log("session id",req.session.id)
    next();
    };

const redirectAuthenticated = (req, res, next) => {
    if (req.session.userId) return res.redirect('/api/dashboard');
    next();
    };

const validateCustomer = [
    body('name', 'Name must not be empty').notEmpty(),
    body('email', 'Email must not be empty').notEmpty(),
];
module.exports = {verifyUser, redirectAuthenticated,validateCustomer

};