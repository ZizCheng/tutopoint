const express = require('express');
const discover = new express.Router();
const auth = require('../auth/auth.js');
const Guides = require('../models/model.js').Guides;

// discover.use(auth.loggedIn);
// discover.use(auth.ensureUserIsClient);

discover.get('/page/:pagenumber', async function(req, res) {
  const pagenumber = parseInt(req.params.pagenumber);
  if (!Number.isInteger(pagenumber)) {
    return res.status(400).json({error: 'Invalid Page Number'});
  }

  const skip = (pagenumber - 1) * 12;

  const query = await Guides.aggregate([
    {
      $facet: {
        stage1: [{$group: {_id: null, count: {$sum: 1}}}],

        stage2: [{$skip: skip}, {$limit: 12}, {$project: {'sessions': 0, 'schedule': 0, 'documents': 0, 'password': 0, 'stripeAccountId': 0, 'isVerified': 0, 'onboarded': 0}}],
      },
    },
    {$unwind: '$stage1'},
    {
      $project: {
        count: '$stage1.count',
        data: '$stage2',
      },
    },
  ]);

  res.json(query[0]);
});

discover.get('/:id', function(req, res) {
  stripe.customers.retrieve(req.user.stripeCustomerId, function(err, customer) {
    Guides.findOne({_id: req.params.id})
        .select(
            '_id name university major grade university profilePic backdrop schedule logo bio',
        )
        .slice('schedule', [0, 10])
        .then((guide) => res.json(JSON.parse(JSON.stringify(guide))))
        .catch((err) => {
          console.log(err);
          res.send('Internal Server Error.');
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
