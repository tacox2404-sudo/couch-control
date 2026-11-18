// Tiny DOM helpers. All API text goes through textContent, never innerHTML.
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c.nodeType ? c : document.createTextNode(String(c)));
  }
  return el;
}

const ALLOWED = new Set(['P', 'B', 'I', 'EM', 'STRONG', 'BR']);

// TVMaze summaries are HTML. Keep only a few safe tags, drop everything else.
export function safeHtml(html) {
  const out = document.createDocumentFragment();
  if (!html) return out;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const walk = (node, target) => {
    for (const child of node.childNodes) {
      if (child.nodeType === 3) target.append(document.createTextNode(child.textContent));
      else if (child.nodeType === 1) {
        if (ALLOWED.has(child.tagName)) {
          const el = document.createElement(child.tagName.toLowerCase());
          walk(child, el);
          target.append(el);
        } else walk(child, target);
      }
    }
  };
  walk(doc.body, out);
  return out;
}

export const poster = (img, alt) =>
  img && (img.medium || img.original)
    ? h('img', { src: (img.medium || img.original).replace('http://', 'https://'), alt, loading: 'lazy' })
    : h('div', { class: 'noposter', 'aria-label': alt }, 'NO SIGNAL');
