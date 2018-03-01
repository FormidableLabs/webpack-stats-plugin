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

let expecteds;

// Read in expected fixtures.
before(() => {
  return Promise.all(BUILD_DIRS.map(
    (dir) => fs.readdir(path.join(__dirname, "expected", dir))
  ))
    .then((dirs) => {
      console.log("TODO HERE", dirs);
    });
});

WEBPACKS.forEach((webpack) => {
  let actuals;

  before(() => {

  });

  describe(webpack, () => {
    it("TODO");
  });
});
