"use strict";

/**
 * Multiple entry points with per-entry-point stats output example.
 */
const base = require("./webpack.config");
const { StatsWriterPlugin } = require("../../index");

const INDENT = 2;
const stringify = (obj) => JSON.stringify(obj, null, INDENT);

module.exports = Object.assign({}, base, {
  entry: {
    main: "../src/main.js",
    two: "../src/main.js",
    three: "../src/main.js"
  },
  plugins: [
    new StatsWriterPlugin({
      filename: "stats-multi-all-entry-points.json",
      fields: ["assets", "modules"],
      transform({ assets, modules }, { compiler }) {
        Object.keys(assets).forEach((assetIdx) => {
          // Reconstitute assets, modules filtered by this specific asset.
          const asset = assets[assetIdx];
          const assetChunks = new Set(asset.chunks);
          const assetStr = stringify({
            assets: [asset],
            modules: modules.filter((mod) => mod.chunks.some((c) => assetChunks.has(c)))
          });

          // Convert `[hash].[name].js` to `[name]` for later use.
          // This replace depends on how you are specifying asset outputs.
          const assetName = asset.name.replace(/.*?\.(.*?)\.js/, "$1");
          // Add per-asset output.
          compiler.assets[`stats-multi-${assetName}.json`] = {
            source() { return assetStr; },
            size() { return assetStr.length; }
          };
        });

        // This is the default "all entry points" output.
        // You _could_ set it to null or empty, but the plugin currently sets
        // `filename` option to a separate asset in output.
        return stringify({ assets, modules });
      }
    })
  ]
});
