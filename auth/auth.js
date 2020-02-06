const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const Users = require('../models/model.js').Users;
const Clients = require('../models/model.js').Clients;
const Guides = require('../models/model.js').Guides;

const bcrypt = require('bcrypt');

authConfig = {
  salt: 2,
};

exports.Strategy = (new LocalStrategy(
    {
      usernameField: 'email',
      passwordField: 'password',
    },
    function(email, password, done) {
      Users.findOne({
        email: email,
      }, function(err, user) {
        if (err) return done(err);
        if (!user) return done(null, false);

        bcrypt.compare(password, user.password, function(err, res) {
          if (res) return done(null, user);
          if (err) return done(err);
          if (!res) return done(null, false);
        });
      });
    }));


exports.newUser = function(req, res, next) {
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    if (err) return next(err);
    let user;
    if (req.body.userType == 'client') {
      const userInfo = {
        name: req.body.name,
        password: hash,
        email: req.body.email,
      };
      user = new Clients(userInfo);
    } else if (req.body.userType == 'guide') {
      const userInfo = {
        name: req.body.name,
        password: hash,
        email: req.body.email,
        university: req.body.university,
        grade: req.body.grade,
        major: req.body.major,
      };

      user = new Guides(userInfo);
    } else res.send('Error occurred');


    user.save(function(err, user) {
      if (err) return next(err);
      req.login(user, function() {
        next();
      });
    });
  });
};

exports.loggedIn = function(req, res, next) {
  if (req.isAuthenticated()) {
    next();
  } else {
    res.redirect('/login');
  }
};

const authOptions = {failureRedirect: '/error'};
exports.authenticateUser = passport.authenticate('local', authOptions);

// sets req.doc to the doc in user.documents, NOT doc in Documents
exports.hasDocument = function(req, res, next) {
  if (!req.params.id) res.redirect('/dashboard');
  const doc = req.user.documents.find(function(tempDoc) {
    return tempDoc._id == req.params.id;
  });
  if (!doc) res.redirect('/dashboard');
  else {
    req.doc = doc;
    next();
  }
};

exports.serializeUser = function(user, cb) {
  cb(null, user.id);
};
exports.deserializeUser = function(id, cb) {
  Users.findById(id)
      .populate('sessions')
      .populate('documents')
      .exec(function(err, user) {
        cb(err, user);
      });
};
