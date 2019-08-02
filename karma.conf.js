const webpackConfig = require('./webpack.config')();
webpackConfig.mode = 'development';

module.exports = (config) => {
    config.set({
        frameworks: ['jasmine'],

        files: [
            { pattern: 'test/**/*.spec.js' }
            ],

        preprocessors: {
            'test/**/*.spec.js': ['webpack']
        },

        webpack: webpackConfig,

        reporters: ['spec'],
        plugin: ["karma-spec-reporter"],

        browsers: ['ChromeHeadlessNoSandbox'],
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox']
            }
        }
    });
};
