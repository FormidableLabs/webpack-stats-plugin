Webpack Stats Plugin
====================

[![Build Status][trav_img]][trav_site]

This plugin will ingest the webpack
[stats](https://github.com/webpack/docs/wiki/node.js-api#stats),
process / tranform the object and write out to a file for further consumption.

The most common use case is building a hashed bundle and wanting to
programmatically referring to the correct bundle path in your Node.js server.

## Stats Writer Plugin

```js
var StatsWriterPlugin = require("webpack-stats-plugin").StatsWriterPlugin;

module.exports = {
  plugins: [
    // Everything else **first**.

    // Write out stats file to build directory.
    new StatsWriterPlugin({
      path: path.join(__dirname, "build"),
      filename: "stats.json" // Default
    })
  ]
}
```

[trav]: https://travis-ci.org/
[trav_img]: https://api.travis-ci.org/FormidableLabs/webpack-stats-plugin.svg
[trav_site]: https://travis-ci.org/FormidableLabs/webpack-stats-plugin
