const express = require('express');
const router = express.Router();
const passport = require('passport');
const auth = require("../auth/auth.js");

router.get('/document/:id', auth.loggedIn, auth.hasDocument, function(req, res){
  res.render("document", {doc_text: req.doc.text, doc_id: req.doc._id, layout: false});
});
router.post('/save-document/:id', auth.loggedIn, auth.hasDocument, function(req,res){
  req.doc.text = req.body.text;
  req.doc.save();
  res.send("success");
});
router.get('/create-document', auth.loggedIn, function(req,res){
  var newDoc = new Documents({title: "Untitled Notes", text: "<p>You can take notes here.</p>"});
  newDoc.save(function(err,doc){
    req.user.documents.push(doc._id)
    req.user.populate("documents").save();
    res.redirect("/document/" + newDoc._id);
  });
});

module.exports = router;
