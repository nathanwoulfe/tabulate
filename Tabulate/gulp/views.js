import gulp from 'gulp';

import { paths, config } from './config';

export function views() {
    return gulp.src(paths.views)
        .pipe(gulp.dest(`${config.prod ? paths.dest : paths.site}backoffice/`));
}