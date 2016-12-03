// Creating an audio context to build an audio graph upon
var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// Creating an audio source
// The createOscillator() method of the AudioContext interface creates an OscillatorNode,
// a source representing a periodic waveform. It basically generates a constant tone.
var oscillator = audioCtx.createOscillator();

// The createGain() method of the AudioContext interface creates a GainNode,
// which can be used to control the overall volume of the audio graph.
var gainNode = audioCtx.createGain();

// Linking source and destination together

// To actually output the tone through your speakers, you need to link them together.
// This is done by calling the connect method on the node you want to connect from,
// which is available on most node types. The node that you want to
// connect to is given as the argument of the connect method.
oscillator.connect(gainNode);

// The default output mechanism of your device (usually your device speakers)
// is accessed using AudioContext.destination.
gainNode.connect(audioCtx.destination);

source = audioCtx.createMediaStreamSource(stream);
source.connect(analyser);
analyser.connect(distortion);
distortion.connect(biquadFilter);
biquadFilter.connect(convolver);
convolver.connect(gainNode);
gainNode.connect(audioCtx.destination);

oscillator.type = 'sine'; // sine wave — other values are 'square', 'sawtooth', 'triangle' and 'custom'
oscillator.frequency.value = 2500; // value in hertz
oscillator.start();

var distortion = audioCtx.createWaveShaper();

function makeDistortionCurve(amount) {
    var k = typeof amount === 'number' ? amount : 50,
        n_samples = 44100,
        curve = new Float32Array(n_samples),
        deg = Math.PI / 180,
        i = 0,
        x;
    for ( ; i < n_samples; ++i ) {
        x = i * 2 / n_samples - 1;
        curve[i] = ( 3 + k ) * x * 20 * deg / ( Math.PI + k * Math.abs(x) );
    }
    return curve;
};

source.connect(analyser);
analyser.connect(distortion);
distortion.connect(biquadFilter);


distortion.curve = makeDistortionCurve(400);