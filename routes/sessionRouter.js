const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');

const Session = require('../scripts/session.js');

const Users = require('../models/model.js').Users;
const Guides = require('../models/model.js').Guides;
const Sessions = require('../models/model.js').Sessions;


router.get('/list', auth.loggedIn, function(req, res) {
  res.send(req.user.sessions);
});
router.post('/request', auth.loggedIn, auth.ensureUserIsClient, function(req, res) {
  console.log(req.body.date);
  Guides.findById(req.body.guideId).exec(function(err, guide) {
    Session.requestSession(req.user, guide, new Date(req.body.date));
  });
});
router.post('/rate', auth.loggedIn, auth.ensureUserIsClient, function(req,res) {
  var sessionId = req.body.sessionId;
  Sessions.findById(sessionId, function(err, session) {
    if(req.user.sessions.contains(session) && !req.user.ratedSessions.contains(session))
    {
      var rating = req.body.rating;
      if(Number.isInteger(rating) && rating>=0 && rating<5)
      {
        var start = session.date.getTime();
        var end = session.dateCompletedAt.getTime();
        if(end == null) {
          res.send("session has not ended");
        }
        else {
          var weight = Math.ceil((start-end)/(1000*60*15));
          req.user.ratings[rating] += weight;
          req.user.save();
        }
      }
    }
  });
});


module.exports = router;
