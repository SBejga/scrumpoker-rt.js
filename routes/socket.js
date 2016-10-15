// Keep track of which names are used so that there are no duplicates
var userNames = (function () {
  var names = {};

  var claim = function (name) {
    if (!name || names[name]) {
      return false;
    } else {
      names[name] = true;
      return true;
    }
  };

  // find the lowest unused "guest" name and claim it
  var getGuestName = function () {
    var name,
      nextUserId = 1;

    do {
      name = 'Guest ' + nextUserId;
      nextUserId += 1;
    } while (!claim(name));

    return name;
  };

  // serialize claimed names as an array
  var getAll = function () {
    var nameArray = [];
    for (var key in names) {
      var val = names[key];
      if (val) {
        nameArray.push({name: key});
      }
    }
    return nameArray;
  };

  var free = function (name) {
    if (names[name]) {
      delete names[name];
    }
  };

  return {
    claim: claim,
    free: free,
    getAll: getAll,
    getGuestName: getGuestName
  };
}());

// export function for listening to the socket
module.exports = function (socket) {
  //scope of this function is a client connection!
  var username;

  socket.emit('ask:name');

  //answer from clients
  socket.on('answer:name', function(data) {
    
    if (data && data.username && data.username !== null) {
      //client send a username
      //check if claim
      if (userNames.claim(data.username)) {
        username = data.username;
      } else {
        //name not available
        //give guest name
        username = userNames.getGuestName();  
      }
      
    } else {
      //client has no username sent, give guest
      username = userNames.getGuestName();
    }

    // send the new user their name and a list of users
    socket.emit('init', {
      name: username,
      users: []
    });

    // notify other clients that a new user has joined
    socket.broadcast.emit('user:join', {
      name: username
    });
  });

  //answer from server
  socket.on('server', function() {
    socket.emit('init', {users: userNames.getAll()})
  });

  // notify other clients score changed
  socket.on('score:change', function (data) {
      socket.broadcast.emit('score:change', data);
  });

  // notify other clients for locks
  socket.on('score:lock', function () {
    socket.broadcast.emit('score:lock');
  });
  socket.on('score:unlock', function () {
    socket.emit('score:unlock');
    socket.broadcast.emit('score:unlock');
  });

  // validate a user's name change, and broadcast it on success
  socket.on('change:name', function (data, fn) {
    if (userNames.claim(data.name)) {
      var oldName = username;
      userNames.free(oldName);

      username = data.name;
      
      socket.broadcast.emit('change:name', {
        oldName: oldName,
        newName: username
      });

      fn(true);
    } else {
      fn(false);
    }
  });

  //server will kick user
  socket.on('kick:name', function (data) {
    console.log("receive kick request of user: ", data);
    
    //free user
    userNames.free(data.username);

    socket.broadcast.emit('user:left', {
      name: data.username
    });
    
  });

  // clean up when a user leaves, and broadcast it to other users
  socket.on('disconnect', function () {
    socket.broadcast.emit('user:left', {
      name: username
    });
    userNames.free(username);
  });
};
