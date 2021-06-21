'use strict';

const Webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackExcludeAssetsPlugin = require('html-webpack-exclude-assets-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const pkg = require('./package.json');
const spdx_banner = `pubcid.js ${pkg.version} - https://github.com/conversant/pubcid.js\nSPDX-License-Identifier: Apache-2.0`

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
                            // Transform to commonjs modules so sinon spies can work in unit tests
                            presets: [['@babel/preset-env', {modules: 'cjs'}]],

                            plugins: [
                                ['@babel/plugin-transform-runtime', { corejs: 3 }],
                            ],
                        },
                    }
                }
            ]
        },
        plugins: [
            new CleanWebpackPlugin(
                // Only clean up files related to scripts before build
                {cleanOnceBeforeBuildPatterns: ['pubcid.*', 'stats.json']}
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
                    test: /\.(js)$/,
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
        plugins: [
            new CleanWebpackPlugin(
                // Only clean up files related to library before build
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
                template: 'src/pubcid.html',
                excludeAssets: [/index.js/]
            }),
            new HtmlWebpackExcludeAssetsPlugin()
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
