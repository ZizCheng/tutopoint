const Peer = require('simple-peer');
const socket = io(window.location.origin, {query: `session=${sessionid}`});
const video = document.querySelector('#localVideo');
const client = {};
let callStarted = false;
// get stream

socket.on('connect', () => {
  console.log('connected');
});
socket.on('forceDisconnect', function() {
  console.log('Socket disconnected');
  socket.disconnect();
  client.peer.destroy();
  endCall();
  window.location = '/session/postcall';
});
socket.on('guideConnected', function() {
  pushNotification('Good news', 'Guide has connected!', 'is-success', 30000);
  socket.emit('replyGuideConnected');
  enableCall();
});
socket.on('clientConnected', function() {
  pushNotification('Good news', 'Client has connected!', 'is-success', 30000);
  socket.emit('replyClientConnected');
  enableCall();
});
socket.on('notifyClientHasConnected', function() {
  pushNotification('Good news', 'Client has connected!', 'is-success', 30000);
  enableCall();
});
socket.on('notifyGuideHasConnected', function() {
  pushNotification('Good news', 'Guide has connected!', 'is-success', 30000);
  enableCall();
});
navigator.mediaDevices.getUserMedia({video: true, audio: {
  sampleRate: 48000,
  channelCount: 2,
  volume: 1.0,
}})
    .then((stream) => {
      video.srcObject = stream;
      video.muted = true;
      video.play();
    })
    .catch((err) => console.log(err));

// used to initialize a peer
function initPeer(type, stream) {
  const initConfig = {
    initiator: (type == 'init') ? true : false,
    stream: stream,
    trickle: false,
    config: {iceServers: [{urls: 'stun:stun.l.google.com:19302'}, {urls: 'stun:global.stun.twilio.com:3478?transport=udp'}, {urls: 'turn:numb.viagenie.ca', username: 'tutopointauth@gmail.com', credential: 'tutopoint'}]},
  };
  const peer = new Peer(initConfig);
  peer.on('stream', function(stream) {
    createVideo(stream);
  });
  peer.on('connect', function() {
    callStart();
  });
  return peer;
}

function createVideo(stream) {
  const vid = document.querySelector('#remoteVideo');
  vid.srcObject = stream;
  vid.muted = false;
  vid.play();
}

function MakePeer(data, stream) {
  console.log('Request received');
  client.gotAnswer = false;
  const peer = initPeer('init', stream);
  peer.on('signal', function(offer) {
    if (!client.gotAnswer) {
      socket.emit('offer', {
        to: data.from,
        offer: offer,
      });
    }
  });
  client.peer = peer;
}

function FrontAnswer(data, stream) {
  console.log('Offer received');
  const peer = initPeer('notInit', stream);
  peer.on('signal', (offer) => {
    socket.emit('answer', {
      to: data.from,
      offer: offer,
    });
  });
  peer.signal(data.offer);
  client.peer = peer;
}

function SignalAnswer(answer) {
  console.log('got answer');
  client.gotAnswer = true;
  const peer = client.peer;
  peer.signal(answer);
}

socket.on('backAnswer', SignalAnswer);
socket.on('makeOffer', function(data) {
  MakePeer(data, video.srcObject);
});
socket.on('frontAnswer', function(data) {
  FrontAnswer(data, video.srcObject);
});


$('#startButton').click(function() {
  console.log('call logged.');
  socket.emit('call');
});

$('#reconnectButton').click(function() {
  reconnect();
});

$('#hideButton').click(function() {
  video.srcObject.getVideoTracks()
      .forEach((track) => track.enabled = !track.enabled);
});

$('#muteButton').click(function() {
  video.srcObject.getAudioTracks()
      .forEach((track) => track.enabled = !track.enabled);
});

$('#streamDisplayButton').click(function() {
  navigator.mediaDevices.getDisplayMedia()
      .then((stream) => {
        const prevSrc = video.srcObject;
        video.srcObject = stream;
        reconnect();
        video.play();
        prevSrc.getTracks()
            .forEach((track) => track.stop());
      });
});

$('#videoButton').click(function() {
  navigator.mediaDevices.getUserMedia({video: true, audio: true})
      .then((stream) => {
        const prevSrc = video.srcObject;
        video.srcObject = stream;
        reconnect();
        video.play();
        prevSrc.getTracks()
            .forEach((track) => track.stop());
      });
});


const quill = new Quill('#editor', {
  theme: 'snow',
});


quill.on('text-change', function(delta, oldDelta, source) {
  console.log(source);
  if (source === 'user') {
    const data = {'who': socket.id, 'delta': JSON.stringify(delta)};
    socket.emit('text change', data);
  }
});

socket.on('text change', function(msg) {
  console.log(msg);
  if (msg.who != socket.id) {
    const del = JSON.parse(msg.delta);
    quill.updateContents(del, msg.who);
  }
});

socket.on('notification', function(msg) {
  pushNotification(msg.title, msg.message, msg.style, 30000);
});


// Start
let whenCallStarted;
let intervalProcess;
init();
function init() {
  endButton.style['display'] = 'none';
  startButton.setAttribute('disabled', '');

  endButton.addEventListener('click', function() {
    endCall();
  });
}

function reconnect() {
  socket.emit('call');
}

function callStart() {
  if (callStarted) {
    return;
  }
  whenCallStarted = new Date(Date.now());
  endButton.style['display'] = '';
  startButton.setAttribute('disabled', '');
  startButton.style['display'] = 'none';
  socket.emit('callStart');
  intervalProcess = setInterval(() => {
    displayTimer();
  }, 1000);
  callStarted = true;
}

function endCall() {
  clearInterval(intervalProcess);
  socket.emit('callEnd');
}

function enableCall() {
  startButton.removeAttribute('disabled');
  startButton.style['display'] = '';
}

function displayTimer() {
  const diff = parseInt(Date.now() - whenCallStarted) / 1000;
  const seconds = pad(parseInt(diff % 60));
  const minutes = pad(parseInt(diff / 60));
  timerDisplay.textContent = `${minutes}:${seconds}`;
}

function pad(val) {
  const valString = val + '';
  if (valString.length < 2) {
    return '0' + valString;
  } else {
    return valString;
  }
}


function deleteNotification(el) {
  const parentArticle = el.parentElement.parentElement;
  notification.removeChild(parentArticle);
}

function pushNotification(title, message, type, timer = null) {
  const notificationElement = document.createElement('article');
  notificationElement.setAttribute('class', `message ${type}`);

  const messageInnerHtml = `
         <div class=\"message-header\">
                  <p>${title}</p>
                  <button class=\"delete\" aria-label=\"delete\"></button>
                </div>
                <div class=\"message-body\">
                    ${message}
                </div>`;
  notificationElement.innerHTML = messageInnerHtml;

  notification.appendChild(notificationElement);
  const button = notificationElement.querySelector('button[class=\'delete\'');
  button.addEventListener('click', function(ev) {
    deleteNotification(ev.srcElement);
  });
  if (timer != null && !
  isNaN(timer)) {
    setTimeout(() => {
      deleteNotification(button);
    }, timer);
  }
}
