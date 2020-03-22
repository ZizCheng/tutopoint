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

discover.get('/:id/schedule', async function(req, res) {
  try {
    const guides = await Guides
        .findOne({_id: req.params.id})
        .select('schedule');

    const filteredSchedule = guides.schedule.filter((schedule) => {
      const currentSchedule = schedule[1];

      return schedule[1] > Date.now();
    });

    res.json({schedule: filteredSchedule});
  } catch (err) {
    res.status(400).json({message: 'Invalid Guide ID'});
  }
});

discover.post('/', auth.loggedIn, auth.ensureUserIsGuide, function(req, res) {
  req.body.schedule = JSON.parse(req.body.schedule);
  for (let i = 0; i < req.body.schedule.length; i++) {
    req.body.schedule[i][0] = new Date(req.body.schedule[i][0]);
    req.body.schedule[i][1] = new Date(req.body.schedule[i][1]);
  }
  if (Schedule.verify(req.body.schedule)) {
    req.user.schedule = req.body.schedule;
    req.user.save();
    res.send('success');
  } else res.send('fail');
});

module.exports = discover;
