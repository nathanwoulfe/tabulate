import del from 'del';
import { paths, config } from './config';

export function clean() {
    return del(config.prod 
        ? [paths.dest] 
        : [paths.site, '!**/*.manifest'], { force: true});
}