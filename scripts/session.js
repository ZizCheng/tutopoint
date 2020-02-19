/*
For more speed:
index sessions by createdBy and clients (and potentially combine them into 1 array)

*/

const Users = require('../models/model.js').Users;
const Sessions = require('../models/model.js').Sessions;

// client requests to start session with guide
// create a new session, add to client and guide
function requestSession(client, guide, date) {
  // if we ever want multiple clients
  const clients = [];
  clients.push(client);

  const newSession = new Sessions({
    title: `Session with ${guide.name}`,
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
  });
}

// guide confirms client's session request
function confirmSession(session) {
  session.confirmed = true;
}

// session (confirmed or not) is cancelled
function cancelSession(session) {
  session
      .populate('createdBy')
      .populate('clients')
      .exec(function(err, session) {
      // remove user and guide from session, remove session from user and guide
      });
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
  requestSession: requestSession,
  confirmSession: confirmSession,
  cancelSession: cancelSession,
  querySessions: querySessions,
};
