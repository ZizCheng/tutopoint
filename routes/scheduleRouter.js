const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');

const Schedule = require('../scripts/schedule.js');

router.get('/', auth.loggedIn, auth.ensureUserIsGuide, function(req, res) {
  const renderOptions =
  {
    schedule: JSON.stringify(req.user.schedule),
    layout: false,
  };
  res.render('schedule', renderOptions);
});

router.post('/', auth.loggedIn, auth.ensureUserIsGuide, function(req, res) {
  req.body.schedule = JSON.parse(req.body.schedule);
  for (let i = 0; i < req.body.schedule.length; i++) {
    for (let j = 0; j < req.body.schedule[i].length; j++) {
      req.body.schedule[i][j] = new Date(req.body.schedule[i][j]);
    }
  }
  if (Schedule.verify(req.body.schedule)) {
    req.user.schedule = req.body.schedule;
    req.user.save();
    res.send('success');
  } else res.send('fail');
});

router.get('/:id', function(req, res) {
  Users.findById(req.params.id).exec(function(user) {
    if (!user) res.send('user doesn\'t exist');
    else if (!user.schedule) res.send('user\'s schedule doesn\'t exist');
    else res.send(user.schedule);
  });
});


module.exports = router;
