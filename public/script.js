let gameRoom;
let myClientId;
let myChannel;
let totalUsers = 0;
let totalRooms = 0;
let mycolor;
let edgeSize = 100;
var timer = null;
const lang_cs = document.getElementsByClassName("lang-cs");
const lang_en = document.getElementsByClassName("lang-en");

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

function getCursorXY(e) {
  position.x = window.Event
    ? e.pageX
    : event.clientX +
      (document.documentElement.scrollLeft
        ? document.documentElement.scrollLeft
        : document.body.scrollLeft);
  position.y = window.Event
    ? e.pageY
    : event.clientY +
      (document.documentElement.scrollTop
        ? document.documentElement.scrollTop
        : document.body.scrollTop);
  socket.emit("change-user-position", position);
  var viewportWidth = document.documentElement.clientWidth;
  var edgeLeft = edgeSize;
  var edgeRight = viewportWidth - edgeSize;
  var isInLeftEdge =
    position.x < document.documentElement.scrollLeft + edgeLeft;
  var isInRightEdge =
    position.x > document.documentElement.scrollLeft + edgeRight;

  if (!(isInLeftEdge || isInRightEdge)) {
    clearTimeout(timer);
    return;
  }
  var documentWidth = Math.max(
    document.body.scrollWidth,
    document.body.offsetWidth,
    document.body.clientWidth,
    document.documentElement.scrollWidth,
    document.documentElement.offsetWidth,
    document.documentElement.clientWidth
  );
  var maxScrollX = documentWidth - viewportWidth;
  (function checkForWindowScroll() {
    clearTimeout(timer);

    if (adjustWindowScroll()) {
      timer = setTimeout(checkForWindowScroll, 30);
    }
  })();

  function adjustWindowScroll() {
    var currentScrollX = window.pageXOffset;
    var canScrollLeft = currentScrollX > 0;
    var canScrollRight = currentScrollX < maxScrollX;
    var nextScrollX = currentScrollX;

    if (isInLeftEdge && canScrollLeft) {
      var intensity = (edgeLeft - position.x) / edgeSize;

      nextScrollX = nextScrollX - 5;
    } else if (isInRightEdge && canScrollRight) {
      var intensity = (position.x - edgeRight) / edgeSize;

      nextScrollX = nextScrollX + 5;
    }

    if (nextScrollX !== currentScrollX) {
      if (nextScrollX > currentScrollX) position.x += 5;
      else position.x -= 5;
      socket.emit("change-user-position", position);
      let v = document.getElementById("visitor-" + socket.id);
      v.style.top = position.y + "px";
      v.style.left = position.x - 9 + "px";
      window.scrollTo(nextScrollX, 0);
      return true;
    } else {
      return false;
    }
  }
}

socket.on("update-room", function (data) {
  roomState = data;
  roomState.visitors.forEach((element) => {
    let v = document.getElementById("visitor-" + element.id);
    if (!v) {
      v = document.createElement("div");
      v.id = "visitor-" + element.id;
      v.classList.add("visitor-cursor");
      document.getElementById("main").append(v);
    }

    v.style.background = element.color;
    v.style.top = element.y + "px";
    v.style.left = element.x - 9 + "px";
  });
});

socket.on("player-connected", function (data) {
  roomState = data;
  myData = getMyData(socket.id);
  document.getElementById("roomid").innerHTML = roomState.roomId;
  document.getElementById("mycolor").value = myData.color;
  document.getElementById("mycolor").addEventListener("input", function (evt) {
    socket.emit("change-user-color", this.value);
  });
  socket.emit("change-user-position", position);
});

socket.on("player-leave", function (data) {
  let v = document.getElementById("visitor-" + data);
  if (v) v.remove();
});

socket.on("update-totals", function (data) {
  document.getElementById("totalrooms").innerHTML = data.totalRooms;
  document.getElementById("totalvisitors").innerHTML = data.totalVisitors;
});

const getMyData = function (id) {
  return roomState.visitors.find(function (x) {
    return x.id === id;
  });
};

const pointer = function () {
  let v = document.getElementById("visitor-" + socket.id);
  if (v) {
    v.classList.add("pointer");
  }
};

const base = function () {
  let v = document.getElementById("visitor-" + socket.id);
  if (v) {
    v.classList.remove("pointer");
  }
};

const setlang = function (lang) {
  var i;
  if (lang == "cs") {
    for (i = 0; i < lang_en.length; i++) {
      lang_en[i].style.display = "none";
    }
    for (i = 0; i < lang_cs.length; i++) {
      lang_cs[i].style.display = "block";
    }
  } else {
    for (i = 0; i < lang_cs.length; i++) {
      lang_cs[i].style.display = "none";
    }
    for (i = 0; i < lang_en.length; i++) {
      lang_en[i].style.display = "block";
    }
  }
};
