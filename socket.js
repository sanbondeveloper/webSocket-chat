const SocketIO = require('socket.io');

module.exports = (server) => {
  const io = SocketIO(server, { path: '/socket.io' });

  io.on('connection', (socket) => {
    const req = socket.request;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log('새로운 클라이언트 접속!', ip, socket.id, req.ip);

    socket.on('disconnect', () => {
      console.log('클라이언트 접속이 종료되었습니다.', ip, socket.id);
    });

    socket.on('error', (error) => {
      console.error(error);
    });
  });
};
