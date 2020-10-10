const express = require('express');
const discover = new express.Router();
const auth = require('../auth/auth.js');
const Guides = require('../models/model.js').Guides;

discover.use(auth.loggedIn);
discover.use(auth.ensureUserIsClient);

discover.get('/page/:pagenumber', async function(req, res) {

  const pagenumber = parseInt(req.params.pagenumber);
  if (!Number.isInteger(pagenumber)) {
    return res.status(400).json({error: 'Invalid Page Number'});
  }

  const skip = (pagenumber - 1) * 12;

  //"old" code commented out below
  //not the original version, bug has already been fixed by querying all the guides after skip
  /*
  //gets a js object query with query[0].count = # elements, query[0].data = guides' data
  //gets all, pruning/skipping happens later
  const query = await Guides.aggregate([
    {
      $facet: {
        stage1: [{$match: {'onboarded': true}}, {$group: {_id: null, count: {$sum: 1}}}],

        stage2: [{$match: {'onboarded': true}},
        {$project: {'backdrop': true, 'bio': true, 'email': true, 'grade': true, 'language': true, 'logo': true,
            'major': true, 'name': true, 'profilePic': true, 'ratings': true, 'university': true, 'freeFirstSession': true, 'schedule': true}}],

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

  //filter out guides with no times in the future
  //guides with no available times will still appear if they have a booked time in the future
  for(var i = 0;i<query[0].data.length;i++) {
    var schedule = query[0].data[i].schedule;
    if(schedule.length === 0 || schedule[schedule.length-1].start.getTime() < Date.now()) {
      query[0].data.splice(i,1);
      i--;
    }
  }

  //prune it down to first 12 guides
  var prunedGuides = {
    count: query[0].data.length,
    data: [],
  }
  for(var i = 0;i<Math.min(12,query[0].data.length-skip);i++) {
    prunedGuides.data[i] = query[0].data[i+skip];
  }


  res.json(prunedGuides);
  */

  //new code: query all guides, skip/limit later
  Guides.find({onboarded: true})
    .select("backdrop bio email grade language logo major name profilePic ratings university freeFirstSession schedule")
    .exec(function(err, guides) {
      //filter out guides with no times in the future
      //guides with no available times will still appear if they have a booked time in the future
      for(var i = 0;i<guides.length;i++) {
        var schedule = guides[i].schedule;
        if(schedule.length === 0 || schedule[schedule.length-1].start.getTime() < Date.now()) {
          guides.splice(i,1);
          i--;
        }
      }

      //prune it down to first 12 guides
      var prunedGuides = {
        count: guides.length,
        data: [],
      }
      for(var i = 0;i<Math.min(12,guides.length-skip);i++) {
        prunedGuides.data[i] = guides[i+skip];
      }

      res.json(prunedGuides);
    });

});

discover.get('/:id', function(req, res) {
  Guides.findOne({_id: req.params.id})
      .select(
          '_id name university major grade university profilePic backdrop logo bio ratings schedule freeFirstSession',
      )
      .then((guide) => res.json(JSON.parse(JSON.stringify(guide))))
      .catch((err) => {
        console.log(err);
        res.send('Internal Server Error.');
      });
});

discover.get('/:id/reviews', function(req, res) {
  Guides.findOne({_id: req.params.id})
      .select(
          '_id comments',
      )
      .then((guide) => res.json(JSON.parse(JSON.stringify(guide.comments))))
      .catch((err) => {
        console.log(err);
        res.status(400).json({error: "Invalid guide"});
      });
});

discover.get('/:id/schedule', async function(req, res) {
  try {
    const guides = await Guides
        .findById(req.params.id)
        .select('schedule');

    // only get dates that are at most 1 hour behind present
    const filteredSchedule = guides.schedule.filter((schedule) => {
      return schedule.end > Date.now();
    });

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
