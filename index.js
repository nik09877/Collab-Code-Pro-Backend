const http = require('http');
const express = require('express');
const cors = require('cors');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.get('/', (req, res) => {
  res.send('Hello from the server!');
});

//CREATE Socket.io SERVER
const io = new Server(server, {
  cors: {
    origin: '*', //allow all connections
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  },
});

require('./socketFunc/userJoin')(io);
require('./socketFunc/chat')(io);
require('./socketFunc/compile')(io);
require('./socketFunc/problem')(io);
require('./socketFunc/contest-join')(io);
require('./socketFunc/collab-draw-join')(io);

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`listening on port ${PORT}`));
