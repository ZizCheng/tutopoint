const express = require('express');
const app = express();
var http = require('http').createServer(app);
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const auth = require("./auth/auth.js");
const handlebars  = require('express-handlebars');
const expressSession = require('express-session');
const io = require('socket.io')(http);
const Users = require("./models/model.js").Users;
const Clients = require("./models/model.js").Clients;
const Guides = require("./models/model.js").Guides;
const Sessions = require("./models/model.js").Sessions;
const Documents = require("./models/model.js").Documents;
const session = expressSession({
  secret: '385willneverlovetitor',
  saveUninitialized: true,
  resave: true
});


mongoose.connect('mongodb://localhost:27017/TutoPoint');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session);
app.use(passport.initialize());
app.use(passport.session());

app.engine('handlebars', handlebars());
app.set('view engine', 'handlebars');



const config = {
  port: 3000
};

passport.use(auth.Strategy);
passport.serializeUser(auth.serializeUser);
passport.deserializeUser(auth.deserializeUser);

app.get('/', function(req, res){
  res.sendFile('views/index.html', { root : __dirname});
});
app.get('/login', function(req, res){
  res.sendFile('views/login.html', { root : __dirname});
});
app.get('/dashboard', auth.loggedIn, function(req, res){
  res.render("dashboard", {
    sessions: JSON.parse(JSON.stringify(req.user.sessions)),
    documents:  JSON.parse(JSON.stringify(req.user.documents)),
    information: JSON.parse(JSON.stringify(req.user.information)),
    layout: false
  });
});
app.get('/logout', function(req, res){
  req.logout();
  res.redirect('/');
});

app.get('/session/:id', auth.loggedIn, function(req, res){
  if(!req.params.id) res.redirect("/dashboard")
  res.render("session", {sessionid: req.params.id, layout: false});
});


app.get('/document/:id', auth.loggedIn, auth.hasDocument, function(req, res){
  res.render("document", {doc_text: req.doc.text, doc_id: req.doc._id, layout: false});
});
app.post('/save-document/:id', auth.loggedIn, auth.hasDocument, function(req,res){
  req.doc.text = req.body.text;
  req.doc.save();
  res.send("success");
});
app.get('/create-document', auth.loggedIn, function(req,res){
  var newDoc = new Documents({title: "Untitled Notes", text: "<p>You can take notes here.</p>"});
  newDoc.save(function(err,doc){
    req.user.documents.push(doc._id)
    req.user.populate("documents").save();
    res.redirect("/document/" + newDoc._id);
  });
});
app.get('/edit-information', auth.loggedIn, function(req,res){
  res.sendFile('views/edit-information.html', { root : __dirname});
});

app.get('/test', function(req,res){
  console.log(req.user);
  res.send(req.user);
});

app.post('/signup', auth.newUser, (req, res) => {
  res.redirect('/dashboard');
});
app.post('/login', passport.authenticate('local', { failureRedirect: '/error' }), function(req, res) {
  res.redirect('/dashboard');
});


io.use(function(socket, next){
  // Wrap the express middleware
  session(socket.request, {}, next);
});

io.on('connection', function(socket, req, res){
  if(!socket.request.session.passport){
    socket.emit("forceDisconnect");
    return;
  }
  //join room for private messages
  socket.join(socket.request.session.passport.user);



  socket.on('call', function(){
    console.log("got call")
    Sessions.findById(socket.request._query['session'])
      .exec(function(err, session) {
        if(err) return;
        socket.to(session.createdBy).emit("makeOffer", {
          from: socket.request.session.passport.user
        });
      });
  });
  socket.on("offer", function(data){
    console.log('offer');
    socket.to(data.to).emit("frontAnswer", {
      offer: data.offer,
      from: socket.request.session.passport.user
    });
  });
  socket.on("answer", function(data){
    console.log('answer');
    socket.to(data.to).emit("backAnswer", data.offer)
  });






  socket.on('text change', function(data){
    socket.to('document ' + data.doc_id).emit("text change", data);
  });
  socket.on('join document room', function(doc_id){
    Users.findById(socket.request.session.passport.user).populate("documents").exec(function(err,user){
      var doc = user.documents.find(function(tempDoc){
        return tempDoc._id == doc_id;
      });
      if(!doc) res.redirect("/dashboard");
      else {
        socket.join('document ' + doc_id);
      }
    });
  });
});

http.listen(config.port , function(){
  console.log(`Server listening on :${config.port}`);
});
