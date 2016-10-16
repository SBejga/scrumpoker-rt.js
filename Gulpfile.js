var gulp = require('gulp');
var NwBuilder = require('nw-builder');
var del = require('del');
var zip = require('gulp-zip');
var release = require('gulp-github-release');
var size = require('gulp-filesize');
var merge = require('merge-stream');
var rename = require('gulp-rename');

var BUILD_PLATFORMS = ['win64'];
// var BUILD_PLATFORMS = ['osx64', 'win64'];

var SRC_GLOB = [
    '**/*', 
    '!chrome.sh',
    '!basicauth.json',
    '!githubtoken.json',
    '!{cache,cache/**}',
    '!{screenshots,screenshots/**}'
];

var nw = new NwBuilder({
    // use the glob format
    files: SRC_GLOB,
    platforms: BUILD_PLATFORMS,
    version: 'latest',
    buildDir: './build/nw/',
    zip: false
});
//Log stuff you want
nw.on('log',  console.log);

gulp.task('clean', function () {
  return del([
    'build/**/*',
    // we don't want to clean this file though so we negate the pattern
    //'!build/config/deploy.json'
  ]);
});

// test: gulp nw && ls build/nw/scrumpoker/osx64/scrumpoker.app/Contents/Resources/app.nw/
gulp.task('nw', ['clean'], function(done) {
    // Build returns a promise
    nw.build().then(function () {
        done();
    }).catch(function (error) {
        console.error(error);
        done();
    });
})

//nw
/**
 * Rename scrumpoker.exe to nw.exe 
 * on windows7, file crashed when not name nw.exe
 */
gulp.task('nw:rename:win', [], function() {
    return gulp.src("./build/nw/**/scrumpoker.exe")
        .pipe(rename(function (path) {
            path.basename = "nw";
            return path;
        }))
        .pipe(del(['./build/nw/**/scrumpoker.exe']))
        .pipe(gulp.dest("./build/nw/"));
})

gulp.task('release:zip', ["nw:rename:win"], (done) => {
    var tasks = BUILD_PLATFORMS.map(function(element){
        return gulp.src('./build/nw/scrumpoker/'+element+'/**')
            .pipe(zip( element+'.zip'))
            .pipe(gulp.dest('./build/zip/'));
    });

    return merge(tasks);
});
gulp.task('release:size', ['release:zip'], function() {
    return gulp.src('./build/zip/*')
        .pipe(size())
});

gulp.task('release', ['release:zip'], function() {
    return gulp.src('./build/zip/*')
        .pipe(size())
        .pipe(release({
            // or you can set an env var called GITHUB_TOKEN instead
            token: require('./githubtoken.json').githubtoken, 
            owner: 'SBejga',                    // if missing, it will be extracted from manifest (the repository.url field)
            repo: 'scrumpoker-rt.js',            // if missing, it will be extracted from manifest (the repository.url field)
            //   tag: 'v1.0.0',                      // if missing, the version will be extracted from manifest and prepended by a 'v'
            //   name: 'publish-release v1.0.0',     // if missing, it will be the same as the tag
            draft: true,                       // if missing it's false
            prerelease: true,                  // if missing it's false
            manifest: require('./package.json') // package.json from which default values will be extracted if they're missing
        }));
});
