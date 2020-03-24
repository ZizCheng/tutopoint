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
    const stripeBalance = await stripe.balance.retrieve({stripe_account: profile['stripeAccountId']});
    profile['balance'] = stripeBalance.available[0].amount;
    profile['stripe'] = stripeData;
  }
  delete profile['password'];
  delete profile['isVerified'];
  delete profile['stripeCustomerId'];


  res.json(profile);
});


router.get('/closeTutorial', function(req, res) {
  const user = req.user;

  user.tutorialHidden = true;

  user.save()
      .then(() => res.json({message: 'ok'}))
      .catch(() => res.json({error: 'Internal Server Error'}));
});

module.exports = router;
