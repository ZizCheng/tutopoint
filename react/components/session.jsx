import React from "react";
import ReactDOM from "react-dom";
import { withRouter } from "react-router-dom";
import profileStore from "../store/profileStore.js";
import quilljs from "quill";
import {
  IoIosEyeOff,
  IoIosEye,
  IoMdMicOff,
  IoMdMic,
  IoMdCall,
} from "react-icons/io";
import simplePeer from "simple-peer";
import "./session.scss";
import io from "socket.io-client";
import Timer from "react-compound-timer";
import * as mediasoupClient from "mediasoup-client";

class Session extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      profile: profileStore.getState(),
      sessionid: props.match.params.id,
    };
    this.initializePeer = this.initializePeer.bind(this);
    this.initializeQuill = this.initializeQuill.bind(this);
    this.replyOffer = this.replyOffer.bind(this);
    this.startCall = this.startCall.bind(this);
    this.muteAudio = this.muteAudio.bind(this);
    this.unmuteAudio = this.unmuteAudio.bind(this);
    this.hideVideo = this.hideVideo.bind(this);
    this.showVideo = this.showVideo.bind(this);
    this.endCall = this.endCall.bind(this);
  }
  initializeQuill() {
    const that = this;
    this.quill = new quilljs("#editor", {
      theme: "snow",
    });
    this.quill.on("text-change", function (delta, oldDelta, source) {
      console.log("source", source);
      if (source === "user") {
        const data = {
          who: that.state.userid,
          delta: JSON.stringify(delta),
        };
        that.state.socket?.emit("text change", data);
      }
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

    const that = this;
    const p = new simplePeer({
      initiator: true,
      trickle: false,
      stream: this.state.stream,
    });

    p.on("signal", (offer) => {
      socket.emit("offer", offer);
    });

    p.on("connect", function () {
      console.log("initializer connected");
      that.startCall();
    });

    p.on("stream", function (stream) {
      console.log("got stream");

      const remote = document.getElementById("remote");
      remote.srcObject = stream;
      remote.play();
    });

    p.on("error", (err) => console.log(err));

    that.setState({ peer: p });

    // return;
  }

  replyOffer(socket, data) {
    const that = this;

    if (this.state.peer) {
      this.state.peer.signal(data);

      return;
    }

    const p = new simplePeer({
      initiator: false,
      trickle: false,
      stream: this.state.stream,
    });

    p.on("signal", (offer) => {
      socket.emit("replyOffer", offer);
    });

    p.on("connect", function () {
      console.log("noninit connected");
      that.startCall();
    });

    p.on("stream", function (stream) {
      console.log("got stream");

      const remote = document.getElementById("remote");
      remote.srcObject = stream;
      remote.play();
    });

    p.on("error", (err) => console.log(err));

    p.signal(data);

    that.setState({ peer: p });

    return;
  }

  endCall() {
    if (this.state.socket) {
      this.state.socket.emit("callEnd");
    }
  }

  startCall() {
    this.state.socket.emit("callStart");
    this.state.socket.emit("ping");
  }

  unmuteAudio() {
    if (this.state.stream) {
      const localVideo = document.getElementById("local");
      const audioTracks = localVideo.srcObject.getAudioTracks();

      this.setState({ audioMuted: false }, () => {
        audioTracks.forEach((track) => {
          track.enabled = true;
        });
      });
    }
  }
  muteAudio() {
    if (this.state.stream) {
      const localVideo = document.getElementById("local");
      const audioTracks = localVideo.srcObject.getAudioTracks();

      this.setState({ audioMuted: true }, () => {
        audioTracks.forEach((track) => {
          track.enabled = false;
        });
      });
    }
  }

  showVideo() {
    if (this.state.stream) {
      const localVideo = document.getElementById("local");
      const videoTracks = localVideo.srcObject.getVideoTracks();

      this.setState({ videoMuted: false }, () => {
        videoTracks.forEach((track) => {
          track.enabled = true;
        });
      });
    }
  }

  hideVideo() {
    if (this.state.stream) {
      const localVideo = document.getElementById("local");
      const videoTracks = localVideo.srcObject.getVideoTracks();

      this.setState({ videoMuted: true }, () => {
        videoTracks.forEach((track) => {
          track.enabled = false;
        });
      });
    }
  }

  getUserMedia() {
    return new Promise((resolve, reject) => {
      // ask for video

      const tryAudio = () => {
        return new Promise((resolve, reject) => {
          navigator.mediaDevices
            .getUserMedia({
              audio: {
                sampleSize: 8,
                echoCancellation: true,
              },
            })
            .then((audioSrc) => {
              const audioTracks = audioSrc.getAudioTracks();
              // If there is a video then we will add track if not set stream to audioSrc.
              if (this.state.stream) {
                audioTracks.forEach((track) => {
                  this.state.stream.addTrack(track);
                });
                this.setState({ hasAudio: true }, () => {
                  resolve();
                });
              } else {
                this.setState({ stream: audioSrc, hasAudio: true }, () => {
                  resolve();
                });
              }
            })
            .catch((err) => {
              resolve();
            });
        });
      };

      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((vidSrc) => {
          const localVideo = document.getElementById("local");
          localVideo.srcObject = vidSrc;
          localVideo.muted = true;
          localVideo.play();
          this.setState({ stream: vidSrc, hasVideo: true }, () => {
            tryAudio()
              .then(() => resolve())
              .catch((err) => resolve());
          });
        })
        .catch((err) => {
          console.log("video was not found.");
          tryAudio()
            .then(() => resolve())
            .catch((err) => {
              resolve();
            });
        });
    });
  }

  async componentDidMount() {
    const that = this;

    await this.getUserMedia();

    this.initializeQuill();
    const socket = io(window.location.origin, {
      query: `session=${this.state.sessionid}`,
    });
    socket.on("connect", function () {
      console.log(`Connection successful`);
    });
    socket.on('text change', function(msg) {
      console.log(msg);
      if (msg.who != that.state.userid) {
        const del = JSON.parse(msg.delta);
        that.quill.updateContents(del, msg.who);
      }
    });
    socket.on("info", function (data) {
      that.setState({ userid: data.myid });
      if (data?.roomInfo?.clientPresent && data?.roomInfo?.guidePresent) {
        that.initializePeer(socket);
      }
    });
    socket.on("activityPing", () => socket.emit("refresh"));
    socket.on("gotOffer", function (data) {
      console.log("receive an offer");
      that.replyOffer(socket, data);
    });
    socket.on("event", function (data) {
      console.log(data);
      if (data.type == "disconnect") {
        that.setState({ peer: null });
        document.getElementById("remote").srcObject = null;
      }
      if (data.type == "callStarted") {
        const startTime = data.startTime;
        that.setState({ startTime: startTime, callHasStarted: true });
      }
      if (data.type == "callEnd") {
        that.props.history.push(`/postcall/${that.state.sessionid}`);
      }
    });
    socket.on("answer", (offer) => {
      // replyOfferTODO: Connect first before asking for video source.
      console.log("got answer", this.state.peer);

      this.state.peer.signal(offer);
    });
    this.setState({ socket: socket });
  }

  componentWillUnmount() {
    this.state.socket?.disconnect();
    this.state.peer?.destroy();
    this.state.stream?.getTracks().forEach((track) => track.stop());
    document.getElementById("remote").srcObject = null;
    this.setState({ peer: null, stream: null, socket: null });
  }

  render() {
    let timerStart = 0;

    if (this.state.startTime) {
      timerStart = Date.now() - new Date(this.state.startTime).valueOf();
      console.log(timerStart);
    }
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
                <div className="level-left"></div>
                <div className="level-right icons">
                  {this.state.hasAudio && (
                    <span className="icon is-small has-text-white">
                      {!this.state.audioMuted ? (
                        <IoMdMic onClick={this.muteAudio} />
                      ) : (
                        <IoMdMicOff onClick={this.unmuteAudio} />
                      )}
                    </span>
                  )}
                  {this.state.hasVideo && (
                    <span className="icon is-small has-text-white">
                      {!this.state.videoMuted ? (
                        <IoIosEye onClick={this.hideVideo} />
                      ) : (
                        <IoIosEyeOff onClick={this.showVideo} />
                      )}
                    </span>
                  )}
                  {this.state.callHasStarted && (
                    <div className="field has-addons timer">
                      <div className="control">
                        <div className="input is-rounded is-small" readOnly>
                          {timerStart && (
                            <Timer initialTime={timerStart}>
                              <Timer.Minutes />:
                              <Timer.Seconds formatValue={value => value.toLocaleString('en-US', {minimumIntegerDigits: 2, useGrouping:false})}/>
                            </Timer>
                          )}
                        </div>
                      </div>
                      <div className="control">
                        <button
                          onClick={this.endCall}
                          className="button is-rounded is-small active"
                        >
                          <span
                            className="icon is-small has-text-white"
                            style={{
                              backgroundColor: "transparent",
                              transform: "rotate(135deg)",
                            }}
                          >
                            <IoMdCall />
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
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
