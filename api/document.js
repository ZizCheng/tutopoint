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

<<<<<<< HEAD

=======
>>>>>>> cecef3ade744946c6bf8d61ab949d7d0bea7da5f
router.get('/:id', auth.loggedIn, auth.hasDocument, function(req, res) {
  s3.getObject({Bucket: "tutopoint-doc-bucket", Key: req.doc.aws_filename})
    .createReadStream()
    .pipe(res);
});
<<<<<<< HEAD
=======

>>>>>>> cecef3ade744946c6bf8d61ab949d7d0bea7da5f
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
  res.send(createDocument(req.user, "Untitled Document", [], Date.now()));
});
router.put('/', auth.loggedIn, function(req, res) {
  res.send(createDocument(req.user, req.body.title, req.body.text, Date.now()));
});

//send to guide of sessionid
router.post('/:id/send', auth.loggedIn, auth.hasDocument, function(req, res) {
  Sessions.findById(req.body.sessionid, function(err, session) {
    cloneDocument(session.createdBy, req.doc)
  })
});

//creates document and adds to user with title, text, and date
//returns document id
function createDocument(user, title, text, date) {
  crypto.randomBytes(32, function(err, buffer) {
    var aws_filename = buffer.toString("hex");
    s3.upload({Bucket: "tutopoint-doc-bucket", Key: aws_filename, Body: JSON.stringify(text)}, function (err, data) {
      if (err) {
        console.log("Error", err);
      } if (data) {
        console.log("Upload Success", data.Location);
      }
    });

    var newDoc = new Documents({
      title: title,
      date: date,
      aws_filename: aws_filename,
    });
    newDoc.save(function(err, doc) {
      user.documents.push(doc._id);
      user.markModified('documents');
      user.save();
      return doc._id;
    });
  });
}
//clones document and adds to user
function cloneDocument(user, document) {
  return createDocument(user, document.title, document.text, document.date);
}

module.exports = router;
