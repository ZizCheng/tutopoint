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
    Session.requestSession(req.user, guide, new Date(req.body.date))
        .then(() => {
          res.redirect('/dashboard');
        })
        .catch((err) => {
          console.log(err); res.send('Internal Server Error.');
        });
  });
});
router.post('/rate', auth.loggedIn, auth.ensureUserIsClient, function(req, res) {
  const sessionId = req.body.sessionId;

  // basically req.user.sessions.includes
  const sessionInsideSessions = req.user.sessions.some(function(session) {
    return session._id == sessionId;
  });
  const sessionInsideRatedSessions = req.user.ratedSessions.some(function(session) {
    return session._id == sessionId;
  });

  if (sessionInsideSessions && !sessionInsideRatedSessions) {
    const rating = Math.floor(req.body.rating); // make sure rating is int
    if (rating>=0 && rating<5) {
      Sessions.findById(sessionId, function(err, session) {
        const start = session.date.getTime();
        const end = session.dateCompletedAt.getTime();
        if (end == null) {
          res.send('session has not ended');
        } else {
          const weight = Math.ceil((end-start)/(1000*60*15));
          console.log(weight);
          Guides.findById(session.createdBy, function(err, guide) {
            // Similar to
            // guide.ratings[rating] += weight;
            // but marks it as modified. Using ^^^ would not save
            guide.ratings.set(rating, guide.ratings[rating] + weight);
            console.log(guide.ratings);
            guide.save();
            res.send('success');
          });
        }
      });
    }
  }
});


module.exports = router;
