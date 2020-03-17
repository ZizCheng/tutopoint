const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');

const Documents = require('../models/model.js').Documents;

/*
GET is used to get the document.
POST is used to create a new document.
PUT is used to modify a document.
*/

router.use(auth.loggedIn);


router.get('/:id', auth.hasDocument, function(req, res) {
  const renderOptions =
  {
    doc_text: req.doc.text,
    doc_id: req.doc._id,
    layout: false,
  };

  res.render('document', renderOptions);
});
router.put('/:id', auth.hasDocument, function(req, res) {
  req.doc.text = req.body.text;
  req.doc.save()
      .then(() => res.send('success'))
      .catch((err) => res.send('Error occurred.'));
});

router.post('/', function(req, res) {
  const newDoc = new Documents(
      {title: 'Untitled Notes',
        text: '<p>You can take notes here.</p>'},
  );
  newDoc.save(function(err, doc) {
    req.user.documents.push(doc._id);
    req.user.populate('documents').save()
        .then(() => res.redirect('/document/' + newDoc._id))
        .catch((err) => res.send('Error occurred.'));
  });
});


module.exports = router;
