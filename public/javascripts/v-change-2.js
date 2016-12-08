// fork getUserMedia for multiple browser versions, for those
// that need prefixes

navigator.getUserMedia = (navigator.getUserMedia ||
navigator.webkitGetUserMedia ||
navigator.mozGetUserMedia ||
navigator.msGetUserMedia);

// set up forked web audio context, for multiple browsers
// window. is needed otherwise Safari explodes

// ***** To extract data from your audio source, you need an AnalyserNode,
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
// myScriptProcessor = audioCtx.createScriptProcessor(1024, 1, 1);

var source;
var stream;

var analyser = audioCtx.createAnalyser();
// human voice 1 -80 decibels. changing min and max made whole window disappear
analyser.minDecibels = -90;
analyser.maxDecibels = -10;
//an average between the current buffer and the last buffer the AnalyserNode processed, and results in a much smoother set of value changes over time.
analyser.smoothingTimeConstant = 0.85;

var distortion = audioCtx.createWaveShaper();
var gainNode = audioCtx.createGain();
var biquadFilter = audioCtx.createBiquadFilter();
var convolver = audioCtx.createConvolver();

// grab audio track via XHR for convolver node
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
    }, function(e){"Error with decoding audio data" + e.err});

    //soundSource.connect(audioCtx.destination);
    //soundSource.loop = true;
    //soundSource.start();
};

ajaxRequest.send();

// set up canvas context for visualizer
var canvas = document.querySelector('.visualizer');
var canvasCtx = canvas.getContext("2d");

var intendedWidth = document.querySelector('.wrapper').clientWidth;
// console.log("intendedWidth= " + intendedWidth);
canvas.setAttribute('width', intendedWidth);

// var halfIntendedWidth = intendedWidth / 2;
// canvas.setAttribute('width',halfIntendedWidth);
// console.log("canvas now halfIntendedWidth= " + halfIntendedWidth);

// var doubleIntendedWidth = intendedWidth * 2;
// canvas.setAttribute('width',doubleIntendedWidth);
// console.log("canvas now doubleIntendedWidth= " + doubleIntendedWidth);

// not much difference btwn quad and intended width
// var quadIntendedWidth = intendedWidth * 4;
// canvas.setAttribute('width',quadIntendedWidth);
// console.log("canvas now quadIntendedWidth= " + quadIntendedWidth);

var visualSelect = document.getElementById("visual");

var drawVisual;

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

// The voiced speech of a typical adult male will have a fundamental frequency from 85 to 180 Hz, and that of a typical adult female from 165 to 255 Hz.
function visualize() {
    WIDTH = canvas.width;
    HEIGHT = canvas.height;

    var visualSetting = visualSelect.value;
    console.log(visualSetting);

    if (visualSetting == "sinewave") {
        // representing the size of the FFT (Fast Fourier Transform) to be used to determine the frequency domain.
        // analyser.fftSize = 2048;
        analyser.fftSize = 1024;
        // analyser.fftSize = 512;
        // analyser.fftSize = 256;
        // analyser.fftSize = 128;
        var bufferLength = analyser.fftSize;
        console.log("bufferLength= " + bufferLength);
        // think I might have stumbled onto something here
        var dataArray = new Uint8Array(bufferLength);
        console.log("dataArray= " + dataArray);

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        function draw() {

            drawVisual = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);
            console.log("dataArray in draw()= " + dataArray);

            canvasCtx.fillStyle = 'rgb(0, 0, 26)';
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            canvasCtx.lineWidth = 1;
            canvasCtx.strokeStyle = 'rgb(179, 255, 255)';

            canvasCtx.beginPath();

            var sliceWidth = WIDTH * 4 / bufferLength;
            // var sliceWidth = WIDTH * 1 / bufferLength;
            var x = 0;

            for (var i = 0; i < bufferLength; i++) {

                var v = dataArray[i] / 128.0;
                var y = v * HEIGHT / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(canvas.width, canvas.height / 2);
            canvasCtx.stroke();
        }

        draw();

    } else if (visualSetting == "frequencybars") {
        // representing the size of the FFT (Fast Fourier Transform) to be used to determine the frequency domain.
        //with 2048, the bars are skinnier and prettier
        // analyser.fftSize = 4096;
        analyser.fftSize = 2048;
        // analyser.fftSize = 256;
        // unsigned long value half that of the FFT size
        // This generally equates to the number of data values you will have to play with for the visualization.
        var bufferLength = analyser.frequencyBinCount;
        // console.log("bufferLength= " + bufferLength);
        var dataArray = new Uint8Array(bufferLength);

        // canvasCtx.fillRect(128, 255, 255);
        // x =The x-coordinate of the upper-left corner of the rectangle to clear
        // y = The y-coordinate of the upper-left corner of the rectangle to clear
        // width = The width of the rectangle to clear, in pixels
        // height = The height of the rectangle to clear, in pixels

        //clear the canvas of what had been drawn on it before to get ready for the new visualization display
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        function draw() {

            drawVisual = requestAnimationFrame(draw);

            analyser.getByteFrequencyData(dataArray);
            // the below makes it look almost like a sinewave
            // analyser.getByteTimeDomainData(dataArray);

            // console.log(dataArray, dataArray.filter);
            var voiceFreqs = dataArray.filter(function(frequency){
                if(frequency >= 80 && frequency <= 255){
                    return true;
                } else {
                    return false;
                }
            });
            console.log(voiceFreqs);

            // voiceFreqs: 0 = few, 20 = a lot
            // new canvas size
            // 0 = 300 pageX20 = 500 px large
            var length = Math.min(voiceFreqs.length, 20) * 6 + 300;
            // var length = Math.min(voiceFreqs.length, 20) * 10 + 400;

            canvas.width = length;
            canvas.height = length;
            document.querySelector("body").style.backgroundColor = "#00001a";

            // midnight express blue
            // canvasCtx.fillStyle = 'rgb(32, 40, 59)';

            // canvas background
            canvasCtx.fillStyle = 'rgb(0, 0, 26)';

            // changing this x (350) and y (350) makes the bars stay
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            // var barWidth = (WIDTH / bufferLength) * 4;
            // var barWidth = (WIDTH / bufferLength) * 3;
            // var barWidth = (WIDTH / bufferLength) * 2;
            // bars skinnier than * 2
            var barWidth = (WIDTH / bufferLength);
            // var barWidth = (WIDTH / bufferLength) * 0.25;

            // human voice 85-255
            // barHeight = frequency
            var barHeight;
            var x = 0;

            for (var i = 0; i < bufferLength; i++) {
                barHeight = dataArray[i];

                // color of bars
                canvasCtx.fillStyle = 'rgb(179, 255, 255)';
                // canvasCtx.fillStyle = 'rgb(52, 149, 151)'; //179, 255, 255

                // other best so far
                // centered (ish) mirrored bars
                // canvasCtx.fillRect(x, HEIGHT - barHeight / 3, barWidth, barHeight / 2);

                canvasCtx.fillRect(x, HEIGHT - barHeight / 2, barWidth * 2, barHeight / 1.25);

                x += barWidth + 2;

            }
        }

        draw();

    } else if (visualSetting == "off") {
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        // canvasCtx.fillStyle = "cyan";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    }
}

// event listeners to change visualize and voice settings
visualSelect.onchange = function () {
    window.cancelAnimationFrame(drawVisual);
    visualize();
};

