const Users = require("../models/model.js").Users;
const Documents = require("../models/model.js").Documents;
const Sessions = require('../models/model.js').Sessions;

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


router.get('/:id/title', auth.loggedIn, auth.hasDocument, function(req, res) {
  res.send(req.doc.title);
});

router.get('/:id', auth.loggedIn, auth.hasDocument, function(req, res) {
  var s3Stream = s3.getObject({Bucket: "tutopoint-doc-bucket", Key: req.doc.aws_filename}).createReadStream()
  // listen for errors
  s3Stream.on('error', function(err) {
    res.json('error');
  });
  s3Stream.pipe(res);
});

router.put('/:id', auth.loggedIn, auth.hasDocument, function(req, res) {
  req.doc.title = req.body.title;
  req.doc.save();
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
  s3.deleteObject({Bucket: "tutopoint-doc-bucket", Key: req.doc.aws_filename}, function(err, data) {
    if(err) console.log(err);
  });
  //remove from req.user.documents
  for(var i = 0;i<req.user.documents.length;i++)
  {
    if(req.user.documents[i]._id == req.doc._id)
    {
      //remove from index i
      req.user.documents.splice(i, 1);
    }
  }
  req.user.markModified('documents');
  req.user.save();
  Documents.findByIdAndDelete(req.doc._id, function(err,data) {
    if(err) console.log(err);
  });
  res.send("success");
});


router.get('/', auth.loggedIn, function(req,res) {
  res.json(req.user.documents);
});
router.post('/', auth.loggedIn, function(req, res) {
  var doc_id = createDocument(req.user, "Untitled Document", [], Date.now());
  res.send(doc_id);
});
router.put('/', auth.loggedIn, function(req, res) {
  res.send(createDocument(req.user, req.body.title, req.body.text, Date.now()));
});

//send to guide of sessionid
router.post('/:id/send', auth.loggedIn, auth.hasDocument, function(req, res) {
  Sessions.findById(req.body.sessionid, function(err, session) {
    Users.findById(session.createdBy, function(err, user) {
      cloneDocument(user, req.doc);
    });
  });
});

//creates document and adds to user with title, text, and date
//returns document id
function createDocument(user, title, text, date) {
  var buffer = crypto.randomBytes(32);
  var aws_filename = buffer.toString("hex");
  s3.upload({Bucket: "tutopoint-doc-bucket", Key: aws_filename, Body: JSON.stringify(text)}, function (err, data) {
    if (err) {
      console.log("Error", err);
    }
  });

  var newDoc = new Documents({
    title: title,
    date: date,
    aws_filename: aws_filename,
  });
  user.documents.push(newDoc._id);
  user.markModified('documents');
  user.save();
  newDoc.save();

  return newDoc._id;
}
//clones document and adds to user
function cloneDocument(user, document) {
  streamToString(s3.getObject({
    Bucket: "tutopoint-doc-bucket",
    Key: document.aws_filename
  }).createReadStream()).then(function(text) {
    return createDocument(user, document.title, text, document.date);
  });
}

function streamToString (stream) {
  var chunks = [];
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
  })
}

module.exports = router;
