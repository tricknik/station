
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index')
};

exports.broken = function(req, res){
  res.render('broken')
};

exports.busy = function(req, res){
  res.render('busy')
};

exports.console = function(req, res){
  res.render('console', { bridge: req.params.bridge, leg: req.params.leg})
};

exports.monitor = function(req, res){
  res.render('monitor', { title: 'Miscommunication Station' })
};
