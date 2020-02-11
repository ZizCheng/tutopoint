const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');
const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);

router.use(auth.loggedIn);
router.use(auth.ensureUserIsClient);

router.get('/', function(req, res) {
  res.render('userPay', {layout: false, guideid: req.params.id});
});


router.post('/', async function(req, res) {
  const token = req.body.stripeToken;

  stripe.charges.create({
    amount: 1500,
    currency: 'usd',
    customer: req.user.stripeCustomerId,
    source: token,
    capture: true,
  },
  function(err, charge) {
    if (err) console.log(err);
    res.send('success');
  },
  );
});

router.post('/save/:token', function(req, res) {
  const stripeid = req.user.stripeCustomerId;
  const tok = req.params.token;
  stripe.customers.createSource(
      stripeid,
      {source: tok},
      function(err, card) {
        // asynchronously called
        if (err) next(err);
        res.send('Payment method added. Redirect to pay or something');
      },
  );
});

module.exports = router;
