// store.js — 全局数据与主题状态

import { escapeHtml } from './utils.js';

/** 书籍数据，由 main.js 在启动时注入。 */
export const store = {
  books: [],
  bySlug: new Map(),
  /** 扁平化的搜索索引：[{ slug, sectionId, title, bookTitle, text }] */
  searchIndex: [],
};

export function loadBooks(data) {
  store.books = data.books;
  store.bySlug = new Map(data.books.map((b) => [b.slug, b]));
  store.searchIndex = [];
  for (const book of data.books) {
    for (const s of book.sections) {
      store.searchIndex.push({
        slug: book.slug,
        bookTitle: book.shortTitle,
        sectionId: s.id,
        title: s.title,
        text: s.text,
      });
    }
  }
}

export function getBook(slug) {
  return store.bySlug.get(slug) || null;
}

// ---------------------------------------------------------------------------
// 主题（明暗）
// ---------------------------------------------------------------------------

const THEME_KEY = 'book-reader-theme';

export function initTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const theme = saved || (prefersDark ? 'dark' : 'light');
  applyTheme(theme);
  return theme;
}

export function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  return next;
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
}

// ---------------------------------------------------------------------------
// 搜索
// ---------------------------------------------------------------------------

/** 在搜索索引里做简单子串匹配，返回按匹配度排序的结果。 */
export function search(query) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const results = [];
  for (const item of store.searchIndex) {
    const hay = (item.bookTitle + ' ' + item.title + ' ' + item.text).toLowerCase();
    const idx = hay.indexOf(q);
    if (idx !== -1) {
      results.push({ item, idx, score: item.title.toLowerCase().includes(q) ? 0 : 1 });
    }
  }
  return results
    .sort((a, b) => a.score - b.score || a.idx - b.idx)
    .map((r) => r.item)
    .slice(0, 30);
}

/** 生成带高亮的结果片段（把 query 用 <mark> 包起来）。 */
export function highlight(text, query, maxLen = 120) {
  const q = query.trim();
  if (!q) return escapeHtml(text.slice(0, maxLen));
  const lower = text.toLowerCase();
  const qi = lower.indexOf(q.toLowerCase());
  if (qi === -1) return escapeHtml(text.slice(0, maxLen));
  const start = Math.max(0, qi - 30);
  const end = Math.min(text.length, qi + q.length + maxLen - 30);
  const before = escapeHtml(text.slice(start, qi));
  const match = escapeHtml(text.slice(qi, qi + q.length));
  const after = escapeHtml(text.slice(qi + q.length, end));
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${before}<mark>${match}</mark>${after}${suffix}`;
}
