const Schedule = require("./scripts/schedule.js");
const Users = require("./models/model.js").Users;
const Guides = require("./models/model.js").Guides;
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/TutoPoint');

var schedule = [
  {start: time(4, 0), end: time(5, 0), status: "available"},
  {start: time(8, 0), end: time(9, 0), status: "available"},
];
Users.findById("5e46644f6c179323d13cf072", function(err, user) {
  user.schedule = schedule;
  user.save(function(err) {
    if(err) console.log(err);
  });
});





function time(hour, min)
{
  return new Date(2020, 3, 23, hour, min);
}
