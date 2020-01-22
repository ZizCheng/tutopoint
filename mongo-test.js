
var mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/TutoPoint');
const Users = require("./models/model.js").Users;
const Documents = require("./models/model.js").Documents;

var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', async function() {
  var user = Users.findById(socket.request.session.passport.user).exec(function(err, user){
    console.log(val);
  });
});
