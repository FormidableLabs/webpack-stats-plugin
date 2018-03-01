"use strict";

/**
 * Fail promise.
 */
const base = require("./webpack.config");
const StatsWriterPlugin = require("../../index").StatsWriterPlugin;

module.exports = Object.assign({}, base, {
  plugins: [
    new StatsWriterPlugin({
      filename: "stats-transform-fail-promise.json",
      transform() {
        return Promise.reject(new Error("PROMISE"));
      }
    })
  ]
});
