const path = require('path');

module.exports = {
  context: __dirname + '/src',

  mode: 'development',

  devtool: 'source-map',
  devServer: {
    contentBase: path.resolve(__dirname, 'dist')
  },

  entry: {
    app: './app.js'
  },

  module: {
    rules: [
      {
        test: /\.js$/,
        type: 'javascript/esm',
        exclude: /node_modules/
      }
    ]
  },
  output: {
    filename: '[name].bundle.js',
    path: path.resolve(__dirname, 'dist/assets'),
    publicPath: '/assets/'
  },

  resolve: {
    fallback: {
      fs: false
    }
  }
};
