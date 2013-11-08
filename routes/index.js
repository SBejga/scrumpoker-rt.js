
/*
 * GET home page.
 */

exports.index = function(req, res){
  res.render('index');
};

exports.server = function(req, res){
    res.render('server');
};

exports.partials = function (req, res) {
  var name = req.params.name;
  res.render('partials/' + name);
};