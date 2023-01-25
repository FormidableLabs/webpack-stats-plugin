"use strict";

/**
 * Webpack configuration
 */
const base = require("./webpack.config");
const { StatsWriterPlugin } = require("../../../index");

module.exports = {
  ...base,
  entry: {
    main: "../../src/huge"
  },
  plugins: [
    new StatsWriterPlugin({
      filename: "huge-stats.json",
      stats: {
        modules: true
      }
    })
  ]
};
