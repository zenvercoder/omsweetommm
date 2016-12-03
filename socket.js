var io = require('socket.io')();

io.on('connection', function(socket){

    console.log("hello!");
});

module.exports = io;