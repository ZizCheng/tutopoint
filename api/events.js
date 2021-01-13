const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');
const Events = require('../models/model.js').Events;

router.use(auth.loggedIn);


router.get('/', function(req, res){
   Events.find({completed: false}).then((allEvents) => {
        res.json({events: allEvents});

    })
    .catch(() => {
        res.json({err: "Events failed."});
    })
})

router.post('/rsvp', auth.loggedIn, auth.ensureUserIsClient, function(req, res) {
  
    Events.findById(req.body.eventID).exec(function(err, event) {
        event.clients.push(req.body.clientID);
        event.save();
      })
})

module.exports = router;