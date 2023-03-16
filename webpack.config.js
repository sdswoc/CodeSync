const path = require('path')

module.exports = {
  mode: 'development',
  devtool: 'source-map',
  entry: {
    client: './client.js'
  },
  output: {
    globalObject: 'self',
    path: path.resolve(__dirname, './public/'),
    filename: '[name].bundle.js',
    publicPath: '/6thMarch/public/'
  }
}