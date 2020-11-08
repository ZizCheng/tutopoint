const express = require('express');
const router = new express.Router();
const auth = require('../auth/auth.js');
const Chats = require('../models/model.js').Chats;
const Users = require("../models/model.js").Users;
const Guides = require("../models/model.js").Guides;
const Clients = require("../models/model.js").Clients;
const Sessions = require("../models/model.js").Sessions;


router.use(auth.loggedIn);

//list the users that this user has a chat with (user id)
router.get("/list", function(req, res) {
  var userIds = [];
  for(var chat of req.user.chats) {
    //loop through participants (should only be 2) to find the one that isn't this user
    for(var participant of chat.participants) {
      if(!participant.equals(req.user._id)) {
        userIds.push(participant);
      }
    }
  }
  res.json(userIds);
});
//new chat given this user and another user
router.post("/new", function(req, res) {
  Users.findById(req.body.userId).exec(async function(err, user) {
    if(!user) {
      res.send("user not found");
    }
    else {
      var chat = await new Chats({
        participants: [req.user._id, req.body.userId]
      });
      chat.save();
      req.user.chats.push(chat._id);
      req.user.markModified("chats");
      req.user.save();
      user.chats.push(chat._id);
      user.markModified("chats");
      user.save();
      res.json("success");
    }
  });
});
//find chat given this user and another user
router.get("/find", function(req, res) {
  Chats.findOne({participants: { $all: [req.query.otherUserId, req.user._id] }}).populate("participants", "name").exec(function(err, chat) {
    if(!chat) res.json("not found");
    else res.json(chat);
  });
});
//get all users this user can chat with
router.get('/qualified', function(req, res) {
  if(req.user.__t == "clients") {
    Guides.find({onboarded: true})
      .select("_id __t email grade language logo major name profilePic ratings university freeFirstSession")
      .exec(function(err, guides) {
        res.json(guides);
      });
  }
  else if(req.user.__t == "guides") {
    Sessions
      .distinct("clients", {createdBy: req.user._id})
      .exec(function(err, clientIds) {
        Clients.find({_id: {$in: clientIds}}).select("_id __t email name").exec((err, clients) => {
          res.json(clients);
        });
      });
  }
  else res.json("error");
});

router.get("/:id", function(req, res) {
  Chats.findById(req.params.id).populate("participants", "name").exec(function(err, chat) {
    res.json(chat);
  });
});



module.exports = router;
