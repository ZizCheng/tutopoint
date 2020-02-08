const express = require('express');
const discover = new express.Router();
const auth = require('../auth/auth.js');
const Guides = require('../models/model.js').Guides;

discover.use(auth.loggedIn);

discover.get('/', function(req, res) {
  Guides
      .find({})
      .select('name')
      .then((listOfGuides) => res.render('discover', {guides: JSON.parse(JSON.stringify(listOfGuides)), layout: false}))
      .catch((err) => next(err));
});

discover.get('/:id', function(req, res) {
  Guides
      .findOne({_id: req.params.id})
      .select('name university major grade')
      .then((guide) => res.render('discoverUser', {guide: JSON.parse(JSON.stringify(guide)), layout: false}))
      .catch((err) => next(err));
});


module.exports = discover;
