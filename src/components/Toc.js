// Toc.js — 页内目录（基于当前章节的 h2/h3 标题）

import { create } from '../lib/utils.js';

/**
 * 渲染页内目录。返回根元素（无标题时返回 null）。
 * @param {object} section 当前 section（含 headings）
 */
export function renderToc(section) {
  const headings = section.headings || [];
  if (headings.length === 0) return null;

  const box = create('nav', { class: 'toc' });
  box.append(create('h3', { class: 'toc-title', text: '本页目录' }));

  const list = create('ul', { class: 'toc-list' });
  for (const h of headings) {
    const item = create('li', { class: 'toc-item toc-lvl-' + h.level });
    const link = create('a', {
      class: 'toc-link',
      href: `#${h.slug}`,
      text: h.text,
      onclick: () => {
        scrollToHeading(h.slug);
        return false;
      },
    });
    item.append(link);
    list.append(item);
  }
  box.append(list);
  return box;
}

/** 平滑滚动到某个标题锚点。 */
function scrollToHeading(slug) {
  const target = document.getElementById(slug);
  if (target) {
    const y = target.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}
