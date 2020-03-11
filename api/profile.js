const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');

router.use(auth.loggedIn);

router.get('/', function(req, res) {
  res.json(req.user.toJSON());
});


module.exports = router;