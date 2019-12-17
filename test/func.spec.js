"use strict";
/*eslint-env mocha*/
/*eslint-disable max-nested-callbacks*/

/**
 * Functional tests.
 *
 * ## Builds
 *
 * Build webpack1-4 to actual files, read those in, and then assert against
 * "expected" fixtures in `test/expected`.
 *
 * ## Failures
 *
 * Use `builder` to do multi-process executions and assert against the logged
 * error output.
 */
const path = require("path");
const pify = require("pify");
const fs = pify(require("fs"));
const expect = require("chai").expect;
const cp = require("child_process");
const builderCli = require.resolve("builder/bin/builder");

const BUILD_DIRS = ["build", "build2"];
const WEBPACKS = [1, 2, 3, 4].map((n) => `webpack${n}`); // eslint-disable-line no-magic-numbers

// Detect if node4 + webpack4 so we can skip.
const isSkipped = (webpack) => webpack === "webpack4" &&
  process.version.match(/(v|)([0-9]+)/)[2] === "4"; // eslint-disable-line no-magic-numbers

// Specific hash regex to abstract.
const HASH_RE = /[0-9a-f]{20}/gm;

// Permissively allow empty files.
const allowEmpty = (err) => {
  if (err.code === "ENOENT") {
    return [];
  }

  throw err;
};

// Normalize / smooth over webpack version differences in data files.
const normalizeFile = ({ data, name }) => {
  // First, do string-based normalizations and short-circuit if not JSON.
  const dataStr = data.replace(HASH_RE, "HASH");
  if (!name.endsWith(".json")) { return dataStr; }

  // Then, as an object if JSON file.
  const dataObj = JSON.parse(dataStr);
  (dataObj.assets || []).forEach((asset) => {
    if (asset.name === "HASH.main.js") {
      // Mutate size and naming fields.
      asset.size = 1234;
      asset.chunks = ["main"]; // webpack4 style.
    }
  });

  return JSON.stringify(dataObj, null, 2); // eslint-disable-line no-magic-numbers
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
      ({ ...m, [files[i]]: normalizeFile({ data: v.toString(), name: files[i] }) }), {})
    );
};

// Promise-friendly spawn.
const spawn = function () {
  const stdout = [];
  const stderr = [];

  return new Promise((resolve) => {
    const proc = cp.spawn.apply(cp, arguments); // eslint-disable-line prefer-spread
    proc.stdout.on("data", (data) => {
      stdout.push(data.toString());
    });
    proc.stderr.on("data", (data) => {
      stderr.push(data.toString());
    });
    proc.on("close", (code, signal) => resolve({
      code,
      signal,
      stdout: stdout.length ? stdout.join("") : null,
      stderr: stderr.length ? stderr.join("") : null
    }));
  });
};

describe("builds", () => {
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
        if (isSkipped(webpack)) {
          // Dynamically skip.
          return void this.skip(); // eslint-disable-line no-invalid-this
        }

        Object.keys(expecteds).forEach((fileKey) => {
          expect(actual[fileKey], fileKey).to.equal(expecteds[fileKey]);
        });
      });
    });
  });
});

describe("failures", () => {
  // Dynamically figure out if doing webpack4.
  const VERSIONS = [].concat(
    [{ VERS: 1 }, { VERS: 2 }, { VERS: 3 }],
    isSkipped("webpack4") ? [] : [{ VERS: 4 }]
  );
  const NUM_ERRS = VERSIONS.length;

  it("fails with synchronous error", () => {
    // Use builder to concurrently run:
    // `webpack<VERS> --config test/webpack<VERS>/webpack.config.fail-sync.js`
    return spawn(builderCli,
      [
        "envs", "test:build:single",
        JSON.stringify(VERSIONS),
        "--env", JSON.stringify({ WP_EXTRA: ".fail-sync" }),
        "--buffer", "--bail=false"
      ]
    )
      .then((obj) => {
        expect(obj.code).to.equal(1);
        expect(obj.stderr).to.contain(`Hit ${NUM_ERRS} errors`);

        const exps = Array(NUM_ERRS).fill("Error: SYNC");
        const errs = obj.stderr.match(/(Error\: SYNC)/gm);
        expect(errs).to.eql(exps);
      });
  });

  it("fails with promise rejection", () => {
    // Use builder to concurrently run:
    // `webpack<VERS> --config test/webpack<VERS>/webpack.config.fail-promise.js`
    return spawn(builderCli,
      [
        "envs", "test:build:single",
        JSON.stringify(VERSIONS),
        "--env", JSON.stringify({ WP_EXTRA: ".fail-promise" }),
        "--buffer", "--bail=false"
      ]
    )
      .then((obj) => {
        expect(obj.code).to.equal(1);
        expect(obj.stderr).to.contain(`Hit ${NUM_ERRS} errors`);

        const exps = Array(NUM_ERRS).fill("Error: PROMISE");
        const errs = obj.stderr.match(/(Error\: PROMISE)/gm);
        expect(errs).to.eql(exps);
      });
  });

});
