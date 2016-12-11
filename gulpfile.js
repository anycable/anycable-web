var gulp = require('gulp');
var browserSync = require("browser-sync");
var reload = browserSync.reload;

function config(dir){
  return {
    server: {
      baseDir: ['./', dir]
    },
    host: 'localhost',
    port: 4242
  };
};

gulp.task('html', function() {
  var pug = require('gulp-pug');
  var useref = require('gulp-useref');

  return gulp.src('src/**/*.pug')
    .pipe(pug({pretty: true}))
    .pipe(useref({searchPath: './'}))
    .pipe(gulp.dest('./build'))
    .pipe(reload({stream: true}));
});

gulp.task('styles', function () {
  var postcss    = require('gulp-postcss');
  var sourcemaps = require('gulp-sourcemaps');

  return gulp.src('src/styles/main.css')
    .pipe(sourcemaps.init())
    .pipe(postcss([
      require('postcss-cssnext'),
      require('precss')
    ]))
    .pipe(sourcemaps.write('.'))
    .pipe(gulp.dest('./build'))
    .pipe(reload({stream: true}));
});

gulp.task('copy:fonts', function () {
  return gulp.src('src/fonts/*')
    .pipe(gulp.dest('./build/fonts'))
    .pipe(reload({stream: true}));
});

gulp.task('copy:images', function () {
  return gulp.src('src/images/**/*')
    .pipe(gulp.dest('./build/images'))
    .pipe(reload({stream: true}));
});

gulp.task('copy:root', function () {
  return gulp.src('src/*.{xml,png,ico,json,svg}')
    .pipe(gulp.dest('./build'))
    .pipe(reload({stream: true}));
});

gulp.task('copy',
  gulp.parallel(
    'copy:images',
    'copy:root',
    'copy:fonts'
  )
);

gulp.task('serve', function() {
   browserSync(config('./build'));
});

gulp.task('watch', function() {
  gulp.watch('src/**/*.pug', gulp.series('html'));
  gulp.watch('src/**/*.css', gulp.series('styles'));
  gulp.watch('src/images/**/*', gulp.series('copy:images'));
});

gulp.task('clean', function(){
  var del = require('del');
  return del([
    './build/**/*'
  ]);
});

gulp.task('build',
  gulp.series(
    'clean', 
    gulp.parallel(
      'styles', 'html', 'copy'
    )
  )
);

gulp.task('default', gulp.series('build', gulp.parallel('serve', 'watch')));
