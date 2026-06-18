const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");

const template = read("src/index.template.html");
const styles = read("src/styles.css").trim();
const app = read("src/app.js").trim();
const data = JSON.parse(read("data/papers.json"));
const distDir = path.join(root, "dist");

if (!Array.isArray(data.papers)) {
  throw new Error("data/papers.json must contain a papers array");
}

const papersJson = JSON.stringify(data.papers)
  .replace(/</g, "\\u003c")
  .replace(/\u2028/g, "\\u2028")
  .replace(/\u2029/g, "\\u2029");

const html = template
  .replace("/* __CSS__ */", styles)
  .replace("/* __APP_JS__ */", app)
  .replace("__PAPERS_JSON__", papersJson);

fs.writeFileSync(path.join(root, "index.html"), html, "utf8");
fs.rmSync(distDir, { recursive: true, force: true });
fs.mkdirSync(distDir, { recursive: true });
fs.writeFileSync(path.join(distDir, "index.html"), html, "utf8");
fs.writeFileSync(path.join(distDir, ".nojekyll"), "", "utf8");

const sizeKb = (Buffer.byteLength(html, "utf8") / 1024).toFixed(1);
console.log(`Built index.html and dist/index.html with ${data.papers.length} papers (${sizeKb} KB).`);

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

