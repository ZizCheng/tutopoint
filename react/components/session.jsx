import React from "react";
import ReactDOM from "react-dom";
import { withRouter } from "react-router-dom";
import transportsAPI from "../api/transports.js";
import profileStore from "../store/profileStore.js";
import * as mediasoupClient from "mediasoup-client";

const produceVideo = async (sendTransport, device) => {
    
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const videoTrack = stream.getVideoTracks()[0];
      sendTransport.on("connect", async ({ dtlsParameters }, callback, errback) => {
        console.log('connected!!')
      // Signal local DTLS parameters to the server side transport.
      try {
        await transportsAPI.transportConnect(123, {
          transportsId: sendTransport.id,
          dtlsParameters: dtlsParameters
        });

        // Tell the transport that parameters were transmitted.
        callback();
      } catch (error) {
        // Tell the transport that something was wrong.
        errback(error);
      }
    });

    sendTransport.on("produce", async (parameters, callback, errback) => {
      // Signal parameters to the server side transport and retrieve the id of
      // the server side new producer.
      try {
        const data = await transportsAPI.transportProduce(123, {
          transportId: sendTransport.id,
          kind: parameters.kind,
          rtpParameters: parameters.rtpParameters,
          appData: parameters.appData
        });

        // Let's assume the server included the created producer id in the response
        // data object.
        const { id } = data;

        // Tell the transport that parameters were transmitted and provide it with the
        // server side producer's id.
 
        callback({ id });
      } catch (error) {
        // Tell the transport that something was wrong.
        errback(error);
      }
    });
      const producer = await sendTransport.produce({
        track: videoTrack
      });

      
}


class Session extends React.Component {
  constructor(props) {
    super(props);
    this.state = {profile: profileStore.getState()}

    this.receive = this.receive.bind(this);
  }

  async componentDidMount() {
    let device = new mediasoupClient.Device();
    const {
      transportOptions,
      routerRtpCapabilities,
      recv
    } = await transportsAPI.getSession(123);
    await device.load({ routerRtpCapabilities });

    console.log(device);

    let sendTransport;
    

    if (device.canProduce("video")) {
        // transportOptions["iceServers"] = [{urls: 'stun:stun.l.google.com:19302'}, {urls: 'turn:numb.viagenie.ca', username: 'tutopointauth@gmail.com', credential: 'tutopoint'}];
        sendTransport = device.createSendTransport(transportOptions);
        produceVideo(sendTransport, device);

        
        
        

    }

    this.setState({
        device: device,
        sendTransport: sendTransport,
        recv: recv
    })


  }

  async receive(){
    let recvTransport;
    let recv = this.state.recv;
    recvTransport = await this.state.device.createRecvTransport(recv);

    recvTransport.on("connect", async ({dtlsParameters}, callback, errback) => {
      // Signal local DTLS parameters to the server side transport.
      try {
        await transportsAPI.transportConnect(123, {
          transportsId: recvTransport.id,
          dtlsParameters: dtlsParameters
        }, "recv");

        // Tell the transport that parameters were transmitted.
        callback();
      } catch (error) {
        // Tell the transport that something was wrong.
        errback(error);
      }
    });

    // recv["iceServers"] = [{urls: 'stun:stun.l.google.com:19302'}, {urls: 'turn:numb.viagenie.ca', username: 'tutopointauth@gmail.com', credential: 'tutopoint'}];
    let consumer = await transportsAPI.transportRecv(123, {rtpCapabilities: this.state.device.rtpCapabilities});
    const DeviceConsumer = await recvTransport.consume(consumer.consumerData);
    
      // Render the remote video track into a HTML video element.
    const { track } = DeviceConsumer;
    
    document.getElementById("remoteVideo").srcObject = (new MediaStream([ track ]));
    document.getElementById("remoteVideo").play();
        
  }

  render() {
    return (
      <div>
        <h1>Session WIP</h1>
        <button onClick={this.receive}>getVideo</button>
        <video id="remoteVideo"></video>
      </div>
    );
  }
}

export default withRouter(Session);
