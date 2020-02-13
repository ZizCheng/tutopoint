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
      .select('name university major grade')
      .then((guide) => res.render('discoverUser', {guide: JSON.parse(JSON.stringify(guide)), layout: false}))
      .catch((err) => next(err));
});

function qwer(){
  console.log("qwer");
}

//search by date
discover.post('/date', function(req,res) {
  var date = new Date(req.body.date);
  Guides
    .find({})
    .exec(function(err, guides) {
      //get all guides with date available
      var ret = [];
      for(var i = 0;i<guides.length;i++) {
        var guide = guides[i];
        if(Schedule.dateAvailable(date, guide.schedule)) {
          //push the guides name, university, major, and grade
          //equivalent to .select('name university major grade') but
          ret.push({
            _id: guide._id,
            name: guide.name,
          });
        }
      }
      res.render('discover', {guides: JSON.parse(JSON.stringify(ret)), layout: false})
    });
});

module.exports = discover;
