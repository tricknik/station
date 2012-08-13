
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { channel: '1', leg: 'a' })
};

exports.console = function(req, res){
  res.render('index', { channel: req.params.channel, leg: req.params.leg})
};

exports.monitor = function(req, res){
  res.render('monitor', { title: 'Miscommunication Station' })
};
