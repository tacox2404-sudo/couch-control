import * as api from '../../api/tvmaze.js';
import { h, safeHtml, poster } from '../../ui/dom.js';

const GENRES = ['Drama', 'Comedy', 'Action', 'Crime', 'Thriller', 'Science-Fiction', 'Horror', 'Fantasy', 'Romance', 'Mystery', 'Adventure', 'Family', 'Medical', 'Anime', 'History', 'Supernatural'];
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const rand = (n) => Math.floor(Math.random() * n);

let maxPage = 300; // shrinks automatically when a page does not exist

const runtimeOf = (s) => s.runtime || s.averageRuntime || 0;

function matches(s, f) {
  if (!s.image) return false;
  if (f.genre && !s.genres?.includes(f.genre)) return false;
  if (f.status && s.status !== f.status) return false;
  if (f.minRating && (s.rating?.average || 0) < f.minRating) return false;
  const r = runtimeOf(s);
  if (f.runtime === 'short' && !(r > 0 && r <= 30)) return false;
  if (f.runtime === 'medium' && !(r > 30 && r <= 60)) return false;
  if (f.runtime === 'long' && !(r > 60)) return false;
  return true;
}

// Random page of 250 shows, filter locally, retry a few pages if nothing matches.
async function pickShow(f) {
  for (let i = 0; i < 6; i++) {
    const page = rand(maxPage + 1);
    const list = await api.getShowPage(page);
    if (!list) { maxPage = Math.max(0, page - 1); continue; }
    const pool = list.filter((s) => matches(s, f));
    if (pool.length) return pool[rand(pool.length)];
  }
  return null;
}

function select(label, name, options) {
  return h('label', { class: 'filter' }, h('span', {}, label),
    h('select', { name }, options.map(([v, t]) => h('option', { value: v }, t))));
}

export function roulette(root) {
  const form = h('form', { class: 'filters', onsubmit: (e) => e.preventDefault() },
    select('Genre', 'genre', [['', 'Any'], ...GENRES.map((g) => [g, g])]),
    select('Status', 'status', [['', 'Any'], ['Running', 'Still running'], ['Ended', 'Finished']]),
    select('Episode length', 'runtime', [['', 'Any'], ['short', 'Up to 30 min'], ['medium', '30 to 60 min'], ['long', 'Over 60 min']]),
    select('Rating', 'minRating', [['', 'Any'], ['6', '6+'], ['7', '7+'], ['8', '8+']]));

  const reel = h('div', { class: 'reel', 'aria-live': 'polite' }, h('span', {}, 'PULL THE LEVER'));
  const result = h('div', { class: 'result' });
  const lever = h('button', { class: 'lever', type: 'button', 'aria-label': 'Pull the lever' }, h('span', { class: 'knob' }), h('span', { class: 'stick' }));
  const spinBtn = h('button', { class: 'btn big', type: 'button' }, 'SPIN');
  let busy = false;

  const filters = () => {
    const d = new FormData(form);
    return { genre: d.get('genre'), status: d.get('status'), runtime: d.get('runtime'), minRating: Number(d.get('minRating')) || 0 };
  };

  async function spin() {
    if (busy) return;
    busy = true;
    spinBtn.disabled = true;
    lever.classList.add('pulled');
    result.replaceChildren();
    reel.classList.add('spinning');

    // Flicker random titles while the real request runs (skipped for reduced motion).
    const preview = await api.getShowPage(rand(maxPage + 1)).catch(() => null);
    const flick = !reduceMotion() && preview?.length
      ? setInterval(() => { reel.firstChild.textContent = preview[rand(preview.length)].name; }, 70) : null;
    if (!flick) reel.firstChild.textContent = 'SPINNING...';

    let show = null, error = null;
    try { [show] = await Promise.all([pickShow(filters()), new Promise((r) => setTimeout(r, reduceMotion() ? 0 : 1300))]); }
    catch (e) { error = e.message; }

    clearInterval(flick);
    reel.classList.remove('spinning');
    lever.classList.remove('pulled');
    spinBtn.disabled = false;
    busy = false;

    if (!show) {
      reel.firstChild.textContent = error ? 'SIGNAL LOST' : 'NO LUCK';
      result.replaceChildren(h('p', { class: 'status err' }, error || 'Nothing matched. Loosen the filters and spin again.'));
      return;
    }
    reel.firstChild.textContent = show.name;
    const meta = [show.premiered?.slice(0, 4), show.status, show.genres?.join(' / '), runtimeOf(show) ? `${runtimeOf(show)} min` : '', show.rating?.average ? `★ ${show.rating.average}` : ''].filter(Boolean).join(' · ');
    result.replaceChildren(h('div', { class: 'jackpot' },
      h('div', { class: 'detail-img' }, poster(show.image, show.name)),
      h('div', { class: 'detail-info' },
        h('h2', { class: 'pick' }, show.name),
        h('p', { class: 'meta' }, meta),
        h('div', { class: 'summary clamp' }, safeHtml(show.summary)),
        h('a', { class: 'btn', href: `#/show/${show.id}` }, 'OPEN SHOW'),
        h('a', { class: 'btn ghost', href: `#/binge/${show.id}` }, 'BINGE-O-METER'))));
  }

  lever.addEventListener('click', spin);
  spinBtn.addEventListener('click', spin);

  root.replaceChildren(
    h('h2', { class: 'h' }, 'COUCH ROULETTE'),
    h('p', { class: 'meta' }, 'Can’t decide? Set your mood, then let fate pick.'),
    h('section', { class: 'machine' }, h('div', { class: 'machine-body' }, reel, form, spinBtn), lever),
    result);
}
