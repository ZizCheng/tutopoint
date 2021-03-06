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

const nodeSchedule = require('node-schedule');

const databaseCredentials = require('./secret.js').databaseCredentials;

const Users = require('./models/model.js').Users;
const Guides = require('./models/model.js').Guides;
const Sessions = require('./models/model.js').Sessions;
const FailedPayments = require('./models/model.js').failedPayments;
const Chats = require('./models/model.js').Chats;

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
const eventsAPI = require('./api/events.js');
const sessionAPI = require('./api/session.js');
const referralAPI = require('./api/referral.js');
const postcallAPI = require('./api/postcall.js');
const chatAPI = require('./api/chat.js');

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
app.use('/api/chat', chatAPI);
app.use('/api/events', eventsAPI);


app.engine('hbs', handlebars({
  extname: 'hbs',
  layoutsDir: './views/layouts',
  partialsDir: './views/partials',
}));
app.set('view engine', 'hbs');

const config = {
  port: 3000,
  hourChunks: 4, // number of chunks an hour is split into
};

passport.use(auth.Strategy);
passport.serializeUser(auth.serializeUser);
passport.deserializeUser(auth.deserializeUser);


app.get('/', function(req, res) {
  if(req.isAuthenticated()) return res.redirect('/dashboard');
  Guides
      .find({})
      .select('_id name university major grade university profilePic backdrop bio')
      .then((listOfGuides) => res.render('index', {guides: JSON.parse(JSON.stringify(listOfGuides)), layout: false}))
      .catch((err) => console.log(err));
});
app.get('/about', function(req, res) {
  res.render('aboutUs', {layout: false});
});
app.get('/mission', function(req, res) {
  res.render('mission', {layout: false});
});
app.get('/events', function(req, res) {
  res.render('events', {layout: false});
});
app.get('/summer', function(req, res) {
  res.render('summer', {layout: false});
});
app.get('/summer/act1', function(req, res) {
  res.render('act1', {layout: false});
});
app.get('/summer/act2', function(req, res) {
  res.render('act2', {layout: false});
});
app.get('/summer/sat', function(req, res) {
  res.render('sat', {layout: false});
});
app.get('/summer/finance', function(req, res) {
  res.render('finance', {layout: false});
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

io.on('connection', function(socket) {
  if (!socket.request.session.passport) return;
  const userId = socket.request.session.passport.user;

  //request: data: chat room id
  //joins the given room (with chat- prefix), does not do security check
  socket.on("chat-join-room", (data) => {
    Chats.findById(data).exec((err,chat) => {
      if(!chat) socket.emit("chat-error", "invalid chat id when joining chat room");
      else {
        //make sure user is part of this chat
        if(!chat.participants.includes(userId)) socket.emit("chat-error", "you are not a part of this chat");
        else {
          socket.join("chat-" + data);
          socket.leave("chat-" + socket.chatId);
          socket.chatId = data;

          //update the lastRead by finding the user then iterating through all chats to match the id
          Users.findById(userId).exec((err, user) => {
            for(var chat of user.chats) {
              if(chat.chat == socket.chatId) {
                chat.lastRead = Date.now();
                user.save();
              }
            }
          });
        }
      }
    });
  });
  //also save chat message
  //performance should be fine because of low volume, but look into concurrent saves
  socket.on("chat-msg", (data) => {
    if(!data) return;
    Chats.findById(socket.chatId).populate("participants", "_id email").exec((err, chat) => {
      var newMessage = {
        message: data,
        sender: userId,
        timestamp: new Date(),
      }
      chat.chatHistory.push(newMessage);
      chat.save();

      //email, currently disabled in favor of daily notifications
      /*
      for(var user of chat.participants) {
        if(user._id == userId) continue;

        const mailOptions = {
          from: 'TutoPoint Accounts <auth@tutopoint.com>',
          to: user.email.toString(),
          subject: 'New chat message',
          text: 'You received a new chat message:\n\n' + data,
        };
        transporter.sendMail(mailOptions, function(err) {

        });
      }
      */

      io.to("chat-" + socket.chatId).emit("chat-msg", newMessage);
    });
  });


  //old call code
  /*
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
  */
});

async function sessionFinished(sessionid) {
  console.log("sessionFinished called");
  Sessions.findById(sessionid)
      .then((session) => {
        console.log("logged from sessionFinished, session has been found");
        if (session.completed) {
          console.log("logged from sessionFinished, session.completed is true, returning");
          return redis.DEL([sessionid, `shadow:${sessionid}`]);
        }
        if (!session.completed) {
          session.completed = true;
        }
        session.save();

        console.log("logged from sessionFinished, session.completed was false and is now true");

        redis.get(sessionid, function(err, reply) {
          console.log("logged from sessionFinished, redis.get sessionid found a session")
          if (err) return console.log(err);
          if (!reply) return;

          const room = JSON.parse(reply);
          const callStart = new Date(room['callStart']);
          const callEnd = new Date(room['callEnd']);

          const diff = (callEnd.valueOf() - callStart.valueOf()) / 1000 / 60 - trialTime; // Turns into minutes.
          if (diff < 0) return redis.DEL([sessionid, `shadow:${sessionid}`]);

          redis.DEL([sessionid, `shadow:${sessionid}`]);

        });
      }).catch((e) => console.log('Session doesn\'t exist!'));
}

subscriber.subscribe('__keyevent@0__:expired');

subscriber.on('message', function(_channel, message) {
  console.log("subscriber.on message called");

  const noActivityTimeout = 1000 * 60 * 5;
  const sessionid = message.split(':')[1];

  redis.get(sessionid, function(err, data) {
    console.log("from subscriber.on message, redis.get sessionid successful");
    if (err) return console.log(err);
    if (!data) return;

    const room = JSON.parse(data);
    const callStart = new Date(room['callStart']);
    const lastSeenClient = new Date(room['lastSeenClient']);

    if (!callStart) {
      // Ignore, session will be deleted.
    }

    if (room['callEnd']) {
      console.log("from subscriber.on message, room[callEnd] is true, will call sessionFinished");
      io.to(sessionid).emit('event', {type: 'callEnd'});
      sessionFinished(sessionid);
    }
    // Calculate room activity based on client
    else if (
      Date.now() - lastSeenClient.valueOf() > noActivityTimeout &&
      !room['guidePresent']
    ) {
      console.log(Date.now() - lastSeenClient.valueOf());
      room['callEnd'] = Date.now();
      redis.set(sessionid, JSON.stringify(room), function(err, _) {
        console.log("from subscriber.on message, room[callEnd] wasn't true but other criteria met, will call sessionFinished");
        sessionFinished(sessionid);
      });
    } else {
      console.log('ping activity');

      io.to(sessionid).emit('activityPing');

      redis.setex(`shadow:${sessionid}`, refreshTTL, '');
    }
  });
});


//send email notifs every day
nodeSchedule.scheduleJob('0 0 0 * * *', function() {
  console.log("sending chat notifs");
  Users.find({chatNotifs: true}).populate("chats.chat").populate("chats.chat.participant", "name").exec((err, users) => {
    //for each user, send an email
    for(let user of users) {
      let unreadMessagesCount = 0;
      //for each chat, construct the email text, and add these together to form the final email
      for(let chatTemp of user.chats) {

        let chatHistory = chatTemp.chat.chatHistory;
        let lastRead = chatTemp.lastRead;
        let participants = chatTemp.chat.participants;

        //find all messages with timestamp greater than lastread
        //stupid O(n) iteration and then sort the result
        let unreadHistory = [];
        for(let i = 0;i<chatHistory.length;i++) {
          if(chatHistory[i].timestamp.getTime() > lastRead.getTime()) {
            unreadHistory.push(chatHistory[i]);
            unreadMessagesCount++;
          }
        }
        unreadHistory.sort();
      }
      if(unreadMessagesCount > 0) {
        const mailOptions = {
          from: "TutoPoint <auth@tutopoint.com>",
          to: user.email,
          subject: "[TutoPoint] " + unreadMessagesCount + " new chat message(s)",
          text: "Hello,\n\nYou have " + unreadMessagesCount + " unread chat messages. You can " +
          "read these at https://tutopoint.com/dashboard/upcoming.\n" +
          "You can turn off these notifications from " + "https://tutopoint.com/profile.\n\n" +
          "Best, TutoPoint LLC."
        };
        transporter.sendMail(mailOptions, function(err, info) {
          if (err) console.log(err);
        });
      }
    }
  });
});
