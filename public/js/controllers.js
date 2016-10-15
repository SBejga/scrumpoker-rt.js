'use strict';
var myApp = angular.module('myApp.controllers',[]);

myApp.controller('ServerCtrl', ['$scope', 'socket', function($scope, socket) {

    $scope.state = "picking";
    $scope.locked = false;
    $scope.sidebar = false; //show initial sidebar?
    $scope.scoreHistory = [];
    $scope.users = [];
    $scope.connection = false;
    $scope.autoUnlock = false;

    //debug purpose, create large scoreHistory:
    //for (var x=0; x<12; x++) {
    //    var users = [];
    //    for (var u=1; u<7; u++) {
    //        users.push({name: "Guest_"+u, score: ((u*3+1)/2)});
    //    }
    //    $scope.scoreHistory.unshift({round: x+1, users: users});
    //}

    $scope.log = function() {
        console.log($scope.users);
    }

    var checkComplete = function() {

        var i;
        for (i = 0; i < $scope.users.length; i++) {
            var usr = $scope.users[i];
            if (typeof(usr)==="object" && usr.scored !== true) {
                return false;
            }
        }

        return true;
    }

    var calcWinScore = function() {
        var diffs = [];
        var counts = [];
        var i, j, score, count, diff;

        //go through users votes
        for (i = 0; i < $scope.users.length; i++) {
            score = $scope.users[i].score+"";

            //if not contained, push into diffs_array
            if (diffs.indexOf(score) < 0) {
                diffs.push(score);
            }
        }

        //diffs contains unique score values

        //go through diffs and count how many users voted this.
        for (i = 0; i < diffs.length; i++) {
            diff = diffs[i];
            count = 0;
            for (j = 0; j < $scope.users.length; j++) {
                score = $scope.users[j].score+"";
                if (diff === score) {
                    count++;
                }
            }
            counts[i] = count;
        }

        //diffs contains unique score values
        //counts contains amount of score value
        //diffs[x] = value, counts[x] = amount

        console.log(diffs);
        console.log(counts);

        var maxPos    = Math.max.apply( null, counts ),
            posInArr  = counts.indexOf( maxPos );

        var maxcounted = 0;
        var highest;

        //check if tie
        for (i=0; i<counts.length; i++) {
            var curcount = counts[i];
            if (curcount === maxPos) {
                maxcounted++;
            }
        }
        if (maxcounted > 1) {
            highest = null;
        } else {
            highest = diffs[posInArr];
        }

        console.log('highest: '+highest);

        var winscore = {
            "highest": highest
        };

        return highest;
    }

    var changeName = function (oldName, newName) {
        // rename user in list of users
        var i;
        for (i = 0; i < $scope.users.length; i++) {
            if ($scope.users[i].name === oldName) {
                $scope.users[i].name = newName;
            }
        }
    }

    //react on ask:name but not answer, raise server emit
    socket.on('ask:name', function() {
        console.log("received ask:name");
        socket.emit('server');
    });

    socket.on('init', function (data) {
        console.log("init server with users: ", data);
        $scope.users = data.users;

        //when reloaded, unlock clients if they are already connected
        socket.emit('score:unlock');
    });

    socket.on('user:join', function (data) {
        console.log("user join: ", data);
        $scope.users.push({name: data.name, score: data.score});
    });

    // add a message to the conversation when a user disconnects or leaves the room
    socket.on('user:left', function (data) {
        console.log("user left: ", data);
        var i, user;
        for (i = 0; i < $scope.users.length; i++) {
            user = $scope.users[i];
            if (user.name === data.name) {
                $scope.users.splice(i, 1);
                break;
            }
        }

        //check if finished due leave, when > 1
        if ($scope.users.length > 1) {
            checkFinishRound();
        }
    });

    // add a message to the conversation when a user disconnects or leaves the room
    socket.on('score:change', function (data) {
        console.log('received score: '+data.name+" "+data.score);
        var i, user;
        for (i = 0; i < $scope.users.length; i++) {
            user = $scope.users[i];
            if (user.name === data.name) {
                user.score = data.score
                user.scored = true;
                break;
            }
        }

        checkFinishRound();
    });

    var checkFinishRound = function() {
        if (checkComplete()) {

            console.log('Round finished');

            $scope.state = "finished";

            //calculate win score
            var win = calcWinScore();

            if (win === null) {
                $scope.winScore = "Draw!";
            } else {
                $scope.winScore = win;
            }

            var copyUsers = angular.copy($scope.users);
            for (var u=0; u<copyUsers.length; u++) {
                copyUsers[u].name = copyUsers[u].name.replace(" ", "_");
            }
            var scoreCopy = {round: $scope.scoreHistory.length+1, users: copyUsers};
            $scope.scoreHistory.unshift(scoreCopy);

            //lock clients
            console.log('Locking Clients for 5sec');
            socket.emit('score:lock');

            if ($scope.autoUnlock) {
                setTimeout(function() {
                    socket.emit('score:unlock');
                }, 5*1000);
            };
        }
    };

    socket.on('score:lock', function() {
        $scope.locked = true;
    })

    socket.on('score:unlock', function () {

        console.log('Unlock. Reset last scores.');
        $scope.locked = false;

        var i, user;
        for (i = 0; i < $scope.users.length; i++) {
            user = $scope.users[i];
            user.score = ""
            user.scored = false;
        }

        $scope.state = "picking";
    });

    socket.on('change:name', function (data) {
        changeName(data.oldName, data.newName);
    });

    $scope.kickUser = function(name) {
        socket.emit('kick:name', {username: name});
    }

    $scope.setLock = function(bool) {
        if (bool) {
            socket.emit('score:lock');
        } else {
            socket.emit('score:unlock');
        }
    };
}]);

myApp.controller('AppCtrl', ['$scope', 'socket', 'remember', function($scope, socket, remember) {

    $scope.cardvalues = [
        0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 99, "Pause"
        //0, 0.5, 1, 2, 3, 5, 8, 13, 20, 40, 99
		//0, 1, 2, 3, 4, 6, 8, 12, 16, 20, 24, 32, 40, 60
        //0, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 99
    ];

    $scope.selectedCard = -1;

  // Socket listeners
  // ================

  var joinWithName = function() {
    var rememberedName = remember.getRememberName();
    console.log('answer with username: ', rememberedName);
    socket.emit('answer:name', {username: rememberedName})
  };
  socket.on('ask:name', joinWithName);

  socket.on('init', function (data) {
    $scope.name = data.name;
    $scope.connection = true;

    $scope.checkServer()
  });

  $scope.serverConnected = false;

  $scope.checkServer = function() {
      socket.emit('ask:server');
  }

  socket.on('server:ok', function() {
    $scope.serverConnected = true;
  });

  socket.on('server:lost', function() {
    $scope.serverConnected = false;
  });


    $scope.cardsLocked = false;

    socket.on('score:lock', function () {
        $scope.cardsLocked = true;
    });

    socket.on('score:unlock', function () {
        $scope.cardsLocked = false;
        //reset selected card
        $scope.selectedCard = -1;
    });

    //react on user:left, check if it is me (kicked)
    socket.on('user:left', function (data) {
        var leftName = data.name;
        if (leftName === $scope.name) {

            console.log("you was kicked! Disconnect socket.");
            $scope.disconnect();

            var action = window.prompt("Du wurdest vom Scrumpoker Leiter gekicked. Evtl. hast du nicht reagiert? "+
                                        "Antworte mit 'rejoin' (ohne '') um erneut beizutreten.")
            if (action === "rejoin") {
                $scope.connect();
                joinWithName();
            }                      
        }
    });

  // Methods published to the scope
  // ==============================

    $scope.sendScore = function (score, $index) {

        //return if locked
        if ($scope.cardsLocked) {
            return;
        }

        $scope.selectedCard = $index;

        console.log('send score change: '+score);
        socket.emit('score:change', {
            name: $scope.name,
            score: score
        });
    };

    $scope.changeName = function () {
        socket.emit('change:name', {
        name: $scope.newName
        }, function (result) {
        if (!result) {
            alert('There was an error changing your name');
        } else {
            //remember this name
            remember.setRememberName($scope.newName);

            //set in scope
            $scope.name = $scope.newName;
            $scope.newName = '';
        }
        });
    };

    $scope.disconnect = function() {
        $scope.connection = false;
        socket.disconnect();
    }

    $scope.connect = function() {
        location.reload();
    }
}]);