const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const dataPath = path.join(root, "data", "papers.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8"));

const requiredStringFields = [
  "title_中文",
  "title_en",
  "background",
  "problem",
  "previous_limitations",
  "solution",
  "achievements",
  "limitations",
  "pdf_link"
];

const errors = [];

if (!Array.isArray(data.papers)) {
  errors.push("data.papers must be an array");
} else {
  const titleCn = new Set();
  const titleEn = new Set();

  data.papers.forEach((paper, index) => {
    const label = `paper[${index}]`;

    for (const field of requiredStringFields) {
      if (typeof paper[field] !== "string" || paper[field].trim() === "") {
        errors.push(`${label}.${field} must be a non-empty string`);
      }
    }

    if (paper.arxiv_link && !isHttpUrl(paper.arxiv_link)) {
      errors.push(`${label}.arxiv_link must be http(s) when present`);
    }

    if (!isHttpUrl(paper.pdf_link)) {
      errors.push(`${label}.pdf_link must be http(s)`);
    }

    if (!Number.isInteger(paper.year) || paper.year < 1900 || paper.year > 2026) {
      errors.push(`${label}.year must be an integer between 1900 and 2026`);
    }

    if (!Array.isArray(paper.authors) || paper.authors.length === 0 || paper.authors.some((author) => typeof author !== "string" || author.trim() === "")) {
      errors.push(`${label}.authors must be a non-empty string array`);
    }

    checkDuplicate(titleCn, paper["title_中文"], `${label}.title_中文`);
    checkDuplicate(titleEn, paper.title_en, `${label}.title_en`);
  });
}

if (errors.length > 0) {
  console.error("Validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

const papers = data.papers;
const years = papers.map((paper) => paper.year);
const missingArxiv = papers.filter((paper) => !paper.arxiv_link).length;

console.log(`Validated ${papers.length} papers (${Math.min(...years)}-${Math.max(...years)}).`);
console.log(`Optional arXiv links missing: ${missingArxiv}.`);

function checkDuplicate(set, value, fieldLabel) {
  if (set.has(value)) {
    errors.push(`${fieldLabel} is duplicated: ${value}`);
  }
  set.add(value);
}

function isHttpUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
