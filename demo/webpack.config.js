/**
 * Webpack configuration
 */
var path = require("path");
var StatsWriterPlugin = require("../index").StatsWriterPlugin;

module.exports = {
  cache: true,
  context: __dirname,
  entry: "./main.js",
  output: {
    path: path.join(__dirname, "build"),
    filename: "[hash].main.js"
  },
  plugins: [
    new StatsWriterPlugin({
      path: path.join(__dirname, "build"),
      filename: "stats.json"
    })
  ]
};
