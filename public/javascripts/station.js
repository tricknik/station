var Station = {
  run: false,
  input: null,
  socket: null,
  transcript: null,
  connect: function(channel) {
    Station.socket = io.connect('/channel' + channel);
    Station.transcript = document.getElementById('transcript');
    Station.input = document.getElementById('input');
    Station.input.onkeydown = Station.key;
    Station.socket.on('connect', function() {
      Station.stop = function() {
        socket.emit('bye', channel);
        socket.close();
      };
      Station.socket.on('message', function(message) {
        var txt = document.createTextNode("> " + message + "\n");
        Station.transcript.appendChild(txt); 
      });
      if(document.getElementById('camera')) {
        Station.run();
      }
    });
  },
  key: function(e) {
    if(Station.input.value != "") {
      if(e.keyCode == 13) {
        Station.socket.send(Station.input.value);     
        var txt = document.createTextNode("= " + Station.input.value + "\n");
        Station.transcript.appendChild(txt); 
        Station.input.value = "";
      }
    }
  },
  stop: function() {},
  run: function(channel) {
    socket = Station.socket;
    socket.emit('ready');
    var frame = document.getElementById('frame');
    var buffer = frame.getContext('2d');
    var camera = document.getElementById('camera');
    var getCamera = function(callback, errback) {
      if (navigator.getUserMedia) {
        navigator.getUserMedia("video", callback); 
      } else if (navigator.webkitGetUserMedia) {
        navigator.webkitGetUserMedia({video: true, audio: false}, function(stream) {
        callback(webkitURL.createObjectURL(stream));
        });
      }
    };
    getCamera(function(stream) {
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
    });

    socket.on('ready', function () {
      socket.emit('ready');
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
    });
  }
};
