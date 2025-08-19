const express = require('express');
const morgan = require('morgan');
const userRouter = require('./routes/user.route');
const dashboardRouter = require('./routes/dashboard.route');
const customerRouter = require('./routes/customer.route');
const invoiceRouter = require('./routes/invoice.route');
const session = require('express-session');
const flash = require('connect-flash');
const MongoStore = require('connect-mongo');
const mongoose = require('mongoose');

const app = express()

// load env variables
require('dotenv').config();

require('./lib/dbConnect');

// register a middleware function to deal with each request to log
app.use(morgan('dev'));

// allow json in request.body
app.use(express.json());
// allow form data in request.body
app.use(express.urlencoded({ extended: true }));
// the view folder
app.set('views',__dirname+'/views')
app.set('view cache', false);
//set the view engine to ejs
app.set('view engine', 'ejs')

// serve static files
// app.use(express.static(__dirname+'/public'));

// disable cache for static files,get css with 200 code each tiem rather than 304 
app.use(express.static(__dirname + '/public', {
    etag: false,
    lastModified: false,
    cacheControl: true,
    maxAge: 0,
    setHeaders: (res) => res.set('Cache-Control', 'no-store')
  }));



//enable session for authentication
app.use(
    session({
    secret: process.env.AUTH_SECRET,
    name: 'sid',
    saveUninitialized: false,
    resave: false,
    store: MongoStore.create({ 
        client: mongoose.connection.getClient(),
        collectionName: 'sessions',
        ttl: 60 * 60 * 24 * 7, 
     }),
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7,
    },
    })
    );
// enable a global middleware flash to deal with all request if necessary, no need to import in the router file again  
app.use(flash());

// let userRouter handle url starting with /api/user
app.use('/api/user',userRouter)
app.use('/api/dashboard',dashboardRouter)
app.use('/api/customers',customerRouter)
app.use('/api/invoices',invoiceRouter)
app.get('/test', (req, res) => {
    res.render('pages/test', { title: 'Test' });
});


//fallback route for 404
app.get(/.*/, (req, res) => {
    res.status(404).render('pages/index', { title: 'Not Found', message: '404,Not Found' });
   });



const PORT = process.env.PORT || 8844;

app.listen(PORT, '0.0.0.0',() => {
    console.log(`Server listening on port ${PORT}`);
});