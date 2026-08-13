// SearchBar.js — 跨书全文搜索（下拉结果）

import { create, debounce } from '../lib/utils.js';
import { href } from '../lib/router.js';
import { search, highlight } from '../lib/store.js';

/** 创建搜索框组件，返回根元素。 */
export function createSearchBar() {
  const root = create('div', { class: 'searchbar' });

  const input = create('input', {
    class: 'search-input',
    type: 'search',
    placeholder: '搜索全部书籍…',
    'aria-label': '搜索书籍',
  });

  const panel = create('div', { class: 'search-panel', hidden: true });
  panel.hidden = true;

  root.append(input, panel);

  const closePanel = () => {
    panel.hidden = true;
    panel.innerHTML = '';
    input.value = '';
  };

  const runSearch = debounce((q) => {
    if (!q.trim()) {
      panel.hidden = true;
      panel.innerHTML = '';
      return;
    }
    const results = search(q);
    panel.innerHTML = '';
    if (results.length === 0) {
      panel.append(create('div', { class: 'search-empty', text: '没有匹配结果' }));
    } else {
      const ul = create('ul', { class: 'search-results' });
      for (const r of results) {
        const a = create('a', {
          class: 'search-result',
          href: href('book', r.slug, r.sectionId),
        });
        a.append(
          create('div', { class: 'search-result-title' }),
          create('div', { class: 'search-result-meta', text: `${r.bookTitle} · ${r.title}` }),
          create('div', { class: 'search-result-snippet' }),
        );
        a.children[0].innerHTML = r.title;
        a.children[2].innerHTML = highlight(r.text, q);
        a.addEventListener('click', () => closePanel());
        ul.append(a);
      }
      panel.append(ul);
    }
    panel.hidden = false;
  }, 180);

  input.addEventListener('input', () => runSearch(input.value));
  input.addEventListener('focus', () => {
    if (input.value.trim()) runSearch(input.value);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closePanel();
  });

  // 点击外部关闭
  document.addEventListener('click', (e) => {
    if (!root.contains(e.target)) panel.hidden = true;
  });

  return root;
}
