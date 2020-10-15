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
const cp = require("child_process");
const { expect } = require("chai");
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
  // Normalize expecteds and previous to webpack4+
  const norm = EXPECTED_NORMS[name];
  if (norm && webpackVers(webpack) < 4) { // eslint-disable-line no-magic-numbers
    return norm({ data });
  }

  // Modern (webpack4) data.
  return data;
};

const normalizeEntryPoints = (obj) => {
  // webpack5+ style.
  if (obj.main === "HASH.main.js") {
    obj.main = ["HASH.main.js"];
  }
};

// Normalize / smooth over webpack version differences in data files.
const normalizeFile = ({ data, name }) => {
  // First, do string-based normalizations and short-circuit if not JSON.
  const dataStr = data.replace(HASH_RE, "HASH");
  if (!name.endsWith(".json")) { return dataStr; }

  // Then, as an object if JSON file.
  const dataObj = JSON.parse(dataStr);

  // Custom output of just entry points.
  normalizeEntryPoints(dataObj);

  if (dataObj.assets) {
    // Sort for determinism
    dataObj.assets = dataObj.assets.sort((a, b) => a.name.localeCompare(b.name));

    // Normalize ephemeral build stuff.
    // eslint-disable-next-line max-statements
    dataObj.assets = dataObj.assets.map((asset) => {
      // Sort keys.
      asset = Object.keys(asset)
        .sort()
        .reduce((m, k) => Object.assign(m, { [k]: asset[k] }), {});

      // Mutate size and naming fields.
      if (asset.name === "HASH.main.js") {
        asset.size = 1234;
        asset.chunks = ["main"]; // webpack4+ style.
      } else if ((/stats(-.*|)\.json/).test(path.basename(asset.name))) {
        // Stats objects themselves are different sizes in webpack5+ bc of array.
        asset.size = 1234;
      }

      // Remove webpack4+ fields
      delete asset.auxiliaryChunkIdHints;
      delete asset.auxiliaryChunkNames;
      delete asset.auxiliaryChunks;
      delete asset.cached;
      delete asset.chunkIdHints;
      delete asset.comparedForEmit;
      delete asset.emitted;
      delete asset.info;
      delete asset.isOverSizeLimit;
      delete asset.related;
      delete asset.type;

      return asset;
    });
  }

  if (dataObj.assetsByChunkName) {
    normalizeEntryPoints(dataObj.assetsByChunkName);
  }

  if (dataObj.namedChunkGroups) {
    Object.values(dataObj.namedChunkGroups).forEach((val) => {
      // webpack5+ normalization
      if (val.assets) {
        val.assets.forEach((assetName, i) => {
          if (typeof assetName === "string") {
            val.assets[i] = { name: assetName };
          }
        });
      }

      // Remove webpack5+ fields
      delete val.name;
      delete val.filteredAssets;
      delete val.assetsSize;
      delete val.auxiliaryAssets;
      delete val.filteredAuxiliaryAssets;
      delete val.auxiliaryAssetsSize;
      delete val.isOverSizeLimit;
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

describe("failures", function () {
  // Set higher timeout for exec'ed tests.
  this.timeout(5000); // eslint-disable-line no-invalid-this,no-magic-numbers

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
    const errs = obj.stderr.match(/(^Error\: SYNC)/gm);
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
    const errs = obj.stderr.match(/(^Error\: PROMISE)/gm);
    expect(errs).to.eql(exps);
  });
});

(async () => {
  const expecteds = await readBuild("expected");
  const actuals = {};
  await Promise.all(WEBPACKS.map(async (webpack) => {
    actuals[webpack] = await readBuild(path.join("scenarios", webpack));
  }));

  // Dynamically and lazily create suites and tests.
  describe("builds", () => {
    WEBPACKS.forEach((webpack) => {
      describe(webpack, () => {
        Object.keys(expecteds).forEach((name) => {
          it(`matches expected file: ${name}`, () => {
            const actual = actuals[webpack][name];
            const expected = normalizeExpected({
              data: expecteds[name],
              name,
              webpack
            });

            expect(actual, name).to.equal(expected);
          });
        });
      });
    });
  });
})();
