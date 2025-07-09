'use strict';

const Webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const TerserPlugin = require('terser-webpack-plugin');

const pkg = require('./package.json');
const spdx_banner = `pubcid.js ${pkg.version} - https://github.com/prebid/Shared-id-v2/\nSPDX-License-Identifier: Apache-2.0`

// eslint-disable-next-line no-unused-vars
module.exports = (env = {}, args = {}) => {
    const mode = args.mode;
    const mapType = (mode === 'production') ? 'hidden-source-map' : 'inline-source-map';

    console.log('Mode: ' + mode);
    console.log('Map:  ' + mapType);

    // Return 2 configs in an array.  First one is a minimized script that is placed in CDN,
    // and the second one as a library used by other projects.

    const scriptConfig = {
        mode: mode,
        target: ['web', 'es5'],
        entry: {
            'pubcid.min': './src/pubcid.js'
        },
        output: {
            filename: '[name].js',
            path: __dirname + '/dist',
            environment: {
                arrowFunction: false
            }
        },
        resolve: {
            fallback: {
                "util": false
            }
        },
        module: {
            rules: [
                {
                    test: /\.m?js$/,
                    exclude: {
                        and: [/node_modules/],
                        not: [/deep-eql/]
                    },
                    use: {
                        loader: 'babel-loader',
                        options: {
                            // sourceType: 'unambiguous',
                            // Transform to commonjs modules so sinon spies can work in unit tests
                            presets: [['@babel/preset-env', {modules: 'commonjs', useBuiltIns: false, debug: false}]],

                            plugins: [
                                ['@babel/plugin-transform-runtime', { corejs: 3, absoluteRuntime: true, version: '7.28.0'}],
                            ],
                        },
                    }
                },
            ]
        },
        optimization: {
            minimizer: [new TerserPlugin({
                extractComments: false,
            })],
        },
        plugins: [
            new CleanWebpackPlugin(
                // Only clean up files related to the script before build
                {cleanOnceBeforeBuildPatterns: ['**/*', '!index.*']}
            ),
            new Webpack.BannerPlugin({
                banner: spdx_banner,
            })
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
                    test: /\.m?js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [['@babel/preset-env', {}]],
                            plugins: [['@babel/plugin-transform-runtime', {
                                corejs: 3
                            }]]
                        },
                    }
                },
            ],
        },
        optimization: {
            minimizer: [new TerserPlugin({
                extractComments: false,
            })],
        },
        plugins: [
            new CleanWebpackPlugin(
                // Only clean up files related to the library before build
                {cleanOnceBeforeBuildPatterns: ['index.*']}
            ),
            new Webpack.BannerPlugin({
                banner: spdx_banner,
            })
        ],
        devtool: mapType
    };

    // Generate the test page if in dev mode

    if (mode !== 'production') {
        scriptConfig.plugins = scriptConfig.plugins || [];
        scriptConfig.plugins.push(
            new HtmlWebpackPlugin({
                filename: 'pubcid.html',
                template: 'src/pubcid.html'
            })
        );
    }
    else {
        scriptConfig.plugins.push(
            new BundleAnalyzerPlugin({
                analyzerMode: 'disabled',
                generateStatsFile: true,
                statsOptions: { source: false }
            })
        )
    }

    return [scriptConfig, libConfig];
};
