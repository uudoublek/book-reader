// Reader.js — 章节正文渲染 + 上下篇导航

import { create } from '../lib/utils.js';
import { href } from '../lib/router.js';

/**
 * 渲染正文区域。返回根元素。
 * @param {object} book
 * @param {object} section 当前 section（含 html）
 */
export function renderReader(book, section) {
  const reader = create('div', { class: 'reader' });

  // 章节标题
  reader.append(create('h1', { class: 'reader-title', text: section.title }));

  // 正文
  const body = create('article', { class: 'reader-content markdown' });
  body.innerHTML = section.html;
  reader.append(body);

  // 上下篇导航
  reader.append(renderPager(book, section));

  return reader;
}

function renderPager(book, section) {
  const idx = book.sections.findIndex((s) => s.id === section.id);
  const prev = book.sections[idx - 1];
  const next = book.sections[idx + 1];

  const pager = create('nav', { class: 'pager' });
  pager.append(
    prev
      ? create('a', { class: 'pager-link pager-prev', href: href('book', book.slug, prev.id) }, '← ', prev.title)
      : create('span', { class: 'pager-link pager-prev is-disabled', text: '已是第一篇' }),
    next
      ? create('a', { class: 'pager-link pager-next', href: href('book', book.slug, next.id) }, next.title, ' →')
      : create('span', { class: 'pager-link pager-next is-disabled', text: '已是最后一篇' }),
  );
  return pager;
}
