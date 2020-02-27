const Schedule = require("./scripts/schedule.js");
const Users = require("./models/model.js").Users;
const Guides = require("./models/model.js").Guides;
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/TutoPoint');



console.log("qwer");

Guides.findById("5e46305c5e66bf4d18db4858", function(err, guide) {
  console.log(guide);
  Schedule.makeScheduleHourly(guide.schedule);
  guide.markModified("schedule");
  guide.save();
});





function time(hour, min)
{
  return new Date(2020, 1, 23, hour, min);
}
