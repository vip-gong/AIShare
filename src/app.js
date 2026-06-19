(function () {
  const rawPapers = Array.isArray(window.__AI_PAPERS__) ? window.__AI_PAPERS__ : [];

  const CATEGORIES = [
    ["all", "全部论文"],
    ["language", "语言模型"],
    ["vision", "视觉与生成"],
    ["multimodal", "多模态"],
    ["rl", "强化学习"],
    ["infra", "数据与系统"],
    ["agent", "Agent"],
    ["method", "方法与理论"],
    ["science", "科学智能"]
  ];

  const ERAS = [
    { id: "roots", label: "1986-1996", title: "连接主义复兴", start: 1986, end: 1996, note: "反向传播等方法为现代深度学习重新点火。" },
    { id: "early", label: "1997-2009", title: "寒冬火种", start: 1997, end: 2009, note: "神经网络复兴前夜的关键铺垫。" },
    { id: "deep", label: "2010-2014", title: "深度学习爆发", start: 2010, end: 2014, note: "视觉、词向量、生成模型和训练技巧同时推进。" },
    { id: "transformer", label: "2015-2019", title: "架构革命", start: 2015, end: 2019, note: "残差、注意力、预训练与强化学习形成主线。" },
    { id: "foundation", label: "2020-2022", title: "基础模型成型", start: 2020, end: 2022, note: "规模化、多模态、扩散、科学智能和对齐方法走向成熟。" },
    { id: "open", label: "2023-2025", title: "开源与推理", start: 2023, end: 2025, note: "开放模型、MoE、长上下文、多模态助手与推理训练加速。" }
  ];

  const state = {
    category: "all",
    query: ""
  };

  const papers = rawPapers
    .map((paper, index) => ({
      ...paper,
      id: `${paper.year}-${slugify(paper.title_en || paper["title_中文"] || "paper")}-${index}`,
      category: paper.category || categorize(paper)
    }))
    .sort((a, b) => a.year - b.year || String(a.title_en).localeCompare(String(b.title_en)));

  const els = {
    controls: document.querySelector(".control-deck"),
    timelineView: document.getElementById("timelineView"),
    paperPage: document.getElementById("paperPage"),
    search: document.getElementById("searchInput"),
    categorySelect: document.getElementById("categorySelect"),
    timeline: document.getElementById("timeline")
  };

  init();

  function init() {
    renderFilters();
    renderListPage();
    bindEvents();
    renderRoute();
  }

  function bindEvents() {
    els.search.addEventListener("input", (event) => {
      state.query = event.target.value.trim();
      if (getPaperFromHash()) {
        window.location.hash = "";
        return;
      }
      renderListPage();
    });

    els.categorySelect.addEventListener("change", (event) => {
      state.category = event.target.value;
      if (getPaperFromHash()) {
        window.location.hash = "";
        return;
      }
      renderListPage();
    });

    els.timeline.addEventListener("click", (event) => {
      const link = event.target.closest(".card-detail-link");
      if (!link) return;
      if (link.hash === window.location.hash) {
        event.preventDefault();
        renderRoute();
      }
    });

    window.addEventListener("hashchange", renderRoute);
  }

  function renderRoute() {
    const paper = getPaperFromHash();
    if (paper) {
      renderPaperPage(paper);
      return;
    }
    renderListPage();
  }

  function renderListPage() {
    const filtered = getFilteredPapers();
    els.controls.hidden = false;
    els.timelineView.hidden = false;
    els.paperPage.hidden = true;
    renderTimeline(filtered);
  }

  function renderPaperPage(paper) {
    els.controls.hidden = true;
    els.timelineView.hidden = true;
    els.paperPage.hidden = false;
    els.paperPage.innerHTML = `
      <a class="back-link" href="#">返回时间轴</a>
      <article class="paper-detail">
        <header class="paper-detail-header">
          <p class="detail-kicker">${paper.year} · ${escapeHtml(categoryLabel(paper.category))}</p>
          <h2>${escapeHtml(paper["title_中文"])}</h2>
          <p class="detail-en-title">${escapeHtml(paper.title_en)}</p>
          <p class="detail-authors">${escapeHtml(compactAuthors(paper.authors, 6))}</p>
        </header>
        <dl class="detail-grid">
          ${renderDetailSection("研究背景", paper.background)}
          ${renderDetailSection("核心问题", paper.problem)}
          ${renderDetailSection("之前局限", paper.previous_limitations)}
          ${renderDetailSection("解决方案", paper.solution)}
          ${renderDetailSection("主要成就", paper.achievements)}
          ${renderDetailSection("局限性", paper.limitations)}
        </dl>
        <div class="paper-links">
          ${paper.arxiv_link ? `<a href="${escapeAttribute(paper.arxiv_link)}" target="_blank" rel="noopener noreferrer">arXiv</a>` : ""}
          ${paper.pdf_link ? `<a href="${escapeAttribute(paper.pdf_link)}" target="_blank" rel="noopener noreferrer">PDF</a>` : ""}
        </div>
      </article>
    `;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderDetailSection(label, value) {
    return `
      <div>
        <dt>${escapeHtml(label)}</dt>
        <dd>${escapeHtml(value || "暂无")}</dd>
      </div>
    `;
  }

  function renderFilters() {
    const counts = papers.reduce((acc, paper) => {
      acc[paper.category] = (acc[paper.category] || 0) + 1;
      return acc;
    }, { all: papers.length });

    els.categorySelect.innerHTML = CATEGORIES
      .filter(([key]) => key === "all" || counts[key])
      .map(([key, label]) => {
        const selected = key === state.category ? " selected" : "";
        return `<option value="${escapeAttribute(key)}"${selected}>${escapeHtml(label)} ${counts[key] || 0}</option>`;
      })
      .join("");
  }

  function renderTimeline(filtered) {
    if (filtered.length === 0) {
      els.timeline.innerHTML = `<div class="empty-state">没有匹配的论文。换一个关键词或筛选条件再试。</div>`;
      return;
    }

    els.timeline.innerHTML = ERAS
      .map((era) => {
        const eraPapers = filtered.filter((paper) => paper.year >= era.start && paper.year <= era.end);
        if (eraPapers.length === 0) return "";
        return `
          <section class="era-section" id="era-${era.id}">
            <div class="era-heading">
              <h2>${escapeHtml(era.title)}</h2>
              <p>${escapeHtml(era.label)}<br>${escapeHtml(era.note)}</p>
            </div>
            <div class="paper-list">
              ${eraPapers.map(renderPaperCard).join("")}
            </div>
          </section>
        `;
      })
      .join("");
  }

  function renderPaperCard(paper) {
    return `
      <article class="paper-card" data-paper-id="${escapeAttribute(paper.id)}">
        <div class="paper-card-top">
          <span class="paper-year">${paper.year}</span>
          <span class="paper-category">${escapeHtml(categoryLabel(paper.category))}</span>
        </div>
        <div class="paper-main">
          <h3 class="paper-title">${escapeHtml(paper["title_中文"])}</h3>
          <p class="paper-subtitle">${escapeHtml(paper.title_en)}</p>
          <p class="paper-authors">${escapeHtml(compactAuthors(paper.authors))}</p>
        </div>
        <dl class="paper-summary">
          ${renderCardSummary("核心问题", paper.problem)}
          ${renderCardSummary("解决方案", paper.solution)}
          ${renderCardSummary("主要成就", paper.achievements)}
        </dl>
        <div class="paper-card-actions">
          <a class="card-detail-link" href="#paper/${encodeURIComponent(paper.id)}">查看完整解析</a>
        </div>
      </article>
    `;
  }

  function renderCardSummary(label, value) {
    return `
      <div>
        <dt>${escapeHtml(label)}</dt>
        <dd>${escapeHtml(value)}</dd>
      </div>
    `;
  }

  function getFilteredPapers() {
    const query = normalize(state.query);
    return papers.filter((paper) => {
      const matchesCategory = state.category === "all" || paper.category === state.category;
      if (!matchesCategory) return false;
      if (!query) return true;

      const haystack = [
        paper.year,
        paper["title_中文"],
        paper.title_en,
        compactAuthors(paper.authors),
        paper.background,
        paper.problem,
        paper.solution,
        paper.achievements,
        paper.limitations
      ].join(" ");

      return normalize(haystack).includes(query);
    });
  }

  function getPaperFromHash() {
    const match = window.location.hash.match(/^#paper\/(.+)$/);
    if (!match) return null;
    return getPaperById(decodeURIComponent(match[1]));
  }

  function getPaperById(id) {
    return papers.find((paper) => paper.id === id);
  }

  function getEra(paper) {
    return ERAS.find((era) => paper.year >= era.start && paper.year <= era.end);
  }

  function categorize(paper) {
    const text = normalize(`${paper["title_中文"]} ${paper.title_en} ${paper.problem} ${paper.solution} ${paper.achievements}`);

    if (containsAny(text, ["alphafold", "protein", "蛋白", "科学智能", "ai for science"])) return "science";
    if (containsAny(text, ["toolformer", "hugginggpt", "jarvis", "react", "agent", "工具使用", "行动"])) return "agent";
    if (containsAny(text, ["dqn", "ppo", "alphago", "reinforcement", "rlhf", "rlaif", "强化学习", "策略"])) return "rl";
    if (containsAny(text, ["clip", "dall-e", "flamingo", "blip", "llava", "gpt-4", "visual instruction", "multimodal", "图文", "视觉语言", "多模态"])) return "multimodal";
    if (containsAny(text, ["alexnet", "lenet", "cnn", "r-cnn", "mask r-cnn", "faster r-cnn", "sam", "segment anything", "detr", "nerf", "vit", "vision transformer", "vgg", "resnet", "yolo", "efficientnet", "stylegan", "gan", "vae", "diffusion", "ddpm", "u-net", "stable diffusion", "卷积", "图像", "视觉", "检测", "分割", "生成"])) return "vision";
    if (containsAny(text, ["chinchilla", "qlora", "brook", "zero", "scaling", "compute-optimal", "laion", "refinedweb", "megascale", "flashattention", "lora", "mamba", "moe", "switch transformer", "数据", "训练", "系统", "量化", "稀疏"])) return "infra";
    if (containsAny(text, ["back-propagating", "backprop", "dropout", "adam", "batch normalization", "gcn", "graph convolution", "scaling laws", "constitutional", "dpo", "direct preference", "bitter lesson", "distillation", "attention", "cot", "seq2seq", "反向传播", "随机失活", "优化器", "归一化", "图卷积", "偏好优化", "宪法式", "知识蒸馏", "思维链", "注意力"])) return "method";
    return "language";
  }

  function containsAny(text, needles) {
    return needles.some((needle) => text.includes(normalize(needle)));
  }

  function categoryLabel(key) {
    return CATEGORIES.find(([value]) => value === key)?.[1] || key;
  }

  function compactAuthors(authors, max = 3) {
    if (!Array.isArray(authors) || authors.length === 0) return "作者未知";
    const shown = authors.slice(0, max).join(", ");
    return authors.length > max ? `${shown} 等 ${authors.length} 位作者` : shown;
  }

  function slugify(value) {
    return normalize(value)
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "paper";
  }

  function normalize(value) {
    return String(value || "").toLowerCase().normalize("NFKD");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttribute(value) {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }
})();
