import * as explorer from './modes/explorer/explorer.js';
import { roulette } from './modes/roulette/roulette.js';
import * as binge from './modes/binge/binge.js';
import { h } from './ui/dom.js';

const screen = document.getElementById('screen');

const soon = (title, text) => screen.replaceChildren(h('div', { class: 'soon' }, h('h2', { class: 'h' }, title), h('p', {}, text)));

const routes = [
  [/^#\/?$/, () => explorer.home(screen), 'explorer'],
  [/^#\/search\/(shows|people)\/(.+)$/, (m) => explorer.search(screen, m[1], decodeURIComponent(m[2])), 'explorer'],
  [/^#\/show\/(\d+)$/, (m) => explorer.showPage(screen, m[1]), 'explorer'],
  [/^#\/person\/(\d+)$/, (m) => explorer.personPage(screen, m[1]), 'explorer'],
  [/^#\/roulette$/, () => roulette(screen), 'roulette'],
  [/^#\/binge$/, () => binge.picker(screen), 'binge'],
  [/^#\/binge\/(\d+)$/, (m) => binge.scoreboard(screen, m[1]), 'binge'],
];

function render() {
  const hash = location.hash || '#/';
  const hit = routes.map(([re, fn, mode]) => [re.exec(hash), fn, mode]).find(([m]) => m);
  const [m, fn, mode] = hit || [null, () => screen.replaceChildren(h('p', { class: 'status err' }, 'Channel not found.')), ''];
  document.querySelectorAll('#tabs a').forEach((a) => {
    const on = a.dataset.mode === mode;
    a.classList.toggle('on', on);
    if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  });
  fn(m);
  window.scrollTo(0, 0);
  screen.focus({ preventScroll: true });
}

addEventListener('hashchange', render);
render();

// Share: native share sheet when available, otherwise copy the link.
const shareBtn = document.getElementById('share');
const shared = document.getElementById('shared');
shareBtn.addEventListener('click', async () => {
  const data = { title: document.title, url: location.href };
  try {
    if (navigator.share) await navigator.share(data);
    else { await navigator.clipboard.writeText(location.href); shared.textContent = 'Link copied!'; setTimeout(() => (shared.textContent = ''), 2500); }
  } catch { /* user cancelled or clipboard blocked */ }
});
