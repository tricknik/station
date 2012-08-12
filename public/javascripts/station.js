
var runCamera = function(channel) {
  var socket = io.connect('/channel/1/a');
  var camera = document.getElementById('camera');
  var canvas = document.getElementById('frame');
  var frame = canvas.getContext('2d');
  socket.on('connect', function () {
    navigator.getUserMedia("video", function(stream) {
      camera.src = stream; 
      var delay = 500;
      var ratio = 0.5;
      var run = function() {
      	setTimeout(function() {
          var newsize = function(size, min, max) {
            var size = (size * Math.random()) + (size * Math.random()); 
            if (size < min) size = max * 0.9;
            if (size > max) size = min * 1.1;
            return size;
          }

          var roll = Math.random();
          if (roll < 0.1) {
            canvas.width = 25;
            canvas.height = 20;
          } else if (roll < 0.2) {
            canvas.width = 50;
            canvas.height = 40;
          } else if (roll < 0.3) {
            canvas.width = 100;
            canvas.height = 80;
          } else if (roll < 0.4) {
            canvas.width = 200;
            canvas.height = 160;
          } else if (roll < 0.5) {
            canvas.width = 400;
            canvas.height = 320;
          } else if (roll < 0.8) {
            canvas.width = newsize(canvas.width, 5, 400);
            canvas.height = newsize(canvas.height, 4, 320);
	  }
          frame.drawImage(camera, 0, 0, canvas.width, canvas.height);
          var dataurl = canvas.toDataURL();
          socket.emit('frame', dataurl);
          var rnd = function(max) {
            return Math.floor(Math.random() * (max + 1));
          };
          delay = rnd(100) + rnd(200) + rnd(300) + rnd(400);
          ratio = Math.random();
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

  var canvas = document.getElementById('display');
  var display = canvas.getContext('2d');
  var imageObj = new Image();
  imageObj.onload = function() {
    display.drawImage(this, 0, 0, canvas.width, canvas.height);
  };
  socket.on('connect', function() {
    socket.on('frame', function (dataURL) {
      imageObj.src = dataURL;
    });
  });
}

