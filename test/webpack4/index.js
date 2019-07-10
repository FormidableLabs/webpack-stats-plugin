"use strict";

// webpack4 is an `optionalDependencies` and only supported on node6.
// Skip the build if it fails to install.
try {
  // eslint-disable-next-line import/no-unresolved,global-require
  module.exports = require("webpack-cli");
} catch (err) {
  if (err.code === "MODULE_NOT_FOUND") {
    console.log("skipping webpack4"); // eslint-disable-line no-console
    module.exports = null;
  } else {
    throw err;
  }
}
