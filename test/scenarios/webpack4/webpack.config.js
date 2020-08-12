"use strict";

/**
 * Webpack configuration
 */
const path = require("path");
const { StatsWriterPlugin } = require("../../../index");
const INDENT = 2;
const STAT_RESET = Object.freeze({
  // fallback for new stuff added after v3
  all: false,
  // explicitly turn off older fields
  // (webpack <= v2.7.0 does not support "all")
  // See: https://webpack.js.org/configuration/stats/
  performance: false,
  hash: false,
  version: false,
  timings: false,
  entrypoints: false,
  chunks: false,
  chunkModules: false,
  cached: false,
  cachedAssets: false,
  children: false,
  moduleTrace: false,
  assets: false,
  modules: false,
  publicPath: false
});

module.exports = {
  mode: "development",
  context: __dirname,
  entry: "../../src/main.js",
  output: {
    path: path.join(__dirname, "build"),
    publicPath: "/website-o-doom/",
    filename: "[hash].main.js"
  },
  devtool: false,
  plugins: [
    // Try various defaults and options.
    new StatsWriterPlugin(),
    new StatsWriterPlugin({}),
    new StatsWriterPlugin({
      filename: "stats-transform.json",
      fields: null,
      transform({ assetsByChunkName }) {
        return JSON.stringify(assetsByChunkName, null, INDENT);
      }
    }),
    new StatsWriterPlugin({
      filename: "stats-transform.md",
      fields: null,
      transform({ assetsByChunkName }) {
        return Object.entries(assetsByChunkName).reduce(
          (memo, [key, val]) => `${memo}${key} | ${val}\n`,
          "Name | Asset\n:--- | :----\n"
        );
      }
    }),
    new StatsWriterPlugin({
      filename: "stats-transform-custom-obj.json",
      transform({ assetsByChunkName: { main } }) {
        return JSON.stringify({ main }, null, INDENT);
      }
    }),
    new StatsWriterPlugin({
      filename: "stats-custom.json"
    }),
    // Relative paths work, but absolute paths do not currently.
    new StatsWriterPlugin({
      filename: "../build2/stats-custom2.json"
    }),
    // Dynamic filename.
    new StatsWriterPlugin({
      filename: () => "stats-dynamic.json"
    }),
    // Promise transform
    new StatsWriterPlugin({
      filename: "stats-transform-promise.json",
      transform({ assetsByChunkName: { main } }) {
        return Promise.resolve()
          // Force async.
          // eslint-disable-next-line promise/avoid-new
          .then(() => new Promise((resolve) => { process.nextTick(resolve); }))
          .then(() => JSON.stringify({ main }, null, INDENT));
      }
    }),
    // Custom stats
    new StatsWriterPlugin({
      filename: "stats-custom-stats.json",
      stats: Object.assign({}, STAT_RESET, {
        assets: true
      }),
      transform(data) {
        // webpack >= v3 adds this field unconditionally, so remove it
        delete data.filteredAssets;
        return JSON.stringify(data, null, INDENT);
      }
    }),
    // Regression test: Missing `stats` option fields that should be default enabled.
    // https://github.com/FormidableLabs/webpack-stats-plugin/issues/44
    new StatsWriterPlugin({
      filename: "stats-custom-stats-fields.json",
      fields: ["errors", "warnings", "assets", "hash", "publicPath", "namedChunkGroups"]
    }),
    new StatsWriterPlugin({
      filename: "stats-override-tostring-opt.json",
      stats: Object.assign({}, STAT_RESET, {
        // chunks are normally omitted due to second argument of .toJson()
        chunks: true
      }),
      transform(data) {
        // normalize subset of chunk metadata across all versions of webpack
        data.chunks = data.chunks.map((chunk) => [
          "rendered",
          "initial",
          "entry",
          "size",
          "names",
          "parents"
        ].reduce((obj, key) => {
          obj[key] = chunk[key];
          return obj;
        }, {}));
        return JSON.stringify(data, null, INDENT);
      }
    })
  ]
};
