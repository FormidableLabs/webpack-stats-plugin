"use strict";

/**
 * Webpack configuration
 */
const path = require("path");
const { mode, ...base } = require("../webpack4/webpack.config");

module.exports = {
  ...base,
  cache: true,
  context: __dirname,
  output: {
    ...base.output,
    path: path.join(__dirname, "build")
  }
};
