"use strict";

/**
 * Webpack configuration
 *
 * Usage:
 *
 * ```sh
 * $ cd test/scenarios/rspack
 * $ yarn rspack build -c $PWD/rspack.config.js
 * ```
 */
const fs = require("fs");
const path = require("path");
const { StatsWriterPlugin } = require("../../../index");
const INDENT = 2;
const STAT_RESET = Object.freeze({
  // webpack5+ needs explicit declaration.
  errors: true,
  warnings: true,
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

const MODE = process.env.MODE || "development";
const OUTPUT_PATH = path.join(__dirname, process.env.OUTPUT_PATH || "build");

// webpack5 has deprecated `hash`.
const VERS = parseInt(process.env.VERS || "", 10);
const HASH_KEY = VERS >= 5 ? "fullhash" : "hash"; // eslint-disable-line no-magic-numbers

// webpack5 returns array even if single item
const normAssets = ({ assetsByChunkName }) => {
  Object.entries(assetsByChunkName).forEach(([key, val]) => {
    assetsByChunkName[key] = Array.isArray(val) && val.length === 1 ? val[0] : val;
  });
  return assetsByChunkName;
};

const normData = (data) => Object.keys(data)
  .sort()
  .reduce((m, k) => Object.assign(m, { [k]: data[k] }), {});

module.exports = {
  mode: MODE,
  context: __dirname,
  entry: {
    main: "../../src/main.js"
  },
  output: {
    path: OUTPUT_PATH,
    publicPath: "/website-o-doom/",
    filename: `[${HASH_KEY}].[name].js`
  },
  plugins: [
    // Try various defaults and options.
    new StatsWriterPlugin(),
    new StatsWriterPlugin({}),
    new StatsWriterPlugin({
      filename: "stats-transform.json",
      fields: null,
      transform({ assetsByChunkName }) {
        return JSON.stringify(normAssets({ assetsByChunkName }), null, INDENT);
      }
    }),
    new StatsWriterPlugin({
      filename: "stats-transform.md",
      fields: null,
      transform({ assetsByChunkName }) {
        return Object.entries(normAssets({ assetsByChunkName })).reduce(
          (memo, [key, val]) => `${memo}${key} | ${val}\n`,
          "Name | Asset\n:--- | :----\n"
        );
      }
    }),
    new StatsWriterPlugin({
      filename: "stats-transform-custom-obj.json",
      transform({ assetsByChunkName }) {
        return JSON.stringify({
          main: normAssets({ assetsByChunkName }).main
        }, null, INDENT);
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
      transform({ assetsByChunkName }) {
        return Promise.resolve()
          // Force async.
          // eslint-disable-next-line promise/avoid-new
          .then(() => new Promise((resolve) => { process.nextTick(resolve); }))
          .then(() => JSON.stringify({
            main: normAssets({ assetsByChunkName }).main
          }, null, INDENT));
      }
    }),
    // Custom stats
    new StatsWriterPlugin({
      filename: "stats-custom-stats.json",
      stats: Object.assign({}, STAT_RESET, {
        assets: true
      }),
      transform(data) {
        data = normData(data);

        // webpack >= v3 adds this field unconditionally, so remove it
        delete data.filteredAssets;

        // webpack >= 5 normalization (remove new extra entries without name).
        if (data.assets) {
          data.assets = data.assets.filter(({ name }) => name);
        }

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
        data = normData(data);

        // normalize subset of chunk metadata across all versions of webpack
        data.chunks = data.chunks.map((chunk) => [
          "rendered",
          "initial",
          "entry",
          "size",
          "names"
        ].reduce((obj, key) => {
          obj[key] = chunk[key];
          return obj;
        }, {}));

        return JSON.stringify(data, null, INDENT);
      }
    }),
    new StatsWriterPlugin({
      filename: "stats-should-not-exist.json",
      emit: false
    }),
    new StatsWriterPlugin({
      emit: false,
      async transform(data, context) {
        // eslint-disable-next-line global-require
        const { JsonStreamStringify } = require("json-stream-stringify");

        // Use same build directory as webpack.
        const outputPath = context.compiler.options.output.path;
        const filePath = path.join(outputPath, "stats-from-write-stream.json");

        // Webpack is going to emit / create intermediate directories _after_ this plugin runs,
        // so do a a mkdir -p before starting our streams.
        await fs.promises.mkdir(outputPath, { recursive: true });

        // Create and kick off the streams.
        const jsonStream = new JsonStreamStringify(data, undefined, INDENT);
        const writeStream = fs.createWriteStream(filePath);

        return new Promise((resolve, reject) => { // eslint-disable-line promise/avoid-new
          jsonStream.pipe(writeStream);
          jsonStream.on("end", () => resolve());
          jsonStream.on("error", (err) => reject(new Error(`error converting stream - ${err}`)));
        });
      }
    }),
    new StatsWriterPlugin({
      filename: "stats.js",
      transform() {
        return "/*eslint-disable*/\nconsole.log(\"hello world\");\n";
      }
    })
  ]
};
