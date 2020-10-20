

"use strict";

/**
 * Regression test for: https://github.com/FormidableLabs/webpack-stats-plugin/issues/56
 */
const path = require("path");
const { StatsWriterPlugin } = require("../../../index");

module.exports = {
  mode: "production",
  context: __dirname,
  entry: {
    main: "../../src/main.js"
  },
  output: {
    path: path.join(__dirname, "build"),
    publicPath: "/website-o-doom/",
    filename: "contenthash.[contenthash].main.js"
  },
  devtool: false,
  plugins: [
    new StatsWriterPlugin({
      filename: "stats-contenthash.json",
      fields: ["entrypoints"]
    })
  ],
  optimization: {
    splitChunks: {
      cacheGroups: {
        vendors: {
          priority: -10,
          test: /[\\/]node_modules[\\/]/
        }
      },
      chunks: "async",
      minChunks: 1,
      minSize: 30000,
      name: false
    }
  }
};
