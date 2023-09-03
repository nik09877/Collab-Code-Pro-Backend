const { compilerFunc } = require('../utils/compilerFunc');
const socketActions = require('../utils/socket-utils/socketActions');

// const { getUser } = require('../utils/socket-utils/users');

module.exports = function (io) {
  try {
    io.on(socketActions.CONNECTION, (socket) => {
      socket.on(
        socketActions.Compile_ON,
        ({ language, code, input, reason }) => {
          try {
            //FIXME Try to uncomment if something doesn't work
            // Get the list of socket IDs of connected clients in the root namespace
            // const sids = io.of('/').adapter.sids;
            // const room = [...sids.get(socket.id)][1]; //Get all t

            //get the room the current socket is in
            const rooms = socket.rooms;
            const roomNames = Object.keys(rooms);
            const room = roomNames[0];
            if (!room) {
              return;
            }

            // want to send a message to all clients in the room except the sender (socket)
            if (reason === 'code-editor')
              socket.broadcast.to(room).emit(socketActions.Compile_ON);

            compilerFunc(language, code, input)
              .then((res) => {
                //FIXME check if returned res has data property
                if (reason === 'code-editor')
                  io.to(room).emit(socketActions.COMPILE_OFF, res.data);
                //   send a message to a specific client
                else io.to(socket.id).emit(socketActions.COMPILE_OFF, res.data);
              })
              .catch((e) => {
                if (reason === 'code-editor')
                  io.to(room).emit(socketActions.COMPILE_OFF, e.data);
                //FIXME uncomment if not working
                // else io.to(socket.id).emit(socketActions.COMPILE_OFF, res.data);
                else io.to(socket.id).emit(socketActions.COMPILE_OFF, e.data);
              });
          } catch (e) {
            console.log(e);
          }
        }
      );
    });
  } catch (e) {
    console.log(e);
  }
};
