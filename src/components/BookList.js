// BookList.js — 首页书架（按分类分组，可折叠）

import { create } from '../lib/utils.js';
import { href } from '../lib/router.js';

const KIND_ICON = {
  overview: '📖',
  chapter: '📄',
  cheatsheet: '⚡',
  glossary: '📚',
  patterns: '🧭',
};

const CATEGORY_ICON = {
  哲学: '☯️',
  历史: '📜',
  政治与制度: '🏛️',
  经济与金融: '📈',
  法律: '⚖️',
};
const FALLBACK_ICON = '📚';

const STORAGE_KEY = 'book-reader-shelf-groups';

// 各分类的折叠状态：{ 分类名: boolean }，缺省视为展开
const groupState = loadGroupState();

function loadGroupState() {
  try {
    const v = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

function persistGroupState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(groupState));
  } catch {
    /* 忽略隐私模式等写失败 */
  }
}

function isOpen(name) {
  return groupState[name] !== false; // 默认展开
}

function setOpen(name, open) {
  groupState[name] = open;
  persistGroupState();
}

/** 渲染书架（分类分组 + 折叠），返回根元素。 */
export function renderBookList(books, categories = []) {
  const shelf = create('div', { class: 'shelf' });

  const hero = create('header', { class: 'shelf-hero' });
  hero.append(
    create('h1', { text: '书库' }),
    create('p', {
      class: 'shelf-subtitle',
      text: `由 .reasonix/skills 编译的结构化书籍 · 共 ${books.length} 本 · ${categories.length || 1} 类`,
    }),
  );
  shelf.append(hero);

  // 分类展示顺序：优先用 books.json 里的 categories，缺失时按书名首见顺序
  const order = categories.length
    ? categories.map((c) => c.name)
    : [...new Set(books.map((b) => b.category || '其他'))];

  const groups = [];
  for (const name of order) {
    const items = books.filter((b) => (b.category || '其他') === name);
    if (items.length === 0) continue;
    groups.push(renderGroup(name, items));
  }

  const toolbar = create('div', { class: 'shelf-toolbar' });
  toolbar.append(
    create('button', {
      class: 'btn-ghost',
      type: 'button',
      text: '全部展开',
      onclick: () => {
        for (const g of groups) setGroupOpen(g, true);
      },
    }),
    create('button', {
      class: 'btn-ghost',
      type: 'button',
      text: '全部折叠',
      onclick: () => {
        for (const g of groups) setGroupOpen(g, false);
      },
    }),
  );
  shelf.append(toolbar, ...groups.map((g) => g.root));
  return shelf;
}

/** 渲染一个分类分组（标题 + 可折叠的书架网格）。 */
function renderGroup(name, items) {
  const open = isOpen(name);

  const section = create('section', {
    class: 'shelf-group' + (open ? '' : ' is-collapsed'),
    'data-category': name,
  });

  const icon = create('span', { class: 'shelf-group-icon', text: CATEGORY_ICON[name] || FALLBACK_ICON });
  const label = create('span', { class: 'shelf-group-label', text: name });
  const count = create('span', { class: 'shelf-group-count', text: `${items.length} 本` });
  const chevron = create('span', { class: 'shelf-group-chevron', text: '▾' });

  const header = create('button', {
    class: 'shelf-group-header',
    type: 'button',
    'aria-expanded': open ? 'true' : 'false',
    title: open ? '点击折叠' : '点击展开',
    onclick: () => {
      const now = !section.classList.contains('is-collapsed');
      section.classList.toggle('is-collapsed', now);
      header.setAttribute('aria-expanded', String(!now));
      setOpen(name, !now);
    },
  });
  header.append(icon, label, count, chevron);
  section.append(header);

  const body = create('div', { class: 'shelf-group-body' });
  const grid = create('div', { class: 'book-grid' });
  for (const book of items) grid.append(renderBookCard(book));
  body.append(grid);
  section.append(body);

  return { root: section, header };
}

/** 程序化展开/折叠一个分组（全部展开/折叠用）。 */
function setGroupOpen(group, open) {
  const { root, header } = group;
  root.classList.toggle('is-collapsed', !open);
  header.setAttribute('aria-expanded', String(open));
  setOpen(root.dataset.category, open);
}

function renderBookCard(book) {
  const chapterCount = book.sections.filter((s) => s.kind === 'chapter').length;
  const card = create('a', {
    class: 'book-card',
    href: href('book', book.slug),
    'data-slug': book.slug,
  });

  const cover = create('div', { class: 'book-cover' });
  cover.append(create('span', { class: 'book-cover-title', text: book.shortTitle }));
  cover.append(create('span', { class: 'book-cover-author', text: book.author || '佚名' }));

  const body = create('div', { class: 'book-card-body' });
  body.append(create('h2', { class: 'book-title', text: book.shortTitle }));
  if (book.author) {
    body.append(create('p', { class: 'book-author', text: book.author }));
  }
  if (book.description) {
    body.append(create('p', { class: 'book-desc', text: book.description }));
  }

  const meta = create('div', { class: 'book-meta' });
  meta.append(create('span', { class: 'meta-chip', text: `${chapterCount} 章` }));
  meta.append(create('span', { class: 'meta-chip', text: `${book.sections.length} 节` }));
  body.append(meta);

  card.append(cover, body);
  return card;
}
