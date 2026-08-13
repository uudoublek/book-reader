// router.js — 极简 hash 路由

/**
 * 解析 hash 路径为结构化 route：
 *   ''                         -> { name: 'home' }
 *   '/book/tao-te-ching'       -> { name: 'book', slug, sectionId: null }
 *   '/book/tao-te-ching/ch01'  -> { name: 'book', slug, sectionId }
 */
export function parseRoute(path) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length === 0) return { name: 'home' };
  if (parts[0] === 'book') {
    return {
      name: 'book',
      slug: parts[1] || null,
      sectionId: parts[2] || null,
    };
  }
  return { name: 'notfound', path };
}

/** 拼接一个 hash 路径字符串。 */
export function href(...segments) {
  return '#/' + segments.filter(Boolean).join('/');
}

/** 导航到路径（写 hash，触发 hashchange）。 */
export function navigate(path) {
  const target = path.startsWith('#') ? path : '#' + path;
  if (window.location.hash === target) {
    // 相同 hash 不触发 hashchange，手动派发一次
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = target;
  }
}

/** 注册路由变化监听，立即回调一次当前路由。返回取消订阅函数。 */
export function onRoute(callback) {
  const handler = () => callback(parseRoute(currentPath()));
  window.addEventListener('hashchange', handler);
  handler(); // 初始触发
  return () => window.removeEventListener('hashchange', handler);
}

function currentPath() {
  return window.location.hash.replace(/^#/, '');
}
