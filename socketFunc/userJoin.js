const axios = require('axios');
const {
  addUser,
  removeUser,
  getUsersInRoom,
  removePassword,
} = require('../utils/socket-utils/users');
const socketActions = require('../utils/socket-utils/socketActions');

module.exports = function (io) {
  try {
    io.on(socketActions.CONNECTION, (socket) => {
      socket.on(
        socketActions.JOIN,
        ({ username, room, password = 'password' }, callback) => {
          try {
            const { error, user } = addUser({
              id: socket.id,
              username,
              room,
              password,
            });

            if (error) {
              return callback({ error });
            }
            try {
              socket.join(user.room);

              console.log('A new user joined', user.room, user.username);
            } catch (e) {
              return console.log("can't join");
            }

            //To get data for newly connected client from the room
            const socketsInstances = async () => {
              try {
                // Fetch sockets in the specified room
                const clients = await io.in(user.room).fetchSockets();

                const teamMembers = getUsersInRoom(user.room);

                io.to(user.room).emit(socketActions.PEOPLE_IN_ROOM, {
                  teamMembers,
                  userJoin: user.username,
                });
                //counts how many users are active in room
                let res = '';
                if (clients.length > 1) {
                  //make functions for getting data
                  let askedCnt = 0;

                  for (const client of clients) {
                    if (askedCnt == 5) break;
                    if (client.id === socket.id) continue;

                    askedCnt++;
                    io.to(client.id).emit(socketActions.SEND_INITIAL_IO, {
                      id: socket.id,
                    });
                  }
                }
              } catch (e) {
                console.log(e);
              }
            };

            socketsInstances();
            return callback({ user });
          } catch (e) {
            console.log(e);
          }
        }
      );

      socket.on(socketActions.TAKE_INITIAL_IO, (data) => {
        try {
          if (data.reason === 'code-editor') {
            console.log(
              socketActions.TAKE_INITIAL_IO,
              data.inputText,
              data.outputText
            );
            io.to(data.id).emit(socketActions.IO_RECEIVED, {
              inputText: data.inputText,
              outputText: data.outputText,
            });
          }
        } catch (e) {
          console.log(e);
        }
      });

      //real-time updates on the change in IO
      socket.on(socketActions.CHANGE_IO, (data) => {
        try {
          if (data.reason === 'code-editor') {
            //FIXME Uncomment if doesn;t work
            // const sids = io.of('/').adapter.sids; //sids gives map of every user socketid to its room
            // const room = [...sids.get(socket.id)][1];

            //get the room the current socket is in
            const rooms = socket.rooms;
            const roomNames = Object.keys(rooms);
            const room = roomNames[0];

            if (!room) return;
            // emit a message to all sockets in a specific room,
            // except the sender of the message
            socket.broadcast.to(room).emit(socketActions.IO_RECEIVED, data);
          }
        } catch (e) {
          console.log(e);
        }
      });

      //Disconnecting the user and updating , notifying other people in the room about the user
      socket.on(socketActions.DISCONNECT, () => {
        try {
          const user = removeUser(socket.id);

          if (!user) return;

          // console.log('disconnecting', user);
          console.log('user disconnected');

          if (user) {
            try {
              const socketsInstances = async () => {
                const clients = await io.in(user.room).fetchSockets();
                const teamMembers = getUsersInRoom(user.room);
                if (clients.length) {
                  io.to(user.room).emit(socketActions.PEOPLE_IN_ROOM, {
                    teamMembers,
                    userLeft: user.username,
                  });
                }

                if (clients.length == 0) {
                  removePassword(user.room);
                }
                socket.leave(user.room);
              };
              socketsInstances();
            } catch (e) {
              console.log(e);
            }
          }
        } catch (e) {
          console.log(e);
        }
      });
    });
  } catch (e) {
    console.log(e);
  }
};
