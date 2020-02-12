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

const Users = require('./models/model.js').Users;
const Sessions = require('./models/model.js').Sessions;

const authRouter = require('./routes/authRouter.js');
const scheduleRouter = require('./routes/scheduleRouter.js');
const documentRouter = require('./routes/documentRouter.js');
const discoverRouter = require('./routes/discoverRouter.js');
const applicationRouter = require('./routes/applicationRouter.js');
const payRouter = require('./routes/payRouter.js');

const session = expressSession({
  secret: '385willneverlovetitor',
  saveUninitialized: true,
  resave: true,
});


mongoose.connect('mongodb://localhost:27017/TutoPoint');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static('public'));

app.use(session);
app.use(passport.initialize());
app.use(passport.session());

app.use(authRouter);
app.use('/schedule', scheduleRouter);
app.use('/document', documentRouter);
app.use('/discover', discoverRouter);
app.use('/pay', payRouter);
app.use('/apply', applicationRouter);


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

app.get('/session/:id', auth.loggedIn, function(req, res) {
  if (!req.params.id) res.redirect('/dashboard');
  res.render('session', {sessionid: req.params.id, layout: false});
});


app.get('/test', function(req, res) {
  console.log(req.user);
  res.send(req.user);
});


io.use(function(socket, next) {
  // Wrap the express middleware
  session(socket.request, {}, next);
});

io.on('connection', function(socket, req, res) {
  if (!socket.request.session.passport) {
    socket.emit('forceDisconnect');
    return;
  }
  // join room for private messages
  socket.join(socket.request.session.passport.user);


  socket.on('call', function() {
    console.log('got call');
    Sessions.findById(socket.request._query['session'])
        .exec(function(err, session) {
          if (err) return;
          socket.to(session.createdBy).emit('makeOffer', {
            from: socket.request.session.passport.user,
          });
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


  socket.on('text change', function(data) {
    socket.to('document ' + data.doc_id).emit('text change', data);
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

http.listen(config.port, function() {
  console.log(`Server listening on :${config.port}`);
});
