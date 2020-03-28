const express = require('express');
const totem = require('totemize');
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

Referral.get('/create', auth.loggedIn, function(req, res) {
  const referralCode = totem({adjectives: [''], separator: Math.ceil(Math.random() * 999)});

  const ref = new Referrals({referrer: req.user.id, code: referralCode});
  ref.save()
      .then((refcode) => res.json({message: 'ok'}))
      .catch((err) => {
        if (err.code == 11000) {
          res.status(400).json({error: 'Invalid Referral Code'});
        } else {
          res.status(400).json({error: 'Invalid Referral Code'});
        }
      });
});

module.exports = Referral;
