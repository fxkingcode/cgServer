module.exports = (io) => {
  io.sockets.on('connection', function(socket) {
    console.log("연결")
    socket.on('disconnect', function() {
        console.log('DISCONNESSO!!! ');
      });
  });
}
