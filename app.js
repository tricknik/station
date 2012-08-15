
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
app.get('/bridge/:bridge', function(req, res) {
  console.log(req.params.bridge + ' entering bridge');
  var counterparty = { 0:'/b', 1:'/a' };
  if (req.params.bridge in busy) {
     routes.busy(req, res);
  }
  if (req.params.bridge in bridges) {
    if (bridges[req.params.bridge] == 'up') {
      console.log(req.params.bridge + ' bridge busy');
      routes.busy(req, res);
    } else if (bridges[req.params.bridge] == 'open') {
      res.redirect('/console/' + req.params.bridge + '/a');
    } else {
      res.redirect('/console/' + req.params.bridge + counterparty[bridges[req.params.bridge]]);
    }
  } else {
    console.log(req.params.bridge + ' unavailable');
    routes.broken(req, res);
  }
});
app.get('/console/:bridge/:leg', function(req, res) {
  var sockets = { a:0, b:1 };
  if (req.params.bridge in bridges) {
    if (bridges[req.params.bridge] == sockets[req.params.leg] || bridges[req.params.bridge] == 'up') {
      console.log(req.params.bridge + ' channel busy');
      res.redirect('/bridge/' + req.params.bridge);
    } else {
      routes.console(req,res);
    }
  } else {
    console.log(req.params.bridge + ' unavailable');
    res.send(404);
  }
});
app.get('/monitor', routes.monitor);

app.listen(3000, function() {
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// BRIDGES
var startBridge = function(bridge) {
  io.set('log level', 1);
  var leg = { 0:'/a', 1:'/b' };
  a = io.of('/channel/' + bridge + leg[0]);
  b = io.of('/channel/' + bridge + leg[1]);
  var sockets = [false, false];
  var bindChannel = function(party, counterparty) {
    sockets[party].on('message', function (data) {
      if (sockets[counterparty]) {
        sockets[counterparty].send(data);
      }
    });
    sockets[party].on('ready', function () {
      if (sockets[counterparty]) {
        sockets[counterparty].emit('ready');
      }
    });
    sockets[party].on('frame', function (frame) {
      if (sockets[counterparty]) {
        process.nextTick(function() {
          sockets[counterparty].emit('frame', frame);
        });
       }
    });
    if (sockets[counterparty]) {
       bridges[bridge] = 'up';
    } else {
       bridges[bridge] = party;
    }
    var disconnect = function() {
      if (sockets[party]) { 
        sockets[party] = false;
        if (sockets[counterparty]) {
          bridges[bridge] = counterparty;
        } else {
          bridges[bridge] = 'open';
        }
        console.log(bridge + leg[party] + " disconnected");
        console.log(bridge + " " + bridges[bridge]);
      }
    };
    sockets[party].on('bye', disconnect);
    sockets[party].on('disconnect', disconnect);
    sockets[party].emit('frame', 'http://placekitten.com/320/240');
    console.log(bridge + leg[party] + " connected");
  };
  a.on('connection', function (socket) {
    sockets[0] = socket;
    bindChannel(0, 1);
    console.log(bridge + " " + bridges[bridge]);
  });
  b.on('connection', function (socket) {
    sockets[1] = socket;
    bindChannel(1, 0);
    console.log(bridge + " " + bridges[bridge]);
  });
  return 'open';
};

var bridges = {
  1: startBridge(1),
  3: startBridge(3),
  4: startBridge(4),
  7: startBridge(7),
};
var busy = {2:true, 8:true};
