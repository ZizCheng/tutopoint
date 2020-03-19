const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');

const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);

router.use(auth.loggedIn);

router.get('/', async function(req, res) {
  const profile = req.user.toJSON();
  if (profile['__t'] == 'clients') {
    const stripeData = await stripe.customers.retrieve(profile['stripeCustomerId']);
    profile['stripe'] = stripeData;
  } else {
    const stripeData = await stripe.accounts.retrieve(profile['stripeAccountId']);
    profile['stripe'] = stripeData;
  }
  delete profile['password'];
  delete profile['isVerified'];
  delete profile['stripeCustomerId'];


  res.json(profile);
});


module.exports = router;
