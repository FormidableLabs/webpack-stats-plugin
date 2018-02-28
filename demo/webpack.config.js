"use strict";

/**
 * Webpack configuration
 */
const path = require("path");
const StatsWriterPlugin = require("../index").StatsWriterPlugin;
const INDENT = 2;

module.exports = {
  cache: true,
  context: __dirname,
  entry: "./main.js",
  output: {
    path: path.join(__dirname, "build"),
    filename: "[hash].main.js"
  },
  plugins: [
    // Try various defaults and options.
    new StatsWriterPlugin(),
    new StatsWriterPlugin({}),
    new StatsWriterPlugin({
      filename: "stats-transform.json",
      fields: null,
      transform(data) {
        return JSON.stringify(data.assetsByChunkName, null, INDENT);
      }
    }),
    new StatsWriterPlugin({
      filename: "stats-transform.md",
      fields: null,
      transform(data) {
        const assetsByChunkName = data.assetsByChunkName;
        return Object.keys(assetsByChunkName).reduce((memo, key) => {
          return `${memo}${key } | ${ assetsByChunkName[key] }\n`;
        }, "Name | Asset\n:--- | :----\n");
      }
    }),
    new StatsWriterPlugin({
      filename: "stats-transform-custom-obj.json",
      transform(data) {
        return JSON.stringify({
          main: data.assetsByChunkName.main
        }, null, INDENT);
      }
    }),
    new StatsWriterPlugin({
      filename: "stats-custom.json"
    }),
    // Relative paths work, but absolute paths do not currently.
    new StatsWriterPlugin({
      filename: "../build2/stats-custom2.json"
    })
  ]
};
