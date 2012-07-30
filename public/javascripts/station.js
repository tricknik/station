
var runCamera = function(channel) {
  var socket = io.connect('/channel/1/a');
  var camera = document.getElementById('camera');
  var canvas = document.getElementById('frame');
  var frame = canvas.getContext('2d');
  socket.on('connect', function () {
    navigator.getUserMedia("video", function(stream) {
      camera.src = stream; 
      var delay = 1;
      var run = function() {
      	setTimeout(function() {
          frame.drawImage(camera, 0, 0, camera.width, camera.height);
          var dataurl = canvas.toDataURL();
          socket.emit('frame', dataurl);
          var rnd = function(max) {
            return Math.floor(Math.random() * (max + 1));
          };
          delay = rnd(200) + rnd(200) + rnd(200) + rnd(200);
          run();
        }, delay);
      };
      run();
    }, function(err) {
      console_log(err);
    });
    socket.on('frame', function (data) {
      alert(" recieved " + data);
    });
  });

  socket.on('disconnect', function () {
    //clearInterval(frames);
  });
}

var runMonitor = function(channel) {
  var socket = io.connect('/channel/1/b');

  var display = document.getElementById('display').getContext('2d');
  var imageObj = new Image();
  imageObj.onload = function() {
    display.drawImage(this, 0, 0);
  };
  socket.on('connect', function() {
    socket.on('frame', function (dataURL) {
      imageObj.src = dataURL;
    });
  });
}

