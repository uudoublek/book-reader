// ThemeToggle.js — 明暗主题切换按钮

import { create } from '../lib/utils.js';
import { toggleTheme } from '../lib/store.js';

/** 创建主题切换按钮，返回根元素。 */
export function createThemeToggle() {
  const btn = create('button', {
    class: 'theme-toggle',
    type: 'button',
    'aria-label': '切换明暗主题',
  });
  btn.textContent = '🌙';

  const sync = () => {
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    btn.textContent = dark ? '☀️' : '🌙';
  };

  btn.addEventListener('click', () => {
    toggleTheme();
    sync();
  });

  // 跟随系统主题变化时同步（仅当用户未手动覆盖时由 store 决定，这里只刷新图标）
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', sync);
  sync();

  return btn;
}
