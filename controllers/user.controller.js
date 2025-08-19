
const User = require('../lib/models/user.model');
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcrypt');
const validateSignup = [
    body('email', 'Email must not be empty').notEmpty(),
    body('password', 'Password must not be empty').notEmpty(),
    body('password', 'Password must be 6+ characters long').isLength({ min: 6 }),
    body('repeatPassword', 'Repeat Password must not be empty').notEmpty(),
    body('repeatPassword', 'Passwords do not match').custom((value, { req }) => (value ===
    req.body.password)),
    ]

const validateLogin = [
    body('email', 'Email must not be empty').notEmpty(),
    body('password', 'Password must not be empty').notEmpty(),
    ];

const createUser = async (req, res) => { 
    try {
        const user = await User.create(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const getUsers = async (req, res) => { 
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const getUserByName = async (req, res) => { 
    try {
        const user = await User.findOne({username: req.params.username});
         if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

};


const updateUser = async (req, res) => { 
    try {
        const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteUser = async (req, res) => { 
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(204).json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


const getSignup = async (req, res) => {
    const messages = req.flash();
    const signUpError = messages?.signupError||[];
    const formDataArray = messages?.formData||[];
    const infoArray = messages?.info||[];
    console.log(infoArray);

    res.render('pages/signup', { 
        title: 'Sign up',
        errors: signUpError,
        user: formDataArray[0]||{},
        info: infoArray[0]||null,
    });
};

const signup = async (req, res) => {
    try {
        const errors = validationResult(req);
        // if (!errors.isEmpty()) {
        //     return res.render('pages/signup', { title: 'Sign up', errors: errors.array() });
        // }
        if (!errors.isEmpty()){
            //save signUpError and data to flash
            req.flash('signUpError', errors.array());
            req.flash('formData', req.body);
            return res.redirect(req.baseUrl+'/signup');
        }
        const { email, password,repeatPassword } = req.body;
        const existingUser = await User.findOne({email});
        if (existingUser) {
            req.flash('info', {
                message: 'Email is already registered. Try to login instead',
                type: 'error'
              });
            req.flash('formData', req.body);
            return res.redirect('/api/user/signup')
        }
        if (password !== repeatPassword) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({email:email, password: hashedPassword});
        req.session.regenerate((regenerateError) => {
            if (regenerateError) {
                return res.status(500).json({ error: regenerateError.message });
            }
            req.session.userId = user._id;
            req.flash('info', { 
                message: 'Account created successfully',
                type: 'success'
            });
            req.session.save(() => {
                return res.redirect(303,'/api/dashboard');
            });
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

const getLogin = async (req, res) => {
    const messages = req.flash();
    const loginError = messages?.loginError||[];
    const formDataArray = messages?.formData||[]
    const infoArray = messages?.info||[];
    res.render('pages/login', {
        title: 'Login',
        errors: loginError[0]||{},
        user: formDataArray[0]||{},
        info: infoArray[0]||null,
    });
}

const login = async (req, res) => {
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      const errors = validationErrors.array();
      req.flash('loginError', errors);
      req.flash('formData', req.body);
      return res.redirect(303,'/api/user/login');
    }
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (user) {
      const passwordMatch = await bcrypt.compare(password, user.password);
      if (passwordMatch) {
        req.session.regenerate((regenerateError) => {
          if (regenerateError) {
            return res.status(500).json({ error: regenerateError.message });
          }
          req.session.userId = user._id;
          // req.flash('info', {
          //   message: 'Login Successful',
          //   type: 'success'
          // });
          req.session.save(() => {
            return res.redirect(303,'/api/dashboard');
          });
        });
      } else {
        req.flash('info', {
          message: 'Wrong Password',
          type: 'error'
        });
        req.flash('formData', req.body)
        res.redirect(303,'/api/user/login');
      }
    } else {
      req.flash('info', {
        message: 'Email is not registered',
        type: 'error'
      });
      req.flash('formData', req.body)
      res.redirect(303,'/api/user/login');
    }
   }

const logout = async (req, res) => {
    req.session.userId = null;
    req.flash('info', {
        message: 'Logout successful',
        type: 'success'
    });
    return res.redirect(303,'/api/user/');
}

module.exports = { getUsers, getUserByName, createUser, updateUser, deleteUser,signup,getSignup,validateSignup,getLogin,login,validateLogin,logout };
