const Schedule = require("./scripts/schedule.js");
const Users = require("./models/model.js").Users;
const Guides = require("./models/model.js").Guides;

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/TutoPoint');

const awsS3 = require('./secret.js').aws_s3;
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: awsS3['accessKeyId'],
  secretAccessKey: awsS3['secretAccessKey'],
});

const bucketParams = {
  Bucket: "tutopoint-doc-bucket",
};
const doc0Params = {
  Bucket: "tutopoint-doc-bucket",
  Key: "s3_test.txt",
};

s3.getObject(doc0Params).createReadStream().on('data', function(data) {
  console.log("Got data:", data.toString());
});





/*
//sample usage of Schedule
const date1 = time(8, 0); //    3/23/2020 8:00 AM
const date2 = time(14, 0); //   3/23/2020 2:00 PM


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
*/
