const Schedule = require("./scripts/schedule.js");
const Users = require("./models/model.js").Users;
const Guides = require("./models/model.js").Guides;

const databaseCredentials = require('./secret.js').databaseCredentials;

const mongoose = require('mongoose');
mongoose.connect(databaseCredentials.url, {useNewUrlParser: true});


Guides.find({}, function(err, users) {
  users.forEach(function(user) {
    Schedule.removeOutdatedTimes(user.schedule);
    user.markModified("schedule");
    user.save();
  })
})
