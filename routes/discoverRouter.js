const express = require('express');
const discover = new express.Router();
const auth = require('../auth/auth.js');
const Guides = require('../models/model.js').Guides;
const Schedule = require('../scripts/schedule.js');

discover.use(auth.loggedIn);
discover.use(auth.ensureUserIsClient);


discover.get('/', function(req, res) {
  Guides
      .find({})
      .select('name')
      .then((listOfGuides) => res.render('discover', {guides: JSON.parse(JSON.stringify(listOfGuides)), layout: false}))
      .catch((err) => next(err));
});

discover.get('/:id', function(req, res) {
  Guides
      .findOne({_id: req.params.id})
      .select('_id name university major grade')
      .then((guide) => res.render('discoverUser', {guide: JSON.parse(JSON.stringify(guide)), layout: false}))
      .catch((err) => next(err));
});

// search by date
discover.post('/date', function(req, res) {
  const date = new Date(req.body.date);
  Guides
      .find({})
      .exec(function(err, guides) {
      // get all guides with date available
        const ret = [];
        for (let i = 0; i<guides.length; i++) {
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
