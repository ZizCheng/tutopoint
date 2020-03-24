const Schedule = require("./scripts/schedule.js");
const Users = require("./models/model.js").Users;
const Guides = require("./models/model.js").Guides;
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/TutoPoint');




//sample usage of Schedule
const date1 = time(8, 0); //3/23/2020 8:00 AM
const date2 = time(14, 0); //3/23/2020 2:00 PM


Guides.findOne({}, function(err, user) {
  console.log("Guide: " + user.name);
  console.log("Hourly start times: " + Schedule.listAvailableTimes(user.schedule));

  console.log(Schedule.bookDate(date2, user.schedule));
  user.save();

  console.log(Schedule.dateBooked(date1, user.schedule));
  console.log(Schedule.dateBooked(date2, user.schedule));
});




//shortcut to creating times
//    3/23/2020 HH:MM
function time(hour, min)
{
  return new Date(2020, 2, 23, hour, min);
}
