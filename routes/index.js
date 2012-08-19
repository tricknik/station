
/*
 * GET home page.
 */

var filters = ['nopants.gif','copyright.gif']

exports.index = function(req, res){
  res.render('index', { channel: '/chat'})
};

exports.broadcast = function(req, res){
  res.render('broadcast', { channel: '/chat'})
};

exports.filter = function(req, res){
  var filter = Math.floor(Math.random() * filters.length);
  res.render('filter', { channel: '/chat', filter: filters[filter]})
};

exports.broken = function(req, res){
  res.render('broken', { channel: '/chat'})
};

exports.busy = function(req, res){
  res.render('busy', { channel: '/chat'})
};

exports.console = function(req, res){
  res.render('console', { channel: "/" + req.params.bridge + '/' + req.params.leg})
};

