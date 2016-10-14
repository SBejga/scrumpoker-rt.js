var express = require('express'),
  routes = require('./routes'),
  basicauth = require('./routes/basicauth.js'),
  socket = require('./routes/socket.js');

var app = module.exports = express.createServer();

// Hook Socket.io into Express
var io = require('socket.io').listen(app);

// Configuration
var authConfig = require('./basicauth.json');

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('view options', {
    layout: false
  });

  //Basic Auth
  if (authConfig.enabled) {
    app.use(express.basicAuth(function(user, pass) {
      return pass === authConfig.credentials[user];
    }));
  }

  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.static(__dirname + '/public'));
  app.use(app.router);
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes
app.get('/', routes.index);
app.get('/server/', routes.server);
app.get('/partials/:name', routes.partials);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

// Socket.io Communication

io.sockets.on('connection', socket);

// Start server

//TODO: in production: NODE_ENV=production

app.listen(8000, function(){
  console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
