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
  s3.upload({Bucket: "tutopoint-doc-bucket", Key: req.doc.aws_filename, Body: JSON.stringify(req.body.text)}, function (err, data) {
    if (err) {
      console.log("Error", err);
    }
    else {
      res.send("success");
    }
  });
});
router.delete('/:id', auth.loggedIn, auth.hasDocument, function(req, res) {
  console.log("delete request");
  s3.deleteObject({Bucket: "tutopoint-doc-bucket", Key: req.doc.aws_filename}, function(err, data) {
    if(err) console.log(err);
  });
  //remove from req.user.documents
  for(var i = 0;i<req.user.documents.length;i++)
  {
    if(req.user.documents[i]._id == req.doc._id)
    {
      console.log(i);
      //remove from index i
      req.user.documents.splice(i, 1);
    }
  }
  console.log("req.doc._id", req.doc._id);
  req.user.markModified('documents');
  req.user.save();
  Documents.findByIdAndDelete(req.doc._id, function(err,data) {
    if(err) console.log(err);
    console.log("data from findByIdAndDelete callback:", data);
  });
  console.log("finished");
  res.send("success");
});


router.get('/', auth.loggedIn, function(req,res) {
  res.json(req.user.documents);
});
router.post('/', auth.loggedIn, function(req, res) {
  crypto.randomBytes(32, function(err, buffer) {
    var aws_filename = buffer.toString("hex");
    s3.upload({Bucket: "tutopoint-doc-bucket", Key: aws_filename, Body: "[]"}, function (err, data) {
      if (err) {
        console.log("Error", err);
      } if (data) {
        console.log("Upload Success", data.Location);
      }
    });

    var newDoc = new Documents({
      title: "Untitled Document",
      date: Date.now(),
      aws_filename: aws_filename,
    });
    newDoc.save(function(err, doc) {
      req.user.documents.push(doc._id);
      req.user.markModified('documents');
      req.user.save();
      res.send("success");
    });
  });
});
router.put('/', auth.loggedIn, function(req, res) {
  crypto.randomBytes(32, function(err, buffer) {
    var aws_filename = buffer.toString("hex");
    s3.upload({Bucket: "tutopoint-doc-bucket", Key: aws_filename, Body: JSON.stringify(req.body.text)}, function (err, data) {
      if (err) {
        console.log("Error", err);
      } if (data) {
        console.log("Upload Success", data.Location);
      }
    });

    var newDoc = new Documents({
      title: req.body.title,
      date: Date.now(),
      aws_filename: aws_filename,
    });
    newDoc.save(function(err, doc) {
      req.user.documents.push(doc._id);
      req.user.markModified('documents');
      req.user.save();
      res.send("success");
    });
  });
});


module.exports = router;
