const webpackConfig = require('./webpack.config')();
webpackConfig.mode = 'development';

// Get around the dreprecation warning in karma-webpack@3.0.5
process.noDeprecation = true;

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
