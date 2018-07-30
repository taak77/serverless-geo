const path = require('path');
const slsw = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');


module.exports = {
  entry: {
    handler: './handler.js'
  },
  target: 'node',
  mode: slsw.lib.webpack.isLocal ? 'development': 'production',
  optimization: {
    // We no not want to minimize our code.
    minimize: false
  },
  performance: {
    // Turn off size warnings for entry points
    hints: false
  },
  devtool: 'nosources-source-map',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|_warmup)/,
        use: [
          {
            loader: 'babel-loader'
          }
        ],
      }
    ]
  },
  plugins: [
    new CopyWebpackPlugin([
        './GeoLite2-City.mmdb',
        './GeoLite2-Country.mmdb',
		{ from: '_warmup', to: '_warmup' }
    ])
  ],
  output: {
    libraryTarget: 'commonjs',
    path: path.join(__dirname, '.webpack'),
    filename: '[name].js',
    sourceMapFilename: '[file].map'
  }
};
