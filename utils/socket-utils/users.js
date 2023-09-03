//stores {room:roomId,id:socketId,username:username}
const users = [];

//stores {room:roomId,password:roomPassword}
//TODO Confused about what is getting stored
const passwordList = [];

//Adding user in a room
const addUser = ({ id, username, room, password }) => {
  username = username.trim().toLowerCase();
  room = room.trim().toLowerCase();
  password = password.trim();

  //If no username or roomId found
  if (!username || !room) {
    return {
      error: 'Username and room are required',
    };
  }

  //No two users can have same username
  const existingUser = users.find(
    (user) => user.room === room && user.username === username
  );
  if (existingUser) {
    return {
      error: 'Username already exists!',
    };
  }

  //Validating the room password
  const roomPassword = passwordList.find((roomPassword) => {
    return roomPassword.room === room;
  });
  //room exists
  if (roomPassword) {
    if (roomPassword.password !== password)
      return { error: 'Password did not match !' };
  }
  //create new room
  else {
    const p = { room, password };
    passwordList.push(p);
  }

  //Updating the users list
  const user = { id, username, room };
  users.push(user);
  return { user };
};

//removing the user by filtering the user id
const removeUser = (id) => {
  const index = users.findIndex((user) => user.id === id);
  if (index !== -1) return users.splice(index, 1)[0];
  else return null;
};

//returns a user
const getUser = (id) => {
  return users.find((user) => user.id === id);
};

//Returning a list of users
const getUsersInRoom = (room) => {
  return users.filter((user) => user.room === room);
};

//removing the room from the list
const removePassword = (room) => {
  const index = passwordList.findIndex(
    (roomPassword) => roomPassword.room === room
  );

  if (index !== -1) return passwordList.splice(index, 1)[0];
  else return null;
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  removePassword,
};
