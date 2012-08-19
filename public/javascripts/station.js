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
      var lang;
      if (lang = localStorage.getItem('lang')) {
        Station.socket.emit('lang', lang);
      } else {
        Station.socket.emit('lang', null);
      }
      Station.stop = function() {
        socket.emit('bye', channel);
        socket.close();
      };
      Station.socket.on('lang', function(lang) {
        localStorage.setItem('lang', lang);
      });
      Station.socket.on('message', function(message) {
        Station.say("> " + message);
      });
      Station.socket.on('untranslated', function(message) {
        Station.socket.emit('translate', message);
      });
      Station.socket.on('filter', function(lang) {
        document.location = '/filter';
      });
      if (document.getElementById('camera')) {
        Station.monitor();
        Station.camera();
      } else if (document.getElementById('broadcast')) {
        Station.broadcast();
      } else if (document.getElementById('monitor')) {
        Station.monitor();
      }
    });
  },
  say: function(message) {
    var txt = document.createTextNode(message + "\n");
    var br = document.createElement('br');
    Station.transcript.appendChild(txt); 
    Station.transcript.appendChild(br); 
    Station.transcript.scrollTop = Station.transcript.scrollHeight;
  },
  key: function(e) {
    if(Station.input.value != "") {
      if(e.keyCode == 13) {
        Station.socket.send(Station.input.value);     
        Station.say("= " + Station.input.value);
        Station.input.value = "";
      }
    }
  },
  stop: function() {},
  getCamera:  function(callback) {
    if (navigator.getUserMedia) {
      navigator.getUserMedia("video", callback); 
    } else if (navigator.webkitGetUserMedia) {
      navigator.webkitGetUserMedia({video: true, audio: false}, function(stream) {
      callback(webkitURL.createObjectURL(stream));
      });
    }
  },
  monitor: function(channel) {
    var monitor = document.getElementById('monitor');
    var display = monitor.getContext('2d');
    var input = new Image();
    input.onload = function() {
      display.drawImage(this, 0, 0, monitor.width, monitor.height);
    };
    input.src = '/images/init.gif';
    var splash = true;
    Station.socket.on('frame', function (url) {
      input.src = url;
      if (splash) {
        if (splash = document.getElementById('splash')) {
          splash.style.display = "none";
	  monitor.style.display = "inline";
          splash = false;
        }
      }
    });
  },
  camera: function(channel) {
    Station.socket.emit('ready');
    var frame = document.getElementById('frame');
    var buffer = frame.getContext('2d');
    var camera = document.getElementById('camera');
    Station.socket.on('ready', function () {
      Station.socket.emit('ready');
      Station.flux(frame);
      buffer.drawImage(camera, 0, 0, frame.width, frame.height);
      var dataurl = frame.toDataURL();
      Station.socket.emit('frame', dataurl);
    });
    Station.getCamera(function(stream) {
      camera.src = stream; 
    });
  },
  broadcast: function() {
    var frame = document.getElementById('frame');
    var buffer = frame.getContext('2d');
    var camera = document.getElementById('broadcast');
    var send = function() {
      buffer.drawImage(camera, 0, 0, frame.width, frame.height);
      Station.socket.emit('push', frame.toDataURL());
    };
    Station.socket.on('ready', function (url) {
      send();
      Station.flux(frame);
    });
    Station.getCamera(function(stream) {
      camera.src = stream; 
      send();
    });
  },
  flux: function(frame) {
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
  }
};
