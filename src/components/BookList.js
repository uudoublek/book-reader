// BookList.js — 首页书架

import { create } from '../lib/utils.js';
import { href } from '../lib/router.js';

const KIND_ICON = {
  overview: '📖',
  chapter: '📄',
  cheatsheet: '⚡',
  glossary: '📚',
  patterns: '🧭',
};

/** 渲染书架网格，返回根元素。 */
export function renderBookList(books) {
  const grid = create('div', { class: 'book-grid' });

  const hero = create('header', { class: 'shelf-hero' });
  hero.append(
    create('h1', { text: '书库' }),
    create('p', {
      class: 'shelf-subtitle',
      text: `由 .reasonix/skills 编译的结构化书籍 · 共 ${books.length} 本，可直接在线阅读`,
    }),
  );
  grid.append(hero);

  for (const book of books) {
    grid.append(renderBookCard(book));
  }
  return grid;
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
