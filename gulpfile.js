// TODO

// Figure out Gulp-Markdown


// Paths
var sendto = {
  dist: './dist'
};

var srcPath = {
  jade: './src/jade/htdocs/**/*.jade',
  jadewatch: './src/jade/**/*.jade',
  yaml: './src/data/data.yaml',
  img: './src/img/**/*',
  stylus: './src/stylus/**/*.styl',
  js: './src/js/**/*.js'

};


// Modules
var gulp            = require('gulp');
var browserSync     = require('browser-sync');      // Automagicly refreshes browser when you save
var reload          = browserSync.reload;
var stylus          = require('gulp-stylus');       // PreProcessor
// var rupture         = require('rupture');        // Use Rupture for
var sourcemaps      = require('gulp-sourcemaps');   // SourceMaps for CSS and JS
var please          = require('gulp-pleeease');     // PostProcessor for (auto-prefixing, minifying, and IE fallbacks)
var evilIcons       = require('gulp-evil-icons');   // SVG Icon Library
var jade            = require('gulp-jade');         // Jade for HTML
var marked          = require('marked');            // Enable MarkDown with Jade. :markdown filter
var plumber         = require('gulp-plumber');      // Prevent pipe from breaking even if and error is encountered
var data            = require('gulp-data');         // Used to Create a static DB
var path            = require('path');
var fs              = require('fs');
var frontMatter     = require('gulp-front-matter'); // Used to enable frontMatter
var rename          = require('gulp-rename');       // Used to rename files
var yaml            = require('gulp-yaml');         // Used to convert YAML into JSON for static DB
var runSequence     = require('run-sequence');      // Used to run tasks in a sequence
var changed         = require('gulp-changed');      // Used to check if a file has changed
var imagemin        = require('gulp-imagemin');     // Used to compress images
var pngquant        = require('imagemin-pngquant'); // Used to compress pngs
var notify          = require('gulp-notify');       // Used to output messages during gulp tasks
var uglify          = require('gulp-uglify');
var concat          = require('gulp-concat');

var ghPages         = require('gulp-gh-pages');     // Used to move Dist to gh-pages

// Production tasks for later
// var argv            = require('yargs').argv;        // Used to notice flags in your gulp commands
// var gulpif          = require('gulp-if');           // Used to create conditionals in your gulp tasks
// var production      = !!(argv.prod);                // true if --prod flag is used
//



// Pleeease Post-Prosessor options
var pleaseOptions  = {
  autoprefixer: {
    browsers: ['ie >= 8', 'ie_mob >= 10', 'ff >= 3.6', 'chrome >= 10', 'safari >= 5.1', 'opera >= 11', 'ios >= 7', 'android >= 4.1', 'bb >= 10']
  },
  filters: true,
  rem: true,
  pseudoElements: true,
  opacity: true,

  import: false,
  minifier: false, //CSS Wring is being used here
  mqpacker: true,

  sourcemaps: false,

  next: {
    calc: false,
    customProperties: false,
    customMedia: false,
    colors: false
  }
};


gulp.task('stylus', function () {
  return gulp.src('src/stylus/style.styl')
    .pipe(plumber())
    //.pipe(gulpif(production, uglify()), sourcemaps.init())
    .pipe(sourcemaps.init())
    .pipe(stylus())
    //.on('error', handleErrors)
    .pipe(sourcemaps.write())
    .pipe(please(pleaseOptions))
    .pipe(gulp.dest(sendto.dist))
    .pipe(reload({ stream: true }));
});


gulp.task('yaml', function () {
  return gulp.src(srcPath.yaml)
    //.pipe(plumber())
    .pipe(yaml({ space: 2 }))
    .pipe(rename('index.jade.json'))
    .pipe(gulp.dest('./src/data'))
    .pipe(browserSync.reload({stream:true}));
});


gulp.task('sequence', function(callback) {
  runSequence('yaml', 'jade', callback);
});


gulp.task('jade', function() {
  return gulp.src(srcPath.jade)
    .pipe(plumber())
    .pipe(frontMatter({ property: 'data' }))
    .pipe(data(function(file) {
      // Use this one when not watching and related to current page
      //return require('./src/data/' + path.basename(file.path) + '.json');

      //Use this one when watchgin JSON files related to the current page
      //return JSON.parse(fs.readFileSync('./src/data/' + path.basename(file.path) + '.json'));

      //Use this when watching a global JSON file for all pages
      return JSON.parse(fs.readFileSync('./src/data/index.jade.json'));
    }))
    // TODO - pretty: false for HTML minification
    .pipe(jade({ pretty: true }))
    .pipe(evilIcons())
    .pipe(gulp.dest(sendto.dist))
    .pipe(browserSync.reload({stream:true}));
});


gulp.task('browser-sync', function() {
    browserSync.init({
        server: {
            baseDir: sendto.dist
        }
        // This is here for special cases when reloading of other files is needed
        // ,
        // files: [
        //   themePath + '/**/*.php',
        //   themePath + '/js/**/*.js'
        //   ]
    });
});


gulp.task('imgs', function () {
  return gulp.src(srcPath.img)
    .pipe(changed(sendto.dist))
    // ngmin will only get the files that
    // changed since the last time it was run
    .pipe(imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use: [pngquant()]
    }))
    .pipe(gulp.dest(sendto.dist + '/img'));
});

gulp.task('js', function () {
    gulp.src(srcPath.js)
    .pipe(concat('global.js'))
    //.pipe(rename({suffix: '.min'}))
    .pipe(uglify())
    .pipe(gulp.dest(sendto.dist + '/js'));
});


// Copy js
// gulp.task('copy-js', function() {
//     gulp.src(srcPath.js)
//     .pipe(gulp.dest(sendto.dist + '/js'));
// });

//
// gulp.task('copy-favicon', function() {
//     gulp.src(srcPath.favicon)
//     .pipe(gulp.dest(sendto.dist));
// });
//
//
// gulp.task('copy-robots', function() {
//     gulp.src(srcPath.robots)
//     .pipe(gulp.dest(sendto.dist));
// });
//


// Deploy active branch to gh-pages branch
gulp.task('ghp', function() {
  return gulp.src('./dist/**/*')
    .pipe(ghPages());
});



gulp.task('default', ['imgs', 'stylus', 'yaml', 'jade', 'js' ,'browser-sync'], function () {
  gulp.watch(srcPath.yaml, ['sequence']);  // Run yaml and then jade tasks when yaml file changes
  gulp.watch(srcPath.img, ['imgs']);      // Run jade task when any jade file changes
  gulp.watch(srcPath.stylus, ['stylus']);  // Run stylus task when any stylus file changes
  gulp.watch(srcPath.jadewatch, ['jade']);      // Run jade task when any jade file changes
  gulp.watch(srcPath.js, ['js']);      // Run jade task when any jade file changes
});
