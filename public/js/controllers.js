'use strict';


// Private helpers
// ===============

/* Controllers */

function ServerCtrl($scope, socket) {

    $scope.state = "picking";

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
        for (i = 0; i < $scope.users.length; i++) {
            score = $scope.users[i].score+"";
            //already found, increase in other array at this position
            if (diffs.indexOf(score) < 0) {
                diffs.push(score);
            }
        }

        //count each different
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

    socket.on('init', function (data) {
        $scope.users = data.users;
    });

    socket.on('user:join', function (data) {
        $scope.users.push({name: data.name, score: data.score});
    });

    // add a message to the conversation when a user disconnects or leaves the room
    socket.on('user:left', function (data) {
        var i, user;
        for (i = 0; i < $scope.users.length; i++) {
            user = $scope.users[i];
            if (user.name === data.name) {
                $scope.users.splice(i, 1);
                break;
            }
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

        if (checkComplete()) {

            console.log('Round finished. Locking Clients for 5sec');

            $scope.state = "finished";

            //calculate win score
            var win = calcWinScore();

            if (win === null) {
                $scope.winScore = "Draw!";
            } else {
                $scope.winScore = win;
            }

            //lock clients
            socket.emit('score:lock');
        }
    });


    socket.on('score:unlock', function () {

        console.log('Reset last scores.');

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
}

function AppCtrl($scope, socket) {

    $scope.cardvalues = [
        0, 0.5, 1, 2, 3, 5, 10, 20, 99
    ];

    $scope.selectedCard = -1;

  // Socket listeners
  // ================

  socket.on('init', function (data) {
    $scope.name = data.name;
  });

    $scope.state = "unlock";

    socket.on('score:lock', function () {
        $scope.state = "lock";
    });

    socket.on('score:unlock', function () {
        $scope.state = "unlock";
        //reset selected card
        $scope.selectedCard = -1;
    });

  // Methods published to the scope
  // ==============================

    $scope.sendScore = function (score, $index) {

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

        $scope.name = $scope.newName;
        $scope.newName = '';
      }
    });
  };

}
