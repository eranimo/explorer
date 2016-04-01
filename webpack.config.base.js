/* eslint strict: 0 */
'use strict';
var webpack = require('webpack')
const path = require('path');

module.exports = {
  module: {
    loaders: [{
      test: /\.jsx?$/,
      loaders: ['babel-loader'],
      exclude: /node_modules/
    }]
  },
  sassLoader: {
    includePaths: [
      path.resolve(__dirname, "./app"),
      path.resolve(__dirname, "./node_modules")
    ]
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    libraryTarget: 'commonjs2'
  },
  resolve: {
    root: path.resolve(__dirname, 'app'),
    extensions: ['', '.js', '.jsx', '.scss'],
    packageMains: ['webpack', 'browser', 'web', 'browserify', ['jam', 'main'], 'main']
  },
  plugins: [
    new webpack.ProvidePlugin({
      _: 'lodash'
    })
  ],
  externals: [
    // put your node 3rd party libraries which can't be built with webpack here (mysql, mongodb, and so on..)
  ]
};
