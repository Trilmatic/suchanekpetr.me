const envConfig = require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const p2 = require("p2");
const { Console } = require("console");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MAX_VISITORS = 20;

let rooms = [];
let intervals = [];
let totals = {
  totalRooms: 0,
  totalVisitors: 0,
};

app.use(express.static("public"));

app.get("/", (request, response) => {
  response.header("Access-Control-Allow-Origin", "*");
  response.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  response.sendFile(__dirname + "/views/index.html");
});

const listener = app.listen(process.env.PORT, () => {});

io.listen(listener);

io.on("connection", (socket) => {
  let playerRoom = null;
  socket.join(socket.id);
  playerRoom = findRoomForPlayer();
  socket.join(playerRoom);
  rooms[playerRoom].visitors.push({
    id: socket.id,
    x: 0,
    y: 100,
    color: randColor(),
  });

  totals.totalVisitors++;

  //console.log("player " + socket.id + " connected to room " + playerRoom);
  io.in(playerRoom).emit("player-connected", rooms[playerRoom]);
  io.in(playerRoom).emit("update-room", rooms[playerRoom]);
  io.emit("update-totals", totals);

  /*if (rooms[data.room] != undefined) {
    let room = rooms[data.room];
    if (room.visitors.length >= MAX_VISITORS) {
      callback({
        status: "denied",
      });
    } else {
      socket.join(data.room);
      playerRoom = data.room;
    }
  } else {
    /*let interval = setInterval(function () {
      let i;
      for (i = rooms[data.room].bullets.length - 1; i >= 0; i -= 1) {
        let b = rooms[data.room].bullets[i];
        if (b.travel_time < b.travel_time_max) {
          let speed = 45;
          switch (b.start_cords.direction) {
            case "left":
              b.current_cords.x -= speed;
              break;
            case "right":
              b.current_cords.x += speed;
              break;
            case "up":
              b.current_cords.y -= speed;
              break;
            case "down":
              b.current_cords.y += speed;
              break;
          }

          b.travel_time += 100;
        } else {
          rooms[data.room].bullets.splice(i, 1);
        }
      }
      io.in(playerRoom).emit(
        "update-room-bullets",
        rooms[playerRoom].bullets
      );
    }, 20);*/

  //intervals[data.room] = interval;
  /*rooms[data.room] = room;
  socket.join(data.room);
  playerRoom = data.room;
}*/

  socket.on("change-user-color", function (color) {
    let v = findVisitorInRoom(playerRoom, socket.id);
    v.color = color;
    //io.in(playerRoom).emit("update-room", rooms[playerRoom]);
  });

  socket.on("change-user-position", function (position) {
    let v = findVisitorInRoom(playerRoom, socket.id);
    v.x = position.x;
    v.y = position.y;
    //io.in(playerRoom).emit("update-room", rooms[playerRoom]);
  });

  //io.in(playerRoom).emit("update-room-players", rooms[playerRoom].players);
  /*});*/

  socket.on("disconnect", () => {
    if (playerRoom) {
      let room = rooms[playerRoom];
      if (room) {
        let p = room.visitors.findIndex(function (i) {
          return i.id === socket.id;
        });
        room.visitors.splice(p, 1);

        if (room.visitors.length == 0) {
          socket.leave(playerRoom);
          socket.leave(socket.id);
          if (intervals[playerRoom]) clearInterval(intervals[playerRoom]);
          delete intervals[playerRoom];
          delete rooms[playerRoom];
          totals.totalRooms--;
        } else {
          io.in(playerRoom).emit("player-leave", socket.id);
          socket.leave(playerRoom);
          socket.leave(socket.id);
        }

        totals.totalVisitors--;
        io.emit("update-totals", totals);
      }
    }
  });
});

const createRoom = function () {
  let roomId = uniqueId();
  if (rooms[roomId]) roomId = createRoom();

  let room = {
    visitors: [],
    roomId: roomId,
  };
  rooms[roomId] = room;
  totals.totalRooms++;
  createRoomInterval(roomId);
  return roomId;
};

const createRoomInterval = function (roomId) {
  let interval = setInterval(function () {
    io.in(roomId).emit("update-room", rooms[roomId]);
  }, 15);

  intervals[roomId] = interval;
};

const randColor = function () {
  return "#" + Math.floor(Math.random() * 16777215).toString(16);
};

const findRoomForPlayer = function () {
  for (const property in rooms) {
    if (Object.keys(rooms[property].visitors).length < MAX_VISITORS) {
      return property;
    }
  }
  return createRoom();
};

const findVisitorInRoom = function (playerRoom, id) {
  return rooms[playerRoom].visitors.find(function (x) {
    return x.id === id;
  });
};

const uniqueId = function () {
  return Math.random().toString(36).substr(2, 16);
};
