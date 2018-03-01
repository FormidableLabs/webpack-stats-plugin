"use strict";
/*eslint-env mocha*/
/*eslint-disable max-nested-callbacks*/

/**
 * Functional tests.
 *
 * Build webpack1-4 to actual files, read those in, and then assert against
 * "expected" fixtures in `test/expected`.
 */
const path = require("path");
const pify = require("pify");
const fs = pify(require("fs"));
const expect = require("chai").expect;

const BUILD_DIRS = ["build", "build2"];
const WEBPACKS = [1, 2, 3, 4].map((n) => `webpack${n}`); // eslint-disable-line no-magic-numbers

// Specific hash regex to abstract.
const HASH_RE = /[0-9a-f]{20}/gm;

// Permissively allow empty files.
const allowEmpty = (err) => {
  if (err.code === "ENOENT") {
    return [];
  }

  throw err;
};

// Read files to an object.
const readBuild = (buildDir) => {
  let files;

  return Promise.all(BUILD_DIRS.map(
    (dir) => fs.readdir(path.join(__dirname, buildDir, dir)).catch(allowEmpty)
  ))
    // Create a flat list of files in an array.
    .then((dirs) => dirs
      // Add directory.
      .map((list, idx) => list.map((file) => path.join(BUILD_DIRS[idx], file)))
      // Flatten.
      .reduce((memo, list) => memo.concat(list), [])
      // Remove "main.js"
      .filter((file) => !/\.main\.js$/.test(file))
    )
    // Read all objects to a string.
    .then((flatFiles) => { files = flatFiles; })
    .then(() => Promise.all(
      files.map((file) => fs.readFile(path.join(__dirname, buildDir, file)))
    ))
    // Create an object of `{ FILE_PATH: STRING_VALUE }`
    .then((data) => data.reduce((m, v, i) =>
      Object.assign(m || {}, { [files[i]]: v.toString().replace(HASH_RE, "HASH") }), null)
    );
};

let expecteds;
const actuals = {};

// Read in expected fixtures.
before(() => readBuild("expected").then((data) => { expecteds = data; }));

// Dynamically create suites and tests.
WEBPACKS.forEach((webpack) => {
  before(() => readBuild(webpack).then((data) => { actuals[webpack] = data; }));

  describe(webpack, () => {
    it("matches expected files", function () {
      const actual = actuals[webpack];

      // Allow webpack4 to have no files if all other webpacks have the right
      // number of files to account for node4 not being supported.
      if (webpack === "webpack4" && !actual &&
          actuals.webpack1 && actuals.webpack2 && actuals.webpack3) {
        // Dynamically skip.
        return void this.skip(); // eslint-disable-line no-invalid-this
      }

      Object.keys(expecteds).forEach((fileKey) => {
        expect(actual[fileKey], fileKey).to.equal(expecteds[fileKey]);
      });
    });
  });
});
