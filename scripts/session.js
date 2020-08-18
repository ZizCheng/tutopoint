/*
For more speed:
index sessions by createdBy and clients (and potentially combine them into 1 array)

*/
const Guides = require('../models/model.js').Guides;
const Users = require('../models/model.js').Users;
const Sessions = require('../models/model.js').Sessions;
const nodemailer = require('nodemailer');
const mailAuth = require('../secret.js').mailAuth;
const Schedule = require('../scripts/schedule.js');
const FailedPayments = require('../models/model.js').failedPayments;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: mailAuth,
});

const secret = require('../secret.js').stripe;
const stripe = require('stripe')(secret.sk_key);

// client requests to start session with guide
// create a new session, add to client and guide
function requestSession(client, guide, date, free = false) {
  if(free) {
    client.freeFirstSessionAvailable = false;
    client.save();
  }
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
      free: free,
    });
    newSession.save(function(err) {
      if (err) {
        console.log(err);
        reject(err);
      };
      Schedule.bookDate(date, guide.schedule);
      client.sessions.push(newSession);
      client.save();
      guide.sessions.push(newSession);
      guide.save();
      const email = guide.email;
      const name = guide.name;
      const mailOptions = {
        from: 'TutoPoint Bookings <bookings@tutopoint.com>',
        to: email,
        subject: '[TutoPoint] New Booking',
        text: 'Hello ' + name + ', someone has booked your time at ' +
         date + '. Please confirm this session on your guide dashboard at ' +
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
    sessionCharge(session);

    Guides.findById(session.createdBy, function(err, guide) {
      if (err) reject(err);
      Users.findById(session.clients[0], function(err, client) {
        const email = client.email;
        const name = guide.name;
        const date = session.date;
        const mailOptions = {
          from: 'TutoPoint Bookings <bookings@tutopoint.com>',
          to: email,
          subject: '[TutoPoint] Session Confirmed!',
          text: 'Hello, ' + name + ' has confirmed your upcoming session at ' +
          (date.getMonth() + 1) + '/' + date.getDate() + ' at ' + '.\nYou may cancel this session up to 24 hours prior, we will charge a $15' +
       ' fine from your account if you fail to show up.' + '\n\nThank you for your business!\nTutoPoint LLC',
        };
        transporter.sendMail(mailOptions, function(error, info) {
          if (error) {
            reject(err);
          }
        });
        session.save()
            .then(() => resolve())
            .catch((err) => reject(err));
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
      from: 'TutoPoint Bookings <bookings@tutopoint.com>',
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
        console.log(t);
        Schedule.unbookDate(t, session.createdBy.schedule);
        session.createdBy.save();
        session.cancelled = true;
        session.save()
            .then((session) => resolve(session))
            .catch((err) => reject(err));
        if(session.free) {
          session.clients[0].freeFirstSession = true;
          session.cleints[0].save();
        }
      }
    });
  });
}

async function sessionCharge(session) {
  console.log("sessionCharge called");
  const clientCost = 6000;
  const guidePay = 4000;

  if(!session.free) {
    console.log("logged from sessionCharge, session.free was false");

    Users.findById(session.clients[0]).then((u) => {
      chargeClient(u.stripeCustomerId, clientCost,`Session Charge`,'charge');
    });

    Users.findById(session.createdBy)
        .then((guide) => {
          payGuide(guide.stripeAccountId, guidePay, session);
        })
        .catch(() => {
          const failedPayment = new FailedPayments({
            guideId: session.createdBy,
            sessionId: session._id,
            count: amount,
          });
          failedPayment.save();
        });
  }
  else console.log("free session occured. client was not charged and guide was not paid.");
}

function chargeClient(clientstripeid, amount, message, dir) {
  const chargeType = {
    charge: 1,
    debit: -1,
  };
  return new Promise((resolve, reject) => {
    stripe.customers.createBalanceTransaction(
        clientstripeid,
        {
          amount: chargeType[dir] * amount,
          currency: 'usd',
          description: message,
        },
        function(err, _) {
          if (err) reject(err);
          resolve();
        },
    );
  });
}

function payGuide(guidestripeaccount, amount, session) {
  return new Promise((resolve, reject) => {
    const paymentInfo = {
      amount: amount,
      currency: 'usd',
      destination: guidestripeaccount,
    };
    stripe.transfers
        .create(paymentInfo)
        .then(() => {
        // Success
          resolve();
        })
        .catch((err) => {
        // Failure
          const topupInfo = {
            amount: amount * 2,
            currency: 'usd',
            description: `Topup`,
            statement_descriptor: 'Top-up',
          };
          stripe
              .topups.create(topupInfo)
              .then(() => {
                // Attempt to charge again
                stripe.transfers
                    .create(paymentInfo)
                    .then(() => {
                      // Success
                      resolve();
                    })
                    .catch(() => {
                      const failedPayment = new FailedPayments({
                        stripeAccountId: guidestripeaccount,
                        sessionId: session._id,
                        count: amount,
                      });
                      failedPayment.save().then(() => {
                        console.log(
                            `Transfer payment for ${session.createdBy} has failed.`,
                        );
                        resolve();
                      });
                    });
              })
              .catch(() => {
                const failedPayment = new FailedPayments({
                  guideId: session.createdBy,
                  sessionId: session._id,
                  count: amount,
                });
                failedPayment.save().then(() => {
                  resolve();
                  console.log(
                      `Transfer payment for ${session.createdBy} has failed.`,
                  );
                });
              });
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
