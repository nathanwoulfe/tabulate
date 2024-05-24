import gulp from 'gulp';
import sass from 'gulp-dart-sass';
import concat from 'gulp-concat';

import { paths } from './config';

export function scss() {
  return gulp.src(paths.dest)
    .pipe(sass())
    .pipe(concat(`styles.css`))
    .pipe(gulp.dest(paths.dest));
}
