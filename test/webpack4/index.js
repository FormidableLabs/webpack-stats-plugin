"use strict";

// webpack4 is an `optionalDependencies` and only supported on node6.
// Skip the build if it fails to install.
try {
  module.exports = require("webpack-cli/bin/webpack");
} catch (err) {
  console.log("TODO DETECT ERR TYPE MODULE AND DO MESSAGE", err);
}
