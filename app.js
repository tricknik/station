
// DEPENDENCIES

var express = require('express')
  , fs = require('fs')
  , http = require('http')
  , routes = require('./routes');

var app = module.exports = express.createServer();
var io = require('socket.io').listen(app);
var rack = require('hat').rack();

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
  process.on('uncaughtException', function(err) {
    console.log("Uncaught exception!", err);
  });
});

// ROUTES

app.get('/', function(req, res) {
  var lang = req.acceptedLanguages;
  routes.index(req, res);
});
app.get('/bridge/:bridge', function(req, res) {
  var counterparty = { 0:'/b', 1:'/a' };
  if (req.params.bridge in busy) {
     routes.busy(req, res);
  }
  if (req.params.bridge in bridges) {
    if (bridges[req.params.bridge] == 'up') {
      routes.busy(req, res);
    } else if (bridges[req.params.bridge] == 'open') {
      res.redirect('/console/' + req.params.bridge + '/a');
    } else {
      res.redirect('/console/' + req.params.bridge + counterparty[bridges[req.params.bridge]]);
    }
  } else {
    routes.broken(req, res);
  }
});
app.get('/console/:bridge/:leg', function(req, res) {
  var sockets = { a:0, b:1 };
  if (req.params.bridge in bridges) {
    if (bridges[req.params.bridge] == sockets[req.params.leg] || bridges[req.params.bridge] == 'up') {
      res.redirect('/bridge/' + req.params.bridge);
    } else {
      routes.console(req,res);
    }
  } else {
    res.send(404);
  }
});
app.get('/filter', routes.filter);
app.get('/__broadcast__', routes.broadcast);

app.listen(3000, function() {
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});

// BRIDGES

io.configure(function (){
  io.set('log level', 1);
  io.set('authorization', function (handshakeData, callback) {
    handshakeData.stationId = rack();
    callback(null, true); 
  });
});

var startBridge = function(bridge) {
  var leg = { 0:'/a', 1:'/b' };
  a = io.of('/channel/' + bridge + leg[0]);
  b = io.of('/channel/' + bridge + leg[1]);
  var sockets = [false, false];
  var bindChannel = function(party, counterparty, callback) {
    if (!('lang' in sockets[party])) sockets[party].lang = sockets[party].handshake.headers['accept-language'].substring(0,2);
    setTimeout(function() {
      sockets[party].emit('filter');
    }, Math.random() * 60000 * 60);
    var say = function(who, message, fn) {
      console.log('channel lang ' + sockets[who].lang);
      translate(message, 'en', sockets[who].lang, function(message) {
        if (fn) {
          fn(message, sockets[who]);
        } else {
          sockets[who].send(message);
        }
      });
    };
    var hooks = false;
    say(party, "Welcome to bridge " + bridge + ".");
    if (sockets[counterparty]) {
      say(counterparty, "connected.", function(translated, socket) {
        socket.send(sockets[party].handshake.address.address + " " + translated);
      });
      say(party, "is here.", function(translated, socket) {
        socket.send(sockets[party].handshake.address.address + " " + translated);
      });
      hooks = setInterval(function() {
         hook(sockets);
      }, 60000);
    } else {
      say(party, "Waiting for counterparty to join.");
      say(party, "Please standby.");
    }
    announce(sockets[party].handshake.address.address + " entered bridge " + bridge);
    sockets[party].on('message', function (data) {
      if (sockets[counterparty]) {
        detect(data, function(lang) {
          if (sockets[party]) {
            if (sockets[party].lang != lang) {
              sockets[party].lang = lang;
              sockets[party].emit('lang', lang);
            }
            translate(data, sockets[party].lang, sockets[counterparty].lang, function(message) {
            sockets[counterparty].send(message);
            });
          }
        });
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
      if (hooks) clearInterval(hooks);
      if (sockets[party]) { 
        addr = sockets[party].handshake.address.address;
        announce(sockets[party].handshake.address.address + " left bridge " + bridge);
        if (sockets[counterparty]) {
          sockets[counterparty].emit('frame', 'http://placekitten.com/320/240');
          say(counterparty, 'disconnected.', function(translated, socket) {
            socket.send(addr + " " + translated);
          });
          bridges[bridge] = counterparty;
        } else {
          bridges[bridge] = 'open';
        }
        sockets[party] = false;
        console.log(bridge + leg[party] + " disconnected");
      }
    };
    sockets[party].on('bye', disconnect);
    sockets[party].on('disconnect', disconnect);
    sockets[party].emit('frame', 'http://placekitten.com/320/240');
    console.log(bridge + leg[party] + " connected");
  };
  a.on('connection', function (socket) {
    socket.on('lang', function(lang) {
      if (lang) {
        socket.lang = lang;
      }
      sockets[0] = socket;
      bindChannel(0, 1);
    });
  });
  b.on('connection', function (socket) {
    socket.on('lang', function(lang) {
      if (lang) {
        socket.lang = lang;
      }
      sockets[1] = socket;
      bindChannel(1, 0);
    });
    if (!('lang' in socket)) socket.lang = socket.handshake.headers['accept-language'].substring(0,2);
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
    chatSocket.broadcast.emit('message', (message));
  }
};
chat.on('connection', function (socket) {
  chatSocket = socket;
  if (!('lang' in socket)) socket.lang = {};
  socket.lang[socket.handshake.stationId] = socket.handshake.headers['accept-language'].substring(0,2);
  socket.emit('untranslated', 'Welcome To Miscommunication Station!');
  socket.emit('untranslated', 'Another fine platform from Telekommunisten.');
  socket.emit('untranslated', 'This is an experimental preview release.');
  socket.emit('untranslated', 'Requires Google Chrome 21 or Opera 12.');
  socket.emit('untranslated', 'Always type in your native language.');
  socket.emit('untranslated', 'Translation for your counterparty is automatic.');
  socket.emit('untranslated', 'Translation by Microsoft Translator.');
  socket.emit('untranslated', 'Hosting by Nodejitsu.');
  socket.emit('untranslated', 'Co-commissioned by Arnolfini and Abandon Normal Devices.');
  socket.emit('untranslated', ' ~~');
  socket.emit('untranslated', 'SELECT A CHANNEL TO ENTER BRIDGE >>');
  socket.broadcast.emit('untranslated', socket.handshake.address.address + " connected.");
  socket.on('translate',function(message) {
    detect(message, function(lang) {
      var to = socket.lang[socket.handshake.stationId];
      translate(message, lang, to, function(translated) {
          socket.send(translated);
      });
    });
  });
  socket.on('message',function(message) {
    detect(message, function(lang) {
      if (socket.lang[socket.handshake.stationId] != lang) {
        socket.lang[socket.handshake.stationId] = lang;
        socket.emit('lang', lang);
      }
      socket.broadcast.emit('untranslated', socket.handshake.address.address + ": " + message);
    });
  });
  socket.on('lang', function(lang) {
    if (lang) {
      socket.lang[socket.handshake.stationId] = lang;
    }
  });
  socket.on('push',function(frame) {
    process.nextTick(function() {
      socket.broadcast.volatile.emit('frame', frame);
      setTimeout(function() {
        socket.emit('ready');
      }, 500);
    });
  });
  socket.on('disconnect',function() {
    delete socket.lang[socket.handshake.stationId];
  });
});
var detect = function(message, callback) {
  var query = "text=" + encodeURIComponent(message);
  var path = "/V2/Ajax.svc/Detect?appId=78280AF4DFA1CE1676AFE86340C690023A5AC139&" + query;
  var value;
  if (value = store.get(query)) {
    callback(value);
  } else { 
    var options = {
      host: 'api.microsofttranslator.com',
      port: 80,
      path: path,
      method: 'GET'
    };
    var req = http.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        var value = chunk.substring(2, chunk.length - 1);
        store.set(query, value);
        callback(value);
      })  ;
    });
    req.end();
  }
};

var translate = function(message, lang, to, callback) {
  if (lang == to) {
    callback(message);
    return;
  }
  var query = "from=" + lang + "&to=" + to + "&text=" + encodeURIComponent(message);
  var path = "/V2/Ajax.svc/Translate?appId=78280AF4DFA1CE1676AFE86340C690023A5AC139&" + query;
  var value;
  if (value = store.get(query)) {
    callback(value);
  } else { 
    var options = {
      host: 'api.microsofttranslator.com',
      port: 80,
      path: path,
      method: 'GET'
    };
    var req = http.request(options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        var value = chunk.substring(2, chunk.length - 1);
        store.set(query, value);
        callback(value);
      });
    });
    req.end();
  }
};
var hook = function(sockets) {
  socket = sockets[Math.floor(Math.random() * 2)];
  if (sockets[0] && sockets[1]) {
    say = interjections[Math.floor(Math.random() * interjections.length + 1)];
    for (i in say) {
      translate(say[i], 'en', socket.lang, function(message) {
        socket.send(message);
      });
    }
  }
};

var interjections = [
  ['Chrome is a great browser!', 'Google did a great job!'],
  ['Ask me to tell you a secret.','Something you would never guess!'],
  ['It\'s really nice to chat with you.','These conversations are very special to me!'],
  ['Tell me something about you that would surprise me.'],
  ['Let\'s spice this chat up a bit!'],
  ['I think I\'m going to have an American Spirit cigarette.'],
  ['I think I\'m going to have a Miller light.'],
  ['I think I\'m going to have a Hostess Twinkee.'],
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
  ['I\'m certainly disapointed,', 'but Barack Obama is good for the country.'],
  ['Do you really expect me to believe that?'],
  ['Blow me a kiss!'],
  ['Samsung Galaxy is way better than iPhone', 'Apple is overrated.'],
  ['I have a feeling Blackberry will make a comeback'],
  ['I\'m really looking forward to the next Iron Man movie'],
  ['Did you know that the creators of Miscommunication Station also made R15N?','You should contact Telekommunisten for more information!'],
  ['Did you know that the creators of Miscommunication Station also made Thimbl?','You should contact Telekommunisten for more information!'],
  ['Did you know that the creators of Miscommunication Station also made deadSwap?','You should contact Telekommunisten for more information!'],
  ['Did you know that the creators of Miscommunication Station also wrote the Telekommunisten Manifesto?','You should contact Telekommunisten for more information!'],
  ['Did you know that you can buy chat ads on Miscommunication Station?','You should contact Telekommunisten for more information!'],
  ['You hair looks great!', 'Have you been using Head & Shoulders?'],
  ['Vidal Sassoon shampoo has really made my hair look great!'],
  ['You should try Dove moisturizing cream','I love it!']
]

var store = {
  get: function(key) {
     var value;
     path = '/tmp/station_translator_' + key;
     if (fs.existsSync(path)) {
       value = fs.readFileSync(path, 'utf8')
     } else {
       value = false;
     }
     return value;
  },
  set: function(key, value) {
    path = '/tmp/station_translator_' + key;
    fs.writeFileSync(path, value, 'utf8')
  }
}

