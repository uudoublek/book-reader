# book-reader · 结构化书籍在线阅读

把 `.reasonix/skills/` 下用 Agent Skills 标准组织的结构化书籍，编译成一个可在线阅读的 **HTML 电子书站点**：Markdown → HTML，内置目录导航、跨书全文搜索、明暗主题，纯静态产物可直接发布到 GitHub Pages。

> 仓库：<https://github.com/uudoublek/book-reader> · 站点：<https://uudoublek.github.io/book-reader/>

- **Makefile** 编排构建
- **Vite + 原生 ES 模块** 前端（组件化，无重型框架）
- **构建期渲染 markdown**（`markdown-it`），浏览器不打进解析器，包体小、首屏快

## 书籍来源

每个 skill 目录 = 一本书，结构一致：

```
.reasonix/skills/<slug>/
├── SKILL.md          # frontmatter(name/description) + 概述 + 章节目录/主题索引
├── chapters/*.md     # 章节正文
├── cheatsheet.md     # 速查
├── glossary.md       # 术语
└── patterns.md       # 思维模型
```

已收录 10 本：

| 书名 | slug |
| --- | --- |
| 货币战争（宋鸿兵四卷合集） | `currency-wars` |
| 原则：应对变化中的世界秩序 | `dalio-changing-world-order` |
| 易经（周易） | `i-ching` |
| 毛泽东选集（毛泽东） | `mao-selected-works` |
| 中国历代政治得失（钱穆） | `qianmu-political-systems` |
| 人类简史（赫拉利） | `sapiens` |
| 史记（司马迁） | `shiji` |
| 道德经（老子） | `tao-te-ching` |
| 论语（孔子及弟子） | `the-analects` |
| 理想国（柏拉图） | `the-republic` |

## 构建

```bash
make build      # 生成内容数据 + vite 打包到 dist/
make dev        # 生成数据 + 启动 vite dev server
make preview    # 构建并本地预览
make clean      # 清理生成物
make sync       # 把上游 skills 拷贝到 content/skills/（供独立发布）
```

内容来源目录可覆盖：

```bash
make build SKILLS_DIR=/path/to/skills
```

构建管线 `scripts/build-content.mjs` 按以下优先级自动探测书籍来源：
1. `SKILLS_DIR` 环境变量
2. `../.reasonix/skills`
3. `content/skills/`（`make sync` 的拷贝）

## 目录结构

```
book-reader/
├── Makefile                 # 构建编排
├── package.json
├── vite.config.js           # base:'./'，产物用相对路径
├── index.html
├── .github/workflows/deploy.yml   # GitHub Pages 发布
├── scripts/build-content.mjs       # markdown -> books.json 管线
├── src/
│   ├── main.js              # 入口 + 外壳 + 路由分发
│   ├── content/books.json   # 构建时生成（gitignore）
│   ├── components/          # BookList / Sidebar / Reader / Toc / SearchBar / ThemeToggle
│   ├── lib/                 # router / store / utils
│   └── styles/              # base / book / theme
└── public/                  # favicon 等
```

## 发布到 GitHub Pages

本仓库即独立仓库，构建所需的书籍内容以 `content/skills/` 的形式**随仓库提交**（见下文）。流程：

1. **同步书籍内容**（内容随仓库提交，CI 无需依赖外部目录）：
   ```bash
   make sync                        # 从上游 ../.reasonix/skills 拷贝到 content/skills/
   git add content/skills/ && git commit -m "chore: sync book content"
   ```
2. **启用 Pages**：GitHub 仓库 **Settings → Pages → Build and deployment → Source** 选 **GitHub Actions**。
3. **推送触发**：push 到 `main` 后，`.github/workflows/deploy.yml` 自动执行
   `npm ci → make build → upload-pages-artifact → deploy-pages`。
4. 完成后站点即发布到 `https://uudoublek.github.io/book-reader/`。

> **内容来源优先级**：`scripts/build-content.mjs` 按 `SKILLS_DIR` 环境变量 →
> `../.reasonix/skills` → `content/skills/` 的顺序探测。本地开发时若工作区根
> 有 `.reasonix/skills`，会优先读取它；CI 里只有 `content/skills/`，则用它。
> 改动上游书籍后重新 `make sync` 并提交即可更新站点。

> 站点使用 hash 路由且产物路径为相对路径（`base:'./'`），部署到
> `uudoublek.github.io/book-reader/` 子路径下无需额外配置。

## 前端模块

- **`BookList`** — 首页书架（封面 + 标题 + 简介 + 章节数）
- **`Sidebar`** — 书籍章节目录（概述 / 章节 / 速查 / 术语 / 思维模型分组）
- **`Reader`** — 章节正文渲染 + 上下篇翻页
- **`Toc`** — 基于 h2/h3 的页内目录，平滑滚动
- **`SearchBar`** — 跨书全文搜索（构建期抽取纯文本索引）
- **`ThemeToggle`** — 明暗主题切换（记忆用户选择，默认跟随系统）

## 许可

代码部分按 MIT 授权。书籍内容版权归原作者/出版社所有，仅用于个人学习；公开发布前请确认相应授权。
