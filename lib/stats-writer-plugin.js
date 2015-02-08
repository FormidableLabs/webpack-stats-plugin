var fs = require("fs");
var path = require("path");

/**
 * Stats writer module.
 *
 * Stats can be a string or array (we"ll have array from using source maps):
 *
 * ```js
 * "assetsByChunkName": {
 *   "main": [
 *     "cd6371d4131fbfbefaa7.bundle.js",
 *     "../js-map/cd6371d4131fbfbefaa7.bundle.js.map"
 *   ]
 * },
 * ```
 *
 * **Note**: The stats object is **big**. It includes the entire source included
 * in a bundle. Thus, we default `opts.fields` to `["assetsByChunkName"]` to
 * only include those. However, if you want the _whole thing_ (maybe doing an
 * `opts.transform` function), then you can set `fields: null` in options to
 * get **all** of the stats object.
 *
 * See:
 * - http://webpack.github.io/docs/long-term-caching.html#get-filenames-from-stats
 * - https://github.com/webpack/docs/wiki/node.js-api#stats
 *
 * @param {Object}   opts           options
 * @param {String}   opts.path      directory path to output (Default: "")
 * @param {String}   opts.filename  output file name (Default: "stat.json")
 * @param {Array}    opts.fields    fields of stats obj to keep (Default: \["assetsByChunkName"\])
 * @param {Function} opts.transform transform function of stats object before writing
 *
 * @api public
 */
var StatsWriterPlugin = function (opts) {
  this.opts = opts || {};
  this.opts.path = opts.path || "";
  this.opts.filename = opts.filename || "stats.json";
  this.opts.fields = typeof opts.fields !== "undefined" ? opts.fields : ["assetsByChunkName"];
  this.opts.transform = opts.transform || function (data) { return data; };
};

StatsWriterPlugin.prototype.apply = function (compiler) {
  var self = this;
  compiler.plugin("after-emit", function (curCompiler, callback) {
    // Get stats.
    // **Note**: In future, could pass something like `{ showAssets: true }`
    // to the `getStats()` function for more limited object returned.
    var stats = curCompiler.getStats().toJson();

    // Filter to fields.
    if (self.opts.fields) {
      stats = self.opts.fields.reduce(function (memo, key) {
        memo[key] = stats[key];
        return memo;
      }, {});
    }

    // Transform.
    stats = self.opts.transform(stats);

    fs.writeFile(
      path.join(self.opts.path, self.opts.filename),
      JSON.stringify(stats, null, 2),
      { flags: "w+" },
      callback
    );
  });
};

module.exports = StatsWriterPlugin;
