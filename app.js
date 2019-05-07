var express = require('express'),
  routes = require('./routes'),
  socket = require('./routes/socket.js'),
  bodyParser = require('body-parser'),
  methodOverride = require('method-override'),
  errorHandler = require('errorhandler'),
  http = require('http');

var app = module.exports = express();
var server = http.createServer(app);
var io = require('socket.io').listen(server);

// Configuration
var jsonfile = require('jsonfile');
try { //surround to catch file not found error...
  var authConfig = jsonfile.readFileSync('./basicauth.json', {throws: false})
} catch(e) {
  authConfig = null;
}

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.set('view options', {
  layout: false
});

//Basic Auth
if (authConfig && authConfig.enabled) {
  app.use(express.basicAuth(function(user, pass) {
    return pass === authConfig.credentials[user];
  }));
}

app.use(bodyParser());
app.use(methodOverride());
app.use(express.static(__dirname + '/public'));

var env = process.env.NODE_ENV || 'development';
if ('development' == env) {
  app.use(errorHandler({ dumpExceptions: true, showStack: true }));
} else {
  app.use(errorHandler());
}

// Routes
app.get('/', routes.index);
app.get('/server/', routes.server);
app.get('/partials/:name', routes.partials);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);

// Socket.io Communication
io.sockets.on('connection', socket);

// Start server
var port = process.env.PORT || '8000';
server.listen(port, function(){
  console.log("server listening on port " + port);
});
