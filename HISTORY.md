History
=======

## 1.1.1

* *Bug*: Better inference of `RawSource` for use with Terser plugin.
  [#91](https://github.com/FormidableLabs/webpack-stats-plugin/issues/91)

## 1.1.0

* *Feature*: Add `opts.emit` option.
  [#89](https://github.com/FormidableLabs/webpack-stats-plugin/pull/89)
  [#84](https://github.com/FormidableLabs/webpack-stats-plugin/issues/84)

## 1.0.3

* *Bug*: Use `RawSource` from current compiler where available.
  [#65](https://github.com/FormidableLabs/webpack-stats-plugin/pull/65)
  (*[@alexander-akait][]*)

## 1.0.2

* *Bug*: Fix multiple stats output with `webpack --watch`.
  [#59](https://github.com/FormidableLabs/webpack-stats-plugin/issues/59)

## 1.0.1

* *Bug*: Fix multiple stats output issue.
  [#55](https://github.com/FormidableLabs/webpack-stats-plugin/issues/55)
  [#57](https://github.com/FormidableLabs/webpack-stats-plugin/issues/57)
* *Bug*: Change `processAssets` hook stage to `PROCESS_ASSETS_STAGE_REPORT` to correctly get hashed asset names.
  [#56](https://github.com/FormidableLabs/webpack-stats-plugin/issues/56)

## 1.0.0

* *Feature*: Support `webpack@5`.
* *Package*: Remove `package.json:engines` and test tweaks for `node4`.
* *Test*: Refactor and separate webpack versions from configs.

## 0.3.2

* *Feature*: Allow `opts.filename` to take `Function` argument.
  [#47](https://github.com/FormidableLabs/webpack-stats-plugin/issues/47)
  [#48](https://github.com/FormidableLabs/webpack-stats-plugin/pull/48)
  (*[@dominics][]*)

## 0.3.1

* *Bug*: Fix options issue with `stats` default fields included in output.
  [#44](https://github.com/FormidableLabs/webpack-stats-plugin/issues/44)

## 0.3.0

* *Feature*: Add `opts.stats` to pass custom webpack-native [stats](https://webpack.js.org/configuration/stats/#stats) config.
  [#18](https://github.com/FormidableLabs/webpack-stats-plugin/issues/18)
  [#31](https://github.com/FormidableLabs/webpack-stats-plugin/pull/31)
  (*[@evocateur][]*)

## 0.2.1

* *Feature*: Allow `opts.transform` to be a `Promise` as well as a `Function`.
  [#27](https://github.com/FormidableLabs/webpack-stats-plugin/issues/27)
* *Bug*: Correctly fail plugin if `opts.transform` throws in webpack4.
* *Test*: Test errors in all versions of webpack.

## 0.2.0

* **Breaking**: Update to node4+.
* Webpack4 compatibility.
  (*[@jdelStrother][]*)

## 0.1.5

* Slim down published npm package.
  (*[@evilebottnawi][]*)

## 0.1.4

* Add constructor definition.
  (*[@vlkosinov][]*)

## 0.1.3

* Add `opts.compiler` to transform function.
  [#15](https://github.com/FormidableLabs/webpack-stats-plugin/issues/15)
  (*[@lostrouter][]*)

## 0.1.2

* _Bad release_

## 0.1.1

* Allow `opts.transform` to output arbitrary formats.
  (*[@tanem][]*)

## 0.1.0

* Emit stat file in compilation assets, allowing use in webpack-dev-server / webpack-stream.
  Fixes [#4](https://github.com/FormidableLabs/webpack-stats-plugin/issues/4)
  (*[@seanchas116][]*)

## 0.0.3

* Add `mkdir -p` functionality for `opts.path` directories.

## 0.0.2

* Actually works.

## 0.0.1

* Is embarrassing and shall be forgotten.

[@alexander-akait]: https://github.com/alexander-akait
[@evocateur]: https://github.com/evocateur
[@evilebottnawi]: https://github.com/evilebottnawi
[@dominics]: https://github.com/dominics
[@lostrouter]: https://github.com/lostrouter
[@ryan-roemer]: https://github.com/ryan-roemer
[@seanchas116]: https://github.com/seanchas116
[@tanem]: https://github.com/tanem
[@vlkosinov]: https://github.com/vlkosinov
