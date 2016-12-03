var socket = io();

$("#target").submit(function (event) {
    event.preventDefault();
    console.log('yay');
    var message = $('#m').val();

    alert("Handler for .submit() called.");
    socket.emit('message', message)
});

// on server, socket.on app.js listen