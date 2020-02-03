const express = require('express');
const router = express.Router();
const passport = require('passport');
const auth = require("../auth/auth.js");


router.get('/schedule',auth.loggedIn, function(req,res){
  console.log(req.user.schedule);
  res.render("schedule",{schedule: JSON.stringify(req.user.schedule), layout: false});
});
router.get('/get-schedule/:id', function(req,res){
  Users.findById(req.params.id).exec(function(user)
  {
    if(!user) res.send("user doesn't exist");
    else if(!user.schedule) res.send("user's schedule doesn't exist");
    else res.send(user.schedule);
  });
});
router.post('/save-schedule', auth.loggedIn, function(req,res){
  for(var i = 0;i<req.body.schedule.length;i++){
    for(var j = 0;j<req.body.schedule[i].length;j++){
      req.body.schedule[i][j] = new Date(req.body.schedule[i][j]);
    }
  }
  if(Schedule.verify(req.body.schedule))
  {
    req.user.schedule = req.body.schedule;
    req.user.save();
    res.send("success")
  }
  else res.send("fail");
});

module.exports = router;
