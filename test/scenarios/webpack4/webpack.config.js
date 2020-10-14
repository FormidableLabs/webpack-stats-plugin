"use strict";

const path = require("path");
const base = require("../webpack5/webpack.config");

// Reuse webpack5
module.exports = {
  ...base,
  context: __dirname,
  output: {
    ...base.output,
    path: path.join(__dirname, "build")
  }
};
