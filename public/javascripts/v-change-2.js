// fork getUserMedia for multiple browser versions, for those
// that need prefixes
navigator.getUserMedia = (navigator.getUserMedia ||
navigator.webkitGetUserMedia ||
navigator.mozGetUserMedia ||
navigator.msGetUserMedia);
// set up forked web audio context, for multiple browsers
// window. is needed otherwise Safari explodes
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var source;
var stream;
var analyser = audioCtx.createAnalyser();
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
analyser.smoothingTimeConstant = 0.85;
var distortion = audioCtx.createWaveShaper();
var gainNode = audioCtx.createGain();
var biquadFilter = audioCtx.createBiquadFilter();
var convolver = audioCtx.createConvolver();
var soundSource, concertHallBuffer;

ajaxRequest = new XMLHttpRequest();
ajaxRequest.open('GET', 'https://mdn.github.io/voice-change-o-matic/audio/concert-crowd.ogg', true);
ajaxRequest.responseType = 'arraybuffer';
ajaxRequest.onload = function () {
    var audioData = ajaxRequest.response;
    audioCtx.decodeAudioData(audioData, function (buffer) {
        concertHallBuffer = buffer;
        soundSource = audioCtx.createBufferSource();
        soundSource.buffer = concertHallBuffer;
    }, function (e) {
        "Error with decoding audio data" + e.err
    });
};
ajaxRequest.send();
// main block for doing the audio recording
if (navigator.getUserMedia) {
    console.log('getUserMedia supported.');
    navigator.getUserMedia(
        // constraints - only audio needed for this app
        {
            audio: true
        },

        // Success callback
        function (stream) {
            source = audioCtx.createMediaStreamSource(stream);
            source.connect(analyser);

            analyser.connect(distortion);
            distortion.connect(biquadFilter);
            biquadFilter.connect(convolver);
            convolver.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            visualize();
        },

        // Error callback
        function (err) {
            console.log('The following gUM error occured: ' + err);
        }
    );
} else {
    console.log('getUserMedia not supported on your browser!');
}


var canvas = document.querySelector('.visualizer');
var canvasCtx = canvas.getContext("2d");
var intendedWidth = document.querySelector('.wrapper').clientWidth;
canvas.setAttribute('width', intendedWidth);
var visualSetting = "frequencybars";
var drawVisual;
analyser.fftSize = 2048;
var bufferLength = analyser.frequencyBinCount;
var dataArray = new Uint8Array(bufferLength);
var voiceFreqs;
let start;
var WIDTH;
var HEIGHT;
var threeSecondsOfVoice = false;
var fiveSecondsOfVoice = false;
var circle = document.getElementById("circle");
circle.style.position = 'absolute';
var hue = 360;
var light = 0;
var lastAnimation = null;

// _.debounce(func, [wait=0], [options={}])
var randomAnimation = _.debounce(function randomAnimation2() {
    // console.log("animations.length= "+ animations.length);

    var animations = [
        changeBackground,
        changeBackground2,
        changeCanvasBackground,
        changeCanvasBackground2
    ];

    const length = animations.length;
    const rand = Math.floor(Math.random() * length);
    const animation = animations[rand];
    if (animation === lastAnimation) {
        return randomAnimation2();
    }
    lastAnimation = animation;
    return animation();
}, 100, {leading: true, trailing: false});
// couple this is randomAnimation()


function visualize(timestamp) {
    requestAnimationFrame(visualize);
    WIDTH = canvas.width;
    HEIGHT = canvas.height;
    canvasCtx.fillStyle = 'rgb(0, 0, 26)';



    if (threeSecondsOfVoice) {
        randomAnimation();
    }
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    if (fiveSecondsOfVoice) {
        canvasCtx.fillStyle = 'hsl(100, 80%, 25%)';
    }
    canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

    drawVoiceFreqs();
    resizeCanvas();
    hasBeenThree(timestamp);
    hasBeenFive(timestamp);
}

function changeBackground() {
console.log("changeBackground");
    function changeHue (){
        var col1 = Math.abs((hue % 720) - 360);
        var col2 = Math.abs( ( (hue+90) % 720) - 360);
        hue++ ;
        light++ ;
        document.body.style.background = 'linear-gradient(to right, hsl('+col1 +',70%, 75%) 0%,hsl('+col2 +',90%,75%) 100%)';
    }
    changeHue();
}
// changeBackground();
// canvasCtx.fillStyle = 'hsl(288, 100%, 50%)';

function changeBackground2() {
    console.log("changeBackground2");

    function changeHue (){
        var col1 = Math.abs((hue % 20) - 360);
        var col2 = Math.abs( ( (hue+80) % 700) - 360);
        hue++ ;
        light++ ;
        document.body.style.background = 'linear-gradient(to right, hsl('+col1 +',70%, 75%) 0%,hsl('+col2 +',90%,75%) 100%)';
    }
    changeHue();
}

function changeCanvasBackground() {
    console.log("changeCanvasBackground");

    canvasCtx.fillStyle = 'hsl(100, 80%, 25%)';
}

function changeCanvasBackground2() {
    console.log("changeCanvasBackground2");
    canvasCtx.fillStyle = 'hsl(200, 90%, 45%)';
}

function hasBeenThree(timestamp) {
    if (!start) start = timestamp;

    var voiceFreqs = dataArray.filter(function (frequency) {
        if (frequency >= 80 && frequency <= 255) {

            return true;
        } else {
            return false;
        }
    });
    if (voiceFreqs.length == 0) {
        start = timestamp;
    }
    var progress = timestamp - start;
    // console.log("progress= " + progress);

    if (progress > 3000) {
        console.log("threeSecondsOfVoice");
        threeSecondsOfVoice = true;
        // circle.style.left = Math.min(progress / 10, 200) + "px";
    } else {
        threeSecondsOfVoice = false;
    }
}
function hasBeenFive(timestamp) {
    if (!start) start = timestamp;

    var voiceFreqs = dataArray.filter(function (frequency) {
        if (frequency >= 80 && frequency <= 255) {

            return true;
        } else {
            return false;
        }
    });
    if (voiceFreqs.length == 0) {
        start = timestamp;
    }
    var progress = timestamp - start;
    // console.log("progress= " + progress);

    if (progress > 5000) {
        console.log("fiveSecondsOfVoice");

        fiveSecondsOfVoice = true;
        // circle.style.left = Math.min(progress / 10, 200) + "px";
    } else {
        fiveSecondsOfVoice = false;
    }
}

function drawVoiceFreqs() {

    analyser.getByteFrequencyData(dataArray);

    var barWidth = (WIDTH / bufferLength);
    var barHeight;
    var x = 0;

    for (var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];
        canvasCtx.fillStyle = 'rgb(179, 255, 255)'; // color of bars
        canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth * 2, barHeight / 1.25);
        x += barWidth + 2;
    }
}


function resizeCanvas() {

    var voiceFreqs = dataArray.filter(function (frequency) {
        if (frequency >= 80 && frequency <= 255) {
            return true;
        } else {
            return false;
        }
    });
    // console.log(voiceFreqs);

    var length = Math.min(voiceFreqs.length, 20) * 6 + 300;
    canvas.style.transform = "translate(length,length)";

    // var length = Math.min(voiceFreqs.length, 20) * 6 + 300;

    circle.style.width = length + "px";
    circle.style.height = length + "px";
}


// event listeners to change visualize and voice settings
// visualSelect.onchange = function () {
//     window.cancelAnimationFrame(drawVisual);
//     window.cancelAnimationFrame(step);
visualize();
// };


// document.querySelector("body").style.backgroundColor = "#00001a";

// extra calculation
// delta time
// diff btwn time from start

// zombie game
// class Game {
//     constructor (canvas) {
//         this.then = null;
//         this.canvas = canvas;
//         this.ctx = canvas.getContext('2d');;
//     }
//     run (now) {
//         requestAnimationFrame(this.run.bind(this));
//         if (!this.then) {this.then = performance.now()}
//         let dt = now - this.then;
//         this.then = now;
//
//         this.update(dt);
//         this.draw();
//     }
//     update (dt) {
//         actors.forEach(a => a.update(dt));
//     }
//     draw () {
//         this.ctx.save();
//         this.ctx.fillStyle = 'hsl(0, 50%, 90%)';
//         this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
//         this.ctx.restore();
//         actors.forEach(a => a.draw(this.ctx));
//     }
// }
//
// let canvas = document.getElementsByTagName('canvas')[0];
//
// const game = new Game(canvas);
// requestAnimationFrame(game.run.bind(game));

// ballpen

// let dt = 0;
// let lastTime = 0;

// function step (timestamp) {
//     requestAnimationFrame(step);
//     dt += timestamp - lastTime;
//     var progress = timestamp - start;
//     circle.style.left = Math.min(progress / 10, 200) + "px";
//     const seconds = (dt / 1000) % 2;
//     const height = -Math.pow((seconds - 1), 2) + 1;
//     console.log("timestamp= " + timestamp);
//     if (progress < 2000) {
//         window.requestAnimationFrame(step);
//     }
//     circle.style.transform = `translate(0, 100px) translate(${seconds * 100}px, ${height * -100}px)`;
//
//     // follower.update((timestamp - lastTime) / 1000);
//     // follower.draw();
//
//     lastTime = timestamp;
// }
//
// requestAnimationFrame(step);


// function animateCanvas(){
//     voiceFreqs = dataArray.filter(function (frequency) {
//         if (frequency >= 80 && frequency <= 255) {
//             return true;
//         } else {
//             return false;
//         }
//     });
//     // console.log(voiceFreqs);
//
//     var length = Math.min(voiceFreqs.length, 20) * 6 + 300;
//
//     // canvas.style.transform = "translate(length,length)";
//     canvas.width = length;
//     canvas.height = length;
// }