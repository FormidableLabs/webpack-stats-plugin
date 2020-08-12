"use strict";

/* eslint-env mocha*/
/* eslint-disable max-nested-callbacks*/

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
const WEBPACKS = [1, 2, 3, 4, 5].map((n) => `webpack${n}`); // eslint-disable-line no-magic-numbers
const VERSIONS = [{ VERS: 1 }, { VERS: 2 }, { VERS: 3 }, { VERS: 4 }, { VERS: 5 }];
const NUM_ERRS = VERSIONS.length;

// Specific hash regex to abstract.
const HASH_RE = /[0-9a-f]{20}/gm;

const webpackVers = (webpack) => parseInt(webpack.replace("webpack", ""), 10);

// Permissively allow empty files.
const allowEmpty = (err) => {
  if (err.code === "ENOENT") {
    return [];
  }

  throw err;
};

// Normalize expected files if earlier than webpack4.
const EXPECTED_NORMS = {
  "build/stats-custom-stats-fields.json": ({ data }) => JSON.stringify({
    ...JSON.parse(data),
    // Remove fields not found in early webpack.
    namedChunkGroups: undefined
  }, null, 2) // eslint-disable-line no-magic-numbers
};

const normalizeExpected = ({ data, name, webpack }) => {
  // Normalize expecteds and previous to webpack4
  const norm = EXPECTED_NORMS[name];
  if (norm && webpackVers(webpack) < 4) { // eslint-disable-line no-magic-numbers
    return norm({ data });
  }

  // Modern (webpack4) data.
  return data;
};

// Normalize / smooth over webpack version differences in data files.
const normalizeFile = ({ data, name }) => {
  // First, do string-based normalizations and short-circuit if not JSON.
  const dataStr = data.replace(HASH_RE, "HASH");
  if (!name.endsWith(".json")) { return dataStr; }

  // Then, as an object if JSON file.
  const dataObj = JSON.parse(dataStr);
  if (dataObj.assets) {
    // Sort for determinism
    dataObj.assets = dataObj.assets.sort((a, b) => a.name.localeCompare(b.name));

    // Normalize ephemeral build stuff.
    dataObj.assets.forEach((asset) => {
      // Mutate size and naming fields.
      if (asset.name === "HASH.main.js") {
        asset.size = 1234;
        asset.chunks = ["main"]; // webpack4+ style.
      }

      // Remove webpack4+ fields
      delete asset.info;
      delete asset.emitted;
    });
  }


  return JSON.stringify(dataObj, null, 2); // eslint-disable-line no-magic-numbers
};

// Read files to an object.
const readBuild = async (buildDir) => {
  const files = await Promise.all(BUILD_DIRS.map(
    (dir) => fs.readdir(path.join(__dirname, buildDir, dir)).catch(allowEmpty)
  ))
    // Create a flat list of files in an array.
    .then((dirs) => dirs
      // Add directory.
      .map((list, idx) => list.map((file) => path.join(BUILD_DIRS[idx], file)))
      // Flatten.
      .reduce((memo, list) => memo.concat(list), [])
      // Remove "main.js"
      .filter((file) => !(/\.main\.js$/).test(file))
    );

  // Read all objects to a string.
  const data = await Promise.all(
    files.map((file) => fs.readFile(path.join(__dirname, buildDir, file)))
  );

  return data.reduce((m, v, i) => ({
    ...m,
    [files[i]]: normalizeFile({ data: v.toString(),
      name: files[i] }) }),
  {});
};

// Promise-friendly spawn.
const spawn = (...args) => {
  const stdout = [];
  const stderr = [];

  // eslint-disable-next-line promise/avoid-new
  return new Promise((resolve) => {
    const proc = cp.spawn(...args);
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
  before(async () => {
    expecteds = await readBuild("expected");
  });

  // Dynamically create suites and tests.
  WEBPACKS.forEach((webpack) => {
    before(async () => {
      actuals[webpack] = await readBuild(path.join("scenarios", webpack));
    });

    describe(webpack, () => {
      it("matches expected files", () => {
        const actual = actuals[webpack];

        Object.keys(expecteds).forEach((name) => {
          const data = expecteds[name];
          expect(actual[name], name).to.equal(normalizeExpected({ data,
            name,
            webpack }));
        });
      });
    });
  });
});

describe("failures", () => {
  it("fails with synchronous error", async () => {
    // Use builder to concurrently run:
    // `webpack<VERS> --config test/scenarios/webpack<VERS>/webpack.config.fail-sync.js`
    const obj = await spawn(builderCli,
      [
        "envs", "test:build:single",
        JSON.stringify(VERSIONS),
        "--env", JSON.stringify({ WP_EXTRA: ".fail-sync" }),
        "--buffer", "--bail=false"
      ]
    );

    expect(obj.code).to.equal(1);
    expect(obj.stderr).to.contain(`Hit ${NUM_ERRS} errors`);

    const exps = Array(NUM_ERRS).fill("Error: SYNC");
    const errs = obj.stderr.match(/(Error\: SYNC)/gm);
    expect(errs).to.eql(exps);
  });

  it("fails with promise rejection", async () => {
    // Use builder to concurrently run:
    // `webpack<VERS> --config test/scenarios/webpack<VERS>/webpack.config.fail-promise.js`
    const obj = await spawn(builderCli,
      [
        "envs", "test:build:single",
        JSON.stringify(VERSIONS),
        "--env", JSON.stringify({ WP_EXTRA: ".fail-promise" }),
        "--buffer", "--bail=false"
      ]
    );
    expect(obj.code).to.equal(1);
    expect(obj.stderr).to.contain(`Hit ${NUM_ERRS} errors`);

    const exps = Array(NUM_ERRS).fill("Error: PROMISE");
    const errs = obj.stderr.match(/(Error\: PROMISE)/gm);
    expect(errs).to.eql(exps);
  });
});
