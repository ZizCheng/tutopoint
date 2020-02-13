const express = require('express');
const router = new express.Router();
const nodemailer = require('nodemailer');
const multer = require('multer');
const fs = require('fs');
const mailAuth = require('../secret.js').mailAuth;
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, './uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now());
  },
});
const upload = multer({storage: storage});
const everything = upload.fields([{name: 'profilePic', maxCount: 1}, {name: 'file1', maxCount: 1}, {name: 'file2', maxCount: 1}]);
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: mailAuth,
});

router.get('/', function(req, res) {
  const path = require('path');
  res.sendFile(path.resolve('../tutopoint-master/views/guideApplication.html'));
});

router.post('/submit', everything, function(req, res, next) {
  const r = req.body;
  if (!(r.email&&r.name&&r.university&&r.major&&r.language&&r.grade&&r.bio&&req.files['profilePic'][0]&&req.files['file1'][0]&&req.files['file2'][0])) {
    // FOR JASON: pop a message saying they didn't fill in everything
  } else {
    const email = r.email;
    const name = r.name;
    let mailOptions = {
      from: 'tutopointauth@gmail.com',
      to: email,
      subject: 'TutoPoint Application Recieved',
      text: 'Hello ' + name + ', your TutoPoint application is being processed. We will notify you soon.',
    };
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
        // FOR JASON: tell them their email fucked up and have them start over
      } else {
        console.log('Email sent1');
      }
    });
    let text = 'There has been a new application from ' + r.name;
    text += '\nEmail: ' + r.email;
    text += '\nUniversity: ' + r.university;
    text += '\nMajor: ' + r.major;
    text += '\nLanguage: ' + r.language;
    text += '\nGrade: ' + r.grade;
    text += '\nBio: ' + r.bio;
    text += '\nAttached below are the applicant\'s files';

    mailOptions = {
      from: 'tutopointauth@gmail.com',
      to: 'zizcheng@berkeley.edu',
      subject: 'TutoPoint Application',
      text: text,
      attachments: [
        {
          filename: req.files['profilePic'][0].originalname,
          content: req.files['profilePic'][0],
        },
        {
          filename: req.files['file1'][0].originalname,
          content: req.files['file1'][0],
        },
        {
          filename: req.files['file2'][0].originalname,
          content: req.files['file2'][0],
        }],
    };
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        // FOR JASON: tell them either their files are too big or it's our issue
        console.log(error);
      } else {
        // didn't error out, it's on gmail now
        fs.unlink(req.files['profilePic'][0].path, (err) => {
          if (err) throw err;
        });
        fs.unlink(req.files['file1'][0].path, (err) => {
          if (err) throw err;
        });
        fs.unlink(req.files['file2'][0].path, (err) => {
          if (err) throw err;
        });
        console.log('Email sent2');
      }
    });
    const path = require('path');
    res.sendFile(path.resolve('../tutopoint-master/views/guideAppSuccess.html'));
  }
});

module.exports = router;
