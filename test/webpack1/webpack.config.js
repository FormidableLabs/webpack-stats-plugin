"use strict";

/**
 * Webpack configuration
 */
const path = require("path");
const base = require("../webpack4/webpack.config");

module.exports = {
  cache: true,
  context: __dirname,
  entry: "../src/main.js",
  output: {
    path: path.join(__dirname, "build"),
    filename: "[hash].main.js"
  },
  plugins: base.plugins // use plugins from webpack4
};
