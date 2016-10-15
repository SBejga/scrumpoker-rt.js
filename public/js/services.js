'use strict';

var myApp = angular.module('myApp.services',[]);
myApp.factory('remember', ['$cookies', function($cookies) {
  
  /**
   * Get Saved Name in Cookie
   */
  var getRememberName = function() {
    var remember = $cookies.getObject('remember');
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
    var remember;
    
    try {
      remember = $cookies.getObject('remember');
    } catch (e) {
      $cookies.setObject('remember', {});
      remember = $cookies.getObject('remember');
    }
    if (!remember) {
      remember = {name: name}
    } else {
      remember.name = name;
    }

    //set exipiration
    var now = new Date(),
        expireInYear = new Date(now.getFullYear()+1, now.getMonth(), now.getDate());

    $cookies.putObject('remember', remember, {expires: expireInYear});
  }

  return {
    getRememberName: getRememberName,
    setRememberName: setRememberName
  }
}]);

myApp.factory('socket', ['$rootScope', function ($rootScope) {
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
}]);
