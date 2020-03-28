const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');

const Session = require('../scripts/session.js');
const Guides = require('../models/model.js').Guides;
const Sessions = require('../models/model.js').Sessions;

const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);

router.use(auth.loggedIn);


router.get('/list', auth.loggedIn, function(req, res) {
  res.json(req.user.sessions);
});
router.post('/request', auth.loggedIn, auth.ensureUserIsClient, async function(req, res) {
  const stripeData = await stripe.customers.retrieve(req.user['stripeCustomerId']);
  const balance = stripeData.balance * -1 / 100;
  if (balance < 15) {
    return res.status(401).json({error: 'Not enough money', code: 15});
  } else {
    Guides.findById(req.body.guideId).exec(function(err, guide) {
      Session.requestSession(req.user, guide, new Date(req.body.date))
          .then(() => {
            res.json({message: 'ok'});
          })
          .catch((err) => {
            console.log(err); res.json(err);
          });
    });
  }
});
router.get('/confirm/:id', auth.loggedIn, auth.ensureUserIsGuide, function(req, res) {
  Sessions.findById(req.params.id, function(err, session) {
    if (err) {
      console.log(err);
    }
    Session.confirmSession(session)
        .then(() => {
          res.json({message: 'ok'});
        })
        .catch(() => {
          res.status(400).json({message: 'error'});
        });
  });
});
router.get('/cancel/:id', auth.loggedIn, auth.ensureUserIsClient, function(req, res) {
  Sessions
      .findById(req.params.id)
      .populate('createdBy')
      .then((session) => Session.cancelSession(session))
      .then(() => res.json({message: 'ok'}))
      .catch((err) => {
        console.log(
            err,
        ); res.status(400).json({message: 'error'});
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
          res.status(400).json({message: 'session has not ended'});
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
            res.json({message: 'ok'});
          });
        }
      });
    }
  }
});
router.post('/comment', auth.loggedIn, auth.ensureUserIsClient, function(req, res) {
  const sessionId = req.body.sessionId;

  // basically req.user.sessions.includes
  const sessionInsideSessions = req.user.sessions.some(function(session) {
    return session._id == sessionId;
  });
  const sessionInsideCommentedSessions = req.user.commentedSessions.some(function(session) {
    return session._id == sessionId;
  });

  if (sessionInsideSessions && !sessionInsideCommentedSessions) {
    const comment = req.body.comment; // make sure rating is int
    Sessions.findById(sessionId, function(err, session) {
      Guides.findById(session.createdBy, function(err, guide) {
        console.log(guide);
        guide.comments.push(comment);
        guide.markModified('comments');
        guide.save();
        req.user.commentedSessions.push(session);
        req.user.markModified('commentedSessions');
        req.user.save();
        res.json({message: 'ok'});
      });
    });
  }
});


module.exports = router;
