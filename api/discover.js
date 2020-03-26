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
  console.log("/:id/schedule recieved request");
  try {
    const guides = await Guides
        .findById(req.params.id)
        .select('schedule');

    //only get dates that are at most 1 hour behind present
    const filteredSchedule = guides.schedule.filter((schedule) => {
      return schedule.end > Date.now();
    });

    console.log("filteredSchedule: " + filteredSchedule);
    res.json(filteredSchedule);
  } catch (err) {
    res.status(400).json({message: 'Invalid Guide ID'});
  }
});

discover.post('/', auth.loggedIn, auth.ensureUserIsGuide, function(req, res) {
  req.body.schedule = JSON.parse(req.body.schedule);
  for (let i = 0; i < req.body.schedule.length; i++) {
    req.body.schedule[i].start = new Date(req.body.schedule[i].start);
    req.body.schedule[i].end = new Date(req.body.schedule[i].end);
  }
  req.user.schedule = req.body.schedule;
  req.user.save();
  res.send('success');
});

module.exports = discover;
