const express = require('express');
const Referral = new express.Router();
const auth = require('../auth/auth.js');
const Referrals = require('../models/model.js').Referrals;

Referral.use(auth.loggedIn);

Referral.get('/', function(req, res) {
  const profile = req.user.toJSON();
  Referrals
      .findOne({referrer: profile['_id']})
      .select('_id code referred')
      .then((Referral) => res.json(JSON.parse(JSON.stringify(Referral))))
      .catch((err) => {
        console.log(err); res.send('Internal Server Error.');
      });
});

module.exports = Referral;
