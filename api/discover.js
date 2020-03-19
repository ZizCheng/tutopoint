const express = require('express');
const discover = new express.Router();
const auth = require('../auth/auth.js');
const Guides = require('../models/model.js').Guides;

discover.use(auth.loggedIn);
discover.use(auth.ensureUserIsClient);


discover.get('/', function(req, res) {
  Guides
      .find({})
      .select('_id name university major grade university profilePic backdrop logo bio')
      .then((listOfGuides) => res.json(JSON.parse(JSON.stringify(listOfGuides))))
      .catch((err) => console.log(err));
});

discover.get('/:id', function(req, res) {
  stripe.customers.retrieve(
      req.user.stripeCustomerId,
      function(err, customer) {
        Guides
            .findOne({_id: req.params.id})
            .select('_id name university major grade university profilePic backdrop schedule logo bio')
            .slice('schedule', [0, 10])
            .then((guide) => res.json(JSON.parse(JSON.stringify(guide))))
            .catch((err) => {
              console.log(err); res.send('Internal Server Error.');
            });
      });
});

discover.get('/:id/schedule', function(req, res) {
  Guides
      .findOne({_id: req.params.id})
      .select('schedule')
      .slice('schedule', [0, 10])
      .then((guide) => res.json(JSON.parse(JSON.stringify(guide))))
      .catch((err) => {
        console.log(err); res.send('Internal Server Error.');
      });
});

module.exports = discover;
