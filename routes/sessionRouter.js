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
router.post('/request', auth.loggedIn, auth.ensureUserIsClient, function(req,res){
  console.log(req.body.date);
  Guides.findById(req.body.guideId).exec(function(err,guide){
    Session.requestSession(req.user, guide, new Date(req.body.date));
  })
});


module.exports = router;
