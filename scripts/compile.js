const { existsSync, readFileSync, writeFileSync } = require("fs");
const { chdir } = require("process");

const { marked } = require("marked");
const { configure, render } = require("nunjucks");

while (!existsSync("package.json")) {
  chdir("..");
}

// Compile README.md.
const readme = readFileSync("README.md", { encoding: "utf8" });
const article = marked.parse(readme, { mangle: false, headerIds: false });

// Generate index.html and about.html.
configure("templates");

const about = render("about.html", { article });
writeFileSync("dist/index.html", about);
writeFileSync("dist/about.html", about);
writeFileSync("dist/graph.html", render("graph.html"));
