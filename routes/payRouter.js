const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');
const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);

router.use(auth.loggedIn);
router.use(auth.ensureUserIsClient);

router.get('/addpaymentmethod', function(req, res) {
  res.render('userAddPayment', {layout: false});
});

router.post('/addpaymentmethod', function(req, res, next) {
  const stripeid = req.user.stripeCustomerId;
  const token = req.body.stripeToken;
  stripe.customers.createSource(
      stripeid,
      {source: token},
      function(err, card) {
        // asynchronously called
        if (err) next(err);
        res.send('Payment method added. Redirect to pay or something');
      },
  );
});

router.get('/', function(req, res, next) {
  res.render('userPay', {layout: false});
});

router.post('/', async function(req, res) {
  const token = req.body.source;
  const amount = req.body.CreditAmount * 100;
  stripe.charges.create({
    amount: amount,
    currency: 'usd',
    customer: req.user.stripeCustomerId,
    source: token,
    capture: true,
  },
  function(err, charge) {
    console.log(err);
    if (err) next(err);
    stripe.customers.createBalanceTransaction(
        req.user.stripeCustomerId,
        {amount: -charge.amount, currency: 'usd', description: 'Session refill.'},
        function(err, customer) {
          console.log(err);
          if (err) next(err);
          res.send('success');
        },
    );
  },
  );
});


module.exports = router;
