
const mongoose = require('mongoose');

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

mongoose.connect('mongodb://localhost:27017/TutoPoint');

bcrypt.hash("123456", 10, (err, hash) => {
  const userInfo = {
    name: "Test Guide",
    password: hash,
    email: "zizcheng@berkeley.edu",
    university: "UC Berkeley",
    grade: "Freshman",
    major: "CS",
    isVerified: true, //for testing
  };

  testUser = new Guides(userInfo);
  console.log(testUser);
  testUser.save(function(err, user) {
    stripe.accounts.create(
        {
          type: 'custom',
          country: 'US',
          email: "zizcheng@berkeley.edu",
          business_type: 'individual',
          requested_capabilities: [
            'card_payments',
            'transfers',
          ],
        },
        function(err, account) {
          user.stripeAccountId = account.id.toString();
        },
    );
  });
});
