const Users = require('../models/model.js').Users;
const Sessions = require('../models/model.js').Sessions;

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/TutoPoint');

Users.findById("5e462ce7ec7d815b1099aa7b", function(err, client) {
  Users.findById("5e46305c5e66bf4d18db4858", function(err, guide) {
    var newSession = new Sessions({
      title: "Test Session",
      createdBy: guide,
      clients: [client],
      date: new Date(2020, 2, 17, 12, 2),
      confirmed: true,
      completed: true,
      dateCompletedAt: new Date(2020, 2, 17, 12, 43),
    });
    newSession.save(function(err){
      if(err) console.log(err);
      client.sessions.push(newSession);
      client.save();
      guide.sessions.push(newSession);
      guide.save();
    });
  });
});
