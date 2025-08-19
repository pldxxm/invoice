const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const {getUsers, getUserByName, createUser, updateUser, deleteUser,signup,getSignup,validateSignup,getLogin,login,validateLogin,logout} = userController;
const {redirectAuthenticated,verifyUser} = require('../lib/middleware')

router.get('/',(req,res) => {
    res.render('pages/index', {
        title: 'Index',
        info: req.flash('info')[0]||null,
    });
})

router.get('/signup', redirectAuthenticated,getSignup);
router.post('/signup', validateSignup,signup);
router.get('/login', redirectAuthenticated,getLogin);
router.post('/login', validateLogin,login);
router.get('/logout', verifyUser,logout);

router.post('/', createUser);


// put static urls before dynamic urls 
router.get('/:username', getUserByName);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);




module.exports = router;