const Users = require("../models/model.js").Users;
const Documents = require("../models/model.js").Documents;

const crypto = require("crypto");

const awsS3 = require('../secret.js').aws_s3;
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: awsS3['accessKeyId'],
  secretAccessKey: awsS3['secretAccessKey'],
});

const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');

router.get('/:id', auth.loggedIn, auth.hasDocument, function(req, res) {
  s3.getObject({Bucket: "tutopoint-doc-bucket", Key: req.doc.aws_filename})
    .createReadStream()
    .pipe(res);
});

router.put('/:id', auth.loggedIn, auth.hasDocument, function(req, res) {
  Documents.findById(req.params.id, function(err, document) {
    s3.upload({Bucket: "tutopoint-doc-bucket", Key: document.aws_filename, Body: req.body.data}, function (err, data) {
      if (err) {
        console.log("Error", err);
      } if (data) {
        console.log("Upload Success", data.Location);
      }
    });
  })

});

router.post('/', auth.loggedIn, function(req, res) {
  crypto.randomBytes(32, function(err, buffer) {
    var aws_filename = buffer.toString("hex");
    s3.upload({Bucket: "tutopoint-doc-bucket", Key: req.doc.aws_filename}, function (err, data) {
      if (err) {
        console.log("Error", err);
      } if (data) {
        console.log("Upload Success", data.Location);
      }
    });

    var newDoc = new Documents({
      title: "Untitled Document",
      aws_filename: aws_filename,
    });
    newDoc.save(function(err, doc) {
      req.user.documents.push(doc._id);
      req.user.markModified('documents');
      res.redirect('/document/' + newDoc._id);
    });
  });
});


module.exports = router;
