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

transports.post('/connect', async function(req, res) {
  const roomid = req.body.roomid;
  const profileid = req.user.id;
  if (!rooms[roomid]) {
    await createRouter(roomid);
  }
  const router = rooms[roomid].router;

  await createTransportForUser(roomid, profileid);

  const webRtcTransport = rooms[roomid][profileid].webRtcTransport;
  const {id, iceParameters, iceCandidates, dtlsParameters} = webRtcTransport;

  const recvwebRtcTransport = rooms[roomid][profileid].recv;
  const {id: recvid, iceParameters: recviceParameters, iceCandidates: recviceCandidates, dtlsParameters: recvdtlsParameters} = recvwebRtcTransport;
  res.json({
    message: 'success',
    routerRtpCapabilities: router.rtpCapabilities,
    transportOptions: {id, iceParameters, iceCandidates, dtlsParameters},
    recv: {id: recvid, iceParameters: recviceParameters, iceCandidates: recviceCandidates, dtlsParameters: recvdtlsParameters},
  });
});

transports.post('/transportConnect', async function(req, res) {
  const roomid = req.body.roomid;
  const profileid = req.user.id;
  let web;
  if (req.body.type == 'recv') {
    web = rooms[roomid][profileid].recv;
  } else {
    web = rooms[roomid][profileid].webRtcTransport;
  }

  const dtlsParameters = req.body.dtlsParameters;
  web.connect({dtlsParameters});
  res.json({message: 'ok'});
});

transports.post('/transportProduce', async function(req, res) {
  const roomid = req.body.roomid;
  const profileid = req.user.id;
  const web = rooms[roomid][profileid].webRtcTransport;
  const producer = await web.produce({
    kind: req.body.kind,
    rtpParameters: req.body.rtpParameters,
  });
  rooms[roomid][profileid]['producer'] = producer;
  res.json({message: 'ok', producerId: producer.id});
});

transports.post('/transportsReceive', async function(req, res) {
  const roomid = req.body.roomid;
  const profileid = req.user.id;
  const rtpCapabilities = await req.body.rtpCapabilities;
  const producerId = rooms[roomid][profileid]['producer'].id;
  console.log(producerId);
  const router = rooms[roomid].router;

  if (router.canConsume({producerId: producerId, rtpCapabilities: rtpCapabilities})) {
    const consumer = await rooms[roomid][profileid].recv.consume({producerId: producerId, rtpCapabilities: rtpCapabilities});
    const {id, producerId: c_producerId, rtpParameters, kind} = consumer;


    res.json({message: 'ok', consumerData: {id, producerId: c_producerId, rtpParameters, kind}});
  } else {
    res.json({error: 'Cannot consume. Incompatible Codecs.'});
  }
});

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

  const webRtcTransport = await router.createWebRtcTransport({
    listenIps: ['10.0.0.171', '127.0.0.1'],
    announcedIp: '73.140.155.16',
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    enableSctp: true,
  });

  const recvWebRtcTransport = await router.createWebRtcTransport({
    listenIps: ['10.0.0.171', '127.0.0.1'],
    announcedIp: '73.140.155.16',
    enableUdp: true,
    enableTcp: true,
    preferUdp: true,
    enableSctp: true,
  });

  webRtcTransport.on('icestatechange', (iceState) => {
    console.log('ICE state changed to %s', iceState);
  });

  const plainRtpTransport = await router.createPlainRtpTransport({
    listenIp: '10.0.0.171',
    announcedIp: '73.140.155.16',
    rtcpMux: true,
    comedia: true,
  });

  rooms[roomid][userid] = {webRtcTransport: webRtcTransport, plain: plainRtpTransport, recv: recvWebRtcTransport};
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
};
