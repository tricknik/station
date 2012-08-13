
var runStation = function(channel) {
  var socket = io.connect('/channel/' + channel);
  socket.on('connect', function() {
    var socket = io.connect('/channel/' + channel);
    var frame = document.getElementById('frame');
    var buffer = frame.getContext('2d');
    var camera = document.getElementById('camera');
    navigator.getUserMedia("video", function(stream) {
      camera.src = stream; 
    });
    var monitor = document.getElementById('monitor');
    var display = monitor.getContext('2d');
    var input = new Image();
    input.onload = function() {
      display.drawImage(this, 0, 0, monitor.width, monitor.height);
    };
    socket.on('frame', function (url) {
      input.src = url;

      var newsize = function(size, min, max) {
        var size = (size * Math.random()) + (size * Math.random()); 
        if (size < min) size = max * 0.9;
        if (size > max) size = min * 1.1;
        return size;
      }

      var roll = Math.random();
      if (roll < 0.025) {
        frame.width = 25;
        frame.height = 20;
      } else if (roll < 0.05) {
        frame.width = 50;
        frame.height = 40;
      } else if (roll < 0.075) {
        frame.width = 100;
        frame.height = 80;
      } else if (roll < 0.1) {
        frame.width = 200;
        frame.height = 160;
      } else if (roll < 0.15) {
        frame.width = 320;
        frame.height = 240;
      } else if (roll < 0.35) {
        frame.width = newsize(frame.width, 5, 200);
        frame.height = newsize(frame.height, 4, 160);
      }
      buffer.drawImage(camera, 0, 0, frame.width, frame.height);
      var dataurl = frame.toDataURL();
      socket.emit('frame', dataurl);
      socket.emit('ack', channel);
    });
  });
};

