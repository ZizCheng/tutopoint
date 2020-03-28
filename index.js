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
app.use('/api/referral', referralAPI)


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
app.get('/session/:id', auth.loggedIn, function(req, res) {
  if (!req.params.id) res.redirect('/dashboard');
  res.render('session', {sessionid: req.params.id, layout: false});
});
app.get('*', auth.loggedIn, function(req, res) {
  res.sendFile('dist/index.html', {root: __dirname});
});

http.listen(config.port, function() {
  console.log(`Server listening on :${config.port}`);
});
transportsAPI.initialize();
// transportsAPI.initialize();


// io.use(function(socket, next) {
//   // Wrap the express middleware
//   session(socket.request, {}, next);
// });

// io.on('connection', transportsAPI.handleIO);


if (process.env.NODE_ENV == 'production') {
  io.adapter(redisAdapter({host: 'rd1.tutopoint.com', port: 6379}));
}


io.use(function(socket, next) {
  // Wrap the express middleware
  session(socket.request, {}, next);
});

function handleUserType(socket) {
  Users.findById(socket.request.session.passport.user)
      .then((user) => {
        console.log(user.__t);
        if (user.__t == 'guides') {
          socket.to(socket.request._query['session']).emit('guideConnected');
        } else if (user.__t == 'clients') {
          socket.to(socket.request._query['session']).emit('clientConnected');
        }
      })
      .catch((err) => {});
}


function chargeUser(io, socket, sessionid, user, count) {
  Sessions.findById(sessionid)
      .populate('createdBy')
      .then((session) => {
        if (session.completed) {
          if (count == 0) {
            return;
          }
          const calculatedCost = parseInt(count * 900);
          const client = session.clients[0];
          Users.findById(client)
              .populate('referredBy')
              .then((user) => {
                if (user.referredBy) {
                  stripe.customers.createBalanceTransaction(
                      user.referredBy.stripeCustomerId,
                      {amount: -(count * 300), currency: 'usd', description: 'Session refill.'},
                      async function(err, customer) {
                        if (err) console.warn('Error paying referrer');
                      },
                  );
                }
              });
          stripe.transfers.create(
              {
                amount: calculatedCost,
                currency: 'usd',
                destination: session.createdBy.stripeAccountId,
              },
              function(err, transfer) {
                // asynchronously called
                if (err) {
                  stripe.topups.create(
                      {
                        amount: calculatedCost * 2,
                        currency: 'usd',
                        description: `Top up for ${sessionid}`,
                        statement_descriptor: 'Top-up',
                      },
                      function(err, topup) {
                        if (err) {
                          // Both payments failed, we will manually pay them out okay.
                          const failedPayment = new FailedPayments({
                            guideId: session.createdBy,
                            sessionId: session._id,
                            count: count,

                          });
                          failedPayment.save()
                              .then(() => {
                                console.log(`Transfer payment for ${session.createdBy} has failed.`);
                              });
                        };
                        // asynchronously called
                        stripe.transfers.create(
                            {
                              amount: calculatedCost,
                              currency: 'usd',
                              destination: session.createdBy.stripeAccountId,
                            },
                            function(err, transfer) {
                              // asynchronously called
                              if (err) {
                                // Both payments failed, we will manually pay them out okay.
                                const failedPayment = new FailedPayments({
                                  guideId: session.createdBy,
                                  sessionId: session._id,
                                  count: count,

                                });
                                failedPayment.save()
                                    .then(() => {
                                      console.log(`Transfer payment for ${session.createdBy} has failed.`);
                                    });
                              };
                              console.log('transfer complete');
                            },
                        );
                      },
                  );
                };
                console.log('transfer complete');
              },
          );
          return;
        } else {
          Users.findById(user)
              .then((customerAccount) => {
                stripe.customers.retrieve(
                    customerAccount.stripeCustomerId,
                    function(err, customer) {
                      if (customer.balance <= -1500) {
                        stripe.customers.createBalanceTransaction(
                            customerAccount.stripeCustomerId,
                            {amount: 1500, currency: 'usd', description: 'Session charge.'},
                            function(err, customerAfterCharge) {
                              console.log(err);
                              if (err) return; // Handle when it could not charge.
                              io.in('/').to(socket.request.session.passport.user).emit('notification', {title: 'You have been charged.', message: `You have been charged $15 for this session. You have $${customerAfterCharge.ending_balance / 100 * -1} remaining`, style: 'is-primary'});
                              if (!(customerAfterCharge.ending_balance <= -1500)) {
                                io.in('/').to(socket.request.session.passport.user).emit('notification', {title: 'Low balance', message: 'You do not have enough credits to continue with this session in 15 minutes!', style: 'is-danger'});
                              }
                              setTimeout(() => {
                                chargeUser(io, socket, sessionid, user, count+1);
                              }, 900000);
                            },
                        );
                      } else {
                        setTimeout(() => {
                          setTimeout(() => {
                            chargeUser(io, socket, sessionid, user, count);
                          }, 20000);
                          endCall(io, socket);
                        }, 120000);

                        return;
                      }
                    },
                );
              });
        }
      });
}

function endCall(io, socket) {
  io.to(socket.request._query['session']).emit('forceDisconnect');
  const endDate = Date.now();
  Sessions.findById(socket.request._query['session'])
      .then((session) => {
        session.completed = true;
        session.dateCompletedAt = endDate;
        session.save()
            .then(() => {
              // TODO: this thing
              const diff = parseInt((endDate - session.date) / 1000);
              const numOfBlocks = Math.ceil((diff / 60) / 15);
              console.log(numOfBlocks);
            })
            .catch((err) => console.log('something occurred'));
      })
      .catch((err) => console.log('Could not find session'));
}

io.on('connection', function(socket, req, res) {
  if (!socket.request.session.passport) {
    socket.emit('forceDisconnect');
    return;
  }
  // join room for private messages
  socket.join(socket.request.session.passport.user);
  // Join's session room.
  socket.join(socket.request._query['session']);

  handleUserType(socket);
  socket.on('replyGuideConnected', function() {
    socket.to(socket.request._query['session']).broadcast.emit('notifyClientHasConnected');
  });

  socket.on('replyClientConnected', function() {
    socket.to(socket.request._query['session']).broadcast.emit('notifyGuideHasConnected');
  });

  socket.on('call', function() {
    console.log('got call');
    Sessions.findById(socket.request._query['session'])
        .exec(function(err, session) {
          if (err) return;
          if (socket.request.session.passport.user == session.createdBy.toString()) {
            for (let i = 0; i < session.clients.length; i++) {
              console.log('guide attempting to call');
              socket.to(session.clients[i]).emit('makeOffer', {
                from: socket.request.session.passport.user,
              });
            }
            return;
          } else {
            socket.to(session.createdBy).emit('makeOffer', {
              from: socket.request.session.passport.user,
            });
          }
        });
  });
  socket.on('offer', function(data) {
    console.log('offer');
    socket.to(data.to).emit('frontAnswer', {
      offer: data.offer,
      from: socket.request.session.passport.user,
    });
  });
  socket.on('answer', function(data) {
    console.log('answer');
    socket.to(data.to).emit('backAnswer', data.offer);
  });

  socket.on('disconnect', function() {
    socket.leave(socket.request.session.passport.user);
    socket.leave(socket.request._query['session']);
  });

  socket.on('callEnd', function() {
    endCall(io, socket);
  });

  socket.on('callStart', function() {
    const sessionid = socket.request._query['session'];
    Sessions.findById(sessionid)
        .then((session) => {
          if (socket.request.session.passport.user == session.createdBy.toString()) {
            return;
          }
          io.in('/').to(socket.request.session.passport.user).emit('notification', {title: 'Alert', message: 'You will be charged in 5 minutes.', style: 'is-warning'});
          if (session.date > (Date.now() + 300000)) {
            // Do not charge
            // Setup timeout till it's that date.\
            console.log('Will not charge since it\'s before 5 minutes session starts');
          } else {
            console.log('Session has started');
            // Charge 5 minutes later.
            setTimeout(() => {
              chargeUser(io, socket, sessionid, socket.request.session.passport.user, 0);
            }, 300000);
          }
        })
        .catch((err) => console.log('Could not find session'));
  });


  socket.on('text change', function(data) {
    socket.to('document ' + data.doc_id).to(socket.request._query['session']).emit('text change', data);
  });
  socket.on('join document room', function(docId) {
    const sessionId = socket.request.session.passport.user;
    Users.findById(sessionId).populate('documents').exec(function(err, user) {
      const doc = user.documents.find(function(tempDoc) {
        return tempDoc._id == docId;
      });
      if (!doc) res.redirect('/dashboard');
      else {
        socket.join('document ' + docId);
      }
    });
  });
});
