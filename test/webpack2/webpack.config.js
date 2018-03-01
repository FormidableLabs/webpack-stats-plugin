"use strict";

const path = require("path");
const base = require("../webpack1/webpack.config");

// Reuse webpack1
module.exports = Object.assign({}, base, {
  context: __dirname,
  output: {
    path: path.join(__dirname, "build"),
    filename: "[hash].main.js"
  }
});
