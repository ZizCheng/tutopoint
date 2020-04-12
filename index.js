const express = require('express');
const app = express();
const http = require('http').createServer(app);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const auth = require('./auth/auth.js');
const handlebars = require('express-handlebars');
const expressSession = require('express-session');
const io = require('socket.io')(http);
const redisAdapter = require('socket.io-redis');

const secret = require('./secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);
const nodemailer = require('nodemailer');
const mailAuth = require('./secret.js').mailAuth;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: mailAuth,
});

const databaseCredentials = require('./secret.js').databaseCredentials;

const Users = require('./models/model.js').Users;
const Guides = require('./models/model.js').Guides;
const Sessions = require('./models/model.js').Sessions;
const FailedPayments = require('./models/model.js').failedPayments;

const authRouter = require('./routes/authRouter.js');
const scheduleRouter = require('./routes/scheduleRouter.js');
// const documentRouter = require('./routes/documentRouter.js');
// const discoverRouter = require('./routes/discoverRouter.js');
// const applicationRouter = require('./routes/applicationRouter.js');
// const payRouter = require('./routes/payRouter.js');
const sessionRouter = require('./routes/sessionRouter.js');
const bankRouter = require('./routes/bankRouter.js');
const adminRouter = require('./routes/adminRouter.js');

const profileAPI = require('./api/profile.js');
const discoverAPI = require('./api/discover.js');
const documentAPI = require('./api/document.js');
const balanceAPI = require('./api/balance.js');
const transportsAPI = require('./api/transports.js');
const sessionAPI = require('./api/session.js');
const referralAPI = require('./api/referral.js');
const postcallAPI = require('./api/postcall.js');

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

// deprecated
app.use(authRouter);
app.use('/session', sessionRouter);
app.use('/schedule', scheduleRouter);
app.use('/bank', bankRouter);
app.use('/admin', adminRouter);
// API
app.use('/api/profile', profileAPI);
app.use('/api/discover', discoverAPI);
app.use('/api/document', documentAPI);
app.use('/api/balance', balanceAPI);
app.use('/api/transports', transportsAPI.router);
app.use('/api/session', sessionAPI);
app.use('/api/referral', referralAPI);
app.use('/api/postcall', postcallAPI);


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
app.get('/about', function(req, res) {
  res.sendFile('views/aboutUs.html', {root: __dirname});
});
app.get('/mission', function(req, res) {
  res.sendFile('views/mission.html', {root: __dirname});
});
const chunk = (arr, size) =>
  Array.from({length: Math.ceil(arr.length / size)}, (v, i) =>
    arr.slice(i * size, i * size + size),
  );
app.get('/guides', function(req, res) {
  Guides
      .find({})
      .select('_id name university major grade university profilePic backdrop')
      .then((listOfGuides) => res.render('ourGuides', {guideChunks: chunk(JSON.parse(JSON.stringify(listOfGuides)), 4), layout: false}))
      .catch((err) => res.send(err));
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
// transportsAPI.initialize();


io.use(function(socket, next) {
  // Wrap the express middleware
  session(socket.request, {}, next);
});

io.on('connection', transportsAPI.handleIO);


if (process.env.NODE_ENV == 'production') {
  io.adapter(redisAdapter({host: 'rd1.tutopoint.com', port: 6379}));
}

const tempSession = {};

io.use(function(socket, next) {
  // Wrap the express middleware
  session(socket.request, {}, next);
});

async function sendInfo(socket, sessionid, userid) {
  // What room info should look like right now!
  // data room = {
  //   clientPresent :: Boolean,
  //   clientJoined :: Date,
  //   lastSeenClient :: Date,
  //   guidePresent :: Boolean,
  //   guideJoined :: Date,
  //   lastSeenGuide :: Date,
  //   callStart :: Date, default: null,
  //   callLastPing :: Date,
  // }
  const info = {};

  try {
    const session = await Sessions.findById(sessionid);
    if (!tempSession[sessionid]) {
      tempSession[sessionid] = {};
    }

    const room = tempSession[sessionid];

    if (session.createdBy._id == userid) {
      currentDate = new Date(Date.now());
      room['guidePresent'] = true;
      room['guideJoined'] = currentDate;
      room['lastSeenClient'] = currentDate;
    }
    if (session.clients.includes(userid)) {
      currentDate = new Date(Date.now());
      room['clientPresent'] = true;
      room['clientJoined'] = currentDate;
      room['lastSeenClient'] = currentDate;
    }


    info['roomInfo'] = room;

    socket.emit('info', info);
  } catch (e) {
    console.log(e);
  }
}

io.on('connection', function(socket, req, res) {
  if (!socket.request.session.passport) {
    return;
  }
  const userid = socket.request.session.passport.user;
  const sessionid = socket.request._query['session'];
  // Join sockets id room
  socket.join(userid);
  // Join's session room.
  socket.join(sessionid);

  // TODO: Fucking get on this shit when we wake up okay!
  sendInfo(socket, sessionid, userid);

  io.on('disconnect', function() {
    // Send an event that the client has disconnected, as well as set clientJoined to false and last seen. Set a timeout in 5 minutes to check if client is there.
    const room = tempSession['sessionid'];

    if (room) {
      room['clientPresent'] = false;
      room['lastSeenClient'] = new Date(Date.now());

      socket.to(sessionid).emit('event', {type: 'disconnect', user: userid});
    }
  });

  socket.on('offer', function(offer) {
    console.log('Got an offer');
    socket.to(sessionid).broadcast.emit('gotOffer', offer);
  });

  socket.on('replyOffer', function(offer) {
    socket.to(sessionid).broadcast.emit('answer', offer);
  });
});

