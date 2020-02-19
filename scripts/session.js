/*
For more speed:
index sessions by createdBy and clients (and potentially combine them into 1 array)

*/
const Guides = require('../models/model.js').Guides;
const Users = require('../models/model.js').Users;
const Sessions = require('../models/model.js').Sessions;
const nodemailer = require('nodemailer');
const mailAuth = require('../secret.js').mailAuth;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: mailAuth,
});

// client requests to start session with guide
// create a new session, add to client and guide
function requestSession(client, guide, date) {
  // if we ever want multiple clients
  const clients = [];
  clients.push(client);

  const newSession = new Sessions({
    title: 'Untitled Session',
    createdBy: guide,
    clients: clients,
    date: date,
    confirmed: false,
  });
  newSession.save(function(err) {
    if (err) console.log(err);
    client.sessions.push(newSession);
    client.save();
    guide.sessions.push(newSession);
    guide.save();
    const email = guide.email;
    const name = guide.name;
    const mailOptions = {
      from: 'tutopointauth@gmail.com',
      to: email,
      subject: '[TutoPoint] New Booking',
      text: 'Hello ' + name + ', someone has booked your time at ' +
       date + ' please confirm this session on your guide dashboard at ' +
       'https://tutopoint.com/dashboard' + '\n\nBest,\nTutoPoint LLC',
    };
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent1');
      }
    });
  });
}

// guide confirms client's session request
function confirmSession(session) {
  session.confirmed = true;
  Guides.findById(session.createdBy, function(err, guide) {
    Users.findById(session.clients[0], function(err, client) {
      const email = client.email;
      const name = guide.name;
      const mailOptions = {
        from: 'tutopointauth@gmail.com',
        to: email,
        subject: '[TutoPoint] Session Confirmed!',
        text: 'Hello, ' + name + ' has confirmed your upcoming session at ' +
        date.getMonth() + '/' + date.getDate() + ' at ' + date.getHours() +
    '.\nYou may cancel this session up to 24 hours prior, we will charge a $15' +
     ' fine from your account if you fail to show up.' + '\n\nThank you for your business!\nTutoPoint LLC',
      };
      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent1');
        }
      });
    });
  });
}

// session (confirmed or not) is cancelled
function cancelSession(session) {
  const t = session.date;
  session
      .populate('createdBy')
      .populate('clients')
      .exec(function(err, session) {
      // remove user and guide from session, remove session from user and guide
      });
  Guides.findById(session.createdBy, function(err, guide) {
    const email = guide.email;
    const name = guide.name;
    const mailOptions = {
      from: 'tutopointauth@gmail.com',
      to: email,
      subject: '[TutoPoint] New Booking',
      text: 'Hello ' + name + ', your session at '+ t +
    ' has been cancelled, we apologize for the inconvenience.' +
     '\n\nBest,\nTutoPoint LLC',
    };
    transporter.sendMail(mailOptions, function(error, info) {
      if (error) {
        console.log(error);
      } else {
        console.log('Email sent1');
      }
    });
  });
}

function rescheduleSession(session, date) {
  const guide = session.createdBy;
  const clients = session.clients;
  cancelSession(session);
  requestSession(clients[0], guide, date);
}

// list all sessions belonging to user (client or guide)
function querySessions(user, callback) {
  Sessions
      .find({$or: [
        {createdBy: user._id},
        {clients: user._id},
      ]})
      .exec(function(err, sessions) {
        callback(sessions);
      });
}

module.exports = {
  rescheduleSession: rescheduleSession,
  requestSession: requestSession,
  confirmSession: confirmSession,
  cancelSession: cancelSession,
  querySessions: querySessions,
};
