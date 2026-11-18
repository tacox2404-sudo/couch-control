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
  document.querySelectorAll('#tabs a').forEach((a) => a.classList.toggle('on', a.dataset.mode === mode));
  fn(m);
  window.scrollTo(0, 0);
}

addEventListener('hashchange', render);
render();
