
window.onload = (event) => {
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
    //save notes

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
      console.log(stream);
      createVideo(stream);
    });

    peer.on('connect', function() {
      console.log('call has started.');
      peer.on('track', function(track, stream) {
        createVideo(stream);
      });
      callStart();
    });
    peer.on('error', (err) => {
      console.log(err);
    });
    return peer;
  }

  function createVideo(stream) {
    const vid = document.querySelector('#remoteVideo');
    vid.srcObject = stream;
    vid.load();
    vid.muted = false;
    vid.play();
  }

  function MakePeer(data, stream) {
    console.log('Request received');
    if (callStarted) {
    // Extra measure. Client is not able to create a new peer when it already has created a new peer.
      return;
    }
    client.gotAnswer = false;
    const peer = initPeer('init', stream);
    peer.on('signal', function(offer) {
      if (callStarted) {
        socket.emit('offer', {
          to: client.id,
          offer: offer,
        });
        return;
      }
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
    // Client already exist, do not creat a new one.
    if (callStarted) {
      client.peer.signal(data.offer);
      return;
    }
    const peer = initPeer('notInit', stream);
    peer.on('signal', (offer) => {
      if (callStarted) {
        socket.emit('answer', {
          to: client.id,
          offer: offer,
        });
        return;
      }
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
    // Client already exist, do not creat a new one.
    if (callStarted) {
      client.peer.signal(answer);
      return;
    }
    client.gotAnswer = true;
    const peer = client.peer;
    peer.signal(answer);
  }

  socket.on('backAnswer', SignalAnswer);
  socket.on('makeOffer', function(data) {
    client.id = data.from;
    MakePeer(data, video.srcObject);
  });
  socket.on('frontAnswer', function(data) {
    client.id = data.from;
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
      video.classList.contains('is-hidden') ? video.classList.remove('is-hidden') : video.classList.add('is-hidden');
  });

  $('#muteButton').click(function(ev) {
    video.srcObject.getAudioTracks()
        .forEach((track) => track.enabled = !(muteButton.children[1].innerHTML == '&nbsp;&nbsp;Mute'));

    if (muteButton.children[1].innerHTML == '&nbsp;&nbsp;Mute') {
      muteButton.children[1].innerHTML = '&nbsp;&nbsp;Unmute';
    } else {
      muteButton.children[1].innerHTML = '&nbsp;&nbsp;Mute';
    }
  });

  $('#deafenButton').click(function(ev) {
    remoteVideo.srcObject.getAudioTracks()
        .forEach((track) => track.enabled = !(deafenButton.children[1].innerHTML == '&nbsp;&nbsp;Deafen'));

    if (deafenButton.children[1].innerHTML == '&nbsp;&nbsp;Deafen') {
      deafenButton.children[1].innerHTML = '&nbsp;&nbsp;Undeafen';
    } else {
      deafenButton.children[1].innerHTML = '&nbsp;&nbsp;Deafen';
    }
  });

  $('#streamDisplayButton').click(function() {
    if (streamDisplayButton.children[1].innerHTML == '&nbsp;&nbsp;Share camera') {
      streamDisplayButton.children[1].innerHTML = '&nbsp;&nbsp;Share screen';
      navigator.mediaDevices.getUserMedia(getMediaConfig())
          .then((stream) => {
            const prevSrc = video.srcObject;
            prevSrc.getTracks()
                .forEach((track) => track.stop());
            video.srcObject = stream;
            video.classList.remove('is-hidden');
            video.play();
            client.peer.removeStream(prevSrc);
            client.peer.addStream(stream);
          })
          .catch((err) => console.log(err));
    } else {
      streamDisplayButton.children[1].innerHTML = '&nbsp;&nbsp;Share camera';
      gdmOptions = {
        video: {
          cursor: 'always',
        },
        audio: false,
      };
      navigator.mediaDevices.getDisplayMedia(gdmOptions)
          .then((stream) => {
            navigator.mediaDevices.getUserMedia({video: false, audio: getMediaConfig().audio})
                .then((streamAudio) => {
                  const prevSrc = video.srcObject;
                  prevSrc.getTracks()
                      .forEach((track) => track.stop());
                  video.srcObject = stream;
                  video.classList.remove('is-hidden');
                  video.play();
                  client.peer.removeStream(prevSrc);
                  client.peer.addStream(stream);
                  client.peer.addTrack(streamAudio.getAudioTracks()[0], stream);
                })
                .catch((err) => console.log(err));
          });
    }
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
  $( document ).ready(function() {
    init();
  });
  function init() {
    initSettings();
    endButton.style['display'] = 'none';
    startButton.setAttribute('disabled', '');



    endButton.addEventListener('click', function() {
      endCall();
    });
  }

  function initSettings() {
    settingsButton.addEventListener('click', function() {
      settingsOverlay.classList.remove('is-hidden');
    });

    closeSettingButton.addEventListener('click', function() {
      settingsOverlay.classList.add('is-hidden');
    });


    navigator.mediaDevices.enumerateDevices()
        .then((devices) => {
          if (devices.length == 0) {
            alert('You do not have a camera or audio');
          }
          cameraOptions.innerHTML = '';
          audioOptions.innerHTML = '';
          devices.forEach((device) => {
            if (device.kind == 'videoinput') {
              const cameraOption = document.createElement('option');
              cameraOption.text = device.label;
              cameraOption.value = device.deviceId;
              cameraOptions.appendChild(cameraOption);
            } else if (device.kind == 'audioinput') {
              const audioOption = document.createElement('option');
              audioOption.text = device.label;
              audioOption.value = device.deviceId;
              audioOptions.appendChild(audioOption);
            }
          });
          cameraOptions.selectedIndex = 0;
          audioOptions.selectedIndex = 0;

          navigator.mediaDevices.getUserMedia(getMediaConfig())
              .then((stream) => {
                video.srcObject = stream;
                video.muted = true;
                video.play();
                navigator.mediaDevices.enumerateDevices()
                    .then((devices) => {
                      video.srcObject.getTracks().forEach((track) => {
                        track.stop();
                      });
                      if (devices.length == 0) {
                        alert('You do not have a camera or audio');
                      }
                      cameraOptions.innerHTML = '';
                      audioOptions.innerHTML = '';
                      devices.forEach((device) => {
                        if (device.kind == 'videoinput') {
                          const cameraOption = document.createElement('option');
                          cameraOption.text = device.label;
                          cameraOption.value = device.deviceId;
                          cameraOptions.appendChild(cameraOption);
                        } else if (device.kind == 'audioinput') {
                          const audioOption = document.createElement('option');
                          audioOption.text = device.label;
                          audioOption.value = device.deviceId;
                          audioOptions.appendChild(audioOption);
                        }
                      });
                      cameraOptions.selectedIndex = 0;
                      audioOptions.selectedIndex = 0;

                      navigator.mediaDevices.getUserMedia(getMediaConfig())
                          .then((stream) => {
                            video.srcObject = stream;
                            video.muted = true;
                            video.play();
                          })
                          .catch((err) => console.log(err));
                    });
              })
              .catch((err) => console.log(err));
        });


    saveSettings.addEventListener('click', function() {
      const prevSrc = video.srcObject;
      prevSrc.getTracks()
          .forEach((track) => track.stop());
      navigator.mediaDevices.getUserMedia(getMediaConfig())
          .then((stream) => {
            video.srcObject = stream;
            video.muted = true;
            video.play();
            if (callStarted) {
              client.peer.removeStream(prevSrc);
              client.peer.addStream(stream);
            }
            settingsOverlay.classList.add('is-hidden');
          })
          .catch((err) => console.log(err));
    });
  }

  function getMediaConfig() {
    let camera = false;
    let audio = false;

    if (cameraOptions.options[cameraOptions.selectedIndex]) {
      camera = {deviceId: {exact: cameraOptions.options[cameraOptions.selectedIndex].value}};
    }
    if (audioOptions.options[audioOptions.selectedIndex]) {
      audio = {
        deviceId: {exact: audioOptions.options[audioOptions.selectedIndex].value},
        sampleRate: 48000,
        channelCount: 1,
        volume: 1.0,
      };
    }

    return {
      video: camera,
      audio: audio,
    };
  }

  function reconnect() {
    socket.emit('call');
  }

  function callStart() {
    whenCallStarted = new Date(Date.now());
    endButton.style['display'] = '';
    startButton.setAttribute('disabled', '');
    startButton.style['display'] = 'none';
    socket.emit('callStart');

    if (video.srcObject == '') {
      callStart = false;
      client.gotAnswer = false;

      reconnect();
    }

    //save notes interval
    console.log("starting save notes interval");
    setInterval(function() {
      console.log("saving notes");
      saveNotes();
    }, 3*1000);


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

  //save notes
  //if already saved, updates notes instead
  var notesId;
  function saveNotes() {
    console.log(quill.getContents());
    if(!notesId) {
      //createDocument
      fetch('/api/document', {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title: "Untitled Document",
          text: quill.getContents()
        })
      }).then((response) => response.text())
        .then((doc_id) => {
          notesId = JSON.parse(doc_id);
        });
    }
    else {
      //updateDocument
      fetch('/api/document/' + notesId, {
        method: 'PUT',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          title: "Untitled Document",
          text: quill.getContents()
        })
      });
    }
  }
};
