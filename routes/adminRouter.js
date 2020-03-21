const express = require('express');
const router = new express.Router();
const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);
const Guides = require('../models/model.js').Guides;
const passcode = require('../secret.js').adminAuth.password;
const bcrypt = require('bcrypt');


const multer = require('multer');
const awsS3 = require('../secret.js').aws_s3;
const multerS3 = require('multer-s3');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: awsS3['accessKeyId'],
  secretAccessKey: awsS3['secretAccessKey'],
});


const upload = multer({
  storage: multerS3({
    s3: s3,
    bucket: 'tutopoint-img-bucket',
    metadata: function(req, file, cb) {
      cb(null, {fieldName: file.fieldname});
    },
    key: function(req, file, cb) {
      cb(null, `${file.fieldname}_${Date.now().toString()}`);
    },
  }),
});

const everything = upload.fields([{name: 'profilePic', maxCount: 1}, {name: 'backdrop', maxCount: 1}, {name: 'logo', maxCount: 1}]);

const ensureAdmin = function(req, res, next) {
  if (req.session.admin == passcode) {
    next();
  } else {
    res.status(500).send('Internal Server Error.');
  }
};


router.get('/logout', function(req, res) {
  req.session.destroy(function(err) {
    res.send(err);
  });
  res.redirect('/');
});

router.get('/authenticate/:passcode', function(req, res) {
  const attemptedPasscode = req.params.passcode;
  if (attemptedPasscode == passcode) {
    req.session.admin = passcode;
    res.redirect('/admin');
  } else {
    res.redirect('/');
  }
});

router.get('/', ensureAdmin, function(req, res) {
  res.send('success');
});

router.get('/guide/register', ensureAdmin, function(req, res) {
  res.render('adminGuideRegister', {layout: false});
});


router.post('/guide/register', ensureAdmin, everything, function(req, res, next) {
  bcrypt.hash(req.body.password, 10, (err, hash) => {
    const userInfo = {
      name: req.body.name,
      password: hash,
      email: req.body.email,
      university: req.body.university,
      grade: req.body.grade,
      major: req.body.major,
      language: req.body.language,
      bio: req.body.bio,
      profilePic: req.files['profilePic'][0].location,
      backdrop: req.files['backdrop'][0].location,
      logo: req.files['logo'][0].location,
    };

    user = new Guides(userInfo);
    console.log(user);
    user.save(function(err, user) {
      if (err) return next(err);
      stripe.accounts.create(
          {
            type: 'custom',
            country: 'US',
            email: req.body.email,
            business_type: 'individual',
            requested_capabilities: [
              'card_payments',
              'transfers',
            ],
          },
          function(err, account) {
            if (err) return next(err);
            user.stripeAccountId = account.id.toString();
            user.save(function(err, user) {
              if (err) next(err);
              res.send(`Success:
                  email: ${req.body.email},
                  password: ${req.body.password}
                  `);
            });
          },

      );
    });
  });
});

module.exports = router;
