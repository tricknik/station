
var runCamera = function(channel) {
  var socket = io.connect('/channel/' + channel);
  var camera = document.getElementById('camera');
  var canvas = document.getElementById('frame');
  var frame = canvas.getContext('2d');
  socket.on('connect', function () {
    navigator.getUserMedia("video", function(stream) {
      camera.src = stream; 
      socket.on('ready', function() {
        var newsize = function(size, min, max) {
          var size = (size * Math.random()) + (size * Math.random()); 
          if (size < min) size = max * 0.9;
          if (size > max) size = min * 1.1;
          return size;
        }

        var roll = Math.random();
        if (roll < 0.025) {
          canvas.width = 25;
          canvas.height = 20;
        } else if (roll < 0.05) {
          canvas.width = 50;
          canvas.height = 40;
        } else if (roll < 0.075) {
          canvas.width = 100;
          canvas.height = 80;
        } else if (roll < 0.1) {
          canvas.width = 200;
          canvas.height = 160;
        } else if (roll < 0.15) {
          canvas.width = 320;
          canvas.height = 240;
        } else if (roll < 0.35) {
          canvas.width = newsize(canvas.width, 5, 200);
          canvas.height = newsize(canvas.height, 4, 160);
        }
        frame.drawImage(camera, 0, 0, canvas.width, canvas.height);
        var dataurl = canvas.toDataURL();
        setTimeout(function() {
          socket.emit('frame', dataurl);
        }, 300);
      });
    });
  }, function(err) {
    console_log(err);
  });

}

var runMonitor = function(channel) {
  var socket = io.connect('/channel/' + channel);
  socket.on('connect', function() {
    var canvas = document.getElementById('display');
    var display = canvas.getContext('2d');
    var imageObj = new Image();
    imageObj.onload = function() {
      display.drawImage(this, 0, 0, canvas.width, canvas.height);
      setTimeout(function() {
        socket.emit('ready');
      }, 200);
    };
    socket.on('frame', function (dataURL) {
      imageObj.src = dataURL;
    });
  });
}

