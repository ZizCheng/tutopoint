const Schedule = require("./scripts/schedule.js");
const Users = require("./models/model.js").Users;
const Guides = require("./models/model.js").Guides;

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/TutoPoint');


Guides.find({}, function(err, users) {
  users.forEach(function(user) {
    Schedule.removeOutdatedTimes(user.schedule);
    user.markModified("schedule");
    user.save();
  })
})
