const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);


const Users = require('../models/model.js').Users;
const Clients = require('../models/model.js').Clients;
const Guides = require('../models/model.js').Guides;

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
        failure_url: 'http://localhost:3000/error',
        success_url: 'http://localhost:3000/dashboard',
        type: 'custom_account_verification',
        collect: 'currently_due',
      },
      function(err, accountLink) {
        if (err) return next(err);
        res.redirect(accountLink.url);
      },
  );
}


exports.guideHasOnboarded = function(req, res, next) {
  if (req.user.__t == 'guides') {
    const stripeid = req.user.stripeAccountId;
    stripe.accounts.retrieve(
        stripeid,
        function(err, account) {
          console.log(account.requirements);
          if (!account.payouts_enabled) {
            res.send('Handle adding bank account');
          } else if (account.requirements.currently_due.length > 0 && account.requirements.eventually_due.length > 0) {
            redirectToStripeOnboarding(stripeid, req, res);
          } else {
            req.user.onboarded = true;
            req.user.save()
                .then(() => next())
                .catch((err) => next(err));
          }
        },
    );
  } else {
    next();
  }
};

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
        if (err) return next(err);
        stripe.customers.create(
            {
              email: req.body.email,
              name: req.body.name,
            },
            function(err, customer) {
              if (err) return next(err);
              user.stripeCustomerId = customer.id;
              user.save()
                  .then(() => req.login(user, function() {
                    next();
                  }))
                  .catch((err) => next(err));
            },
        );
      });
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
                next();
              });
            },

        );
      });
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
      .populate('documents')
      .exec(function(err, user) {
        cb(err, user);
      });
};
