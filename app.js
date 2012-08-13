
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
app.get('/console/:channel/:leg', function(req, res) {
  routes.console(req,res);
});
app.get('/monitor', routes.monitor);

app.listen(3000, function() {
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// CHANNELS
var startChannel = function(channel) {
  io.set('log level', 1);
  a = io.of('/channel/' + channel + '/a');
  b = io.of('/channel/' + channel + '/b');
  var bridge = [false, false];
  var bindChannel = function(party, counterparty) {
    bridge[party].on('frame', function (frame) {
      if (bridge[counterparty]) {
        bridge[counterparty].emit('frame', frame);
      }
    });
    bridge[party].emit('frame', 'http://placekitten.com/320/240');
  };
  a.on('connection', function (socket) {
    bridge[0] = socket;
    bindChannel(0, 1);
    bridge[0].on('disconnect', function (frame) {
      console.log(channel + "/a disconnected");
    });
    console.log(channel + "/a connected");
  });
  b.on('connection', function (socket) {
    bridge[1] = socket;
    bindChannel(1, 0);
    bridge[1].on('disconnect', function (frame) {
      console.log(channel + "/b disconnected");
    });
    console.log(channel + "/b connected");
  });
}

startChannel('1');

