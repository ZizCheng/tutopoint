const express = require('express');
const review = new express.Router();
const auth = require('../auth/auth.js');
const Referrals = require('../models/model.js').Referrals;
const Guides = require('../models/model.js').Guides;

const nodemailer = require('nodemailer');
const mailAuth = require('../secret.js').mailAuth;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: mailAuth,
});

review.use(auth.loggedIn);
review.use(auth.ensureUserIsClient);

review.post('/:id/newreview', function(req, res) {
  stripe.customers.retrieve(req.user.stripeCustomerId, function(err, customer) {
    Guides.findOne({_id: req.params.id})
        .then((guide) => {
          if (req.body.review) {
            guide.comments.push(req.body.review);
            guide.markModified('comments');
          }
          if (req.body.star != -1) {
            guide.ratings.push(req.body.star);
            guide.markModified('ratings');
          }
          guide.save();
          res.send('success');
        })
        .catch((err) => {
          console.log(err);
          res.send('Internal Server Error.');
        });
  });
});

review.post('/refer', function(req, res) {
  const profile = req.user.toJSON();
  Referrals
      .findOne({referrer: profile['_id']})
      .select('code')
      .then((Referral) => {
        const email = req.body.email;
        const name = req.user.name;
        const mailOptions = {
          from: 'TutoPoint <auth@tutopoint.com>',
          to: email,
          subject: '[TutoPoint] Invitation to Join',
          text: 'Hello!\n\n ' +
           name + ' has referred you to use TutoPoint, an online college consulting platform.\n' +
           'TutoPoint connects clients like you with our pool of college student guides, allowing you to ask questions to real time college students.\n' +
           'You can signup at anytime at this link: https://tutopoint.com/signup/' + Referral.code + '\n' +
           'To visit our main page and see our products and services, please go to https://tutopoint.com \n' +
           'For any questions, concerns, or requests, you can email support@tutopoint.com and we will reply within 2 business days.' +
           '\n\nThank you for your interest, we hope to see you using our platform.\n' +
           'Best, TutoPoint LLC.'
        };
        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            console.log('Email sent1');
          }
        });
      })
      .catch((err) => {
        console.log(err); res.send('Internal Server Error.');
      });
});

review.post('/:id/report', function(req, res) {
  Guides.findOne({_id: req.params.id})
      .then((guide) => {
        const name = guide.name;
        const mailOptions = {
          from: 'TutoPoint <auth@tutopoint.com>',
          to: 'zizcheng@berkeley.edu',
          subject: 'REPORT',
          text: 'There has been a new report regarding guide ' + name + ', submitted by ' + req.user.name +
          '. The user reported:\n\n' + req.body.report +
          '\n\nThe client\'s email is ' + req.user.email + '\n' +
          'The guide\'s email is ' + guide.email
        };
        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            console.log('Email sent1');
          }
        });
      })
      .catch((err) => {
        console.log(err);
        res.send('Internal Server Error.');
      });
});


module.exports = review;
