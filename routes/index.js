
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { channel: '/chat'})
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

