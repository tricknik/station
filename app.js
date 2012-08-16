
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

io.set('log level', 1);

var startBridge = function(bridge) {
  var leg = { 0:'/a', 1:'/b' };
  a = io.of('/channel/' + bridge + leg[0]);
  b = io.of('/channel/' + bridge + leg[1]);
  var sockets = [false, false];
  var bindChannel = function(party, counterparty) {
    sockets[party].send("Welcome to bridge " + bridge + ".");
    if (sockets[counterparty]) {
      sockets[counterparty].send(sockets[party].handshake.address.address + " connected.");
      sockets[party].send(sockets[counterparty].handshake.address.address + " is here.");
      setInterval(function() {
         hook(sockets);
      }, 120000);
    } else {
      sockets[party].send("Waiting for counterparty to join.");
      sockets[party].send("Please standby.");
    }
    announce(sockets[party].handshake.address.address + " entered bridge " + bridge);
    sockets[party].on('message', function (data) {
      console.log(">> " + data);
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
        announce(sockets[party].handshake.address.address + " left bridge " + bridge);
        if (sockets[counterparty]) {
          sockets[counterparty].emit('frame', 'http://placekitten.com/320/240');
          sockets[counterparty].send(sockets[party].handshake.address.address + " disconnected.");
          bridges[bridge] = counterparty;
        } else {
          bridges[bridge] = 'open';
        }
        sockets[party] = false;
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

// CHAT
var chat = io.of('/channel/chat');
var chatSocket = false;
var announce = function(message) {
  if (chatSocket) {
    chatSocket.broadcast.send(message);
  }
};
chat.on('connection', function (socket) {
  chatSocket = socket;
  socket.send('Welcome To Miscommunication Station!');
  socket.send('Select a channel to enter bridge.');
  socket.broadcast.send(socket.handshake.address.address + " connected.");
  socket.on('message',function(message) {
    socket.broadcast.send(socket.handshake.address.address + ": " + message);
    console.log(message);
  });
  console.log("chat ready");
});

var hook = function(sockets) {
  console.log('hooked');
  socket = sockets[Math.floor(Math.random() * 2)];
  if (socket) {
    say = interjections[Math.floor(Math.random() * interjections.length + 1)];
    for (i in say) {
      socket.send(say[i]);
    }
  }
};

var interjections = [
  ['Chrome is a great browser!', 'Google did a great job!'],
  ['Ask me to tell you a secret.','Something I would not guess!'],
  ['Aren\'t you a little warm in all that clothing?'],
  ['You look great!', 'Have you been working out?'],
  ['Amazon has a great deal on the Kindl', 'Will you get one?'],
  ['I\'m never lonely now that I joined OKCupid!', 'Do you have a profile?'],
  ['Pepsi is much more refreshing than Coke'],
  ['HBO is the best TV network ever!'],
  ['Don\'t just sit there!', 'Get up and do something!'],
  ['Tide really keeps my clothes looking new!'],
  ['The latest version of Windows really works great!'],
  ['I think my next car will be a Toyota!'],
  ['I had a really bad headache','Thank god for Advil!'],
  ['You seem a little stressed', 'What\'s bothering you?'],
  ['I know he\'s a Mormon,', 'but Mit Romney has some good ideas'],
  ['Do you really expect me to believe that?'],
  ['Blow me a kiss!'],
  ['Samsung Galaxy is way better than iPhone', 'Apple is overrated.'],
  ['I have a feeling Blackberry will make a comeback'],
  ['I\'m really looking forward to the next Iron Man movie'],
  ['You should try Dove moisturizing cream','I love it!']
]

