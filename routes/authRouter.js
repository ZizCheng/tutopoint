const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');

router.get('/login', function(req, res) {
  res.render('login', {
    layout: false,
  });
});
router.post('/login', auth.authenticateUser, function(req, res) {
  res.redirect('/dashboard');
});

router.get('/dashboard', auth.loggedIn, function(req, res) {
  res.render('dashboard', {
    sessions: JSON.parse(JSON.stringify(req.user.sessions)),
    documents: JSON.parse(JSON.stringify(req.user.documents)),
    layout: false,
  });
});
router.post('/signup', auth.newUser, (req, res) => {
  res.redirect('/dashboard');
});
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

module.exports = router;
