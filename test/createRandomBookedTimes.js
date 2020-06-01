const mongoose = require('mongoose');

const Guides = require('../models/model.js').Guides;

const Schedule = require('../scripts/schedule.js');

mongoose.connect('mongodb://localhost:27017/TutoPoint');

//PST 9 AM to 9 PM
//UTC 4 PM to 4 AM


//create 4-6 booked times for each guide randomly spread out
Guides.findOne({}, function(err, user) {
  console.log(user.email);

  //determine number of random times [4,6]
  var numFakes = Math.floor(Math.random() * 3) + 4;
  console.log("numfakes: " + numFakes);

  //determine number of days
  var firstDay = roundDownDay(user.schedule[0].start);
  var lastDay = roundDownDay(user.schedule[schedule.length - 1].start);
  var numDays = (firstDay.getTime() - lastDay.getTime())/(24*60*60*1000);
  console.log("firstDay: " + firstDay);
  console.log("numDays: " + numDays);

  for(var i = 0;i<numFakes;i++) {
    //choose random day
    var randomDayNum = Math.floor(Math.random() * numDays);
    var randomDay = new Date(firstDay.getTime() + randomDayNum * (24*60*60*1000));
    console.log("randomDay: " + randomDay);
    //generate random time
    var randomTime = createRandomTime(randomDay)
    //if time is not already in schedule (available or booked)
    if(Schedule.findDate(randomTime) === -1) {
      //book a random time for that day
      Schedule.bookDate(randomTime,user.schedule);
    }
  }
});

console.log(roundDownDay(new Date()));
console.log(createRandomTime(roundDownDay(new Date())));

function createRandomTime(day) {
  //                           4 PM UST         + random number of hours between 0 and 11
  return new Date(day.getTime() + 16*1000*60*60 + Math.floor(Math.random()*12) * (1000*60*60));
}
function roundDownDay(date) {
  var nearestDay = new Date();
  nearestDay.setTime(Math.floor(date.getTime()/(1000*60*60*24)) * (1000*60*60*24));
  return nearestDay;
}
