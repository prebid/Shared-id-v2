'use strict';

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = (env = {}, args = {}) => {
    console.log('Mode is ' + args.mode);

    const isProd = args.mode === 'production';

    let config = {
        entry: {
            'pubcid.min': './src/pubcid.js',
            'index':'./src/index.js'
        },
        output: {
            filename: '[name].js',
            path: __dirname + '/dist',
            libraryTarget: 'umd'
        }
        ,
        module: {
            rules: [
                {
                    test: /\.js$/,
                    exclude: /(node_modules|bower_components)/,
                    use: {
                        loader: 'babel-loader'
                    }
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin()
        ]
        ,
        devServer: {
            host: 'mockpub'
        },
        optimization: {
            minimize: true,
            minimizer: [
                new TerserPlugin({
                    include: /\.min\.js$/
                }),
            ]
        },
        devtool: 'hidden-source-map'
    };

    // Generate the test page if in dev mode

    if (!isProd) {
        config.plugins.push(
            new HtmlWebpackPlugin({
                filename: 'pubcid.html',
                template: 'src/pubcid.html',
                excludeAssets: [/index.js/]
            }),
            new HtmlWebpackExcludeAssetsPlugin()
        );
    }

    return config;
};
