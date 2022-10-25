const path = require('path');

module.exports = {
  entry: './8gui.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '8gui-standalone.js',
  },
};