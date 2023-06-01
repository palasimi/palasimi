const { existsSync, writeFileSync } = require("fs");
const { chdir } = require("process");

const { configure, render } = require("nunjucks");

while (!existsSync("package.json")) {
  chdir("..");
}

// Generate index.html and about.html.
configure("templates");

const about = render("about.html");
writeFileSync("dist/index.html", about);
writeFileSync("dist/about.html", about);
writeFileSync("dist/graph.html", render("graph.html"));
