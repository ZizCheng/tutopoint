const express = require('express');
const document = new express.Router();
const auth = require('../auth/auth.js');
const Documents = require('../models/model.js').Documents;

document.use(auth.loggedIn);

document.get('/', function(req, res) {
  const profile = req.user.toJSON();
  const ids = profile['documents'];
  const ret = {};
  ids.forEach((id) => {
    Documents
        .findOne({_id: id})
        .select('_id title text')
        .then((Document) => ret.push(Document))
        .catch((err) => {
          console.log(err); res.send('Internal Server Error.');
        });
  });
  res.json(JSON.parse(JSON.stringify(ret)))
});

document.get('/:id', function(req, res) {
  Documents
      .findOne({_id: req.params.id})
      .select('_id title text')
      .then((Document) => res.json(JSON.parse(JSON.stringify(Document))))
      .catch((err) => {
        console.log(err); res.send('Internal Server Error.');
      });
});

module.exports = document;
