let Peer = require('simple-peer')
let socket = io(window.location.origin, {query: `session=${sessionid}`})
const video = document.querySelector('#localVideo')
let client = {}
let currentFilter
//get stream

socket.on('connect', () => {
  console.log("connected")
});
socket.on('forceDisconnect', function(){
  console.log("Socket disconnected")
  socket.disconnect();
})
navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
        video.srcObject = stream
        video.muted = true;
        video.play()
        //used to initialize a peer
        function InitPeer(type) {
            let peer = new Peer({ initiator: (type == 'init') ? true : false, stream: stream, trickle: false })
            peer.on('stream', function (stream) {
                CreateVideo(stream)
            })
            return peer
        }

        function CreateVideo(stream) {
            var vid = document.querySelector('#remoteVideo');
            vid.srcObject = stream;
            vid.muted = false;
            vid.play();

        }

        function MakePeer(data) {
            console.log("Request received")
            client.gotAnswer = false
            let peer = InitPeer('init')
            peer.on('signal', function (offer) {
                if (!client.gotAnswer) {
                    socket.emit('offer', {
                      to: data.from,
                      offer: offer
                    })
                }
            })
            client.peer = peer
        }

        function FrontAnswer(data) {
          console.log("Offer received")
            let peer = InitPeer('notInit')
            peer.on('signal', (offer) => {
                socket.emit('answer', {
                  to: data.from,
                  offer: offer
                })
            })
            peer.signal(data.offer)
            client.peer = peer
        }

        function SignalAnswer(answer) {
          console.log("got answer");
            client.gotAnswer = true
            let peer = client.peer
            peer.signal(answer)
        }

        socket.on('backAnswer', SignalAnswer)
        socket.on("makeOffer", MakePeer)
        socket.on("frontAnswer", FrontAnswer)

    })
    .catch(err => console.log(err))

document.getElementById("join").addEventListener('click', function(){
  socket.emit('call');
})


var quill = new Quill('#editor', {
 theme: 'snow'
});


quill.on('text-change', function(delta, oldDelta, source) {
  console.log(source)
  if (source === 'user') {
    socket.emit('text change', {'who': socket.id, 'delta': JSON.stringify(delta)});
  }
});

socket.on('text change', function(msg){
  console.log(msg);
  if(msg.who != socket.id) {
    var del = JSON.parse(msg.delta);
    quill.updateContents(del, msg.who);
  }
});
