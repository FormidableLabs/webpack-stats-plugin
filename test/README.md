Tests
=====

We test the `webpack-stats-plugin` in all webpack browser version.

## Setup

To allow a multiple install scenario, we have multiple pseudo-packages as
follows:

```
test/
├── webpack1
├── webpack2
├── webpack3
└── webpack4
```

where each `webpack<VERSION>` directory has a structure of:

```
test/webpack1
├── index.js
├── package.json
└── webpack.config.js
```

and an independent `package.json` that has the desired webpack version, e.g.:

```js
  "dependencies": {
    "webpack": "^1.15.0"
  }
```

The `index.js` file in these directories is simply a re-export of the applicable
`webpack` CLI tool. We are then able to take a root `package.json` dependency on
each of these different versions like:

```js
  "devDependencies": {
    "webpack1": "file:test/webpack1",
    "webpack2": "file:test/webpack2",
    "webpack3": "file:test/webpack3",
    "webpack4": "file:test/webpack4"
  }
```

and we end up with **all** versions that we want!

**Side Note**: The `index.js` file is crafted carefully to account for
`node_modules` flattening performed by `yarn`. There are some complexities of
that omitted from this guide.

## Build

We then build files outside of git source to, e.g.:

```js
test/webpack1
├── build
└── build2
```

We do this with the command:

```js
"test:build:single":
  "cd node_modules/webpack${VERS} && node index.js --config ../../test/webpack${VERS}/webpack.config.js",
```

which importantly **must** change directory to our re-export file so that the
"detect a local webpack in `CWD/node_modules/.bin/webpack` scheme" doesn't take
over. The package in that location is only correct for **one** scenario and is
there because of webpack flattening.

## Tests

Once we have a build, we can do tests. We have a set of "expected" files that
are committed to source in:

```
test/expected/
├── build
│   ├── stats-custom.json
│   ├── stats-transform-custom-obj.json
│   ├── stats-transform.json
│   ├── stats-transform.md
│   └── stats.json
└── build2
    └── stats-custom2.json
```

Our mocha tests in [func.spec.js](test/func.spec.js) first read in all of these expected files, then all of the build files from each of the `webpack<VERSION>` directories. We then have dynamic suites and tests to wrap this up and assert similarities.

We take a slight helping tool to regex replace any file hashes with the token `HASH` to get clean asserts.

Putting this all together, our steps are:

```sh
$ yarn run test:clean
$ yarn run test:build
$ yarn run test:run
```

or as a single command:

```sh
$ yarn run test
```
