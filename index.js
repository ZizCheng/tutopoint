const express = require('express');
const app = express();
const http = require('http').createServer(app);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const auth = require('./auth/auth.js');
const handlebars = require('express-handlebars');
const expressSession = require('express-session');

const secret = require('./secret.js').stripe;

const authRouter = require('./routes/authRouter.js');
const scheduleRouter = require('./routes/scheduleRouter.js');
const documentRouter = require('./routes/documentRouter.js');
const discoverRouter = require('./routes/discoverRouter.js');
const applicationRouter = require('./routes/applicationRouter.js');
const payRouter = require('./routes/payRouter.js');
const sessionRouter = require('./routes/sessionRouter.js');
const bankRouter = require('./routes/bankRouter.js');
const adminRouter = require('./routes/adminRouter.js');

const databaseCredentials = require('./secret.js').databaseCredentials;
const profileAPI = require('./api/profile.js');
const discoverAPI = require('./api/discover.js');
const balanceAPI = require('./api/balance.js');
const transportsAPI = require('./api/transports.js');

const session = expressSession({
  secret: '385willneverlovetitor',
  saveUninitialized: true,
  resave: true,
});


mongoose.connect(databaseCredentials.url, {useNewUrlParser: true});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'));


app.use(function(req, res, next) {
  res.locals.stripePK = secret.pk_key;
  next();
});

app.use(session);
app.use(passport.initialize());
app.use(passport.session());

//deprecated
app.use(authRouter);

// API
app.use('/api/profile', profileAPI);
app.use('/api/discover', discoverAPI);
app.use('/api/balance', balanceAPI);
app.use('/api/transports', transportsAPI.router);


app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');


const config = {
  port: 3000,
  hourChunks: 4, // number of chunks an hour is split into
};

passport.use(auth.Strategy);
passport.serializeUser(auth.serializeUser);
passport.deserializeUser(auth.deserializeUser);

app.get('/', function(req, res) {
  res.sendFile('views/index.html', {root: __dirname});
});

app.use(express.static('dist'));
app.get('/dashboard', auth.loggedIn, function(req, res) {
  res.sendFile('dist/index.html', {root: __dirname});
});
app.get('*', auth.loggedIn, function(req, res) {
  res.sendFile('dist/index.html', {root: __dirname});
});

http.listen(config.port, function() {
  console.log(`Server listening on :${config.port}`);
});
transportsAPI.initialize();
