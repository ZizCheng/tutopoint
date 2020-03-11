const express = require('express');
const discover = new express.Router();
const auth = require('../auth/auth.js');
const Guides = require('../models/model.js').Guides;

discover.use(auth.loggedIn);
discover.use(auth.ensureUserIsClient);


discover.get('/', function(req, res) {
  Guides
      .find({})
      .select('_id name university major grade university profilePic backdrop')
      .then((listOfGuides) => res.json(JSON.parse(JSON.stringify(listOfGuides))))
      .catch((err) => console.log(err));
});


module.exports = discover;