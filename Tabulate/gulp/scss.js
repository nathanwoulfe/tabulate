import gulp from 'gulp';
import sass from 'gulp-dart-sass';
import concat from 'gulp-concat';
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';

import { paths, config } from './config';
import { noop } from 'gulp-util';

export function scss() {
    return gulp.src(paths.scss)
        .pipe(sass())
        .pipe(concat(`styles.css`))
        .pipe(config.prod ? autoprefixer() : noop())
        .pipe(config.prod ? cleanCSS() : noop())
        .pipe(gulp.dest(config.prod ? `${paths.dest}backoffice/` : `${paths.site}backoffice/`));
}
