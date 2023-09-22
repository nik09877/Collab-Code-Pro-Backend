const socketActions = require('../utils/socket-utils/socketActions');

const roomCode = {};

module.exports = function (io) {
  try {
    io.on(socketActions.CONNECTION, (socket) => {
      socket.on(socketActions.CODE_SYNC, ({ roomId }) => {
        if (!roomCode[roomId]) roomCode[roomId] = '';
        io.to(socket.id).emit(socketActions.CODE_SYNC, {
          code: roomCode[roomId],
        });
      });
      socket.on(socketActions.CODE_CHANGE, ({ code }) => {
        try {
          // Get the list of socket IDs of connected clients in the root namespace
          //get the room the current socket is in
          const sids = io.of('/').adapter.sids;
          const room = [...sids.get(socket.id)][1];

          if (!room) {
            return;
          }
          roomCode[room] = code;
          // want to send a message to all clients in the room except the sender (socket)
          socket.broadcast.to(room).emit(socketActions.CODE_CHANGE, { code });
        } catch (e) {
          console.log(e);
        }
      });
    });
  } catch (e) {
    console.log(e);
  }
};
