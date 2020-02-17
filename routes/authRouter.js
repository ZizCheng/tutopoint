const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');

const Token = require('../models/model.js').VerifyToken;
const Users = require('../models/model.js').Users;
const Referrals = require('../models/model.js').Referrals;

const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);

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

router.post('/login', auth.authenticateUser, auth.userIsVerified, function(req, res) {
  res.redirect('/dashboard');
});

router.get('/dashboard', auth.loggedIn, auth.userIsVerified, function(req, res) {
  if (req.user.__t == 'clients') {
    stripe.customers.retrieve(
        req.user.stripeCustomerId,
        function(err, customer) {
          res.render('dashboard-user', {
            sessions: JSON.parse(JSON.stringify(req.user.sessions)),
            documents: JSON.parse(JSON.stringify(req.user.documents)),
            customerBalance: (customer.balance / 100) * -1,
            layout: false,
          });
        },
    );
  } else if (req.user.__t == 'guides') {
    res.render('dashboard-guide', {
      sessions: JSON.parse(JSON.stringify(req.user.sessions)),
      documents: JSON.parse(JSON.stringify(req.user.documents)),
      layout: false,
    });
  }
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

router.get('/referral/create/:name', auth.loggedIn, function(req, res) {
  const referralCode = req.params.name;

  const ref = new Referrals({referrer: req.user.id, code: referralCode});
  ref.save()
      .then(() => res.render('referralCode', {layout: false, code: referralCode}))
      .catch((err) => res.status(500).send('Internal Server Error'));
});


module.exports = router;
