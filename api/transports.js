const express = require('express');
const transports = new express.Router();
const mediasoup = require('mediasoup');

// Single worker per core. Mixed with other stuff right now.
// Only call within server. Need redis.
let worker = null;

const rooms = {};

const mediaCodecs = [
  {
    kind: 'audio',
    mimeType: 'audio/opus',
    clockRate: 48000,
    channels: 2,
  },
  {
    kind: 'video',
    mimeType: 'video/H264',
    clockRate: 90000,
    parameters: {
      'packetization-mode': 1,
      'profile-level-id': '42e01f',
      'level-asymmetry-allowed': 1,
    },
  },
  {
    kind: 'video',
    mimeType: 'video/VP8',
    clockRate: 90000,
  },
];


function handleIO(socket) {
  const profileid = socket.request.session.passport ? socket.request.session.passport.user : null;
  const sessionid = socket.request._query['sessionid'];
  if (profileid == null || sessionid == null) return;

  else {
    socket.join(sessionid);
    handleIOConnectTransport(socket, profileid, sessionid);
    initializeSocketUser(socket, profileid, sessionid);
  }
}

async function initializeSocketUser(socket, profileid, sessionid) {
  if (!rooms[sessionid]) {
    await createRouter(sessionid);
  }

  subscribeUser(socket, profileid, sessionid);
  await createTransportForUser(sessionid, profileid);

  const router = rooms[sessionid].router;
  const {id, iceParameters, iceCandidates, dtlsParameters} = rooms[sessionid][profileid].video;
  const {id: a_id, iceParameters: a_iceParameters, iceCandidates: a_iceCandidates, dtlsParameters: a_dtlsParameters} = rooms[sessionid][profileid].audio;

  const reply = {
    routerRtpCapabilities: router.rtpCapabilities,
    videoTransportOptions: {id, iceParameters, iceCandidates, dtlsParameters},
    audioTransportOptions: {id: a_id, iceParameters: a_iceParameters, iceCandidates: a_iceCandidates, dtlsParameters: a_dtlsParameters},
  };

  socket.emit('connectInfo', reply);
}

function handleIOConnectTransport(socket, profileid, sessionid) {
  socket.on('connectRTC', function({dtlsParameters, kind, tag}) {
    const profileTransports = rooms[sessionid][profileid];
    console.log('conect');
    let transport;
    if (tag == undefined) {
      console.log('prod');
      if (kind == 'video') {
        transport = profileTransports.video;
      } else if (kind == 'audio') {
        transport = profileTransports.audio;
      }
    }
    if (tag != undefined) {
      console.log(tag);
      if (kind == 'video') {
        transport = profileTransports[tag].videoTransport;
      }
      if (kind == 'audio') {
        transport = profileTransports[tag].audioTransport;
      }
    }
    socket.to(sessionid).emit('CheckStreams');
    transport.connect({dtlsParameters});
  });

  socket.on('produce', async function(producerData) {
    const profileTransports = rooms[sessionid][profileid];
    let transport;
    if (producerData.kind == 'video') {
      transport = profileTransports.video;
      const producer = await transport.produce(producerData);
      profileTransports.videoProducer = producer;
      socket.emit('producerCallback', producer);
    }
    if (producerData.kind == 'audio') {
      transport = profileTransports.audio;
      const producer = await transport.produce(producerData);
      profileTransports.audioProducer = producer;
      socket.emit('producerCallback', producer);
    }
  });

  socket.on('consume', async function({tag, rtpCapabilities, type}) {
    const profileTransports = rooms[sessionid][profileid];
    profileTransports[tag] = {};
    const router = rooms[sessionid].router;
    if (type == 'video') {
      if (router.canConsume({producerId: tag, rtpCapabilities: rtpCapabilities})) {
        const videoReceive = await router.createWebRtcTransport({
          listenIps: ['10.0.0.171', '127.0.0.1'],
          announcedIp: '73.140.155.16',
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
          enableSctp: true,
        });

        videoReceive.on('icestatechange', (iceState) => {
          console.log('FUCKING YES ICE state changed to %s', iceState);
        });

        profileTransports[tag].videoTransport = await videoReceive;
        profileTransports[tag].videoConsumer = await profileTransports[tag].videoTransport.consume({producerId: tag, rtpCapabilities: rtpCapabilities});
        const {id: a_id, iceParameters: a_iceParameters, iceCandidates: a_iceCandidates, dtlsParameters: a_dtlsParameters} = videoReceive;
        const {id, producerId, kind, rtpParameters} = profileTransports[tag].videoConsumer;
        socket.emit('receiveConsumer', {producerId: tag, type: type, consumerInfo: {id, producerId, kind, rtpParameters}, transportOptions: {id: a_id, iceParameters: a_iceParameters, iceCandidates: a_iceCandidates, dtlsParameters: a_dtlsParameters}});
      }
    } else if (type == 'audio') {
      if (router.canConsume({producerId: tag, rtpCapabilities: rtpCapabilities})) {
        const audioReceive = await router.createWebRtcTransport({
          listenIps: ['10.0.0.171', '127.0.0.1'],
          announcedIp: '73.140.155.16',
          enableUdp: true,
          enableTcp: true,
          preferUdp: true,
          enableSctp: true,
        });

        profileTransports[tag].audioTransport = await audioReceive;
        profileTransports[tag].audioConsumer = await profileTransports[tag].audioTransport.consume({producerId: tag, rtpCapabilities: rtpCapabilities});

        const {id: a_id, iceParameters: a_iceParameters, iceCandidates: a_iceCandidates, dtlsParameters: a_dtlsParameters} = audioReceive;
        const {id, producerId, kind, rtpParameters} = profileTransports[tag].audioConsumer;
        socket.emit('receiveConsumer', {producerId: tag, type: type, consumerInfo: {id, producerId, kind, rtpParameters}, transportOptions: {id: a_id, iceParameters: a_iceParameters, iceCandidates: a_iceCandidates, dtlsParameters: a_dtlsParameters}});
      }
    }
  });
}

async function subscribeUser(socket, profileid, sessionid) {
  socket.on('getAllStreams', function() {
    const room = rooms[sessionid];
    const profiles = Object.keys(room)
        .filter((item) => {
          if (item == 'router' || item == profileid) {
            return false;
          } else {
            return true;
          }
        })
        .map((profile) => {
          const profileObj = rooms[sessionid][profile];
          const ret = {};

          if (profileObj.videoProducer != undefined) {
            ret['videoTag'] = profileObj.videoProducer.id;
          }
          if (profileObj.audioProducer != undefined) {
            ret['audioTag'] = profileObj.audioProducer.id;
          }

          return ret;
        });

    socket.emit('AllStreams', profiles);
  });
}


async function createWorker() {
  try {
    worker = await mediasoup.createWorker({
      loglevel: 'warn',
    });
  } catch (e) {
    console.log(e);
  }

  worker.observer.on('newrouter', (router) => {
    console.log('new router created [id:%s]', router.id);
  });
}

async function createRouter(id) {
  const router = await worker.createRouter({mediaCodecs});
  if (rooms[id]) {
    return false;
  } else {
    rooms[id] = {
      router: router,
    };
    return true;
  }
}

async function createTransportForUser(roomid, userid) {
  const router = rooms[roomid].router;

  const videoRtc= await router.createWebRtcTransport({
    listenIps: ['10.0.0.171', '127.0.0.1'],
    announcedIp: '73.140.155.16',
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    enableSctp: true,
  });

  const audioRtc = await router.createWebRtcTransport({
    listenIps: ['10.0.0.171', '127.0.0.1'],
    announcedIp: '73.140.155.16',
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    enableSctp: true,
  });

  videoRtc.on('icestatechange', (iceState) => {
    console.log('Video ICE state changed to %s', iceState);
  });

  audioRtc.on('icestatechange', (iceState) => {
    console.log('Audio ICE state changed to %s', iceState);
  });


  rooms[roomid][userid] = {audio: audioRtc, video: videoRtc};
}

function init() {
  createWorker();
  mediasoup.observer.on('newworker', (worker) => {
    console.log('new worker created [pid:%d]', worker.pid);
  });
}

module.exports = {
  router: transports,
  initialize: init,
  handleIO: handleIO,
};
