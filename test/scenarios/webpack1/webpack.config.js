"use strict";

/**
 * Webpack configuration
 */
const path = require("path");
const base = require("../webpack5/webpack.config");
delete base.mode;

module.exports = {
  ...base,
  cache: true,
  context: __dirname,
  output: {
    ...base.output,
    path: path.join(__dirname, "build")
  }
};
