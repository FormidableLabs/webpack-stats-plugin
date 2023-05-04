Webpack Stats Plugin
====================

This plugin will extract stats from your webpack build, transform and write to file.

## Installation

```
$ npm install --save-dev @regru/webpack-stats-plugin
$ yarn add --dev @regru/webpack-stats-plugin
```

### Usage

```js
const { StatsWriterPlugin } = require("@regru/webpack-stats-plugin");

module.exports = {
  plugins: [
    // Everything else **first**.

    // Write out stats file to build directory.
    new StatsWriterPlugin({
      filename: "stats.json" // Default
    })
  ]
}
```

### Custom Transform Function

The transform function has a signature of:

```js
/**
 * Transform skeleton.
 *
 * @param {Object} stats          Stats object
 * 
 * @returns {String}              String to emit to file
 */
function transform(stats) {}
```

which you can use like:

```js
const { StatsWriterPlugin } = require("@regru/webpack-stats-plugin");

module.exports = {
  plugins: [
    new StatsWriterPlugin({
      transform(data, opts) {
        return JSON.stringify({
          main: data.assetsByChunkName.main[0],
          css: data.assetsByChunkName.main[1]
        }, null, 2);
      }
    })
  ]
}
```

## Plugins

* [`StatsWriterPlugin(opts)`](#statswriterplugin-opts-)

### `StatsWriterPlugin(opts)`
* **opts** (`Object`) options
* **opts.filename** (`String`) output file name (Default: &quot;stat.json&quot;)
* **opts.once** (`Boolean`) skip functionality after first occurrence
* **opts.statsOptions** (`Object`) options for webpack Stats object (See [Stats](https://webpack.js.org/configuration/stats/#stats-options))
* **opts.transform** (`Function`) transform stats obj (Default: `JSON.stringify()`)

Stats writer module.

Stats can be a string or array (we"ll have array from using source maps):

```js
"assetsByChunkName": {
  "main": [
    "cd6371d4131fbfbefaa7.bundle.js",
    "../js-map/cd6371d4131fbfbefaa7.bundle.js.map"
  ]
},
```

See:
- http://webpack.github.io/docs/long-term-caching.html#get-filenames-from-stats
- https://github.com/webpack/docs/wiki/node.js-api#stats

**`filename`**: The `opts.filename` option can be a file name or path relative to
`output.path` in webpack configuration. It should not be absolute.

**`transform`**: By default, the retrieved stats object is `JSON.stringify`'ed
but by supplying an alternate transform you can target _any_ output format.
See [`test/webpack4/webpack.config.js`](test/webpack4/webpack.config.js) for
various examples including Markdown output.

- **Warning**: The output of `transform` should be a `String`, not an object. On
  Node `v4.x` if you return a real object in `transform`, then webpack will
  break with a `TypeError` (See
  [#8](https://github.com/FormidableLabs/webpack-stats-plugin/issues/8)). Just
  adding a simple `JSON.stringify()` around your object is usually what you need
  to solve any problems.
