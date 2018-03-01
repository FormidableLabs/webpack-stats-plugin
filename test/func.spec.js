"use strict";

/**
 * Functional tests.
 *
 * Build webpack1-4 to actual files, read those in, and then assert against
 * "expected" fixtures in `test/expected`.
 */
const path = require("path");
const pify = require("pify");
const fs = pify(require("fs"));

const BUILD_DIRS = ["build", "build2"];
const WEBPACKS = [1, 2, 3, 4].map((n) => `webpack${n}`);

// Read files to an object.
const readBuild = (buildDir) => {
  let files;

  return Promise.all(BUILD_DIRS.map(
    (dir) => fs.readdir(path.join(__dirname, buildDir, dir))
  ))
    // Create a flat list of files in an array.
    .then((dirs) => dirs
      // Add directory.
      .map((list, idx) => list.map((file) => path.join(BUILD_DIRS[idx], file)))
      // Flatten.
      .reduce((memo, list) => memo.concat(list), [])
    )
    // Read all objects to a string.
    .then((flatFiles) => { files = flatFiles })
    .then(() => Promise.all(
      files.map((file) => fs.readFile(path.join(__dirname, buildDir, file)))
    ))
    .then((data) => {
      return data.reduce((memo, data, idx) => {
        memo[files[idx]] = data.toString();
        return memo;
      }, {});
    });
}

let expecteds;

// Read in expected fixtures.
before(() => {
  return readBuild("expected")
    .then((data) => { expecteds = data; });
});

WEBPACKS.forEach((webpack) => {
  let actuals;

  before(() => {

  });

  describe(webpack, () => {
    it("TODO");
  });
});
