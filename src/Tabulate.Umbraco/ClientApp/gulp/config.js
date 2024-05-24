const backofficePath = './src/';

var argv = require('minimist')(process.argv.slice(2));

var outputPath = argv['output-path'];
if (!outputPath) {
  outputPath = require('./config.outputPath.js').outputPath;
}

export const paths = {
  src: [`${backofficePath}/**/*.*`, `!${backofficePath}/**/*.js`, `!${backofficePath}/**/*.scss/`],
  js: [`${backofficePath}/**/*.js`],  
  scss: `${backofficePath}/**/*.scss`,
  dest: outputPath,
};

export const config = {
  prod: argv["prod"] || false,
};
