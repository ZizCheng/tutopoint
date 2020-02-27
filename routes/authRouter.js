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
          console.log(JSON.parse(JSON.stringify(req.user.sessions)));
          res.render('dashboard-user', {
            sessions: JSON.parse(JSON.stringify(req.user.sessions)),
            documents: JSON.parse(JSON.stringify(req.user.documents)),
            customerBalance: (customer.balance / 100) * -1,
            layout: false,
          });
        },
    );
  } else if (req.user.__t == 'guides') {
    stripe.balance.retrieve({
      stripe_account: req.user.stripeAccountId,
    }, function(err, balance) {
      res.render('dashboard-guide', {
        sessions: JSON.parse(JSON.stringify(req.user.sessions)),
        documents: JSON.parse(JSON.stringify(req.user.documents)),
        balance: (balance.available[0].amount / 100),
        layout: false,
      });
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

router.post('/referral/create', auth.loggedIn, function(req, res) {
  const referralCode = req.body.code;

  const ref = new Referrals({referrer: req.user.id, code: referralCode});
  ref.save()
      .then(() => res.render('referralCode', {layout: false, code: referralCode, referredLength: 0}))
      .catch((err) => {
        if (err.code == 11000) {
          res.render('createCode', {layout: false, duplicateError: 'That code already exists! Try again.'});
        } else {
          res.send('Internal Server Error');
        }
      });
});

router.get('/referral/create', auth.loggedIn, function(req, res) {
  Referrals.count({referrer: req.user.id})
      .then((count) => {
        if (count > 0) {
          res.render('createCode', {layout: false, cannotCreateError: 'Cannot create more than one referral code'});
        } else {
          res.render('createCode', {layout: false});
        }
      })
      .catch((err) => res.send('Internal Server Error.'));
});

router.get('/referral', auth.loggedIn, function(req, res) {
  Referrals.findOne({referrer: req.user.id})
      .then((ref) => {
        if (ref == null) {
          res.render('createCode', {layout: false});
        } else {
          res.render('referralCode', {layout: false, code: ref.code, referredLength: ref.referred.length});
        }
      })
      .catch((err) => {
        console.log(err);
        if (err.DocumentNotFoundError) {
          res.render('createCode', {layout: false});
        } else {
          res.send('Internal Server Error.');
        }
      });
});


module.exports = router;
