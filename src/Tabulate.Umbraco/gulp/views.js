import gulp from 'gulp';
import gulpif from 'gulp-if';

import { paths, config } from './config';

export function views() {
    const backoffice = 'Backoffice/';
    return gulp.src(paths.viewsProd)
        .pipe(gulpif(!config.prod, gulp.dest(paths.siteNetCore + backoffice)))
        .pipe(gulpif(!config.prod, gulp.dest(paths.site + backoffice)))
        .pipe(gulpif(config.prod, gulp.dest(paths.dest + backoffice)));
}