const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');
const Token = require('../models/model.js').VerifyToken;
const Users = require('../models/model.js').Users;

router.get('/login', function(req, res) {
  res.render('login', {
    layout: false,
  });
});
router.get('/awaitVerification', function(req, res) {
  res.render('awaitVerification', {
    layout: false,
  });
});

router.get('/verify/:token', function(req, res) {
  Token.findOne({token: req.params.token}, function(err, token) {
    if (!token) return res.status(400).send({type: 'not-verified', msg: 'We were unable to find a valid token. Your token my have expired.'});

    // If we found a token, find a matching user
    Users.findOne({_id: token.for}, function(err, user) {
      if (!user) return res.status(400).send({msg: 'We were unable to find a user for this token.'});
      if (user.isVerified) return res.status(400).send({type: 'already-verified', msg: 'This user has already been verified.'});

      // Verify and save the user
      user.isVerified = true;
      user.save(function(err) {
        if (err) {
          return res.status(500).send({msg: err.message});
        }
        res.redirect('/dashboard');
      });
    });
  });
});

router.post('/login', auth.authenticateUser, auth.guideHasOnboarded, auth.clientIsVerified, function(req, res) {
  res.redirect('/dashboard');
});

router.get('/dashboard', auth.loggedIn, auth.guideHasOnboarded, auth.clientIsVerified, function(req, res) {
  res.render('dashboard', {
    sessions: JSON.parse(JSON.stringify(req.user.sessions)),
    documents: JSON.parse(JSON.stringify(req.user.documents)),
    layout: false,
  });
});
router.get('/signup', (req, res) => {
  const referralCode = req.query.referral;
  res.render('signup', {
    layout: false,
    referralCode,
  });
});
router.post('/signup', auth.newUser, (req, res) => {
  res.redirect('/dashboard');
});
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
