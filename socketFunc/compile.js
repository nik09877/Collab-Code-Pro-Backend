const { compilerFunc } = require('../utils/compilerFunc');
const socketActions = require('../utils/socket-utils/socketActions');

// const { getUser } = require('../utils/socket-utils/users');

module.exports = function (io) {
  try {
    io.on(socketActions.CONNECTION, (socket) => {
      socket.on(
        socketActions.COMPILE_ON,
        ({ language, code, input, reason }) => {
          try {
            // Get the list of socket IDs of connected clients in the root namespace
            //get the room the current socket is in
            const sids = io.of('/').adapter.sids;
            const room = [...sids.get(socket.id)][1];

            //FIXME Try to uncomment if something doesn't work
            // const rooms = socket.rooms;
            // const roomNames = Object.keys(rooms);
            // const room = roomNames[0];
            if (!room) {
              return;
            }

            // want to send a message to all clients in the room except the sender (socket)
            if (reason === 'code-editor')
              socket.broadcast.to(room).emit(socketActions.COMPILE_ON);

            compilerFunc(language, code, input)
              .then((res) => {
                // console.log(res);
                if (reason === 'code-editor')
                  io.to(room).emit(socketActions.COMPILE_OFF, res.data);
                //   send a message to a specific client
                else io.to(socket.id).emit(socketActions.COMPILE_OFF, res.data);
              })
              .catch((e) => {
                if (reason === 'code-editor')
                  io.to(room).emit(socketActions.COMPILE_OFF, e.data);
                else io.to(socket.id).emit(socketActions.COMPILE_OFF, res.data);
                // else io.to(socket.id).emit(socketActions.COMPILE_OFF, e.data);
              });
          } catch (e) {
            // console.log(e);
          }
        }
      );
    });
  } catch (e) {
    console.log(e);
  }
};
