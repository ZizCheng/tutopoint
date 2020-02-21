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

  return new Promise((resolve, reject) => {
    const clients = [];
    clients.push(client);
    console.log(guide);
    const newSession = new Sessions({
      title: `Session with ${guide.name}`,
      createdBy: guide,
      clients: clients,
      date: date,
      confirmed: false,
    });
    newSession.save(function(err) {
      if (err) {
        console.log(err);
        reject(err);
      };
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
          reject(error);
        } else {
          console.log('Email sent1');
        }
      });
      resolve(newSession);
    });
  });
}

// guide confirms client's session request
function confirmSession(session) {
  return new Promise((resolve, reject) => {
    session.confirmed = true;
    Guides.findById(session.createdBy, function(err, guide) {
      if (err) reject(err);
      Users.findById(session.clients[0], function(err, client) {
        const email = client.email;
        const name = guide.name;
        const date = session.date;
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
            reject(err);
          } else {
            session.save()
                .then(() => resolve())
                .catch((err) => reject(err));
          }
        });
      });
    });
  });
}

// session (confirmed or not) is cancelled
function cancelSession(session) {
  return new Promise((resolve, reject) => {
    if (session.cancelled) {
      resolve();
    }
    const t = session.date;
    const email = session.createdBy.email;
    const name = session.createdBy.name;
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
        session.cancelled = true;
        session.save()
            .then((session) => resolve(session))
            .catch((err) => reject(err));
      }
    });
  });
}

function rescheduleSession(oldSession, date) {
  Guides.findById(oldSession.createdBy, function(err, guide) {
    Users.findById(oldSession.clients[0], function(err, client) {
      requestSession(clients[0], guide, date);
    });
  });
  cancelSession(oldSession);
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
