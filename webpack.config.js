'use strict';

//const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = (env = {}, args = {}) => {
    const mode = args.mode || 'production';
    console.log('Mode is ' + mode);

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
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [['@babel/preset-env', {
                                // debug: true,
                                useBuiltIns: "usage",
                                corejs: 3,}]],
                            plugins: ['@babel/plugin-transform-modules-commonjs'],
                        },
                    }
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin(
                {cleanOnceBeforeBuildPatterns: ['pubcid.*']}
            )
        ]
        ,
        devServer: {
            host: 'mockpub'
        },
        devtool: 'hidden-source-map'
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
                            plugins: ['@babel/plugin-transform-modules-commonjs'],
                        },
                    }
                },
            ],
        },
        plugins: [
            new CleanWebpackPlugin(
                {cleanOnceBeforeBuildPatterns: ['index.*']}
            )
        ],
        devtool: 'source-map'
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
