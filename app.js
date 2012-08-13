
// DEPENDENCIES

var express = require('express')
  , routes = require('./routes');

var app = module.exports = express.createServer()
  , io = require('socket.io').listen(app);

// CONFIGURATION

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// ROUTES

app.get('/', routes.index);
app.get('/console/:channel/:leg', routes.console);
app.get('/monitor', routes.monitor);

app.listen(3000, function() {
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// CHANNELS
var startChannel = function(channel) {
  a = io.of('/channel/' + channel + '/a');
  b = io.of('/channel/' + channel + '/b');
  var user1 = false;
  var user2 = false;
  a.on('connection', function (socket) {
    user1 = socket;
    socket.on('frame', function (frame) {
      if (user2) {
        user2.emit('frame', frame);
      }
    });
    console.log("A LEG CONNECTED");
  });
  b.on('connection', function (socket) {
    user2 = socket
    socket.on('ready', function () {
      if (user1) {
        user1.emit('ready');
      }
    });
    console.log("B LEG CONNECTED");
  });
}

startChannel('1');

