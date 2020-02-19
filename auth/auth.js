const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const mailAuth = require('../secret.js').mailAuth;

const Users = require('../models/model.js').Users;
const Clients = require('../models/model.js').Clients;
const Guides = require('../models/model.js').Guides;
const Referrals = require('../models/model.js').Referrals;
const VerifyToken = require('../models/model.js').VerifyToken;

authConfig = {
  salt: 2,
};

// TODO: Redo with explicity querying for the __password__
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


function redirectToStripeOnboarding(stripeid, req, res) {
  stripe.accountLinks.create(
      {
        account: stripeid,
        failure_url: 'https://tutopoint.com/error',
        success_url: 'https://tutopoint.com/dashboard',
        type: 'custom_account_verification',
        collect: 'currently_due',
      },
      function(err, accountLink) {
        if (err) return next(err);
        res.redirect(accountLink.url);
      },
  );
}

exports.userIsVerified = function(req, res, next) {
  if (req.user.__t == 'clients') {
    console.log(req.user.isVerified);
    if (!req.user.isVerified) {
      res.redirect('/awaitVerification');
    } else {
      next();
    }
  } else next();
};

exports.guideHasOnboarded = function(req, res) {
  if (req.user.__t == 'guides') {
    const stripeid = req.user.stripeAccountId;
    stripe.accounts.retrieve(
        stripeid,
        function(err, account) {
          console.log(account.requirements);
          if (account.requirements.currently_due.includes('external_account') || account.requirements.eventually_due.includes('external_account')) {
            res.redirect('/bank/addbank');
          } else if (account.requirements.disabled_reason != null) {
            redirectToStripeOnboarding(stripeid, req, res);
          } else {
            req.user.onboarded = true;
            req.user.save()
                .then(() => res.redirect('/dashboard'))
                .catch((err) => res.send('error'));
          }
        },
    );
  } else {
    res.redirect('/dashboard');
  }
};

function handleReferral(client, referralCode) {
  return new Promise(function(resolve, reject) {
    if (referralCode == '') {
      resolve(client);
      return;
    }
    Referrals.find({code: referralCode})
        .then((ref) => {
          ref.referred.push(client.id);
          ref.save()
              .then((ref) => {
                client.referredBy = ref.id;
                client.save()
                    .then((user) => resolve(user))
                    .catch((err) => reject(new Error('Database error.')));
              })
              .catch((err) => reject(new Error('Database Error')));
        })
        .catch((err) => resolve(client));
  });
}

function mailToken(user) {
  const token = new VerifyToken({for: user._id, token: crypto.randomBytes(16).toString('hex')});
  token.save(function(err) {
    if (err) {
      return;
    }

    // Send the email
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: mailAuth,
    });
    const mailOptions = {
      from: 'tutopointauth@gmail.com',
      to: user.email.toString(),
      subject: 'NO REPLY Confirm TutoPoint Email Address',
      text: `Hello\n\n Please verify your account by clicking the link: https://tutopoint.com/verify/${token.token}\n\n`,
    };
    transporter.sendMail(mailOptions, function(err) {
      if (err) {
        console.log(err);
      } else {
        console.log('yippy');
      }
    });
  });
}

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
      user.save(function(err, user) {
        if (err) {
          if (err.code == 11000) {
            res.render('signup', {layout: false, emailError: 'Email already exists.', referralCode: req.body.referralCode});
          } else {
            res.render('signup', {layout: false, error: 'Please make sure all fields are filled.', referralCode: req.body.referralCode});
          }
          return;
        }
        stripe.customers.create(
            {
              email: req.body.email,
              name: req.body.name,
            },
            function(err, customer) {
              if (err) return next(err);
              user.stripeCustomerId = customer.id;
              user.save()
                  .then((user) => handleReferral(user, req.body.referralCode))
                  .then(() => req.login(user, function() {
                    next();
                  }))
                  .then(() => mailToken(user))
                  .catch((err) => {
                    if (err.message == 'Cannot find referer') {
                      res.render('signup', {layout: false, error: 'Referer Code invalid'});
                    } else {
                      next(err);
                    }
                  });
            },
        );
      });
    } else if (req.body.userType == 'guide') {
      res.redirect('/apply');
    } else res.send('Error occurred');
  });
};

exports.ensureUserIsGuide = function(req, res, next) {
  if (req.user.__t == 'guides') {
    next();
  } else {
    res.redirect('/dashboard');
  }
};

exports.ensureUserIsClient = function(req, res, next) {
  if (req.user.__t == 'clients') {
    next();
  } else {
    res.redirect('/dashboard');
  }
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
      .populate('ratedSessions')
      .populate('documents')
      .exec(function(err, user) {
        cb(err, user);
      });
};
