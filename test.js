const Schedule = require("./scripts/schedule.js");
const Users = require("./models/model.js").Users;
const Guides = require("./models/model.js").Guides;
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/TutoPoint');

var schedule = [
  [time(4,0), time(5,0)],
  [time(7,30), time(8,30)]
];

Schedule.queryByDate([time(4,30),time(4,45)],Guides,function(res){
  console.log(res)
});





function time(hour, min)
{
  return new Date(2020, 1, 23, hour, min);
}
