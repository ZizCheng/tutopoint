const express = require('express');
const discover = new express.Router();
const auth = require('../auth/auth.js');
const Guides = require('../models/model.js').Guides;
const Schedule = require('../scripts/schedule.js');
const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);
const moment = require('moment');

discover.use(auth.loggedIn);
discover.use(auth.ensureUserIsClient);


const chunk = (arr, size) =>
  Array.from({length: Math.ceil(arr.length / size)}, (v, i) =>
    arr.slice(i * size, i * size + size),
  );


discover.get('/', function(req, res) {
  Guides
      .find({})
      .select('_id name university major grade university profilePic backdrop')
      .then((listOfGuides) => res.render('discover', {guideChunks: chunk(JSON.parse(JSON.stringify(listOfGuides)), 4), layout: false}))
      .catch((err) => next(err));
});

discover.get('/:id', function(req, res) {
  stripe.customers.retrieve(
      req.user.stripeCustomerId,
      function(err, customer) {
        Guides
            .findOne({_id: req.params.id})
            .select('_id name university major grade university profilePic schedule logo bio')
            .slice('schedule', [0, 10])
            .then((guide) => res.render('discoverUser', {
              guide: JSON.parse(JSON.stringify(guide)),
              schedule: JSON.parse(JSON.stringify(guide.schedule)),
              customerBalance: (customer.balance / 100) * -1,
              layout: false
            }))
            .catch((err) => {
              console.log(err); res.send('Internal Server Error.');
            });
      });
});
discover.get('/:id/rating', function(req, res) {
  Guides.findById(req.params.id, function(err, guide) {
    if (err) res.send(err);
    else res.send(guide.ratings);
  });
});

// search by date
discover.post('/date', function(req, res) {
  const date = new Date(req.body.date);
  Guides
      .find({})
      .exec(function(err, guides) {
      // get all guides with date available
        const ret = [];
        for (let i = 0; i < guides.length; i++) {
          const guide = guides[i];
          if (Schedule.dateAvailable(date, guide.schedule)) {
          // push the guides name, university, major, and grade
          // equivalent to .select('name university major grade') but
            ret.push({
              _id: guide._id,
              name: guide.name,
            });
          }
        }
        res.render('discover', {guides: JSON.parse(JSON.stringify(ret)), layout: false});
      });
});

module.exports = discover;
