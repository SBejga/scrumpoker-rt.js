'use strict';

/* Services */
app.factory('remember', ['$cookieStore', function($cookies) {
  
  /**
   * Get Saved Name in Cookie
   */
  var getRememberName = function() {
    var remember = $cookies.get('remember');
    console.log("remember cookie content: ", remember);

    if (remember && remember.name) {
      return remember.name;
    } else {
      return null;
    }
  }

  /**
   * Save new name into cookie to remember
   */
  var setRememberName = function(name) {
    var remember = $cookies.get('remember');
    if (!remember) {
      remember = {name: name}
    } else {
      remember.name = name;
    }
    $cookies.put('remember', remember);
  }

  return {
    getRememberName: getRememberName,
    setRememberName: setRememberName
  }
}]);

// Demonstrate how to register services
// In this case it is a simple value service.
app.factory('socket', function ($rootScope) {
  var socket = io.connect();
  return {
    on: function (eventName, callback) {
      socket.on(eventName, function () {  
        var args = arguments;
        $rootScope.$apply(function () {
          callback.apply(socket, args);
        });
      });
    },
    emit: function (eventName, data, callback) {
      socket.emit(eventName, data, function () {
        var args = arguments;
        $rootScope.$apply(function () {
          if (callback) {
            callback.apply(socket, args);
          }
        });
      })
    },
    disconnect: function(){
      return socket.disconnect();
    }
  };
});
