# AIshare

AIshare 是一个“AI 演义”论文科普可视化项目，用单页时间轴展示 47 篇 AI 里程碑论文。

## 项目结构

- `index.html`：根目录成品页面，可直接用浏览器打开。
- `dist/index.html`：GitHub Pages 发布产物，由构建脚本生成。
- `data/papers.json`：当前静态构建使用的论文数据源。
- `src/index.template.html`：HTML 外壳模板。
- `src/styles.css`：页面样式。
- `src/app.js`：筛选、搜索、时间轴渲染和详情页路由。
- `scripts/validate.js`：数据结构和链接校验。
- `scripts/build.js`：生成根目录 `index.html` 和 `dist/index.html`。
- `scripts/smoke.js`：构建后冒烟测试。
- `.github/workflows/pages.yml`：GitHub Pages 自动部署工作流。

## 本地使用

```bash
npm run check
```

`check` 会先校验 `data/papers.json`，再重新生成 `index.html` 和 `dist/index.html`，最后执行冒烟测试。

只更新数据时，先从飞书多维表格维护论文内容，再同步到 `data/papers.json`，然后运行：

```bash
npm run build
```

## 部署到 GitHub Pages

1. 推送代码到 GitHub 仓库的 `main` 分支。
2. 打开仓库的 `Settings -> Pages`。
3. 在 `Build and deployment` 里选择 `Source: GitHub Actions`。
4. 回到 `Actions` 页面，运行或等待 `Deploy GitHub Pages` 工作流。
5. 工作流成功后，页面地址会显示在部署记录里，通常是 `https://<username>.github.io/<repo>/`。

这个项目发布的是 `dist/`，不会把本地授权二维码、飞书导入 payload、临时计划文档等过程产物发布出去。
