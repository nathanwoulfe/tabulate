import gulp from 'gulp';

import { paths, config } from './gulp/config';

import { js } from './gulp/js';
import { clean } from './gulp/clean';
import { scss } from './gulp/scss';
import { views } from './gulp/views';

// set env from args
config.prod = process.argv.indexOf('--prod') > -1;

function manifest() {
    return gulp.src(paths.manifest)
        .pipe(gulp.dest(config.prod ? paths.dest : paths.site));
};

function lang() {
    return gulp.src(paths.lang)
        .pipe(gulp.dest(config.prod ? `${paths.dest}lang` : `${paths.site}lang`));
};

// entry points... 
export const prod = gulp.task('prod',
    gulp.series(clean,
        gulp.parallel(
            js,
            scss,
            views,
            lang,
            manifest
        )));

export const dev = gulp.task('dev',
    gulp.series(clean,
        gulp.parallel(
            js,
            scss,
            views,
            lang,
            manifest,
            done => {
                console.log('watching for changes... ctrl+c to exit');
                gulp.watch(paths.js, gulp.series(js, views));
                gulp.watch(paths.scss, gulp.series(scss, views));
                gulp.watch(paths.views, gulp.series(views, js));
                gulp.watch(paths.lang, gulp.series(lang));
                gulp.watch(paths.manifest, gulp.series(manifest));

                done();
            }
        )));
