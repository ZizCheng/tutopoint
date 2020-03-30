const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');

const scheduleAPI = require('../scripts/schedule.js');

const Users = require('../models/model.js').Users;

const fs = require('fs');

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

  for (var i = 0; i < req.body.schedule.length; i++) {
    req.body.schedule[i].start = new Date(req.body.schedule[i].start);
    req.body.schedule[i].end = new Date(req.body.schedule[i].end);
  }

  //checked to make sure booked times match
  //should always match unless user is trying to hack
  var prevBookedTimes = scheduleAPI.listBookedTimes(req.user.schedule);
  var newBookedTimes = scheduleAPI.listBookedTimes(req.body.schedule);
  console.log(prevBookedTimes);
  console.log(newBookedTimes);
  if (prevBookedTimes.length != newBookedTimes.length) {
    res.send('booked times don\'t match');
    return;
  }
  for (var i = 0; i < prevBookedTimes.length; ++i) {
    if (prevBookedTimes[i].getTime() !== newBookedTimes[i].getTime()) {
      res.send('booked times don\'t match');
      return;
    }
  }


  req.user.schedule = req.body.schedule;
  req.user.save(function(err) {
    if(err) console.log(err);
  });
  res.send('success');
});

router.get('/:id', function(req, res) {
  Users.findById(req.params.id).exec(function(user) {
    if (!user) res.send('user doesn\'t exist');
    else if (!user.schedule) res.send('user\'s schedule doesn\'t exist');
    else res.send(user.schedule);
  });
});

function print2dArr(more, arr) {
  var output = "";
  for(var i = 0;i<arr.length;i++) {
    output += "[";
    for(var j = 0;j<arr[i].length;j++) {
      output += arr[i][j];
      if(j != arr[i].length-1) output += ", ";
    }
    output += "], ";
  }
  return output;
  console.log(more + "[" + output + "]")
}

module.exports = router;
