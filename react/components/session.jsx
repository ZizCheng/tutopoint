import React from "react";
import ReactDOM from "react-dom";
import { withRouter } from "react-router-dom";
import transportsAPI from "../api/transports.js";
import profileStore from "../store/profileStore.js";
import io from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";
import { SSM } from "aws-sdk";

const produce = async (sendTransport, device, socket, type) => {
  let stream;
  let track;

  if (type == "video") {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    track = stream.getVideoTracks()[0];
  } else if (type == "audio") {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    track = stream.getAudioTracks()[0];
  }

  sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
    try {
      socket.emit("connectRTC", {
        transportsId: sendTransport.id,
        dtlsParameters: dtlsParameters,
        kind: type
      });
      callback();
    } catch (error) {
      errback(error);
    }
  });

  sendTransport.on("produce", async (parameters, callback, errback) => {
    try {
      console.log("We should be here.");
      socket.emit("produce", {
        transportId: sendTransport.id,
        kind: parameters.kind,
        rtpParameters: parameters.rtpParameters,
        appData: parameters.appData
      });
      socket.on("producerCallback", function(data) {
        const { id } = data;
        callback({ id });
      });
    } catch (error) {
      errback(error);
    }
  });
  const producer = await sendTransport.produce({
    track: track
  });
};

class Session extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      profile: profileStore.getState(),
      sessionid: `sessionid=${props.match.params.id}`
    };

    this.receive = this.receive.bind(this);
  }

  async componentDidMount() {
    const socket = io(window.location.origin, { query: this.state.sessionid });
    document.getElementById("remoteVideo").srcObject = new MediaStream();
    socket.on("connectInfo", async function({
      audioTransportOptions,
      videoTransportOptions,
      routerRtpCapabilities
    }) {
      let device = new mediasoupClient.Device();
      audioTransportOptions["iceServers"] = [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:numb.viagenie.ca",
          username: "tutopointauth@gmail.com",
          credential: "tutopoint"
        }
      ];

      videoTransportOptions["iceServers"] = [
        { urls: "stun:stun.l.google.com:19302" },
        {
          urls: "turn:numb.viagenie.ca",
          username: "tutopointauth@gmail.com",
          credential: "tutopoint"
        }
      ];

      await device.load({ routerRtpCapabilities });
      console.log(device);
      if (device.canProduce("video")) {
        let sendTransport = device.createSendTransport(videoTransportOptions);
        produce(sendTransport, device, socket, "video");
      }

      if (device.canProduce("audio")) {
        let sendTransport = device.createSendTransport(audioTransportOptions);
        produce(sendTransport, device, socket, "audio");
      }

      socket.on("receiveConsumer", async function(data) {
        console.log(data)
        let transportOptions = data.transportOptions;
        const consumerInfo = data.consumerInfo;
        const producerId = data.producerId;
        const type = data.type;
        transportOptions["iceServers"] = [
          { urls: "stun:stun.l.google.com:19302" },
          {
            urls: "turn:numb.viagenie.ca",
            username: "tutopointauth@gmail.com",
            credential: "tutopoint"
          }
        ];
        let recvTransport = await device.createRecvTransport(transportOptions);

        recvTransport.on(
          "connect",
          async ({ dtlsParameters }, callback, errback) => {
            try {
              socket.emit("connectRTC", {
                transportsId: recvTransport.id,
                dtlsParameters: dtlsParameters,
                kind: type,
                tag: producerId
              });

              callback();
            } catch (error) {
              errback(error);
            }
          }
        );

        const DeviceConsumer = await recvTransport.consume(consumerInfo);
        const { track } = DeviceConsumer;


        document.getElementById("remoteVideo").srcObject.addTrack(track);
        document.getElementById("remoteVideo").play();
       
        
      });

      socket.on("AllStreams", async function(data) {
        if (data.length > 0) {
          const stream = data[0];
          const videoTag = stream.videoTag;
          const audioTag = stream.audioTag;
          socket.emit("consume", {
            tag: videoTag,
            rtpCapabilities: device.rtpCapabilities,
            type: "video"
          });
          socket.emit("consume", {
            tag: audioTag,
            rtpCapabilities: device.rtpCapabilities,
            type: "audio"
          });
          // consume(socket, audioTag, device, "audio")
        } else{
          console.log("checking streams")
          setTimeout(() => {socket.emit("getAllStreams")}, 1000)
        }
      });

      socket.on("CheckStream", function(){
        socket.emit("getAllStreams");
      });

      socket.emit("getAllStreams");

      
    });
  }

  async receive() {
    socket.emit("getAllStreams");
  }

  render() {
    return (
      <div>
        <h1>Session WIP</h1>
        <button onClick={this.receive}>getVideo</button>
        <video id="remoteVideo" controls></video>
      </div>
    );
  }
}

export default withRouter(Session);
