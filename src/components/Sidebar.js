// Sidebar.js — 书籍章节目录导航

import { create } from '../lib/utils.js';
import { href } from '../lib/router.js';

const GROUP_LABEL = {
  overview: '概述',
  chapter: '章节',
  cheatsheet: '速查',
  glossary: '术语',
  patterns: '思维模型',
};

/**
 * 渲染侧边栏。返回根元素。
 * @param {object} book 当前书籍
 * @param {string} activeId 当前选中的 section id
 */
export function renderSidebar(book, activeId) {
  const nav = create('nav', { class: 'sidebar' });

  const header = create('div', { class: 'sidebar-header' });
  header.append(
    create('a', { class: 'sidebar-back', href: href(''), text: '← 书库' }),
    create('h2', { class: 'sidebar-book-title', text: book.shortTitle }),
  );
  if (book.author) {
    header.append(create('p', { class: 'sidebar-book-author', text: book.author }));
  }
  nav.append(header);

  // 按 kind 分组
  const groups = new Map();
  for (const s of book.sections) {
    if (!groups.has(s.kind)) groups.set(s.kind, []);
    groups.get(s.kind).push(s);
  }

  // 固定的展示顺序：概述 -> 章节 -> 速查/术语/思维模型
  const order = ['overview', 'chapter', 'cheatsheet', 'glossary', 'patterns'];

  const list = create('div', { class: 'sidebar-groups' });
  for (const kind of order) {
    const sections = groups.get(kind);
    if (!sections || sections.length === 0) continue;
    list.append(create('div', { class: 'sidebar-group-label', text: GROUP_LABEL[kind] || kind }));
    for (const s of sections) {
      const link = create('a', {
        class: 'sidebar-link' + (s.id === activeId ? ' is-active' : ''),
        href: href('book', book.slug, s.id),
        'data-section-id': s.id,
        text: s.title,
      });
      list.append(link);
    }
  }
  nav.append(list);
  return nav;
}
