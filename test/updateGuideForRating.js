/*
Adds "comments" to guide
*/

const Guides = require('../models/model.js').Guides;

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/TutoPoint');

Guides.findByIdAndUpdate("5e46305c5e66bf4d18db4858", {comments: []}, {new: true}, function(err, guide) {
  if(err) console.log(err);
  console.log("-------------");
  console.log(guide);
  console.log("-------------");
});
