// scan the repository for Nunjucks macros that imply the use of component scss
// the pattern is
// {% from "govuk/components/[component]/macro.njk" import [component name] %}

const fs = require("fs");
const path = require("path");

const componentsUsed = [];
const allFiles = [];

function readFile(filepath) {
  /* eslint-disable no-console */
  console.log("Checked for components: " + filepath);
  /* eslint-enable no-console */

  return new Promise((resolve, reject) => {
    fs.readFile(filepath, "utf-8", (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

function createOutput(data) {
  const possibleOutput = [
    ...data.matchAll(/{% from "([a-z-/.]*)" import ([a-zA-Z]*) %}/g),
  ];

  for (const output of possibleOutput) {
    const sassInstruction = output[1]
      .replace("govuk/components/", "")
      .replace("/macro.njk", "");
    componentsUsed.push(
      `@import "../../../node_modules/govuk-frontend/govuk/components/${sassInstruction}/index"; // use ${output[2]}`
    );
  }
  const CLIoutput = [...new Set(componentsUsed)];
  // I will learn how to output this once
  /* eslint-disable no-console */
  // create a list we can output to the command line
  console.log("...");
  for (const line of CLIoutput) {
    // prettier-ignore
    console.log(line);
  }
  /* eslint-enable no-console */
}

function fromDir(startPath, filter) {
  if (!fs.existsSync(startPath)) {
    /* eslint-disable no-console */
    console.log("There is no directory at: ", startPath);
    /* eslint-enable no-console */
    return;
  }

  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      fromDir(filename, filter); //recurse
    } else if (filename.endsWith(filter)) {
      allFiles.push(filename);
    }
  }
}

// find all nunjucks files in the repo

fromDir("./src", ".njk");

// read through them all and match them against the regex for design system modules

allFiles.forEach((file) => {
  readFile(file).then((data) => {
    createOutput(data);
  });
});

