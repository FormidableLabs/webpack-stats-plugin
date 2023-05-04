const fs = require('fs');
const { basename } = require('path');

const INDENT = 2;
const DEFAULT_TRANSFORM = (data) => JSON.stringify(data, null, INDENT);
const PLUGIN_NAME = 'StatsWriterPlugin';

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
 *
 * See:
 * - http://webpack.github.io/docs/long-term-caching.html#get-filenames-from-stats
 * - https://github.com/webpack/docs/wiki/node.js-api#stats
 *
 * **`filename`**: The `opts.filename` option can be a file name or path relative to
 * `output.path` in webpack configuration. It should not be absolute.
 *
 * - **Warning**: The output of `transform` should be a `String`, not an object.
 *   On Node `v4.x` if you return a real object in `transform`, then webpack
 *   will break with a `TypeError` (See #8). Just adding a simple
 *   `JSON.stringify()` around your object is usually what you need to solve
 *   any problems.
 *
 * @param {Object}   opts               options
 * @param {String}   opts.filename      output file name (Default: "stat.json")
 * @param {Object}   opts.statsOptions  options for webpack Stats object (See [Stats](https://webpack.js.org/configuration/stats/#stats-options))
 * @param {Boolean}  opts.once          skip additional runs
 * @param {Function} opts.transform     transform stats obj (Default: `JSON.stringify()`)
 *
 * @api public
 */
class StatsWriterPlugin {
    constructor(opts = {}) {
        this.opts = {};
        this.opts.filename = opts.filename || 'stats.json';
        this.opts.transform = opts.transform || DEFAULT_TRANSFORM;
        this.opts.statsOptions = opts.statsOptions;
        this.opts.once = opts.once || false;

        this.isWritten = false;
    }

    apply(compiler) {
        compiler.hooks.emit.tapAsync(PLUGIN_NAME, this.saveStats.bind(this));
    }

    saveStats(curCompiler, callback) {
        if (this.opts.once && this.isWritten) {
            callback();

            return;
        }

        const stats = curCompiler.getStats().toJson(this.opts.statsOptions);

        const statsStr = this.opts.transform(stats);

        fs.writeFile(this.opts.filename, statsStr, (err) => {
            const logger = curCompiler.getLogger(PLUGIN_NAME);

            if (err) {
                curCompiler.errors.push(err);

                callback(err);

                return;
            }

            logger.info(`config ${basename(this.opts.filename)} emitted`);
            this.isWritten = true;

            callback();
        });
    }
}

module.exports = StatsWriterPlugin;
