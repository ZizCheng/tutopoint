const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');
const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);

router.use(auth.loggedIn);
router.use(auth.ensureUserIsGuide);

router.get('/addbank', function(req, res) {
  res.render('addBank', {layout: false});
});

router.post('/addbank', function(req, res, next) {
  const token = req.body.stripeToken;
  const acctId = req.user.stripeAccountId;
  stripe.accounts.createExternalAccount(
      acctId,
      {
        external_account: token,
      },
      function(err, bankAccount) {
        // asynchronously called
        if (err) next(err);
        res.redirect('/dashboard');
      },
  );
});

module.exports = router;
