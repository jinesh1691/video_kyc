﻿//our username 
var name;
var connectedUser;

//connecting to our signaling server 
//var conn = new WebSocket('wss://echo.websocket.org/');
var conn = new WebSocket('wss://chatkyc.herokuapp.com/');



conn.onopen = function () {
    console.log("Connected to the signaling server");
};



//when we got a message from a signaling server 
conn.onmessage = function (msg) {
    console.log("Got message", msg.data);

    var data = JSON.parse(msg.data);

    switch (data.type) {
        case "login":
            handleLogin(data.success);
            break;
        //when somebody wants to call us 
        case "offer":
            handleOffer(data.offer, data.name);
            break;
        case "answer":
            handleAnswer(data.answer);
            break;
        //when a remote peer sends an ice candidate to us 
        case "candidate":
            handleCandidate(data.candidate);
            break;
        case "leave":
            handleLeave();
            break;
        default:
            break;
    }
};

conn.onerror = function (err) {
    console.log("Got error", err);
};

//alias for sending JSON encoded messages 
function send(message) {
    //attach the other peer username to our messages 
    if (connectedUser) {
        message.name = connectedUser;
    }

    conn.send(JSON.stringify(message));
};




//****** 
//UI selectors block 
//****** 

var loginPage = document.querySelector('#loginPage');
var usernameInput = document.querySelector('#usernameInput');
var loginBtn = document.querySelector('#loginBtn');

var callPage = document.querySelector('#callPage');
var callToUsernameInput = document.querySelector('#callToUsernameInput');
var callBtn = document.querySelector('#callBtn');

var hangUpBtn = document.querySelector('#hangUpBtn');

//hide call page 
callPage.style.display = "none";

// Login when the user clicks the button 
loginBtn.addEventListener("click", function (event) {
    name = usernameInput.value;

    if (name.length > 0) {
        send({
            type: "login",
            name: name
        });
    }

});


//async function getMedia(pc) {
//    let stream = null;

//    try {
//        stream = await navigator.mediaDevices.getUserMedia(constraints);
//        /* use the stream */
//    } catch (err) {
//        /* handle the error */
//    }
//}

function handleLogin(success) {

    if (success === false) {
        alert("Ooops...try a different username");
    } else {
        loginPage.style.display = "none";
        callPage.style.display = "block";

        //********************** 
        //Starting a peer connection 
        //********************** 

        //getting local video stream 
        //navigator.webkitGetUserMedia({ video: true, audio: true }, function (myStream) {

        //Set Web Camera resolution using https://test.webrtc.org/
        
        //navigator.getUserMedia = navigator.getUserMedia ||
        //    navigator.webkitGetUserMedia ||
        //    navigator.mozGetUserMedia;
        //if (navigator.getUserMedia) {
        //    console.log('Found..');
        //}
        //else {
        //    console.log('Not Found..');
        //}
        //navigator.webkitGetUserMedia({ video: { width: 320, height: 240 }, audio:  false , function (myStream) {
        navigator.getUserMedia({ video: { width: 320, height: 240 }, audio: {
    autoGainControl: false,
    channelCount: 2,
    echoCancellation: false,
    latency: 0,
    noiseSuppression: false,
    sampleRate: 48000,
    sampleSize: 16
  } }, function (myStream) {
            stream = myStream;

            //displaying local video stream on the page 
            //localVideo.src = stream; //window.URL.createObjectURL(stream);
            localVideo.srcObject = stream;
            //using Google public stun server 
            var configuration = {iceServers: 
                                 { "iceServers": [{ "url": "stun:stun.l.google.com:19302" }] },
                                    constraints: { 'mandatory': { 'OfferToReceiveAudio': true, 'OfferToReceiveVideo': true } 
                                 }};

            yourConn = new webkitRTCPeerConnection(configuration);

            // setup stream listening 
            yourConn.addStream(stream);

            //when a remote user adds stream to the peer connection, we display it 
            yourConn.onaddstream = function (e) {
                //remoteVideo.src = window.URL.createObjectURL(e.stream);
                remoteVideo.srcObject = e.stream;
            };

            // Setup ice handling 
            yourConn.onicecandidate = function (event) {

                if (event.candidate) {
                    send({
                        type: "candidate",
                        candidate: event.candidate
                    });
                }

            };

        }, function (error) {
            console.log(error);
        });
    }
};

var localVideo = document.querySelector('#localVideo');
var remoteVideo = document.querySelector('#remoteVideo');

var yourConn;
var stream;



//initiating a call 
callBtn.addEventListener("click", function () {
    var callToUsername = callToUsernameInput.value;

    if (callToUsername.length > 0) {

        connectedUser = callToUsername;

        // create an offer
        yourConn.createOffer(function (offer) {
            send({
                type: "offer",
                offer: offer
            });

            yourConn.setLocalDescription(offer);

        }, function (error) {
            alert("Error when creating an offer");
        });
    }
});

//when somebody sends us an offer 
function handleOffer(offer, name) {
    connectedUser = name;
    yourConn.setRemoteDescription(new RTCSessionDescription(offer));

    //create an answer to an offer 
    yourConn.createAnswer(function (answer) {
        yourConn.setLocalDescription(answer);

        send({
            type: "answer",
            answer: answer
        });

    }, function (error) {
        alert("Error when creating an answer");
    });
};

//when we got an answer from a remote user 
function handleAnswer(answer) {
    yourConn.setRemoteDescription(new RTCSessionDescription(answer));
};

//when we got an ice candidate from a remote user 
function handleCandidate(candidate) {
    yourConn.addIceCandidate(new RTCIceCandidate(candidate));
};

//hang up 
hangUpBtn.addEventListener("click", function () {

    send({
        type: "leave"
    });

    handleLeave();
});

function handleLeave() {
    connectedUser = null;
    remoteVideo.src = null;

    yourConn.close();
    yourConn.onicecandidate = null;
    yourConn.onaddstream = null;
};


//Click Photo
var startbutton = document.querySelector('#PhotoBtn');
var canvas = document.querySelector('#canvas');
var photo = document.querySelector('#photo');
var width = 320;    // We will scale the photo width to this
var height = 320;     // This will be computed based on the input stream

canvas.setAttribute('width', width);
canvas.setAttribute('height', height);

startbutton.addEventListener('click', function (ev) {
    console.log(width);
    takepicture();
    ev.preventDefault();
}, false);


function clearphoto() {
    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
}

// Capture a photo by fetching the current contents of the video
// and drawing it into a canvas, then converting that to a PNG
// format data URL. By drawing it on an offscreen canvas and then
// drawing that to the screen, we can change its size and/or apply
// other changes before drawing it.

function takepicture() {
    var context = canvas.getContext('2d');
    if (width && height) {
        canvas.width = width;
        canvas.height = height;
        context.drawImage(remoteVideo, 0, 0, width, height);

        var data = canvas.toDataURL('image/png');
        console.log(canvas.toDataURL('image/png'));
        photo.setAttribute('src', data);
    } else {
        clearphoto();
    }
}
