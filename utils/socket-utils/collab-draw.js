//stores {roomId,id:socketId,userName}
let users = [];

//whiteboard elements
let elements = {};

const updateElementInElements = (roomId, elementData) => {
  //TODO uncomment if not working
  if (!elements[roomId]) {
    elements[roomId] = [elementData];
    return;
  }
  const index = elements[roomId].findIndex(
    (element) => element.id === elementData.id
  );

  if (index === -1) return elements[roomId].push(elementData);

  elements[roomId][index] = elementData;
  // elements = elementData;
};

const getElements = (roomId) => {
  if (!elements[roomId]) {
    elements[roomId] = [];
  }
  return elements[roomId];
};

const clearElements = (roomId) => {
  elements[roomId] = [];
};

//Adding user in a room
const addUser = ({ userName, roomId, socketId }) => {
  userName = userName.trim().toLowerCase();
  roomId = roomId.trim().toLowerCase();

  //If no username or roomId found
  if (!userName || !roomId) {
    return {
      error: 'Username and room are required',
    };
  }

  //No two users can have same username
  const existingUser = users.find(
    (user) => user.roomId === roomId && user.userName === userName
  );
  if (existingUser) {
    return {
      error: 'Username already exists!',
    };
  }

  //Updating the users list
  const user = { id: socketId, userName, roomId };
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
const getUsersInRoom = (roomId) => {
  return users.filter((user) => user.roomId === roomId);
};

module.exports = {
  addUser,
  removeUser,
  getUser,
  getUsersInRoom,
  updateElementInElements,
  clearElements,
  getElements,
};
