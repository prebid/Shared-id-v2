const webpackConfig = require('./webpack.config')(undefined, {mode: 'development'});
webpackConfig.mode = 'development';

module.exports = (config) => {
    var reporters = ['mocha', 'bamboo'];
    if(config.coverage){
        reporters = ['coverage'];
        webpackConfig[0].module.rules.forEach(rule=>{
            if(rule.use.loader === 'babel-loader'){
                rule.use.options.plugins = rule.use.options.plugins || [];
                rule.use.options.plugins.push(["istanbul", {"exclude": ["test/**/*.js"]}]);
            }
        })
    }

    config.set({
        frameworks: ['mocha'],

        files: [
            { pattern: 'src/**/*.js' },
            { pattern: 'test/**/*.js' }
            ],

        preprocessors: {
            'src/**/*.js': ['webpack', 'sourcemap'],
            'test/**/*.js': ['webpack', 'sourcemap']
        },

        webpack: webpackConfig[0],

        reporters: reporters,

        browsers: ['ChromeHeadlessNoSandbox'],
        //browsers: ['Safari'],
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox']
            }
        },
        coverageReporter: {
            reporters: [
                {type: 'text'},
                {type: 'html'},
                {type: 'clover', dir: 'coverage', subdir: '.', file: 'clover.xml'}
            ]
        },
        singleRun: true
    });
};
