let gameRoom;
let myClientId;
let myChannel;
let totalUsers = 0;
let totalRooms = 0;
let mycolor;

const host = "http://localhost:3000/";

var roomState = {};
var socket = io();
let position = {
  x: 0,
  y: 100,
};

window.onload = init;
function init() {
	if (window.Event) {
	document.captureEvents(Event.MOUSEMOVE);
	}
	document.onmousemove = getCursorXY;
}

function getCursorXY (e) {
  position.x = (window.Event) ? e.pageX : event.clientX + (document.documentElement.scrollLeft ? document.documentElement.scrollLeft : document.body.scrollLeft);
  position.y = (window.Event) ? e.pageY : event.clientY + (document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop);
  socket.emit("change-user-position", position);
}

socket.on("update-room", function (data) {
  roomState = data;
  roomState.visitors.forEach(element => {
    console.log(element.x);
    let v = document.getElementById("visitor-" + element.id);
    if (!v) {
      v = document.createElement('div');
      v.id = "visitor-" + socket.id;
      v.classList.add('visitor-cursor');
      document.getElementById("main").append(v);
    }

    v.style.background = element.color;
    v.style.top = element.y - 12 + "px";
    v.style.left = element.x - 12  + "px";

  });
});

socket.on("player-connected", function (data) {
  roomState = data;
  myData = getMyData(socket.id);
  document.getElementById("roomid").innerHTML = roomState.roomId;
  document.getElementById("mycolor").value = myData.color;
  document.getElementById("mycolor").addEventListener('input', function (evt) {
    socket.emit("change-user-color", this.value);
  });
  socket.emit("change-user-position", position);
});

socket.on("update-totals", function (data) {
  document.getElementById("totalrooms").innerHTML = data.totalRooms;
  document.getElementById("totalvisitors").innerHTML = data.totalVisitors;
});

const getMyData = function (id) {
  return roomState.visitors.find(function (x) { return x.id === id });
};
