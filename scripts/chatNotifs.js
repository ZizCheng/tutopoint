//useless file, I copy pasted the sendChatNotifs function into index.js (to avoid connecting to mongoose again)

//periodically send out chat notifs by using timestamp and last read
const mongoose = require('mongoose');
const Chats = require('../models/model.js').Chats;
const Users = require("../models/model.js").Users;

const databaseCredentials = require('../secret.js').databaseCredentials;
mongoose.connect(databaseCredentials.url, {useNewUrlParser: true});

const nodemailer = require('nodemailer');
const mailAuth = require('../secret.js').mailAuth;
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: mailAuth,
});

/*
For now, only send the number of unread messages, and a fixed message

Maybe also send the chat messages, but code is unfinished
*/
function sendChatNotifs() {
  Users.find({chatNotifs: true}).populate("chats.chat").populate("chats.chat.participant", "name").exec((err, users) => {
    //for each user, send an email
    for(let user of users) {
      let unreadMessagesCount = 0;
      //for each chat, construct the email text, and add these together to form the final email
      for(let chatTemp of user.chats) {

        let chatHistory = chatTemp.chat.chatHistory;
        let lastRead = chatTemp.lastRead;
        let participants = chatTemp.chat.participants;

        //find all messages with timestamp greater than lastread
        //stupid O(n) iteration and then sort the result
        let unreadHistory = [];
        for(let i = 0;i<chatHistory.length;i++) {
          if(chatHistory[i].timestamp.getTime() > lastRead.getTime()) {
            unreadHistory.push(chatHistory[i]);
            unreadMessagesCount++;
          }
        }
        unreadHistory.sort();

        /*
        //construct the email text
        let emailBody = "";
        //add the chat header
        emailBody += "Chat with ";
        for(let i = 0;i<participants.length) {
          if(i > 0) emailBody += ", ";
          emailBody += participants[i];
        }
        emailBody += "\n";
        //add the chat body (not implemented yet)
        */
      }
      if(unreadMessagesCount > 0) {
        const mailOptions = {
          from: "TutoPoint <auth@tutopoint.com>",
          to: user.email,
          subject: "[TutoPoint] " + unreadMessagesCount + " new chat message(s)",
          text: "Hello,\n\nYou have " + unreadMessagesCount + " unread chat messages. You can " +
          "read these at https://tutopoint.com/dashboard/upcoming.\n" +
          "You can turn off these notifications from " + "https://tutopoint.com/profile.\n\n" +
          "Best, TutoPoint LLC."
        };
        transporter.sendMail(mailOptions, function(err, info) {
          if (err) console.log(err);
        });
      }
    }
  });
}
