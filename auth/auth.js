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
const Referrals = require('../models/model.js').Referrals;
const VerifyToken = require('../models/model.js').VerifyTokens;
const ResetToken = require('../models/model.js').ResetTokens;

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
    Referrals.findOne({code: referralCode})
        .then((ref) => {
          if (ref == null) {
            resolve(client); return;
          }
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
  return new Promise((resolve, reject) =>{
    const token = new VerifyToken({for: user._id, token: crypto.randomBytes(16).toString('hex')});
    token.save(function(err) {
      if (err) {
        reject(err);
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
          reject(err);
        } else {
          console.log('yippy');
          resolve(user);
        }
      });
    });
  });
}

function mailReset(user) {
  return new Promise((resolve, reject) =>{
    const token = new ResetToken({for: user._id, token: crypto.randomBytes(16).toString('hex')});
    token.save(function(err) {
      if (err) {
        reject(err);
      }

      // Send the email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: mailAuth,
      });
      const mailOptions = {
        from: 'tutopointauth@gmail.com',
        to: user.email.toString(),
        subject: 'NO REPLY TutoPoint Password Reset',
        text: `Hello\n\n Please reset your password at this link: https://tutopoint.com/reset/${token.token}\n\n`,
      };
      transporter.sendMail(mailOptions, function(err) {
        if (err) {
          reject(err);
        } else {
          console.log('yippy');
          resolve(user);
        }
      });
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
                  .then(() => mailToken(user))
                  .then(() => req.login(user, function() {
                    next();
                  }))
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

exports.resetUser = function(req, res, next) {
  ResetToken.findOne({token: req.params.token}, function(err, token) {
    if (!token) return res.status(400).send({type: 'not-verified', msg: 'Invalid Password Reset Token.'});

    // If we found a token, find a matching user
    Users.findOne({_id: token.for}, function(err, user) {
      if (!user) return res.status(400).send({msg: 'We were unable to find a user for this token.'});

      // Verify and save the user
      bcrypt.hash(req.body.password, 10, (err, hash) => {
        user.password = hash;
        user.isVerified = true;
        user.save(function(err) {
          if (err) {
            return res.status(500).send({msg: err.message});
          };
          next();
        });
      });
    });
  });
};

exports.reset = function(req, res, next) {
  Users.findOne({email: req.body.email}, function(err, user) {
    if (!user) return res.status(400).send({msg: 'This is not a recognized email'});
    mailReset(user).then(() => next());
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

const authOptions = {failureRedirect: '/login'};
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
      .populate({
        path: 'sessions',
        populate: {
          path: 'createdBy',
          model: 'users',
        },
      })
      .populate('ratedSessions')
      .populate('documents')
      .exec(function(err, user) {
        cb(err, user);
      });
};
