"use strict";

const path = require("path");
const base = require("../webpack1/webpack.config");

// Reuse webpack1
module.exports = {
  ...base,
  context: __dirname,
  output: {
    ...base.output,
    path: path.join(__dirname, "build")
  }
};

