const express = require('express');
const router = new express.Router();
const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);
const Guides = require('../models/model.js').Guides;
const passcode = require('../secret.js').adminAuth.password;
const bcrypt = require('bcrypt');

const ensureAdmin = function(req, res, next) {
  if (req.session.admin == passcode) {
    next();
  } else {
    res.status(500).send('Internal Server Error.');
  }
};


router.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    res.send(err);
  });
  res.redirect('/');
});

router.get('/authenticate/:passcode', function(req, res) {
  const attemptedPasscode = req.params.passcode;
  if (attemptedPasscode == passcode) {
    req.session.admin = passcode;
    res.redirect('/admin');
  } else {
    res.redirect('/');
  }
});

router.get('/', ensureAdmin, function(req, res) {
  res.send('success');
});

router.get('/guide/register', ensureAdmin, function(req, res) {
  res.render('adminGuideRegister', {layout: false});
});


router.post('/guide/register', ensureAdmin, function(req, res, next) {
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    const userInfo = {
      name: req.body.name,
      password: hash,
      email: req.body.email,
      university: req.body.university,
      grade: req.body.grade,
      major: req.body.major,
    };

    user = new Guides(userInfo);
    console.log(user);
    user.save(function(err, user) {
      if (err) return next(err);
      stripe.accounts.create(
          {
            type: 'custom',
            country: 'US',
            email: req.body.email,
            business_type: 'individual',
            requested_capabilities: [
              'card_payments',
              'transfers',
            ],
          },
          function(err, account) {
            if (err) return next(err);
            user.stripeAccountId = account.id.toString();
            user.save(function(err, user) {
              if (err) next(err);
              res.send(`Success:
                  email: ${req.body.email},
                  password: ${req.body.password}
                  `);
            });
          },

      );
    });
  });
});

module.exports = router;
