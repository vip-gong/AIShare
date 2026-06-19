const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "index.html");
const distHtmlPath = path.join(root, "dist", "index.html");
const nojekyllPath = path.join(root, "dist", ".nojekyll");
const dataPath = path.join(root, "data", "papers.json");
const appPath = path.join(root, "src", "app.js");
const stylePath = path.join(root, "src", "styles.css");
const html = fs.readFileSync(htmlPath, "utf8");
const distHtml = fs.existsSync(distHtmlPath) ? fs.readFileSync(distHtmlPath, "utf8") : "";
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));
const app = fs.readFileSync(appPath, "utf8");
const styles = fs.readFileSync(stylePath, "utf8");

const checks = [
  ["index.html exists", fs.existsSync(htmlPath)],
  ["dist/index.html exists", fs.existsSync(distHtmlPath)],
  ["dist/.nojekyll exists", fs.existsSync(nojekyllPath)],
  ["paper data exists", fs.existsSync(dataPath)],
  ["CSS source exists", fs.existsSync(stylePath)],
  ["app source exists", fs.existsSync(appPath)],
  ["template placeholders replaced", !html.includes("__PAPERS_JSON__") && !html.includes("__CSS__") && !html.includes("__APP_JS__")],
  ["embedded paper count matches source", embeddedPaperCount(html) === data.papers.length],
  ["dist paper count matches source", embeddedPaperCount(distHtml) === data.papers.length],
  ["search control present", html.includes('id="searchInput"')],
  ["category selector belongs to filter controls", html.indexOf('id="categorySelect"') > -1 && html.indexOf('id="categorySelect"') < html.indexOf('id="timelineView"')],
  ["era selector removed from filter controls", !html.includes('id="eraSelect"')],
  ["timeline region present", html.includes('id="timeline"')],
  ["detail page region present", html.includes('id="paperPage"')],
  ["dialog region removed", !html.includes('id="paperDialog"')],
  ["card detail route present", html.includes("#paper/") && html.includes("查看完整解析")],
  ["hidden views cannot be overridden", styles.includes("[hidden]") && styles.includes("display: none !important")],
  ["same-hash detail click handled", app.includes('link.hash === window.location.hash') && app.includes("renderRoute();")],
  ["app JavaScript parses", parses(app, appPath)],
  ["styles are non-empty", styles.trim().length > 1000],
  ["static output is ready for Pages", fs.existsSync(distHtmlPath) && fs.existsSync(nojekyllPath)]
];

const failures = checks.filter(([, passed]) => !passed);

if (failures.length > 0) {
  console.error("Smoke test failed:");
  for (const [label] of failures) {
    console.error(`- ${label}`);
  }
  process.exit(1);
}

console.log(`Smoke test passed for index.html and ${data.papers.length} papers.`);

function embeddedPaperCount(htmlText) {
  const match = htmlText.match(/window\.__AI_PAPERS__\s*=\s*(\[.*?\]);\s*<\/script>/s);
  if (!match) return -1;
  return JSON.parse(match[1]).length;
}

function parses(source, filename) {
  try {
    new vm.Script(source, { filename });
    return true;
  } catch (error) {
    console.error(error.message);
    return false;
  }
}


