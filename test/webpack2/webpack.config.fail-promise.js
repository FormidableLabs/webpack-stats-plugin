"use strict";

/**
 * Fail promise.
 */
const base = require("./webpack.config");
const fail = require("../webpack4/webpack.config.fail-promise");

module.exports = Object.assign({}, base, {
  plugins: fail.plugins
});
