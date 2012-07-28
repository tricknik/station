
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index', { title: 'Miscommunication Station' })
};

exports.monitor = function(req, res){
  res.render('monitor', { title: 'Miscommunication Station' })
};
