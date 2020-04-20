'use strict';

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = (env = {}, args = {}) => {
    const mode = args.mode;
    const mapType = (mode === 'production') ? 'hidden-source-map' : 'inline-source-map';

    console.log('Mode: ' + mode);
    console.log('Map:  ' + mapType);

    // Return 2 configs in an array.  First one is a minimized script that is placed in CDN,
    // and the second one as a library used by other projects.

    const scriptConfig = {
        mode: mode,
        entry: {
            'pubcid.min': './src/pubcid.js'
        },
        output: {
            filename: '[name].js',
            path: __dirname + '/dist'
        }
        ,
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            // Turn on polyfill with core-js
                            presets: [['@babel/preset-env', {
                                // debug: true,
                                useBuiltIns: "usage",
                                corejs: 3,}]],

                            // Transform to commonjs modules so sinon spies can work in unit tests
                            plugins: ['@babel/plugin-transform-modules-commonjs'],
                        },
                    }
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin(
                // Only clean up files related to scripts before build
                {cleanOnceBeforeBuildPatterns: ['pubcid.*']}
            )
        ]
        ,
        devServer: {
            host: 'mockpub'
        },
        devtool: mapType
    };

    const libConfig = {
        mode: mode,
        entry: {
            'index':'./src/index.js'
        },
        output: {
            filename: 'index.js',
            path: __dirname + '/dist',
            libraryTarget: 'umd'
        },
        module: {
            rules: [
                {
                    test: /\.(js)$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            // No polyfill
                            // Transform to commonjs module so that clients can call exported functions
                            plugins: ['@babel/plugin-transform-modules-commonjs'],
                        },
                    }
                },
            ],
        },
        plugins: [
            new CleanWebpackPlugin(
                // Only clean up files related to library before build
                {cleanOnceBeforeBuildPatterns: ['index.*']}
            )
        ],
        devtool: mapType
    };

    // Generate the test page if in dev mode

    if (mode !== 'production') {
        scriptConfig.plugins = scriptConfig.plugins || [];
        scriptConfig.plugins.push(
            new HtmlWebpackPlugin({
                filename: 'pubcid.html',
                template: 'src/pubcid.html',
                excludeAssets: [/index.js/]
            }),
            new HtmlWebpackExcludeAssetsPlugin()
        );
    }

    return [scriptConfig, libConfig];
};
