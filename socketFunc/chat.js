const { getUser } = require('../utils/socket-utils/users');
const socketActions = require('../utils/socket-utils/socketActions');

module.exports = function (io) {
  try {
    io.on(socketActions.CONNECTION, (socket) => {
      socket.on(socketActions.CLIENT_MSG, ({ message }) => {
        try {
          const user = getUser(socket.id);
          if (!user) {
            return;
          }
          const data = { text: message, user: user.username };
          //   emit an event to all clients who are in a specific room
          io.to(user.room).emit(socketActions.SERVER_MSG, data);
        } catch (e) {
          console.log(e);
        }
      });

      socket.on(socketActions.CONTEST_MSG, ({ message, room, name }) => {
        try {
          const data = { text: message, user: name };
          //   emit an event to all clients who are in a specific room
          io.to(room).emit(socketActions.SERVER_MSG, data);
        } catch (e) {
          console.log(e);
        }
      });
    });
  } catch (e) {
    console.log(e);
  }
};
