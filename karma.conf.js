const webpackConfig = require('./webpack.config')();
webpackConfig.mode = 'development';

module.exports = (config) => {
    config.set({
        frameworks: ['mocha'],

        files: [
            { pattern: 'test/**/*.spec.js' }
            ],

        preprocessors: {
            'test/**/*.spec.js': ['webpack', 'sourcemap']
        },

        webpack: webpackConfig[0],

        reporters: ['mocha', 'bamboo'],

        browsers: ['ChromeHeadlessNoSandbox'],
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox']
            }
        }
    });
};
