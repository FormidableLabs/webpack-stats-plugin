"use strict";

/**
 * Webpack configuration
 */
const path = require("path");
const base = require("../webpack1/webpack.config");

module.exports = {
  mode: "development",
  context: __dirname,
  entry: "../src/main.js",
  output: {
    path: path.join(__dirname, "build"),
    filename: "[hash].main.js"
  },
  devtool: false,
  plugins: base.plugins
};
