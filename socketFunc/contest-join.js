/** WORKFLOW
 * If FIRST USER JOINS WE CREATE A CONTEST
 * ELSE WE ALLOW THE USER TO JOIN THE CONTEST IF CONTEST HASN'T STARTED YET
 * WHEN WE DO START CONTEST WE FETCH ALL PROBLEMS USING AXIOS
 * THEN WE SEND THOSE PROBLEMS TO CLIENTS
 * WHEN SOMEONE WANTS TO SEE LEADERBOARD
 * WE CHECK WHICH PROBLEMS HAVEN'T BEEN SOLVED YET
 * THEN FOR EACH PROBLEM WE CHECK WHICH USER HAS SOLVED IT FIRST
 * THEN WE UPDATE THE PROBLEM DATA AND RATING OF USERS PARTICULARLY
 * AND RETURN THE RESULTS
 */
const axios = require('axios');
const {
  checkContest,
  removeContestUser,
  startContest,
  getTeamMembers,
  createURL,
  updateContest,
  getContestLength,
  deleteContests,
} = require('../utils/socket-utils/contest');
const socketActions = require('../utils/socket-utils/socketActions');

let DeleteIntervalOn = false;

module.exports = function (io) {
  try {
    io.on(socketActions.CONNECTION, (socket) => {
      socket.on(socketActions.CONTEST_JOIN, (user, callback) => {
        try {
          if (!user || !user.Name || !user.Name.trim()) {
            return callback({
              error: 'Update Codeforces Handle',
              contest: null,
            });
          }
          if (!user.RoomId || !user.RoomId.trim()) {
            return callback({ error: 'Invalid room Name', contest: null });
          }
          //HERE Name is cf handle
          const obj = checkContest(user.RoomId, user.Name, socket.id);

          console.log(obj.contest);
          if (obj.error) {
            return callback({ error: obj.error, contest: obj.contest });
          }

          //Delete Contests after 24 hours
          if (!DeleteIntervalOn) {
            console.log('Starting Interval');
            DeleteIntervalOn = true;
            const interval = setInterval(() => {
              console.log('deleting data.....');
              deleteContests();
              if (getContestLength() == 0) {
                console.log('Stopping Interval');
                DeleteIntervalOn = false;
                clearInterval(interval);
              }
            }, 24 * 60 * 60 * 1000);
          }

          socket.join(user.RoomId);
          console.log('contest-joined');
          callback({ error: obj.error, contest: obj.contest });

          const teamMembers = getTeamMembers(obj.contest.UsersId);
          io.in(user.RoomId).emit(socketActions.PEOPLE_IN_ROOM, {
            teamMembers,
            userJoin: user.Name.trim().toLowerCase(),
          });
        } catch (e) {
          console.log(e);
        }
      });

      socket.on(
        socketActions.START_CONTEST,
        ({ room, problemTags, minRating, maxRating, maxDuration }) => {
          try {
            socket.to(room).emit(socketActions.CONTEST_STARTING);
            problemTags = problemTags.map((tag) => tag.label);
            const URL = createURL(problemTags);
            axios
              .get(URL)
              .then((res) => {
                console.log(res);
                const problemArray = res.data.result.problems.slice(0);
                const contest = startContest({
                  room,
                  problemTags,
                  minRating,
                  maxRating,
                  problemArray,
                  maxDuration,
                });
                const teamMembers = getTeamMembers(contest.UsersId);
                io.to(room).emit(socketActions.UPDATE, contest); //First update then send memebers
              })
              .catch((e) => console.log(e));
          } catch (e) {
            console.log(e);
          }
        }
      );
      socket.on(socketActions.CONTEST_UPDATE, async ({ roomId }) => {
        try {
          const contest = await updateContest(roomId);
          console.log(contest);
          io.to(roomId).emit(socketActions.UPDATE, contest);
        } catch (e) {
          console.log(e);
        }
      });
      socket.on(socketActions.LEAVE_CONTEST, (user) => {
        try {
          console.log('contest-Left');
          const contest = removeContestUser({
            roomId: user.roomId,
            name: user.name,
          });
          console.log(contest);
          const teamMembers = getTeamMembers(contest.UsersId);
          console.log(teamMembers);
          io.to(user.room).emit(socketActions.PEOPLE_IN_ROOM, {
            teamMembers,
            userLeft: user.name.trim().toLowerCase(),
          });
          socket.leave(user.room);
        } catch (e) {
          console.log(e);
        }
      });
    });
  } catch (e) {
    console.log(e);
  }
};
