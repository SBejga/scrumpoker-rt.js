# Scrum Poker RT

An realtime webapp to play scrum poker virtually.

## Screenshots

![Screenshot Client View](/screenshots/screenshot_client.png?raw=true "Screenshot Client View")
![Screenshot Server View Picking](/screenshots/screenshot_server-picking.png?raw=true "Screenshot Server View Picking")
![Screenshot Server View Result](/screenshots/screenshot_server-result.png?raw=true "Screenshot Server View Result")

## Packaged app

the app will be packaged as node-webkit apps and deployed to the release section of github.
Currently it will be packaged for osx64 and win64. See [Releases](https://github.com/SBejga/scrumpoker-rt.js/releases).

## Running it

Install the dependencies with npm:

    npm install
    bower install

Run the app:

    node app.js

Open Server View at [http://localhost:8000/server/](http://localhost:8000/server/) and Clients at local [http://localhost:8000/](http://localhost:8000/)

## Improvements / Todos

- Login & Users
- Secure server view 
- Only accept one server view, warn when multiple server views
- add spectator mode client

## Thanks

- [Anika Henke](http://selfthinker.github.com/CSS-Playing-Cards/) for Playing Cards CSS
- [kues / Freepik](http://www.freepik.com/free-photo/wooden-texture_928750.htm) for wooden texture as background
- [Freepik / Flaticon](http://www.flaticon.com/free-icon/poker-playing-cards_35203) for poker playing cards icon as base for scrumpoker logo 

