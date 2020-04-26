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
const sessionAPI = require('./api/session.js');
const referralAPI = require('./api/referral.js');
const postcallAPI = require('./api/postcall.js');

const session = expressSession({
  secret: '385willneverlovetitor',
  saveUninitialized: true,
  resave: true,
});

let redisConfig = {}

if (process.env.NODE_ENV == 'production') {
 redisConfig = {host: 'rd1.tutopoint.com', port: 6379};
}

const redis = require('redis').createClient(redisConfig);
const subscriber = require('redis').createClient(redisConfig);

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
  if(req.isAuthenticated()) return res.redirect('/dashboard');
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
      .select('_id name university major grade university profilePic backdrop bio')
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

io.use(function(socket, next) {
  // Wrap the express middleware
  session(socket.request, {}, next);
});


if (process.env.NODE_ENV == 'production') {
  io.adapter(redisAdapter({host: 'rd1.tutopoint.com', port: 6379}));
}

io.use(function(socket, next) {
  // Wrap the express middleware
  session(socket.request, {}, next);
});

const refreshTTL = 60 * 1;

async function sendInfo(socket, sessionid, userid) {
  const tempSession = {};
  const info = {};

  try {
    const session = await Sessions.findById(sessionid);

    redis.get(sessionid, function(err, reply) {
      let room = tempSession[sessionid];
      if (reply != null) {
        room = JSON.parse(reply);
      } else {
        room = {};
      }
      if (session.createdBy._id == userid) {
        currentDate = new Date(Date.now());
        room['guideid'] = userid;
        room['guidePresent'] = true;
        room['guideJoined'] = currentDate;
      }
      if (session.clients.includes(userid)) {
        currentDate = new Date(Date.now());
        room['clientid'] = userid;
        room['clientPresent'] = true;
        room['clientJoined'] = currentDate;
        room['lastSeenClient'] = currentDate;
      }

      info['roomInfo'] = room;
      info['myid'] = userid;

      redis
          .multi()
          .set(sessionid, JSON.stringify(room))
          .setex(`shadow:${sessionid}`, refreshTTL, '')
          .exec(function(err, reply) {
            if (err) return console.log(err);
            socket.emit('info', info);
          });
    });
  } catch (e) {
    console.log(e);
  }
}

function refreshUser(sessionid, userid) {
  console.log('got refreshed');
  redis.get(sessionid, function(err, rep) {
    if (err) return err;
    if (!rep) return;

    const room = JSON.parse(rep);
    const currentDate = new Date(Date.now());
    if (room['clientid'] == userid) {
      room['lastSeenClient'] = currentDate;
    } else if (room['guideid'] == userid) {
      return;
    }

    redis
        .multi()
        .set(sessionid, JSON.stringify(room))
        .setex(`shadow:${sessionid}`, refreshTTL, '')
        .exec();
  });
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

  sendInfo(socket, sessionid, userid);

  socket.on('text change', function(data) {
    socket.to(sessionid).broadcast.emit('text change', data);
  });

  socket.on('disconnect', function() {
    console.log('A user has disconnected');

    // Send an event that the client has disconnected, as well as set clientJoined to false and last seen. Set a timeout in 5 minutes to check if client is there.
    redis.get(sessionid, function(err, data) {
      if (err) return console.log(err);
      if (!data) return;

      const room = JSON.parse(data);
      const currentDate = new Date(Date.now());
      if (room['clientid'] == userid) {
        room['clientPresent'] = false;
        room['lastSeenClient'] = currentDate;
      } else if (room['guideid'] == userid) {
        room['guidePresent'] = false;
      }

      redis.set(sessionid, JSON.stringify(room), function(err, r) {
        if (err) return console.log(err);
        socket
            .to(sessionid)
            .emit('event', {type: 'disconnect', user: userid});
      });
    });
  });

  socket.on('callEnd', function() {
    console.log('callEnds');
    redis.get(sessionid, function(err, reply) {
      if (err) return console.log(err);
      if (!reply) return;

      const room = JSON.parse(reply);

      if (!room['callEnd']) {
        console.log('no end date');
        room['callEnd'] = Date.now();
        const thatSocket = socket;

        redis.set(sessionid, JSON.stringify(room), function(err, r) {
          if (err) return console.log(err);
          console.log('ok it ended');
          thatSocket.emit('event', {type: 'callEnd'});
          redis.EXPIRE(`shadow:${sessionid}`, 2);
        });
      }
    });
  });

  socket.on('callStart', function() {
    redis.exists(sessionid, function(err, r) {
      if (err) return console.log(err);
      if (!r) return;
      redis.get(sessionid, function(err, data) {
        if (err) return console.log(err);
        const room = JSON.parse(data);
        refreshUser(sessionid, userid);
        if (room && !room['callStart']) {
          const currentDate = new Date(Date.now());
          room['callStart'] = currentDate;
          redis.set(sessionid, JSON.stringify(room));
          socket.emit('event', {type: 'callStarted', startTime: currentDate});
        } else if (room['callStart']) {
          socket.emit('event', {
            type: 'callStarted',
            startTime: room['callStart'],
          });
        }
      });
    });
  });

  socket.on('refresh', function() {
    // TODO Refresh the client / guide as well
    console.log('Session will be refreshed again in 15 minutes to check');
    refreshUser(sessionid, userid);
  });

  socket.on('offer', function(offer) {
    console.log('Got an offer');
    socket.to(sessionid).broadcast.emit('gotOffer', offer);
  });

  socket.on('replyOffer', function(offer) {
    console.log('Replied offer');
    socket.to(sessionid).broadcast.emit('answer', offer);
  });
});

function chargeClient(clientstripeid, amount, message, dir) {
  const chargeType = {
    charge: 1,
    debit: -1,
  };
  return new Promise((resolve, reject) => {
    stripe.customers.createBalanceTransaction(
        clientstripeid,
        {
          amount: chargeType[dir] * amount,
          currency: 'usd',
          description: message,
        },
        function(err, _) {
          if (err) reject(err);
          resolve();
        },
    );
  });
}

function payGuide(guidestripeaccount, amount) {
  return new Promise((resolve, reject) => {
    const paymentInfo = {
      amount: amount,
      currency: 'usd',
      destination: guidestripeaccount,
    };
    stripe.transfers
        .create(paymentInfo)
        .then(() => {
        // Success
          resolve();
        })
        .catch((err) => {
        // Failure
          const topupInfo = {
            amount: amount * 2,
            currency: 'usd',
            description: `Topup`,
            statement_descriptor: 'Top-up',
          };
          stripe
              .topups.create(topupInfo)
              .then(() => {
                // Attempt to charge again
                stripe.transfers
                    .create(paymentInfo)
                    .then(() => {
                      // Success
                      resolve();
                    })
                    .catch(() => {
                      const failedPayment = new FailedPayments({
                        stripeAccountId: guidestripeaccount,
                        sessionId: session._id,
                        count: amount,
                      });
                      failedPayment.save().then(() => {
                        console.log(
                            `Transfer payment for ${session.createdBy} has failed.`,
                        );
                        resolve();
                      });
                    });
              })
              .catch(() => {
                const failedPayment = new FailedPayments({
                  guideId: session.createdBy,
                  sessionId: session._id,
                  count: amount,
                });
                failedPayment.save().then(() => {
                  resolve();
                  console.log(
                      `Transfer payment for ${session.createdBy} has failed.`,
                  );
                });
              });
        });
  });
}

async function sessionCharge(sessionid) {
  const trialTime = 10; // 10 minutes.
  const hour = 40;
  const per15rate = 15;
  Sessions.findById(sessionid)
      .then((session) => {
        if (session.completed) {
          return redis.DEL([sessionid, `shadow:${sessionid}`]);
        }
        if (!session.completed) {
          session.completed = true;
        }

        session.save();
        redis.get(sessionid, function(err, reply) {
          if (err) return console.log(err);
          if (!reply) return;

          const room = JSON.parse(reply);
          const callStart = new Date(room['callStart']);
          const callEnd = new Date(room['callEnd']);

          const diff = (callEnd.valueOf() - callStart.valueOf()) / 1000 / 60 - trialTime; // Turns into minutes.
          if (diff < 0) return redis.DEL([sessionid, `shadow:${sessionid}`]);

          let totalClientCost;
          if (diff > 0 && diff < 60) {
            totalClientCost = hour;
          } else if (diff > 60) {
            totalClientCost = hour + Math.ceil((diff - 60) / 15) * per15rate;
          }
          totalClientCost = Math.ceil(totalClientCost) * 100;
          console.log(totalClientCost);
          Users.findById(session.clients[0]).then((u) => {
            chargeClient(
                u.stripeCustomerId,
                totalClientCost,
                `Session Charge`,
                'charge',
            );
          });
          const guidePay = Math.ceil(totalClientCost * 0.9);
          Users.findById(session.createdBy)
              .then((guide) => {
                payGuide(guide.stripeAccountId, guidePay).then(() => {
                  redis.DEL([sessionid, `shadow:${sessionid}`]);
                });
              })
              .catch(() => {
                const failedPayment = new FailedPayments({
                  guideId: session.createdBy,
                  sessionId: session._id,
                  count: amount,
                });
                failedPayment.save();
              });
        });
      })
      .catch((e) => console.log('Session doesn\'t exist!'));
}

subscriber.subscribe('__keyevent@0__:expired');

subscriber.on('message', function(_channel, message) {
  const noActivityTimeout = 1000 * 60 * 5;
  const sessionid = message.split(':')[1];

  redis.get(sessionid, function(err, data) {
    if (err) return console.log(err);
    if (!data) return;

    const room = JSON.parse(data);
    const callStart = new Date(room['callStart']);
    const lastSeenClient = new Date(room['lastSeenClient']);

    if (!callStart) {
      // Ignore, session will be deleted.
    }

    if (room['callEnd']) {
      io.to(sessionid).emit('event', {type: 'callEnd'});
      sessionCharge(sessionid);
    }
    // Calculate room activity based on client
    else if (
      Date.now() - lastSeenClient.valueOf() > noActivityTimeout &&
      !room['guidePresent']
    ) {
      console.log(Date.now() - lastSeenClient.valueOf());
      room['callEnd'] = Date.now();
      redis.set(sessionid, JSON.stringify(room), function(err, _) {
        sessionCharge(sessionid);
      });
    } else {
      console.log('ping activity');

      io.to(sessionid).emit('activityPing');

      redis.setex(`shadow:${sessionid}`, refreshTTL, '');
    }
  });
});