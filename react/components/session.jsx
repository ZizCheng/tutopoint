import React from "react";
import ReactDOM from "react-dom";
import { withRouter } from "react-router-dom";
import profileStore from "../store/profileStore.js";
import quilljs from "quill";
import simplePeer from "simple-peer";
import "./session.scss";
import io from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";

class Session extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      profile: profileStore.getState(),
      sessionid: props.match.params.id,
    };
    this.initializePeer = this.initializePeer.bind(this)
    this.initializeQuill = this.initializeQuill.bind(this);
    this.replyOffer = this.replyOffer.bind(this);
  
  }
  initializeQuill() {
    this.quill = new quilljs("#editor", {
      theme: "snow",
    });
  }

  initializePeer(socket) {
    // TODO: Implement video protocol

    /*
      Whoever is last to join the call will be the one initiating the call.
      
      Process:
        -> Once IO is connected IO will receive an IO info event to know who is missing in the call. Information about room and initiators.
        -> Signaling server is completely independent from any payment system / tracker.
        -> Peer.onConnect() will send a ping that the call has started and so will the guide
        -> Same with end call.




    */
    const p = new simplePeer({
      initiator: true,
      trickle: false,
    }) 

    p.on('signal', offer => {
      socket.emit('offer', offer);
    })

    p.on('connect', function(){
      console.log('both users hav econnected!!!!!');
    })

    this.setState({peer: p});

    return;
  }

  replyOffer(socket, data) {
    const p  = new simplePeer({
      initiator: false,
      trickle: false,
    })

    p.on('signal', offer => {
      socket.emit('replyOffer', offer);
    })

    p.on('connect', function(){
      console.log('both users hav econnected!!!!!');
    })

    p.signal(data);

    this.setState({peer: p});

    return;
  }

  getUserMedia() {
    // ask for video
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((vidSrc) => {
        const localVideo = document.getElementById("local");
        localVideo.srcObject = vidSrc;
        localVideo.play();
      })
      .catch((err) => {
        console.log("video was not found.");
      });

    // ask for audio.
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((audioSrc) => {
        // Handle audio src. Send it to RTC.
      })
      .catch((err) => {
        //  No audio src has been found once user has been connected so to other caller that there is no audio found.
      });
  }

  async componentDidMount() {
    const that = this;
    this.initializeQuill();
    const socket = io(window.location.origin, {
      query: `session=${this.state.sessionid}`,
    });
    socket.on("connect", function(){
      console.log(`Connection successful`);
    })
    socket.on("info", function (data) {
      console.log(data);
      if(data?.roomInfo?.clientPresent && data?.roomInfo?.guidePresent){
        that.initializePeer(socket);
      }
    });
    socket.on('gotOffer', function(data){
      console.log('receive an offer');
      that.replyOffer(socket, data);
    })
    socket.on('answer', offer => {
    // replyOfferTODO: Connect first before asking for video source.
      console.log('got answer', this.state.peer);
      
      this.state.peer.signal(offer);
    });
    this.getUserMedia();
  }

  render() {
    return (
      <div>
        <div className="tile is-ancestor ">
          <div className="tile is-vertical is-parent is-4">
            <div className="tile is-child has-background-white">
              <h1 className="title is-size-4 has-text-gray">Notes</h1>
              <div id="editor"></div>
            </div>
          </div>
          <div className="tile is-parent videoContainer">
            <div className="tile is-child has-background-white">
              <nav className="level">
                <div className="level-left">
                  <h1 className="title is-size-4 has-text-gray">Call</h1>
                </div>
                <div className="level-right">Icons here</div>
              </nav>
              <video
                id="remote"
                src="https://interactive-examples.mdn.mozilla.net/media/examples/flower.webm"
              />
              <video id="local" />
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default withRouter(Session);
