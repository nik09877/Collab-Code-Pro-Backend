const {
  addUser,
  updateElementInElements,
  clearElements,
  removeUser,
  getUser,
  getElements,
} = require('../utils/socket-utils/collab-draw');
const socketActions = require('../utils/socket-utils/socketActions');

module.exports = function (io) {
  try {
    io.on(socketActions.CONNECTION, (socket) => {
      socket.on(
        socketActions.COLLAB_DRAW_JOIN,
        ({ userName, roomId }, callback) => {
          const { error, user } = addUser({
            userName,
            roomId,
            socketId: socket.id,
          });
          if (error) {
            return callback({ error });
          }

          // console.log('user joined', user);
          socket.join(roomId);

          const sendUpdate = async () => {
            const elements = getElements(roomId);
            // send the elements to individual socketid (private message)
            io.to(socket.id).emit(socketActions.WHITEBOARD_STATE, elements);
            //send joined message to all users except current socket
            socket.to(roomId).emit(socketActions.COLLAB_DRAW_JOIN, user);
          };
          sendUpdate();

          return callback({ user });
        }
      );

      //when a client updates an element
      socket.on(socketActions.ELEMENT_UPDATE, (elementData) => {
        // Find the rooms the current socket is in
        const { roomId } = getUser(socket.id);

        // console.log('received elements update');
        updateElementInElements(roomId, elementData);

        //emit this to all clients except the client who sent it
        socket.to(roomId).emit(socketActions.ELEMENT_UPDATE, elementData);
      });

      ///////ON WHITEBIARD CLEAR EVENT
      socket.on(socketActions.WHITEBOARD_CLEAR, () => {
        // Find the rooms the current socket is in
        const { roomId } = getUser(socket.id);

        clearElements(roomId);
        // console.log('received whiteboard clear');

        //emit this to all clients except the client who sent it
        socket.to(roomId).emit(socketActions.WHITEBOARD_CLEAR);
      });

      socket.on(socketActions.CURSOR_POSITION, (cursorData) => {
        // console.log('received cursor position');

        // Find the rooms the current socket is in
        const { roomId } = getUser(socket.id);

        socket.to(roomId).emit(socketActions.CURSOR_POSITION, {
          ...cursorData,
          userId: socket.id,
        });
      });

      socket.on(socketActions.DISCONNECT, () => {
        const user = removeUser(socket.id);
        if (!user) {
          //  console.log('user is not in the room');
          return;
        }
        // console.log('user disconnected', user);

        socket
          .to(user.roomId)
          .emit(socketActions.COLLAB_DRAW_USER_DISCONNECTED, user);

        socket.leave(user.roomId);
      });
    });
  } catch (e) {
    console.log(e);
  }
};
