
var runCamera = function(channel) {
  var socket = io.connect('/channel/1/a');
  var camera = document.getElementById('camera');
  var frame = document.getElementById('frame').getContext('2d');
  socket.on('connect', function () {
    navigator.getUserMedia("video", function(stream) {
      camera.src = stream; 
      var frames = setInterval(function() {
        frame.drawImage(camera, 0, 0, camera.width, camera.height);
        // imagedata = frame.getImageData(0, 0, 400, 300);
        imagedata = "data";
        socket.emit('frame', imagedata);
      }, 2000);
    }, function(err) {
      console_log(err);
    });
    socket.on('frame', function (data) {
      alert(" recieved " + data);
    });
  });

  socket.on('disconnect', function () {
    clearInterval(frames);
  });
}

var runMonitor = function(channel) {
  var socket = io.connect('/channel/1/b');

  var display = document.getElementById('display').getContext('2d');
  socket.on('connect', function() {
    socket.on('frame', function (data) {
      d = data; 
    });
  });
}

