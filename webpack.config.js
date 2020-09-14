const path = require('path');

module.exports = {
  entry: {
    background: './src/background.js',
    popup: './src/popup.js'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  mode: 'development',
  // mode: 'production',
  devtool: 'source-map',
  watch: true
};
