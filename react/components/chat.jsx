import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import { NavLink } from 'react-router-dom';
import socketIOClient from "socket.io-client";
const socketIOEndpoint = window.location.origin;

import "./chat.scss";
import chatAPI from "../api/chat.js";
import profileAPI from "../api/profile.js";

import { withRouter } from "react-router-dom";

class Chat extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      chatWindowOpen: false,
    }

    this.toggleChat = this.toggleChat.bind(this);
  }

  toggleChat() {
    this.setState({
      chatWindowOpen: !this.state.chatWindowOpen
    });
  }

  render() {
    return (
      <div>
        <div className="chat-launcher" onClick={this.toggleChat}>
          {this.state.chatWindowOpen ?
            <i className="chat-launcher-icon chat-launcher-icon-close fas fa-chevron-down"></i> :
            <i className="chat-launcher-icon chat-launcher-icon-open far fa-comment-alt"></i>
          }
        </div>
        <div className={"chat-window-wrapper " + (this.state.chatWindowOpen ? "" : "chat-window-wrapper-hidden")}>
          <ChatWindow></ChatWindow>
        </div>
      </div>
    );
  }
}
class ChatWindow extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      //existing chat users and qualified users
      existingUsers: [],
      users: [],
      chatBoxOpen: false,
      chatBoxData: null,
    }

    this.idCounter = 0;
    this.loadChat = this.loadChat.bind(this);
    this.chatBoxBack = this.chatBoxBack.bind(this);
    this.updateChat = this.updateChat.bind(this);
    this.getChatState = this.getChatState.bind(this);
    this.assignId = this.assignId.bind(this);
  }

  //opens chat box with chat (full chat object with messages with auto-gen ids)
  loadChat(chat, newChatCreated /* boolean: refresh chats if true */) {
    for(var chatHistoryEle of chat.chatHistory) {
      this.assignId(chatHistoryEle);
    }
    this.setState({
      chatBoxOpen: true,
      chatBoxData: chat,
    });
    if(newChatCreated) {
      this.getChatState();
    }
  }
  chatBoxBack() {
    this.setState({
      chatBoxOpen: false,
    });
  }
  updateChat(message) {
    this.assignId(message);
    //clone state's chatBoxData
    var chatBoxData = JSON.parse(JSON.stringify(this.state.chatBoxData));
    chatBoxData.chatHistory.push(message);
    this.setState({
      chatBoxData: chatBoxData,
    });
  }
  //auto-generate an id for a message (and store it as a property)
  //this will be used for React keys later
  assignId(message) {
    message.generatedId = this.idCounter;
    this.idCounter++;
  }
  //get data for ChatSelect and put into state
  getChatState() {
    //wait for both to finish before updating state
    var promise1 = chatAPI.listChats();
    var promise2 = chatAPI.getQualifiedUsers();
    Promise.all([promise1, promise2]).then((values) => {
      this.setState({
        existingUsers: values[0],
        users: values[1],
      });
    });
  }

  componentDidMount() {
    this.getChatState();
  }

  render() {
    //clients (see all the guides)
    var existingChatList = [];
    var newChatList = [];
    var existingChatList = this.state.existingUsers.map((user) => {

    });
    for(var user of this.state.users) {
      var ChatSelectTemp = null;
      if(user.__t == "guides") {
        ChatSelectTemp = <ChatSelect key={user._id} userType="guide" _id={user._id} name={user.name} profilePic={user.profilePic}
            grade={user.grade} major={user.major} university={user.university} loadChat={this.loadChat}></ChatSelect>
      }
      else if(user.__t == "clients") {
        ChatSelectTemp = <ChatSelect key={user._id} userType="client"
          _id={user._id} name={user.name} loadChat={this.loadChat}></ChatSelect>
      }
      else console.log("user.__t not recognized, equal to " + user.__t);

      //determine whether to add to existing or new chat list
      if(this.state.existingUsers.includes(user._id)) {
        existingChatList.push(ChatSelectTemp);
      }
      else newChatList.push(ChatSelectTemp);
    }
    return (
      <div className="chat-container card">
        <div className="chat-select-list" style={{display: this.state.chatBoxOpen ? "none" : "block"}}>
          <p className="chat-title">Chat</p>
          {existingChatList.length > 0 ?
          <div className="chat-select-list-category">
            <p className="chat-select-list-category-label">Keep talking with</p>
            {existingChatList}
          </div> : ""}


          <div className="chat-select-list-category">
            <p className="chat-select-list-category-label">Start a new conversation</p>
            {newChatList}
          </div>
        </div>
        <div className="chat-box-wrapper" style={{display: this.state.chatBoxOpen ? "block" : "none"}}>
          <ChatBox chat={this.state.chatBoxData} back={this.chatBoxBack} updateChat={this.updateChat}></ChatBox>
        </div>
      </div>
    );
  }
}

//a guide or client to select to chat with
//props: userType: "guide" or "client", existing: true or false, loadChat: function to change chat box
//  guide:  _id, name, profilePic, grade, major, university
//  client: _id, name
class ChatSelect extends React.Component {
  constructor(props) {
    super(props);

    this.chatSelectClick = this.chatSelectClick.bind(this);
  }

  chatSelectClick() {
    chatAPI.findChat(this.props._id).then((chat) => {
      if(chat == "not found") {
        //if chat does not exist, create a new one and then find it
        //kind of dumb to find it again but simpler to code this way
        chatAPI.newChat(this.props._id).then((newChat) => {
          chatAPI.findChat(this.props._id).then((chat) => {
            this.props.loadChat(chat, true);
          });
        });
      }
      else {
        this.props.loadChat(chat, false);
      }
    });
  }

  render() {
    if(this.props.userType == "client") {
      return (
        <div className="chat-select-wrapper" onClick={this.chatSelectClick}>
          <p>{this.props.name}</p>
        </div>
      );
    }
    else if(this.props.userType == "guide") {
      return (
        <div className="chat-select-wrapper" onClick={this.chatSelectClick}>
          <article className="media">
            <div className="media-left">
              <figure className="image is-48x48">
                <img className="is-rounded" src={this.props.profilePic ? this.props.profilePic : "https://bulma.io/images/placeholders/64x64.png"} />
              </figure>
            </div>
            <div className="media-content">
              <p className="is-size-7 has-text-weight-bold">
                {this.props.name} at <span className="highlight">{this.props.university}</span>
              </p>
              <p className="is-size-7 has-text-weight-bold">
                {this.props.grade} &mdash; <span className="highlight">{this.props.major}</span>
              </p>
            </div>
          </article>
        </div>
      );
    }
    else {
      console.log("userType not specified in ChatSelect");
      return <div>Error</div>;
    }
  }
}

//the chat box (with send button, messages, etc)
//props: chat, back, updateChat
class ChatBox extends React.Component {
  constructor(props) {
    super(props);
    console.log(this.props);

    this.socket = socketIOClient(socketIOEndpoint);
    this.socket.on("chat-error", (data) => {
      console.log("chat-error: " + data);
    });
    this.socket.on("chat-msg", (data) => {
      console.log("recieved chat message and called updateChat with data:");
      console.log(data);
      this.props.updateChat(data);
    });

    this.state = {
      chatInput: "",
      userId: "",
    }

    this.chatInputChange = this.chatInputChange.bind(this);
    this.sendSubmit = this.sendSubmit.bind(this);
    this.joinChatRoom = this.joinChatRoom.bind(this);

    if(this.props.chat) {
      this.joinChatRoom();
    }
  }
  chatInputChange(e) {
    this.setState({chatInput: e.target.value});
  }
  sendSubmit(e) {
    e.preventDefault();
    this.socket.emit("chat-msg", this.state.chatInput);
    this.setState({chatInput: ""});
  }
  joinChatRoom() {
    this.socket.emit("chat-join-room", this.props.chat._id);
  }

  componentDidMount() {
    profileAPI.getProfile().then((json) => {
      this.setState({userId: json._id});
    });
  }
  //use this to join another socket room if props changes
  //this is called on every change, including re-render, so first compare props with old props
  componentDidUpdate(prevProps) {
    //if this.props.chat exists and ( either prevProps.chat doesn't exist or prevProps.chat._id is different )
    if(this.props.chat && (!prevProps.chat || this.props.chat._id != prevProps.chat._id)) {
      this.joinChatRoom();
    }
  }

  /* TODO: add messages using message component */
  render() {
    if(!this.props.chat) {
      return <div className="chat-box-container"></div>
    }

    var participantsList = "";
    for(var i = 0;i<this.props.chat.participants.length;i++) {
      if(i != 0) participantsList += ", ";
      participantsList += this.props.chat.participants[i].name;
    }

    var messageList = [];
    for(var chatHistoryEle of this.props.chat.chatHistory) {
      var sentByMe = false;
      if(chatHistoryEle.sender == this.state.userId) sentByMe = true;
      //note that it isn't a big deal if this.state.userId is still empty
      //string for some reason (shouldn't ever be the case for average use case):
      //the messages will all appear as their messages. Once the profileAPI call
      //returns, state will update and everything will be fine
      messageList.push(<ChatMessage key={chatHistoryEle.generatedId} message={chatHistoryEle.message} sentByMe={sentByMe}></ChatMessage>)
    }

    return (
      <div className="chat-box-container">
        <div className="chat-box-header">
          <div className="chat-box-header-back" onClick={this.props.back}>
            <i className="fas fa-chevron-left"></i>
          </div>
          <p className="chat-box-header-title">{participantsList}</p>
        </div>
        <div className="chat-messages-container">
          {messageList}
        </div>
        <div className="chat-input-wrapper">
          <form className="chat-input-form" onSubmit={this.sendSubmit}>
            <input className="chat-input" type="text" value={this.state.chatInput} onChange={this.chatInputChange}
              placeholder="Type text here..."></input>
            <button type="submit" className="chat-send">
              <i className="fa fa-paper-plane"></i>
            </button>
          </form>

        </div>
      </div>
    );
  }
}

//a chat message
//props: message, sentByMe (true or false depending on who sent it)
class ChatMessage extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    return (
      <div className={"chat-message " + (this.props.sentByMe ? "chat-message-me" : "chat-message-them")}>
        <p>{this.props.message}</p>
      </div>
    );
  }
}

export default withRouter(Chat);
