const backofficePath = 'app_plugins/tabulate/backoffice/';

export const paths = {
    js: [`${backofficePath}**/*.js`],
    views: [`${backofficePath}**/*.html`],
    scss: `${backofficePath}**/*.scss`,
    lang: `./app_plugins/tabulate/lang/*.xml`,
    manifest: './app_plugins/tabulate/package.manifest',
    dest: './dist/app_plugins/tabulate/',
    site: '../tabulate.site/app_plugins/tabulate/',
};

export const config = {
    hash: new Date().toISOString().split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0).toString().substring(1)
};
