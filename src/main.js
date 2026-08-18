// main.js — 应用入口：装配外壳、路由与视图

import booksData from './content/books.json';
import './styles/base.css';
import './styles/book.css';
import './styles/theme.css';

import { create } from './lib/utils.js';
import { onRoute, href } from './lib/router.js';
import { loadBooks, getBook, initTheme } from './lib/store.js';
import { renderBookList } from './components/BookList.js';
import { renderSidebar } from './components/Sidebar.js';
import { renderReader } from './components/Reader.js';
import { renderToc } from './components/Toc.js';
import { createSearchBar } from './components/SearchBar.js';
import { createThemeToggle } from './components/ThemeToggle.js';

loadBooks(booksData);
initTheme();

const app = document.getElementById('app');

// ---------------------------------------------------------------------------
// 外壳
// ---------------------------------------------------------------------------

const header = create('header', { class: 'site-header' });
const brand = create('a', { class: 'brand', href: href('') });
brand.append(create('span', { class: 'brand-icon', text: '📚' }), create('span', { text: '书库' }));
const actions = create('div', { class: 'header-actions' });
actions.append(createSearchBar(), createThemeToggle());
header.append(brand, actions);

const main = create('main', { id: 'view' });
app.append(header, main);

// ---------------------------------------------------------------------------
// 视图
// ---------------------------------------------------------------------------

function renderHome() {
  document.title = '书库 · Book Reader';
  main.innerHTML = '';
  main.append(renderBookList(booksData.books, booksData.categories || []));
}

function renderBook(route) {
  const book = getBook(route.slug);
  if (!book) return renderNotFound();

  const section =
    book.sections.find((s) => s.id === route.sectionId) || book.sections[0];

  document.title = `${book.shortTitle} · ${section.title}`;
  main.innerHTML = '';

  const view = create('div', { class: 'book-view' });

  const toggleBtn = create('button', { class: 'sidebar-toggle', type: 'button', text: '☰ 目录' });

  const sidebarWrap = create('aside', { class: 'sidebar-wrap' });
  sidebarWrap.append(renderSidebar(book, section.id));

  const reading = create('div', { class: 'reading' });
  const toolbar = create('div', { class: 'reader-toolbar' });
  toolbar.append(toggleBtn);
  reading.append(toolbar);

  const content = create('div', { class: 'reading-inner' });
  content.append(renderReader(book, section));
  reading.append(content);

  const toc = renderToc(section);
  if (toc) {
    const tocPane = create('aside', { class: 'toc-pane' });
    tocPane.append(toc);
    reading.append(tocPane);
  }

  view.append(sidebarWrap, reading);

  toggleBtn.addEventListener('click', () => view.classList.toggle('sidebar-open'));
  sidebarWrap.addEventListener('click', (e) => {
    if (e.target.closest('.sidebar-link')) view.classList.remove('sidebar-open');
  });

  main.append(view);
  window.scrollTo(0, 0);
}

function renderNotFound() {
  document.title = '未找到 · Book Reader';
  main.innerHTML = '';
  main.append(
    create('div', { class: 'notfound' },
      create('h1', { text: '未找到该书籍' }),
      create('p', { text: '链接可能已失效。' }),
      create('a', { class: 'btn', href: href(''), text: '返回书库' }),
    ),
  );
}

// ---------------------------------------------------------------------------
// 路由分发
// ---------------------------------------------------------------------------

onRoute((route) => {
  if (route.name === 'home') renderHome();
  else if (route.name === 'book') renderBook(route);
  else renderNotFound();
});
