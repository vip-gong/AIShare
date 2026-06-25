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
  "insight_headline",
  "insight_lead",
  "insight_shift",
  "insight_mechanism",
  "insight_legacy",
  "insight_caveat",
  "pdf_link"
];

// category 枚举与其对应的中文 topic 标签，必须与 src/app.js 中的 CATEGORIES 保持一致。
const CATEGORY_LABELS = {
  language: "语言模型",
  vision: "视觉与生成",
  multimodal: "多模态",
  rl: "强化学习",
  infra: "数据与系统",
  agent: "Agent",
  method: "方法与理论",
  science: "科学智能"
};

// 年份上限随当前年份滚动（允许提前一年的预印本），不再硬编码。
const MAX_YEAR = new Date().getFullYear() + 1;

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

    if (!Number.isInteger(paper.year) || paper.year < 1900 || paper.year > MAX_YEAR) {
      errors.push(`${label}.year must be an integer between 1900 and ${MAX_YEAR}`);
    }

    if (typeof paper.category !== "string" || !CATEGORY_LABELS[paper.category]) {
      errors.push(`${label}.category must be one of: ${Object.keys(CATEGORY_LABELS).join(", ")}`);
    } else if (typeof paper.topic === "string" && paper.topic.trim() !== "" && paper.topic !== CATEGORY_LABELS[paper.category]) {
      errors.push(`${label}.topic ("${paper.topic}") must match category label "${CATEGORY_LABELS[paper.category]}"`);
    }

    if (paper.doi && typeof paper.doi !== "string") {
      errors.push(`${label}.doi must be a string when present`);
    }

    if (paper.venue && typeof paper.venue !== "string") {
      errors.push(`${label}.venue must be a string when present`);
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

const categoryCounts = papers.reduce((acc, paper) => {
  acc[paper.category] = (acc[paper.category] || 0) + 1;
  return acc;
}, {});

console.log(`Validated ${papers.length} papers (${Math.min(...years)}-${Math.max(...years)}).`);
console.log(`Optional arXiv links missing: ${missingArxiv}.`);
console.log(`Categories: ${Object.entries(categoryCounts).map(([k, v]) => `${k}=${v}`).join(", ")}.`);

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
