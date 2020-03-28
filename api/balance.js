const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');

const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);

router.use(auth.loggedIn);

router.post('/pay', function(req, res) {
  const token = req.body.token;
  const userid = req.user.stripeCustomerId;
  const amount = req.body.amount * 100;
  const save = req.body.save;

  const cardInfo = {
    amount: amount,
    currency: 'usd',
    customer: userid,
    source: token,
    capture: true,
  };

  save ? true : (delete cardInfo['customer']);

  stripe.charges.create(cardInfo,
      function(err, charge) {
        if (err) res.status(400).json({error: 'Transaction error.'});
        stripe.customers.createBalanceTransaction(
            req.user.stripeCustomerId,
            {amount: -charge.amount, currency: 'usd', description: 'Session refill.'},
            async function(err, customer) {
              if (err) res.status(400).json({error: 'Transaction error.'});
              const transactions = await stripe.customers.listBalanceTransactions(req.user['stripeCustomerId'], {limit: 10});
              customer['transactions'] = transactions;
              res.json(customer);
            },
        );
      },
  );
});


module.exports = router;
