"use strict";

const { existsSync, mkdirSync, writeFileSync } = require("fs");
const { join } = require("path");

const dir = join(__dirname, "src", "huge");
const build = () => {
  mkdirSync(dir);
  const fileCount = 300000;
  const files = [];
  for (let i = 0; i < fileCount; i++) {
    files.push(`file${i}`);
  }
  files.forEach((file) => {
    writeFileSync(join(dir, `${file}.js`), `"use strict";

module.exports = "${file}";
`);
  });
  writeFileSync(join(dir, "index.js"), `"use strict";

${files.map((file) => `const ${file} = require("./${file}");`).join("\n")}
const files = [${files.join(", ")}];

console.log("Hello World!\\nfiles: " + files.length);
`);
};

if (!existsSync(dir)) {
  build();
}
