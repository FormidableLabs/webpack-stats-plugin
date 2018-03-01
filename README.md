Webpack Stats Plugin
====================

[![Build Status][trav_img]][trav_site]

This plugin will ingest the webpack
[stats](https://github.com/webpack/docs/wiki/node.js-api#stats) object,
process / transform the object and write out to a file for further consumption.

The most common use case is building a hashed bundle and wanting to
programmatically refer to the correct bundle path in your Node.js server.

## Installation

The plugin is available via [npm](https://www.npmjs.com/package/webpack-stats-plugin):

```
$ npm install --save-dev webpack-stats-plugin
$ yarn add --dev webpack-stats-plugin
```

## Examples

We have example webpack configurations for all versions of webpack. See., e.g.
[`test/webpack4/webpack.config.js`](test/webpack4/webpack.config.js).

### Basic

```js
const StatsWriterPlugin = require("webpack-stats-plugin").StatsWriterPlugin;

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
 * @param {Object} data           Stats object
 * @param {Object} opts           Options
 * @param {Object} opts.compiler  Current compiler instance
 * @returns {String}              String to emit to file
 */
function (data, opts) {}
```

which you can use like:

```js
const StatsWriterPlugin = require("webpack-stats-plugin").StatsWriterPlugin;

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

### Promise transform

You can use an asynchronous promise to transform as well:

```js
const StatsWriterPlugin = require("webpack-stats-plugin").StatsWriterPlugin;

module.exports = {
  plugins: [
    new StatsWriterPlugin({
      filename: "stats-transform-promise.json",
      transform(data) {
        return Promise.resolve().then(() => JSON.stringify({
          main: data.assetsByChunkName.main
        }, null, INDENT));
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
* **opts.fields** (`Array`) fields of stats obj to keep (Default: \[&quot;assetsByChunkName&quot;\])
* **opts.transform** (`Function|Promise`) transform stats obj (Default: `JSON.stringify()`)

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

**Note**: The stats object is **big**. It includes the entire source included
in a bundle. Thus, we default `opts.fields` to `["assetsByChunkName"]` to
only include those. However, if you want the _whole thing_ (maybe doing an
`opts.transform` function), then you can set `fields: null` in options to
get **all** of the stats object.

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

## Contributions

Contributions welcome!

We test against all versions of webpack. For a full explanation of our
functional tests, see [test/README.md](test/README.md)

To get started, first install:

```sh
$ yarn
```

Our tests first do various webpack builds and then run mocha asserts on the real
outputted stats files. Inefficient, but for our small sample size efficient
enough.

```sh
# Lint and tests
$ yarn run lint
$ yarn run test

# All together
$ yarn run check
```

[trav]: https://travis-ci.org/
[trav_img]: https://api.travis-ci.org/FormidableLabs/webpack-stats-plugin.svg
[trav_site]: https://travis-ci.org/FormidableLabs/webpack-stats-plugin
[yarn workspaces]: https://yarnpkg.com/blog/2017/08/02/introducing-workspaces/
