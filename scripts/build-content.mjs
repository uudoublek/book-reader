/**
 * build-content.mjs — 内容管线
 *
 * 把上游的结构化书籍（每个 skill 目录 = 一本书）编译成一份 books.json：
 *   - SKILL.md        -> overview 章节（概述）
 *   - chapters/*.md   -> chapter 章节（正文）
 *   - cheatsheet.md   -> 速查
 *   - glossary.md     -> 术语
 *   - patterns.md     -> 思维模型
 *
 * markdown 在构建期用 markdown-it 渲染为 HTML（含标题锚点 id），
 * 同时为每个章节抽取纯文本（供前端全文搜索）与标题树（供页内目录）。
 *
 * 输出：src/content/books.json
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '..');
const OUT_DIR = join(PROJECT_ROOT, 'src', 'content');
const OUT_FILE = join(OUT_DIR, 'books.json');

/**
 * 解析书籍来源目录，按优先级尝试：
 *   1. SKILLS_DIR 环境变量（显式指定）
 *   2. ../.reasonix/skills（工作区根下的 skill 目录）
 *   3. content/skills（make sync 拷贝的本地副本，供独立仓库发布）
 * 返回第一个存在且非空的目录。
 */
function resolveSkillsDir() {
  const candidates = [];
  if (process.env.SKILLS_DIR) candidates.push(resolve(PROJECT_ROOT, process.env.SKILLS_DIR));
  candidates.push(resolve(PROJECT_ROOT, '../.reasonix/skills'));
  candidates.push(resolve(PROJECT_ROOT, 'content/skills'));
  for (const c of candidates) {
    try {
      if (existsSync(c) && statSync(c).isDirectory() && readdirSync(c).length > 0) return c;
    } catch {
      /* 跳过不可读路径 */
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// markdown 工具
// ---------------------------------------------------------------------------

const md = new MarkdownIt({ html: true, linkify: true, typographer: false });

/** 去除行内 markdown 标记，得到纯文本（用于标题与 slug）。 */
function stripInline(s) {
  return s
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .trim();
}

/** 生成稳定的锚点 slug：保留字母/数字/中日韩字符，其余折叠为 '-'。 */
function slugify(s) {
  const slug = stripInline(s)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
  return slug || 'section';
}

/** HTML -> 纯文本（供搜索）。 */
function htmlToText(html) {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 渲染一段 markdown，返回 { html, text, headings }。
 * headings 只收集 h2/h3，用于页内目录；slug 在同一章节内去重。
 */
function renderMarkdown(src) {
  const headings = [];
  const used = new Map();

  md.renderer.rules.heading_open = (tokens, idx) => {
    const tag = tokens[idx].tag;
    const inline = tokens[idx + 1];
    const text = inline ? stripInline(inline.content) : '';
    let slug = slugify(text);
    if (tag === 'h2' || tag === 'h3') {
      const n = used.get(slug) || 0;
      used.set(slug, n + 1);
      if (n > 0) slug = `${slug}-${n + 1}`;
      headings.push({ level: Number(tag[1]), text: text || slug, slug });
      return `<${tag} id="${slug}">`;
    }
    return `<${tag}>`;
  };

  const html = md.render(src);
  const text = htmlToText(html);
  return { html, text, headings };
}

// ---------------------------------------------------------------------------
// 章节处理
// ---------------------------------------------------------------------------

/** 去掉正文中的 HTML 注释（如 <!-- argument-hint ... -->）。 */
function stripComments(src) {
  return src.replace(/<!--[\s\S]*?-->/g, '');
}

/** 去掉首个一级标题（书籍标题），正文从导语开始。 */
function stripLeadingH1(src) {
  return src.replace(/^#\s+[^\n]*\n+/, '');
}

const KIND_LABELS = {
  cheatsheet: '速查',
  glossary: '术语',
  patterns: '思维模型',
};

function readSkillDir(dir) {
  const slug = basename(dir);
  const { data, content } = matter(readFileSync(join(dir, 'SKILL.md'), 'utf8'));

  const body = stripLeadingH1(stripComments(content));

  const firstH1 = (content.match(/^#\s+([^\n]+)/m) || [])[1] || data.name || slug;
  const title = firstH1.trim();
  const shortTitle = (title.split(/[（(]/)[0] || title).trim();

  const authorMatch = content.match(/\*\*作者\*\*[:：]\s*([^|\n]+)/);
  const author = authorMatch ? authorMatch[1].trim() : '';

  const sections = [];
  const fileToSectionId = new Map();

  sections.push({
    id: 'overview',
    kind: 'overview',
    title: '概述',
    ...renderMarkdown(body),
  });

  const chaptersDir = join(dir, 'chapters');
  const chapterFiles = existsSync(chaptersDir)
    ? readdirSync(chaptersDir).filter((f) => f.endsWith('.md')).sort()
    : [];
  for (const file of chapterFiles) {
    const raw = readFileSync(join(chaptersDir, file), 'utf8');
    const content2 = stripComments(raw);
    const heading = (content2.match(/^#\s+([^\n]+)/m) || [])[1] || file;
    const id = `chapter-${basename(file, '.md')}`;
    fileToSectionId.set(file, id);
    fileToSectionId.set(basename(file, '.md'), id);
    sections.push({
      id,
      kind: 'chapter',
      title: heading.trim(),
      file,
      ...renderMarkdown(content2),
    });
  }

  for (const kind of ['cheatsheet', 'glossary', 'patterns']) {
    const file = `${kind}.md`;
    const p = join(dir, file);
    if (!existsSync(p)) continue;
    const raw = readFileSync(p, 'utf8');
    const content2 = stripComments(raw);
    const heading = (content2.match(/^#\s+([^\n]+)/m) || [])[1] || KIND_LABELS[kind] || kind;
    fileToSectionId.set(file, kind);
    sections.push({
      id: kind,
      kind,
      title: heading.trim(),
      ...renderMarkdown(content2),
    });
  }

  return {
    slug,
    title,
    shortTitle,
    author,
    description: data.description || '',
    sections,
    fileToSectionId,
  };
}

/** 把章节 HTML 中的相对链接重写为站内 hash 路由。 */
function rewriteLinks(book) {
  const { slug, fileToSectionId } = book;
  for (const s of book.sections) {
    s.html = s.html.replace(/href="([^"]+)"/g, (full, href) => {
      const candidate = href.replace(/\.md$/, '').split('/').pop();
      if (fileToSectionId.has(candidate)) {
        return `href="#/book/${slug}/${fileToSectionId.get(candidate)}"`;
      }
      if (fileToSectionId.has(href)) {
        return `href="#/book/${slug}/${fileToSectionId.get(href)}"`;
      }
      return full;
    });
  }
  return book;
}

// ---------------------------------------------------------------------------
// 主流程
// ---------------------------------------------------------------------------

function main() {
  const skillsDir = resolveSkillsDir();
  if (!skillsDir) {
    console.error('未找到书籍来源目录（按顺序尝试了 SKILLS_DIR、../.reasonix/skills、content/skills）。');
    console.error('请确认路径，或运行 `make sync` 拷贝内容，或用 SKILLS_DIR 指定。');
    process.exit(1);
  }

  const dirs = readdirSync(skillsDir)
    .map((name) => join(skillsDir, name))
    .filter((p) => statSync(p).isDirectory() && existsSync(join(p, 'SKILL.md')));

  const books = dirs.map(readSkillDir).map(rewriteLinks);
  books.sort((a, b) => a.slug.localeCompare(b.slug));

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(
    OUT_FILE,
    JSON.stringify({ generatedAt: new Date().toISOString(), source: skillsDir, books }, null, 2),
    'utf8',
  );

  const totalSections = books.reduce((n, b) => n + b.sections.length, 0);
  console.log(`✅ 已生成 ${OUT_FILE}`);
  console.log(`   书籍 ${books.length} 本，章节 ${totalSections} 个`);
  for (const b of books) {
    console.log(`   · ${b.shortTitle}（${b.slug}，${b.sections.length} 节）`);
  }
}

main();
