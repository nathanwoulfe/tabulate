const backofficePath = './src/Tabulate/Backoffice';

// two directories up to the test sites
// but build into /src

export const paths = {
    js: [`${backofficePath}/**/*.js`,],
    json: [`${backofficePath}/**/*.json`,],
    viewsDev: [`${backofficePath}/**/*.html`],
    viewsProd: [`${backofficePath}/**/*.html`, `!${backofficePath}/**/components/**/*.html`],
    scss: `${backofficePath}/**/*.scss`,
    lang: `./src/Tabulate/Lang/*.xml`,
    manifest: './src/Tabulate/package.manifest',
    dest: './App_Plugins/Tabulate/',
    site: '../../Tabulate.Site.V8/App_Plugins/Tabulate/',
    siteNetCore: '../../Tabulate.Site.V9/App_Plugins/Tabulate/',
};

export const config = {
    hash: new Date().toISOString().split('').reduce((a, b) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0).toString().substring(1)
};
