"use strict";

/**
 * Fail promise.
 */
const base = require("./webpack.config");
const fail = require("../webpack4/webpack.config.fail-promise");

module.exports = {
  ...base,
  plugins: fail.plugins
};
